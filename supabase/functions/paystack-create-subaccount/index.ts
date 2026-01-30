import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to identify the user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    const userId = userData.user.id;
    const { businessName, accountNumber, bankCode, accountType } = await req.json();

    if (!businessName || !accountNumber || !bankCode) {
      throw new Error("businessName, accountNumber, and bankCode are required");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, phone_number")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // First, verify the account with Paystack
    console.log("Resolving account number:", accountNumber, "Bank:", bankCode);
    
    const resolveResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const resolveData = await resolveResponse.json();
    console.log("Account resolution response:", JSON.stringify(resolveData, null, 2));

    if (!resolveResponse.ok || !resolveData.status) {
      throw new Error(resolveData.message || "Could not verify bank account");
    }

    // Create subaccount
    const subaccountPayload = {
      business_name: businessName || profile.full_name,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 85, // Provider gets 85%
      primary_contact_email: profile.email || userData.user.email,
      primary_contact_phone: profile.phone_number,
      metadata: {
        user_id: userId,
        account_type: accountType || "mobile_money",
      },
    };

    console.log("Creating subaccount:", JSON.stringify(subaccountPayload, null, 2));

    const subaccountResponse = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subaccountPayload),
    });

    const subaccountData = await subaccountResponse.json();
    console.log("Subaccount response:", JSON.stringify(subaccountData, null, 2));

    if (!subaccountResponse.ok || !subaccountData.status) {
      throw new Error(subaccountData.message || "Failed to create subaccount");
    }

    // Update user profile with subaccount code
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        paystack_subaccount_code: subaccountData.data.subaccount_code,
        payout_details: {
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: resolveData.data.account_name,
          account_type: accountType || "mobile_money",
          subaccount_code: subaccountData.data.subaccount_code,
          created_at: new Date().toISOString(),
        },
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error("Subaccount created but failed to save to profile");
    }

    return new Response(
      JSON.stringify({
        success: true,
        subaccount_code: subaccountData.data.subaccount_code,
        account_name: resolveData.data.account_name,
        message: "Payout account set up successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in paystack-create-subaccount:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
