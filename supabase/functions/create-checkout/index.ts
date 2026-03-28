import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  plan: z.enum(["monthly", "quarterly"]),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

const PLANS: Record<string, { name: string; amount: number; description: string }> = {
  monthly: {
    name: "FiloHeart Premium — Monthly",
    amount: 299900, // $29.99 in centavos (PHP equivalent)
    description: "Unlimited messaging, see who liked you, profile boost",
  },
  quarterly: {
    name: "FiloHeart Premium — 3 Months",
    amount: 690000, // $69.00 in centavos (PHP equivalent)
    description: "Best value — everything in Premium for 3 months, save 23%",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYMONGO_SECRET_KEY = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!PAYMONGO_SECRET_KEY) {
      throw new Error("PAYMONGO_SECRET_KEY is not configured");
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

    const { plan, success_url, cancel_url } = parsed.data;
    const planConfig = PLANS[plan];

    // Create PayMongo Checkout Session
    const paymongoRes = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${btoa(PAYMONGO_SECRET_KEY + ":")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: planConfig.description,
            line_items: [
              {
                currency: "PHP",
                amount: planConfig.amount,
                name: planConfig.name,
                quantity: 1,
              },
            ],
            payment_method_types: ["card"],
            success_url,
            cancel_url,
            metadata: {
              user_id: user.id,
              plan,
            },
          },
        },
      }),
    });

    const paymongoData = await paymongoRes.json();

    if (!paymongoRes.ok) {
      console.error("PayMongo error:", JSON.stringify(paymongoData));
      throw new Error(`PayMongo API error [${paymongoRes.status}]: ${JSON.stringify(paymongoData)}`);
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;

    return new Response(
      JSON.stringify({ checkout_url: checkoutUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
