import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, Shield, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */
interface CookiePreferences {
  essential: true; // always on
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const PREFS_KEY = "cookie_preferences";
const DEFAULT_PREFS: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

/* ── Helpers ── */
const getAnonymousId = (): string => {
  let id = localStorage.getItem("anonymous_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anonymous_id", id);
  }
  return id;
};

const getSavedPrefs = (): CookiePreferences | null => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const savePrefs = (prefs: CookiePreferences) => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  // Also keep legacy key for backwards compat
  localStorage.setItem(
    "cookie_consent",
    prefs.analytics || prefs.marketing ? "accepted" : "declined"
  );
};

const storeConsentRecord = async (prefs: CookiePreferences) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("cookie_consents" as any).insert({
      anonymous_id: getAnonymousId(),
      consent_type: JSON.stringify(prefs),
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    console.error("Failed to store consent record:", e);
  }
};

const applyPrefs = (prefs: CookiePreferences) => {
  if (prefs.analytics) window.__loadAnalytics?.();
  if (prefs.marketing) window.__loadMarketing?.();
};

/* ── Globals ── */
declare global {
  interface Window {
    __loadAnalytics?: () => void;
    __analyticsLoaded?: boolean;
    __loadMarketing?: () => void;
    __marketingLoaded?: boolean;
  }
}

/* ── Category descriptions ── */
const categories: {
  key: keyof CookiePreferences;
  label: string;
  description: string;
  locked?: boolean;
}[] = [
  {
    key: "essential",
    label: "Essential",
    description: "Required for secure logins, messaging, and core site functionality. Cannot be disabled.",
    locked: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Google Analytics — helps us understand how visitors use the site so we can improve it.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Facebook Pixel — allows us to measure the effectiveness of our ads and show relevant content.",
  },
  {
    key: "preferences",
    label: "Preferences",
    description: "Remembers your display settings, language, and other personalization choices.",
  },
];

/* ── Component ── */
const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({ ...DEFAULT_PREFS });

  useEffect(() => {
    const saved = getSavedPrefs();
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setPrefs(saved);
    }

    const handleReopen = () => {
      const saved = getSavedPrefs();
      if (saved) setPrefs(saved);
      setShowPrefs(true);
      setVisible(true);
    };
    window.addEventListener("open-cookie-consent", handleReopen);
    return () => window.removeEventListener("open-cookie-consent", handleReopen);
  }, []);

  const handleSave = useCallback((finalPrefs: CookiePreferences) => {
    savePrefs(finalPrefs);
    applyPrefs(finalPrefs);
    storeConsentRecord(finalPrefs);
    setVisible(false);
    setShowPrefs(false);
  }, []);

  const handleAcceptAll = () => {
    const all: CookiePreferences = { essential: true, analytics: true, marketing: true, preferences: true };
    setPrefs(all);
    handleSave(all);
  };

  const handleRejectNonEssential = () => {
    handleSave({ ...DEFAULT_PREFS });
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop for preferences modal */}
      {showPrefs && (
        <div
          className="fixed inset-0 z-50 bg-black/40 animate-in fade-in duration-200"
          onClick={() => setShowPrefs(false)}
        />
      )}

      {/* Preferences modal */}
      {showPrefs ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-elevated animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Cookie Preferences</h2>
              </div>
              <button
                onClick={() => { setShowPrefs(false); if (!getSavedPrefs()) setVisible(true); }}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies to improve your experience, ensure secure logins, and enable features like messaging and video calls. You can manage your preferences anytime.
              </p>

              <div className="space-y-4">
                {categories.map((cat) => (
                  <div key={cat.key} className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                        {cat.locked && (
                          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">
                            Always active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                    </div>
                    <Switch
                      checked={prefs[cat.key]}
                      disabled={cat.locked}
                      onCheckedChange={(checked) =>
                        setPrefs((p) => ({ ...p, [cat.key]: checked }))
                      }
                      className="mt-1 flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row gap-2 border-t border-border px-6 py-4">
              <Button size="sm" onClick={() => handleSave(prefs)} className="flex-1 text-xs">
                Save Preferences
              </Button>
              <Button size="sm" variant="outline" onClick={handleAcceptAll} className="flex-1 text-xs">
                Accept All
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Banner */
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-elevated">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex rounded-xl bg-primary/10 p-2.5 mt-0.5">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm mb-1">We value your privacy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  We use cookies to improve your experience, ensure secure logins, and enable features like messaging and video calls. You can manage your preferences anytime.
                  {" "}
                  <Link to="/cookie-policy" className="text-primary hover:underline">Learn more</Link>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={handleAcceptAll} className="text-xs">
                    Accept All
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRejectNonEssential} className="text-xs">
                    Reject Non-Essential
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPrefs(true)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Manage Preferences
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
