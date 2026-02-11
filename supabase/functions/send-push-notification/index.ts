
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

        const { record, old_record } = payload;
        const status = record.status;
        const oldStatus = old_record?.status;

        // Determine who to notify and what to say
        let recipientId: string | null = null;
        let title = "";
        let message = "";

        // Provider-facing notifications (when they get assigned or customer accepts)
        if (status === "assigned" && oldStatus === "pending" && record.provider_id) {
            // Provider gets assigned to a new request
            recipientId = record.provider_id;
            title = "New Job Assigned! 🚗";
            message = "You've been assigned to a new service request. Check it now.";
        } else if (status === "accepted" && oldStatus === "quoted" && record.provider_id) {
            // Customer accepted provider's quote
            recipientId = record.provider_id;
            title = "Quote Accepted! ✅";
            message = "The customer has accepted your quote. Time to get started!";
        } else if (status === "cancelled" && record.provider_id && oldStatus !== "pending") {
            // Request was cancelled after provider was involved - notify provider
            recipientId = record.provider_id;
            title = "Request Cancelled ❌";
            message = "A service request you were working on has been cancelled.";
        } else {
            // Customer-facing notifications (existing logic)
            recipientId = record.customer_id;

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
                    break;
                default:
                    console.log("Status not relevant for notification:", status);
                    return new Response(JSON.stringify({ message: "Status ignored" }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
            }
        }

        if (!recipientId || !title) {
            return new Response(JSON.stringify({ message: "No recipient or content" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Sending notification to user ${recipientId}: ${title}`);

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
                    external_id: [recipientId]
                },
                target_channel: "push",
                headings: { en: title },
                contents: { en: message },
                // Top level url for deep linking (works even if app is closed)
                url: `https://drivegh.com/track/${record.tracking_code}`,
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
