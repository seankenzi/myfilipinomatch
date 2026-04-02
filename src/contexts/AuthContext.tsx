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

      // Fallback only: signup emails are primarily triggered from the backend.
      if (_event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const normalizedUserEmail = u.email?.trim().toLowerCase();

        if (!normalizedUserEmail) return;

        (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('welcome_email_sent')
              .eq('id', u.id)
              .single();

            if (profile?.welcome_email_sent) return;

            const { data: welcomeResult, error: welcomeError } = await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'welcome-email',
                recipientEmail: u.email,
                idempotencyKey: `welcome-signup-${normalizedUserEmail}`,
                templateData: { name: u.user_metadata?.full_name || undefined },
              },
            });

            if (welcomeError || welcomeResult?.queued !== true) {
              console.error('[Welcome email] fallback enqueue failed:', welcomeError ?? welcomeResult);
              return;
            }

            const { data: adminEmails, error: adminEmailsError } = await supabase.rpc('get_admin_emails');

            if (adminEmailsError) {
              console.error('[Admin signup email] failed to load admin emails:', adminEmailsError);
              return;
            }

            const adminResults = await Promise.allSettled(
              (adminEmails ?? []).map(async (row: { email: string }) => {
                const normalizedAdminEmail = row.email.trim().toLowerCase();

                const { data, error } = await supabase.functions.invoke('send-transactional-email', {
                  body: {
                    templateName: 'admin-new-signup',
                    recipientEmail: row.email,
                    idempotencyKey: `admin-new-signup-${normalizedUserEmail}-${normalizedAdminEmail}`,
                    templateData: {
                      userName: u.user_metadata?.full_name || undefined,
                      userEmail: u.email,
                    },
                  },
                });

                if (error || data?.queued !== true) {
                  throw error ?? new Error('Admin signup email was not queued');
                }
              })
            );

            const failedAdminEmails = adminResults.filter((result) => result.status === 'rejected');
            if (failedAdminEmails.length > 0) {
              console.error('[Admin signup email] fallback enqueue failed:', failedAdminEmails);
              return;
            }

            await supabase
              .from('profiles')
              .update({ welcome_email_sent: true })
              .eq('id', u.id);
          } catch (err) {
            console.error('[Welcome/Admin email fallback]', err);
          }
        })();
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
