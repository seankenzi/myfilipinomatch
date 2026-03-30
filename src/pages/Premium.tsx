import { Crown, Heart, Eye, Zap, MessageCircle, Check, Loader2, Video } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import visaLogo from "@/assets/visa-logo.svg";
import mastercardLogo from "@/assets/mastercard-logo.svg";
import amexLogo from "@/assets/amex-logo.svg";
import discoverLogo from "@/assets/discover-logo.svg";
import paypalLogo from "@/assets/paypal-logo.png";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "$29.99",
    priceSub: "per month",
    period: "/month",
    popular: false,
    savings: null,
    features: [
      "Unlimited likes (free users get 10/day)",
      "Unlimited messaging",
      "See who liked you",
      "Undo accidental passes",
      "Profile boost (24h top placement)",
      "Advanced filters (education, height, language & more)",
      "Direct message anyone",
      "Read receipts",
    ],
  },
  {
    id: "quarterly" as const,
    name: "3 Months",
    price: "$69.99",
    priceSub: "$23.33/month — save 22%",
    period: "/3 months",
    popular: false,
    savings: `You save $${((29.99 * 3) - 69.99).toFixed(2)} vs monthly`,
    features: [
      "Everything in Monthly",
      "Priority in Discover",
      "Exclusive badge",
      "Priority support",
    ],
  },
  {
    id: "yearly" as const,
    name: "1 Year",
    price: "$219.99",
    priceSub: "Only $18.33/month — save 39%",
    period: "/year",
    popular: true,
    savings: `You save $${((29.99 * 12) - 219.99).toFixed(2)} vs monthly`,
    features: [
      "All Premium features included",
      "Best value — biggest savings",
      "Includes 2 FREE hours of video calls every month",
      "VIP badge on your profile",
      "Priority support & early access to new features",
    ],
  },
];

const Premium = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_premium) setIsPremium(true);
      });

    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCurrentPlan(data.plan);
      });
  }, [user]);

  const handleSubscribe = async (plan: "monthly" | "quarterly" | "yearly") => {
    if (!user) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }

    setLoading(plan);
    try {
      const res = await supabase.functions.invoke("create-checkout", {
        body: {
          plan,
          success_url: `${window.location.origin}/premium?success=true`,
          cancel_url: `${window.location.origin}/premium?cancelled=true`,
        },
      });

      if (res.error) throw new Error(res.error.message);

      const { checkout_url, order_id } = res.data;
      
      // Store order_id for capture on return
      if (order_id) {
        sessionStorage.setItem("paypal_order_id", order_id);
      }

      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "Unable to start checkout",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Handle PayPal return — capture order on success
  const captureAttempted = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("success") === "true" && !captureAttempted.current) {
      captureAttempted.current = true;
      const orderId = sessionStorage.getItem("paypal_order_id");
      
      if (orderId) {
        sessionStorage.removeItem("paypal_order_id");
        // Capture the PayPal payment
        supabase.functions.invoke("paypal-capture", {
          body: { order_id: orderId },
        }).then(({ data, error }) => {
          if (error || !data?.success) {
            console.error("Capture failed:", error || data);
            toast({
              title: "Payment processing issue",
              description: "Your payment may still be processing. Please check back shortly.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Payment successful! 🎉",
              description: "Your premium subscription is now active. Enjoy unlimited access!",
            });
            setIsPremium(true);
            setCurrentPlan(data.plan);
            setTimeout(() => navigate("/discover"), 2000);
          }
        });
      } else {
        toast({
          title: "Payment successful! 🎉",
          description: "Your premium subscription is now active. Enjoy unlimited access!",
        });
      }
      window.history.replaceState({}, "", "/premium");
    } else if (params.get("cancelled") === "true") {
      toast({
        title: "Payment cancelled",
        description: "No worries — you can upgrade anytime.",
      });
      window.history.replaceState({}, "", "/premium");
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl text-center">
          {/* Hero */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
              <Crown className="h-4 w-4" />
              MyFilipinoMatch Premium
            </div>
            <h1
              className="text-3xl font-bold md:text-4xl mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Unlock the Full Experience
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Get unlimited messaging, see who liked you, and boost your profile to find your match faster.
            </p>
          </div>

          {/* Premium active state */}
          {isPremium && (
            <div className="mb-8 rounded-2xl border-2 border-accent bg-accent/5 p-6 text-center">
              <Crown className="h-8 w-8 text-accent mx-auto mb-2" />
              <h2 className="text-lg font-bold text-foreground">You're a Premium member!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Current plan: <span className="font-semibold capitalize">{currentPlan || "Premium"}</span>
              </p>
            </div>
          )}

          {/* Plans */}
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-card p-6 shadow-card text-left transition-all hover:shadow-card-hover ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-hero px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{plan.priceSub}</p>
                {plan.savings && (
                  <p className="text-xs font-semibold text-primary mb-4">{plan.savings}</p>
                )}
                {!plan.savings && <div className="mb-5" />}

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => {
                    const isVideoFeature = f === "Includes 2 FREE hours of video calls every month";
                    const content = (
                      <li key={f} className={`flex items-center gap-2 text-sm ${isVideoFeature ? "text-primary font-semibold" : "text-foreground"}`}>
                        {isVideoFeature ? <Video className="h-4 w-4 text-primary flex-shrink-0" /> : <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                        {isVideoFeature ? <span className="underline decoration-dotted cursor-help">{f}</span> : f}
                      </li>
                    );
                    if (isVideoFeature) {
                      return (
                        <TooltipProvider key={f}>
                          <Tooltip>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px] text-center p-3">
                              <p className="font-semibold text-sm">Build real connections faster with 2 FREE hours of video call every month</p>
                              <p className="text-xs text-muted-foreground mt-1">(Worth $28.80/year in call credits)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }
                    return content;
                  })}
                </ul>

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full gap-2"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null || (isPremium && currentPlan === plan.id)}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : isPremium && currentPlan === plan.id ? (
                    "Current Plan"
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      {isPremium ? "Switch Plan" : "Get " + plan.name}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground mb-3">Secure payments via PayPal</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={paypalLogo} alt="PayPal" className="h-6 object-contain" loading="lazy" width={24} height={24} />
                <span className="text-sm font-medium text-foreground">PayPal</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={visaLogo} alt="Visa" className="h-6 w-6 object-contain" loading="lazy" />
                <span className="text-sm font-medium text-foreground">Visa</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={mastercardLogo} alt="Mastercard" className="h-6 w-6 object-contain" loading="lazy" />
                <span className="text-sm font-medium text-foreground">Mastercard</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={amexLogo} alt="Amex" className="h-6 w-6 object-contain" loading="lazy" />
                <span className="text-sm font-medium text-foreground">Amex</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={discoverLogo} alt="Discover" className="h-6 w-6 object-contain" loading="lazy" />
                <span className="text-sm font-medium text-foreground">Discover</span>
              </span>
            </div>
          </div>

          {/* Plan comparison table */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Compare Plans</h2>
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-3 font-semibold text-foreground min-w-[140px]">Feature</th>
                    <th className="py-3 px-2 font-semibold text-foreground text-center min-w-[80px]">Free</th>
                    <th className="py-3 px-2 font-semibold text-foreground text-center min-w-[80px]">
                      <div>1 Month</div>
                      <div className="text-xs font-normal text-muted-foreground">$29.99</div>
                    </th>
                    <th className="py-3 px-2 font-semibold text-foreground text-center min-w-[80px]">
                      <div>3 Months</div>
                      <div className="text-xs font-normal text-muted-foreground">$69.99</div>
                    </th>
                    <th className="py-3 px-2 font-semibold text-primary text-center min-w-[80px]">
                      <span className="inline-flex items-center gap-1 justify-center"><Crown className="h-3.5 w-3.5" /> Annual</span>
                      <div className="text-xs font-normal text-primary/70">$219.99</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { feature: "Browse & Discover profiles", free: true, monthly: true, quarterly: true, annual: true },
                    { feature: "Match with mutual likes", free: true, monthly: true, quarterly: true, annual: true },
                    { feature: "Verification badge", free: true, monthly: true, quarterly: true, annual: true },
                    { feature: "Report & block users", free: true, monthly: true, quarterly: true, annual: true },
                    { feature: "Daily Likes", free: "10/day", monthly: "Unlimited", quarterly: "Unlimited", annual: "Unlimited" },
                    { feature: "Messaging (mutual match)", free: "10/day", monthly: "Unlimited", quarterly: "Unlimited", annual: "Unlimited" },
                    { feature: "Direct Message anyone", free: false, monthly: true, quarterly: true, annual: true },
                    { feature: "See who liked you", free: false, monthly: true, quarterly: true, annual: true },
                    { feature: "Undo accidental passes", free: false, monthly: true, quarterly: true, annual: true },
                    { feature: "Profile Boost (24h)", free: false, monthly: true, quarterly: true, annual: true },
                    { feature: "Advanced filters", free: false, monthly: true, quarterly: true, annual: true },
                    { feature: "Read receipts", free: false, monthly: true, quarterly: true, annual: true },
                    { feature: "Priority in Discover", free: false, monthly: false, quarterly: true, annual: true },
                    { feature: "Exclusive badge", free: false, monthly: false, quarterly: true, annual: true },
                    { feature: "Priority support", free: false, monthly: false, quarterly: true, annual: true },
                    { feature: "Video calls (2 hrs/month)", free: false, monthly: false, quarterly: false, annual: true },
                    { feature: "VIP badge", free: false, monthly: false, quarterly: false, annual: true },
                    { feature: "Early access to features", free: false, monthly: false, quarterly: false, annual: true },
                  ] as Array<{ feature: string; free: boolean | string; monthly: boolean | string; quarterly: boolean | string; annual: boolean | string }>).map(({ feature, free, monthly, quarterly, annual }, i) => {
                    const renderCell = (value: boolean | string) => {
                      if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
                      if (value === false) return <span className="text-muted-foreground">—</span>;
                      return <span className="text-primary font-semibold text-xs">{value}</span>;
                    };
                    return (
                      <tr key={feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="py-2.5 px-3 text-left text-foreground font-medium">{feature}</td>
                        <td className="py-2.5 px-2 text-center">{renderCell(free)}</td>
                        <td className="py-2.5 px-2 text-center">{renderCell(monthly)}</td>
                        <td className="py-2.5 px-2 text-center">{renderCell(quarterly)}</td>
                        <td className="py-2.5 px-2 text-center bg-primary/5">{renderCell(annual)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Benefits grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3 text-center">
            {[
              { icon: MessageCircle, title: "Unlimited Messages", desc: "Chat without limits" },
              { icon: Eye, title: "See Who Likes You", desc: "No more guessing" },
              { icon: Zap, title: "Profile Boost", desc: "Get seen 5x more" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Premium;
