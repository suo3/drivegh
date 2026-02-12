import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Get params from URL or Body
    const url = new URL(req.url);
    let country = url.searchParams.get("country") || "ghana";
    let useMobileMoney = url.searchParams.get("mobile_money") === "true";

    // Try to parse body for params if not in URL (for invoke calls)
    try {
      if (req.method === "POST") {
        const body = await req.json();
        if (body.country) country = body.country;
        if (typeof body.mobile_money !== 'undefined') useMobileMoney = body.mobile_money;
      }
    } catch (e) {
      // Ignore body parsing error (might be empty)
    }

    console.log("Fetching banks for:", country, "Mobile Money:", useMobileMoney);

    // Fetch banks from Paystack
    let endpoint = `https://api.paystack.co/bank?country=${country}&perPage=100`;
    if (useMobileMoney) {
      endpoint += "&type=mobile_money";
    }

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.message || "Failed to fetch banks");
    }

    // Filter and format the response
    const banks = data.data.map((bank: any) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      type: bank.type,
      is_mobile_money: bank.type === "mobile_money",
    }));

    return new Response(
      JSON.stringify({
        success: true,
        banks,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in paystack-banks:", error);
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
