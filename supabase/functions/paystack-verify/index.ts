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

    const { reference } = await req.json();

    if (!reference) {
      throw new Error("reference is required");
    }

    console.log("Verifying Paystack transaction:", reference);

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("Paystack verify response:", JSON.stringify(verifyData, null, 2));

    if (!verifyResponse.ok || !verifyData.status) {
      throw new Error(verifyData.message || "Failed to verify transaction");
    }

    const transactionData = verifyData.data;
    const isSuccessful = transactionData.status === "success";

    if (isSuccessful) {
      const amount = transactionData.amount / 100; // Convert from kobo
      const serviceRequestId = transactionData.metadata?.service_request_id;

      if (serviceRequestId) {
        // Check if payment is already processed
        const { data: existingRequest } = await supabase
          .from("service_requests")
          .select("status, payment_status")
          .eq("id", serviceRequestId)
          .single();

        if (existingRequest?.payment_status !== "paid") {
          // Update service request
          await supabase
            .from("service_requests")
            .update({
              status: "paid",
              amount: amount,
              payment_status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", serviceRequestId);

          // Create transaction record if not exists
          const { data: existingTransaction } = await supabase
            .from("transactions")
            .select("id")
            .eq("reference", reference)
            .single();

          if (!existingTransaction) {
            const platformPercentage = 15;
            const providerPercentage = 85;
            const platformAmount = amount * (platformPercentage / 100);
            const providerAmount = amount * (providerPercentage / 100);

            await supabase.from("transactions").insert({
              service_request_id: serviceRequestId,
              amount: amount,
              payment_method: "mobile_money",
              transaction_type: "customer_to_business",
              status: "confirmed",
              reference: reference,
              provider_percentage: providerPercentage,
              provider_amount: providerAmount,
              platform_amount: platformAmount,
              confirmed_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: isSuccessful,
        status: transactionData.status,
        amount: transactionData.amount / 100,
        currency: transactionData.currency,
        reference: transactionData.reference,
        paid_at: transactionData.paid_at,
        channel: transactionData.channel,
        metadata: transactionData.metadata,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in paystack-verify:", error);
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
