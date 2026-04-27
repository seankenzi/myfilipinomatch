import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "mfm_analytics_session_id";
const SOURCE_KEY = "mfm_signup_source";

function isSkippedHost(): boolean {
  const host = window.location.hostname;
  return (
    host.includes("lovableproject.com") ||
    host.includes("lovable.app/builder") ||
    host === "localhost"
  );
}

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto as Crypto).randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Persist the source (foreigner|filipino) so we can attribute later funnel events. */
export function setSignupSource(source: "foreigner" | "filipino") {
  try {
    sessionStorage.setItem(SOURCE_KEY, source);
    localStorage.setItem(SOURCE_KEY, source);
  } catch {
    // ignore
  }
}

export function getSignupSource(): string | null {
  try {
    return sessionStorage.getItem(SOURCE_KEY) || localStorage.getItem(SOURCE_KEY);
  } catch {
    return null;
  }
}

export async function trackEvent(
  eventName: string,
  options: {
    source?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  if (typeof window === "undefined") return;
  if (isSkippedHost()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const source = options.source ?? getSignupSource();

    await supabase.from("analytics_events").insert({
      event_name: eventName,
      source: source || null,
      session_id: getOrCreateSessionId(),
      user_id: user?.id || null,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      metadata: (options.metadata ?? {}) as never,
    } as never);
  } catch {
    // silent fail — analytics must never block UX
  }
}
