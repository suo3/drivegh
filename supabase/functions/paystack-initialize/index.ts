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

    const { serviceRequestId, email, callbackUrl } = await req.json();

    if (!serviceRequestId || !email) {
      throw new Error("serviceRequestId and email are required");
    }

    // Get service request details
    const { data: request, error: requestError } = await supabase
      .from("service_requests")
      .select("*, profiles!service_requests_provider_id_fkey(paystack_subaccount_code)")
      .eq("id", serviceRequestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching service request:", requestError);
      throw new Error("Service request not found");
    }

    if (!request.quoted_amount) {
      throw new Error("No quote amount set for this request");
    }

    // Calculate amounts
    const totalAmount = Math.round(request.quoted_amount * 100); // Convert to kobo
    const platformCommission = 15; // 15% commission
    
    // Prepare transaction metadata
    const metadata = {
      service_request_id: serviceRequestId,
      custom_fields: [
        {
          display_name: "Service Type",
          variable_name: "service_type",
          value: request.service_type,
        },
        {
          display_name: "Tracking Code",
          variable_name: "tracking_code",
          value: request.tracking_code || "N/A",
        },
      ],
    };

    // Prepare Paystack payload - Collect full amount to platform account
    // Funds will be held until customer confirms service completion, then transferred to provider
    const paystackPayload: any = {
      email,
      amount: totalAmount,
      currency: "GHS",
      callback_url: callbackUrl || `${req.headers.get("origin")}/track/${request.tracking_code}`,
      metadata,
    };

    // NOTE: We intentionally do NOT use split payments here
    // Funds are collected to the main platform account and held as escrow
    // After customer confirms service completion, we initiate a transfer to the provider
    console.log("Collecting payment to platform account (escrow model)");

    console.log("Initializing Paystack transaction:", JSON.stringify(paystackPayload, null, 2));

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error("Paystack initialization failed:", paystackData);
      throw new Error(paystackData.message || "Failed to initialize payment");
    }

    console.log("Paystack response:", JSON.stringify(paystackData, null, 2));

    // Update service request with Paystack reference
    const { error: updateError } = await supabase
      .from("service_requests")
      .update({
        paystack_reference: paystackData.data.reference,
        status: "awaiting_payment",
      })
      .eq("id", serviceRequestId);

    if (updateError) {
      console.error("Error updating service request:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in paystack-initialize:", error);
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
