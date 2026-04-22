import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY =
  "BEk1S7G1LkzUf3gvf4RdCUEDuIGzA_8E2GSJnQxdwZBMdK_INyo6Ys8bTrOEiLMoO71UGhtgD63foBY7FP7bBv4";
const DISMISS_KEY = "notif_prompt_dismissed_at";
const DISMISS_HOURS = 24;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type Status = "default" | "granted" | "denied" | "unsupported";

const NotificationPermissionPrompt = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("default");
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Detect support + current permission
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as Status);

    // Honor a recent dismissal
    try {
      const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (ts && Date.now() - ts < DISMISS_HOURS * 60 * 60 * 1000) {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleEnable = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as Status);

      if (permission !== "granted") {
        toast.error("Notifications blocked", {
          description:
            "Click the lock icon in your browser's address bar and allow notifications, then press Retry.",
        });
        return;
      }

      const registration = await navigator.serviceWorker.register("/push-sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Invalid subscription");
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: "user_id,endpoint" }
      );
      if (error) throw error;

      toast.success("Notifications enabled", {
        description: "You'll get alerts for new messages, matches, and likes.",
      });
    } catch (err) {
      console.error("Notification enable error:", err);
      toast.error("Could not enable notifications", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  // Don't render if granted, unsupported, dismissed, or no user
  if (!user || status === "granted" || status === "unsupported" || dismissed) {
    return null;
  }

  const isDenied = status === "denied";

  return (
    <div className="mb-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {isDenied ? "Notifications are blocked" : "Stay in the loop"}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {isDenied
              ? "To get message and match alerts, click the lock icon in your browser's address bar, allow notifications, then press Retry."
              : "Get notified instantly when you receive a message, match, or like — even when this tab isn't open."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={busy}
              className="h-9 rounded-full px-4 text-xs"
            >
              {busy ? "Enabling…" : isDenied ? "Retry" : "Enable notifications"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-9 rounded-full px-3 text-xs text-muted-foreground"
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
