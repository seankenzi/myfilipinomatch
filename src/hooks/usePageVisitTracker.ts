import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function parseUserAgent(ua: string) {
  let device_type = "desktop";
  if (/tablet|ipad/i.test(ua)) device_type = "tablet";
  else if (/mobile|android|iphone/i.test(ua)) device_type = "mobile";

  let browser = "Other";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/opera|opr\//i.test(ua)) browser = "Opera";

  let os = "Other";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { device_type, browser, os };
}

export function usePageVisitTracker() {
  const location = useLocation();
  const tracked = useRef(new Set<string>());

  useEffect(() => {
    const key = location.pathname;
    // Only track each path once per session
    if (tracked.current.has(key)) return;
    tracked.current.add(key);

    const ua = navigator.userAgent;
    const { device_type, browser, os } = parseUserAgent(ua);

    (async () => {
      const [{ data: { user } }, geo] = await Promise.all([
        supabase.auth.getUser(),
        fetch("https://ipapi.co/json/")
          .then(r => r.json())
          .then(d => ({ ip: d.ip as string | null, country: d.country_name as string | null }))
          .catch(() => ({ ip: null, country: null })),
      ]);
      await supabase.from("page_visits").insert({
        user_id: user?.id || null,
        user_agent: ua,
        device_type,
        browser,
        os,
        page_path: key,
        referrer: document.referrer || null,
        ip_address: geo.ip,
        country: geo.country,
      } as any);
    })();
  }, [location.pathname]);
}
