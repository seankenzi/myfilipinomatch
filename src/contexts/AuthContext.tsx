import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL = 60_000; // 1 minute

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

      // Send welcome email on first sign-in after email confirmation
      if (_event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const createdAt = new Date(u.created_at).getTime();
        const now = Date.now();
        // Only send within 2 minutes of account creation (first login)
        if (now - createdAt < 120_000) {
          supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'welcome-email',
              recipientEmail: u.email,
              idempotencyKey: `welcome-${u.id}`,
              templateData: { name: u.user_metadata?.full_name || undefined },
            },
          }).catch(() => { /* non-critical */ });
        }
      }
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
