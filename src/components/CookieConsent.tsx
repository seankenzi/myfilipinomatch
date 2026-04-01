import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const COOKIE_CONSENT_KEY = "cookie_consent";

const getAnonymousId = (): string => {
  let id = localStorage.getItem("anonymous_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anonymous_id", id);
  }
  return id;
};

const storeConsentRecord = async (consentType: "accepted" | "declined") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("cookie_consents" as any).insert({
      anonymous_id: getAnonymousId(),
      consent_type: consentType,
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    console.error("Failed to store consent record:", e);
  }
};

declare global {
  interface Window {
    __loadAnalytics?: () => void;
    __analyticsLoaded?: boolean;
  }
}

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
    storeConsentRecord("accepted");
    // Load analytics now
    window.__loadAnalytics?.();
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
    storeConsentRecord("declined");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-elevated">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex rounded-xl bg-primary/10 p-2.5 mt-0.5">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm mb-1">We value your privacy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              We use essential cookies to keep the site running and analytics cookies to improve your experience.
              You can read more in our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" "}and{" "}
              <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleAccept} className="text-xs">
                Accept all
              </Button>
              <Button size="sm" variant="outline" onClick={handleDecline} className="text-xs">
                Essential only
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
