import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL = 60_000; // 1 minute
const OAUTH_SIGNUP_EMAIL_SYNC_WINDOW_MS = 24 * 60 * 60 * 1000;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  premiumLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);
  const attemptedSignupEmailSyncUserId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setPremiumLoading(false);
        return;
      }

      setPremiumLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        setIsPremium(data?.is_premium === true);
        setPremiumLoading(false);
      }
    };

    fetchPremiumStatus();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const maybeTriggerOAuthSignupEmails = async () => {
      if (!user || !session) {
        attemptedSignupEmailSyncUserId.current = null;
        return;
      }

      const authProvider = session.user.app_metadata?.provider;
      if (!authProvider || authProvider === "email") {
        return;
      }

      if (attemptedSignupEmailSyncUserId.current === user.id) {
        return;
      }

      attemptedSignupEmailSyncUserId.current = user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("created_at, welcome_email_sent")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled || profileError || !profile || profile.welcome_email_sent) {
        return;
      }

      const createdAtMs = new Date(profile.created_at).getTime();
      if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > OAUTH_SIGNUP_EMAIL_SYNC_WINDOW_MS) {
        return;
      }

      const invokeSignupSync = async (accessToken: string) =>
        supabase.functions.invoke("auth-email-hook", {
          body: { trigger: "oauth-signup-sync" },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

      let accessToken = session.access_token;

      if (!accessToken) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (cancelled || refreshError) {
          return;
        }
        accessToken = refreshed.session?.access_token ?? "";
      }

      if (!accessToken) {
        return;
      }

      let { error: syncError } = await invokeSignupSync(accessToken);

      if (syncError && /401|jwt|unauthorized|auth/i.test(syncError.message || "")) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (cancelled || refreshError || !refreshed.session?.access_token) {
          return;
        }

        ({ error: syncError } = await invokeSignupSync(refreshed.session.access_token));
      }

      if (syncError) {
        console.error("OAuth signup email sync failed", syncError);
      }
    };

    void maybeTriggerOAuthSignupEmails();

    return () => {
      cancelled = true;
    };
  }, [session, user]);

  // Online heartbeat - update last_seen every minute
  useEffect(() => {
    if (!user) return;
    const updateLastSeen = () => {
      supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id).then();
    };
    updateLastSeen();
    const interval = setInterval(updateLastSeen, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    // Supabase returns a fake success with empty identities for duplicate emails
    if (!error && data?.user?.identities?.length === 0) {
      return { error: new Error("An account with this email already exists. Please sign in instead.") };
    }
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) {
      setSession(data.session ?? null);
      setUser(data.user ?? null);
      setLoading(false);
    }

    return { error: error as Error | null, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isPremium, premiumLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
