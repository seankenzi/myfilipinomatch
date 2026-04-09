import { useEffect, useRef } from "react";

const VERSION_ENDPOINT = "/version.json";
const VERSION_QUERY_PARAM = "__app_update";
const RELOAD_GUARD_KEY = "__app_reload_target__";
const CHECK_INTERVAL_MS = 60_000;

type VersionPayload = {
  buildId?: string | null;
};

const passiveInputTypes = new Set([
  "button",
  "submit",
  "reset",
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "date",
  "time",
  "month",
  "week",
]);

const canReloadWithoutInterrupting = () => {
  if (document.visibilityState !== "visible") return false;

  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return true;
  if (activeElement.isContentEditable) return false;

  if (activeElement instanceof HTMLTextAreaElement) {
    return activeElement.value.trim().length === 0;
  }

  if (activeElement instanceof HTMLInputElement) {
    return passiveInputTypes.has(activeElement.type) || activeElement.value.trim().length === 0;
  }

  return true;
};

const removeVersionQueryParam = () => {
  const url = new URL(window.location.href);

  if (url.searchParams.get(VERSION_QUERY_PARAM) !== __APP_BUILD_ID__) {
    return;
  }

  url.searchParams.delete(VERSION_QUERY_PARAM);
  window.history.replaceState(window.history.state, "", url.toString());
};

const reloadToLatestBuild = (latestBuildId: string) => {
  if (sessionStorage.getItem(RELOAD_GUARD_KEY) === latestBuildId) {
    return;
  }

  sessionStorage.setItem(RELOAD_GUARD_KEY, latestBuildId);

  const url = new URL(window.location.href);
  url.searchParams.set(VERSION_QUERY_PARAM, latestBuildId);
  window.location.replace(url.toString());
};

const fetchLatestBuildId = async () => {
  const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      pragma: "no-cache",
      "cache-control": "no-cache, no-store, must-revalidate",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as VersionPayload;

  return typeof data.buildId === "string" && data.buildId.length > 0 ? data.buildId : null;
};

export const useAppVersionSync = () => {
  const pendingBuildIdRef = useRef<string | null>(null);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return undefined;
    }

    removeVersionQueryParam();

    const queueReload = (latestBuildId: string) => {
      pendingBuildIdRef.current = latestBuildId;

      if (canReloadWithoutInterrupting()) {
        reloadToLatestBuild(latestBuildId);
      }
    };

    const checkForNewBuild = async () => {
      if (checkingRef.current || document.visibilityState === "hidden") {
        return;
      }

      checkingRef.current = true;

      try {
        const latestBuildId = await fetchLatestBuildId();

        if (!latestBuildId || latestBuildId === __APP_BUILD_ID__) {
          return;
        }

        queueReload(latestBuildId);
      } catch {
        // Ignore transient network errors and try again on the next interval/focus.
      } finally {
        checkingRef.current = false;
      }
    };

    const flushPendingReload = () => {
      if (pendingBuildIdRef.current && canReloadWithoutInterrupting()) {
        reloadToLatestBuild(pendingBuildIdRef.current);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        flushPendingReload();
        void checkForNewBuild();
      }
    };

    const handleFocus = () => {
      flushPendingReload();
      void checkForNewBuild();
    };

    const handleOnline = () => {
      void checkForNewBuild();
    };

    const initialCheckId = window.setTimeout(() => {
      void checkForNewBuild();
    }, 3_000);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkForNewBuild();
      }
    }, CHECK_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearTimeout(initialCheckId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
};
