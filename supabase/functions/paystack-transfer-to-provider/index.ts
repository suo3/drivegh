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

    const { serviceRequestId } = await req.json();

    if (!serviceRequestId) {
      throw new Error("serviceRequestId is required");
    }

    console.log("Initiating transfer for service request:", serviceRequestId);

    // Get service request details with provider info
    const { data: request, error: requestError } = await supabase
      .from("service_requests")
      .select(`
        *,
        provider:profiles!service_requests_provider_id_fkey(
          id,
          full_name,
          payout_details,
          paystack_subaccount_code
        )
      `)
      .eq("id", serviceRequestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching service request:", requestError);
      throw new Error("Service request not found");
    }

    // Validate request status
    if (request.payment_status !== "paid") {
      throw new Error("Payment has not been received for this request");
    }

    if (!request.customer_confirmed_at) {
      throw new Error("Customer has not confirmed service completion");
    }

    const provider = request.provider;
    if (!provider) {
      throw new Error("No provider assigned to this request");
    }

    // Get provider's payout details
    const payoutDetails = provider.payout_details as {
      bank_code?: string;
      account_number?: string;
      account_name?: string;
      recipient_code?: string;
    } | null;

    if (!payoutDetails?.recipient_code && (!payoutDetails?.bank_code || !payoutDetails?.account_number)) {
      throw new Error("Provider has not set up payout details");
    }

    // Calculate provider's share (85% minus Paystack fees)
    const totalAmount = Number(request.amount || request.quoted_amount);
    const platformCommission = 0.15; // 15%
    const providerShare = totalAmount * (1 - platformCommission);
    const providerAmountKobo = Math.round(providerShare * 100);

    console.log(`Total: GHS ${totalAmount}, Provider share: GHS ${providerShare}`);

    // Get or create transfer recipient
    let recipientCode = payoutDetails.recipient_code;

    if (!recipientCode) {
      console.log("Creating new transfer recipient for provider");
      
      const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "mobile_money",
          name: payoutDetails.account_name || provider.full_name,
          account_number: payoutDetails.account_number,
          bank_code: payoutDetails.bank_code,
          currency: "GHS",
        }),
      });

      const recipientData = await recipientResponse.json();
      
      if (!recipientResponse.ok || !recipientData.status) {
        console.error("Failed to create recipient:", recipientData);
        throw new Error(recipientData.message || "Failed to create transfer recipient");
      }

      recipientCode = recipientData.data.recipient_code;

      // Save recipient code for future use
      await supabase
        .from("profiles")
        .update({
          payout_details: {
            ...payoutDetails,
            recipient_code: recipientCode,
          },
        })
        .eq("id", provider.id);
    }

    // Initiate transfer to provider
    const transferReference = `transfer_${serviceRequestId}_${Date.now()}`;
    
    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: providerAmountKobo,
        recipient: recipientCode,
        reason: `Payment for service request ${request.tracking_code || serviceRequestId}`,
        reference: transferReference,
      }),
    });

    const transferData = await transferResponse.json();
    console.log("Transfer response:", JSON.stringify(transferData, null, 2));

    if (!transferResponse.ok || !transferData.status) {
      console.error("Transfer failed:", transferData);
      throw new Error(transferData.message || "Failed to initiate transfer");
    }

    // Update transaction record with transfer details
    const { error: transactionError } = await supabase
      .from("transactions")
      .update({
        paystack_transfer_code: transferData.data.transfer_code,
        paystack_transfer_status: transferData.data.status,
        transfer_initiated_at: new Date().toISOString(),
      })
      .eq("service_request_id", serviceRequestId)
      .eq("transaction_type", "customer_to_business");

    if (transactionError) {
      console.error("Error updating transaction:", transactionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_code: transferData.data.transfer_code,
        status: transferData.data.status,
        amount: providerShare,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in paystack-transfer-to-provider:", error);
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
