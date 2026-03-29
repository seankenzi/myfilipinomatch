import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  order_id: z.string().min(1),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_SECRET_KEY = Deno.env.get("PAYPAL_SECRET_KEY");
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
      throw new Error("PayPal credentials are not configured");
    }

    // Verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id } = parsed.data;

    // Get PayPal access token
    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(PAYPAL_CLIENT_ID + ":" + PAYPAL_SECRET_KEY)}`,
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("PayPal token error:", JSON.stringify(tokenData));
      throw new Error("Failed to obtain PayPal access token");
    }

    const accessToken = tokenData.access_token;

    // Capture the order
    const captureRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${order_id}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await captureRes.json();
    if (!captureRes.ok) {
      console.error("PayPal capture error:", JSON.stringify(captureData));
      throw new Error(`PayPal capture failed [${captureRes.status}]`);
    }

    if (captureData.status !== "COMPLETED") {
      console.error("Order not completed:", captureData.status);
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: captureData.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract metadata from custom_id
    const purchaseUnit = captureData.purchase_units?.[0];
    let metadata: { user_id: string; plan: string };
    try {
      metadata = JSON.parse(purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id || "{}");
    } catch {
      metadata = { user_id: user.id, plan: "monthly" };
    }

    const userId = metadata.user_id || user.id;
    const plan = metadata.plan || "monthly";
    const captureId = purchaseUnit?.payments?.captures?.[0]?.id || order_id;

    // Verify the user making the request matches the payment
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Activate subscription using service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const periodEnd = new Date();
    const daysMap: Record<string, number> = { monthly: 30, quarterly: 90, yearly: 365 };
    periodEnd.setDate(periodEnd.getDate() + (daysMap[plan] || 30));

    const { error: subError } = await adminSupabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        stripe_subscription_id: captureId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subError) {
      console.error("Error upserting subscription:", subError);
      throw new Error("Failed to activate subscription");
    }

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    console.log(`Subscription activated for user ${userId}, plan: ${plan}, capture: ${captureId}`);

    return new Response(
      JSON.stringify({ success: true, plan, status: "active" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Capture error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
