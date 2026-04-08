import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BEk1S7G1LkzUf3gvf4RdCUEDuIGzA_8E2GSJnQxdwZBMdK_INyo6Ys8bTrOEiLMoO71UGhtgD63foBY7FP7bBv4";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushSubscription = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/push-sw.js", {
          scope: "/",
        });

        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const subJson = subscription.toJSON();
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return;

        // Upsert subscription to database
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

        if (error) console.error("Failed to save push subscription:", error.message);
      } catch (err) {
        console.error("Push subscription error:", err);
      }
    };

    subscribe();
  }, [user]);
};
