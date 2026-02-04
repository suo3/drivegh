
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
    type: "INSERT" | "UPDATE" | "DELETE";
    table: string;
    record: any;
    schema: string;
    old_record: unknown;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: WebhookPayload = await req.json();
        console.log("Received webhook payload:", payload);

        if (payload.table !== "service_requests") {
            return new Response(JSON.stringify({ message: "Ignored table" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { record } = payload;
        const status = record.status;

        // Determine who to notify and what to say
        let userId = record.customer_id; // Default to customer
        let title = "";
        let message = "";

        switch (status) {
            case "assigned":
                title = "Provider Assigned! 👨‍🔧";
                message = "A provider has been assigned to your request.";
                break;
            case "quoted":
                title = "Quote Received 💰";
                message = "Your provider has submitted a quote. Check it now.";
                break;
            case "accepted":
                title = "Request Accepted! ✅";
                message = "The provider has accepted your service request.";
                break;
            case "en_route":
                title = "Provider En Route 🚗";
                message = "Your provider is on the way to your location.";
                break;
            case "in_progress":
                title = "Service Started 🔧";
                message = "The provider has arrived and started working.";
                break;
            case "completed":
                title = "Service Completed ✨";
                message = "Your service has been completed successfully.";
                break;
            case "cancelled":
                title = "Request Cancelled ❌";
                message = "Your service request was cancelled.";
                // Note: If customer cancelled, they know. If provider cancelled, they need to know.
                // For simplicity, we notify anyway or check who triggered it (not part of simple record).
                break;
            default:
                console.log("Status not relevant for notification:", status);
                return new Response(JSON.stringify({ message: "Status ignored" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
        }

        if (!userId || !title) {
            return new Response(JSON.stringify({ message: "No user or content" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Sending notification to user ${userId}: ${title}`);

        // Send to OneSignal
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_aliases: {
                    external_id: [userId]
                },
                target_channel: "push",
                headings: { en: title },
                contents: { en: message },
                // Add data so the app can navigate to the request
                data: {
                    requestId: record.id,
                    trackingCode: record.tracking_code,
                    url: `/track/${record.tracking_code}`
                },
            }),
        });

        const result = await response.json();
        console.log("OneSignal result:", result);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
