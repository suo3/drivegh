import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

async function verifyPaystackSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );
  
  const expectedSignature = decoder.decode(hexEncode(new Uint8Array(signatureBuffer)));
  return signature === expectedSignature;
}

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

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify Paystack signature
    if (signature) {
      const isValid = await verifyPaystackSignature(body, signature, PAYSTACK_SECRET_KEY);
      if (!isValid) {
        console.error("Invalid Paystack signature");
        return new Response("Invalid signature", { status: 400 });
      }
    }

    const payload = JSON.parse(body);
    console.log("Paystack webhook received:", JSON.stringify(payload, null, 2));

    const { event, data } = payload;

    if (event === "charge.success") {
      const reference = data.reference;
      const amount = data.amount / 100; // Convert from kobo to GHS
      const serviceRequestId = data.metadata?.service_request_id;

      console.log(`Payment successful: ${reference}, amount: ${amount}, request: ${serviceRequestId}`);

      if (!serviceRequestId) {
        // Try to find by reference
        const { data: request, error } = await supabase
          .from("service_requests")
          .select("id, provider_id, quoted_amount")
          .eq("paystack_reference", reference)
          .single();

        if (error || !request) {
          console.error("Could not find service request for reference:", reference);
          return new Response("OK", { status: 200 });
        }

        await processSuccessfulPayment(supabase, request.id, amount, reference, data);
      } else {
        // Get the full request details
        const { data: request, error } = await supabase
          .from("service_requests")
          .select("id, provider_id, quoted_amount")
          .eq("id", serviceRequestId)
          .single();

        if (error || !request) {
          console.error("Could not find service request:", serviceRequestId);
          return new Response("OK", { status: 200 });
        }

        await processSuccessfulPayment(supabase, request.id, amount, reference, data);
      }
    } else if (event === "transfer.success") {
      // Handle successful transfer to provider
      const transferCode = data.transfer_code;
      console.log("Transfer successful:", transferCode);

      // Update transaction status
      const { error } = await supabase
        .from("transactions")
        .update({
          paystack_transfer_status: "success",
          transfer_completed_at: new Date().toISOString(),
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("paystack_transfer_code", transferCode);

      if (error) {
        console.error("Error updating transaction:", error);
      }
    } else if (event === "transfer.failed") {
      const transferCode = data.transfer_code;
      console.log("Transfer failed:", transferCode);

      const { error } = await supabase
        .from("transactions")
        .update({
          paystack_transfer_status: "failed",
          notes: `Transfer failed: ${data.reason || "Unknown reason"}`,
        })
        .eq("paystack_transfer_code", transferCode);

      if (error) {
        console.error("Error updating transaction:", error);
      }
    }

    return new Response("OK", { headers: corsHeaders, status: 200 });
  } catch (error) {
    console.error("Error in paystack-webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
});

async function processSuccessfulPayment(
  supabase: any,
  serviceRequestId: string,
  amount: number,
  reference: string,
  paystackData: any
) {
  console.log("Processing successful payment for request:", serviceRequestId);

  // Update service request status
  const { error: updateError } = await supabase
    .from("service_requests")
    .update({
      status: "paid",
      amount: amount,
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", serviceRequestId);

  if (updateError) {
    console.error("Error updating service request:", updateError);
    return;
  }

  // Get request details for transaction
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("provider_id, quoted_amount")
    .eq("id", serviceRequestId)
    .single();

  if (requestError || !request) {
    console.error("Could not fetch request for transaction:", requestError);
    return;
  }

  // Create transaction record
  const platformPercentage = 15;
  const providerPercentage = 85;
  const platformAmount = amount * (platformPercentage / 100);
  const providerAmount = amount * (providerPercentage / 100);

  const { error: transactionError } = await supabase.from("transactions").insert({
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
    notes: `Paystack payment - Channel: ${paystackData.channel || "unknown"}`,
  });

  if (transactionError) {
    console.error("Error creating transaction:", transactionError);
  } else {
    console.log("Transaction record created successfully");
  }
}
