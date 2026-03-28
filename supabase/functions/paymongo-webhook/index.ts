import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<boolean> {
  // PayMongo signature format: t=<timestamp>,te=<test_signature>,li=<live_signature>
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const liveSigPart = parts.find((p) => p.startsWith("li="));
  const testSigPart = parts.find((p) => p.startsWith("te="));

  if (!timestampPart) return false;

  const timestamp = timestampPart.replace("t=", "");
  const signature = liveSigPart?.replace("li=", "") || testSigPart?.replace("te=", "");

  if (!signature) return false;

  // Compute expected signature: HMAC-SHA256(timestamp + "." + rawBody, webhookSecret)
  const message = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const expectedSignature = new TextDecoder().decode(encode(new Uint8Array(sig)));

  return expectedSignature === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();

    // Verify webhook signature
    const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
    const signatureHeader = req.headers.get("paymongo-signature");

    if (!webhookSecret || !signatureHeader) {
      console.error("Missing webhook secret or signature header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isValid = await verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = JSON.parse(rawBody);
    const event = body?.data?.attributes;

    if (!event) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = event.type;
    console.log("PayMongo webhook event:", eventType);

    if (eventType !== "checkout_session.payment.paid") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutData = event.data;
    const metadata = checkoutData?.attributes?.metadata;

    if (!metadata?.user_id || !metadata?.plan) {
      console.error("Missing metadata in webhook:", JSON.stringify(checkoutData));
      return new Response(JSON.stringify({ error: "Missing metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = metadata.user_id;
    const plan = metadata.plan;
    const paymentId = checkoutData?.attributes?.payments?.[0]?.id || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const periodEnd = new Date();
    const daysMap: Record<string, number> = { monthly: 30, quarterly: 90, yearly: 365 };
    periodEnd.setDate(periodEnd.getDate() + (daysMap[plan] || 30));

    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        stripe_subscription_id: paymentId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subError) {
      console.error("Error upserting subscription:", subError);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    console.log(`Subscription activated for user ${userId}, plan: ${plan}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
