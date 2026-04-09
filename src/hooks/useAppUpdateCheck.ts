import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const APP_VERSION = "1.0.3";

const compareVersions = (a: string, b: string): number => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
};

interface UpdateInfo {
  updateAvailable: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
}

export const useAppUpdateCheck = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only check in native/Capacitor context (not in browser)
    const isNative =
      typeof (window as any).Capacitor !== "undefined" ||
      navigator.userAgent.includes("wv") || // Android WebView
      navigator.userAgent.includes("Capacitor");

    if (!isNative) return;

    // Don't re-check if already dismissed this session
    const dismissedKey = `update-dismissed-${APP_VERSION}`;
    if (sessionStorage.getItem(dismissedKey)) return;

    const check = async () => {
      try {
        const { data } = await supabase
          .from("app_config" as any)
          .select("key, value")
          .in("key", ["min_app_version", "latest_app_version", "play_store_url"]);

        if (!data || data.length === 0) return;

        const config: Record<string, string> = {};
        for (const row of data as any[]) {
          config[row.key] = row.value;
        }

        const minVersion = config.min_app_version ?? "1.0.0";
        const latestVersion = config.latest_app_version ?? "1.0.0";
        const storeUrl = config.play_store_url ?? "";

        const forceUpdate = compareVersions(APP_VERSION, minVersion) < 0;
        const updateAvailable = compareVersions(APP_VERSION, latestVersion) < 0;

        if (updateAvailable || forceUpdate) {
          setUpdateInfo({
            updateAvailable: true,
            forceUpdate,
            currentVersion: APP_VERSION,
            latestVersion,
            storeUrl,
          });
        }
      } catch {
        // Silently fail — don't block the app
      }
    };

    void check();
  }, []);

  const dismiss = () => {
    const dismissedKey = `update-dismissed-${APP_VERSION}`;
    sessionStorage.setItem(dismissedKey, "1");
    setDismissed(true);
  };

  return {
    updateInfo: dismissed ? null : updateInfo,
    dismiss,
  };
};

export { APP_VERSION };
