import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getSignedPhotoUrl } from "@/lib/storage";

interface DisplayMatch {
  id: string;
  name: string;
  age: number | null;
  city: string | null;
  country: string | null;
  image: string | null;
  lastActive: string;
  newMatch: boolean;
  type: string;
}

const getLastActiveLabel = (lastSeen: string | null) => {
  if (!lastSeen) return "Recently";
  const date = new Date(lastSeen);
  if (Number.isNaN(date.getTime())) return "Recently";
  return formatDistanceToNow(date, { addSuffix: true });
};

const MatchCard = ({ match }: { match: DisplayMatch }) => (
  <Link
    key={match.id}
    to={`/messages?match=${match.id}`}
    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
  >
    <div className="relative">
      {match.image ? (
        <img src={match.image} alt={match.name} loading="lazy" className="h-16 w-16 rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-lg">👤</div>
      )}
      {match.newMatch && (
        <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-card gradient-hero" />
      )}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">
          {match.name}{match.age ? `, ${match.age}` : ""}
        </h3>
        {match.newMatch && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">New</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {[match.city, match.country].filter(Boolean).join(", ") || "Location not set"}
      </p>
    </div>
    <div className="flex flex-col items-end gap-1">
      <MessageCircle className="h-5 w-5 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">{match.lastActive}</span>
    </div>
  </Link>
);

const Matches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchMatches = async () => {
      if (!user) {
        if (!cancelled) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      const { data: matchesData, error } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, created_at, type")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error || !matchesData) {
        if (!cancelled) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      const resolvedMatches = await Promise.all(
        matchesData.map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

          const { data: profileData } = await supabase.rpc("get_profile_by_id", {
            profile_id: otherUserId,
          });

          const profile = profileData?.[0];
          if (!profile) return null;

          const rawPhoto = profile.photos?.[0] || profile.avatar_url;
          const image = rawPhoto ? await getSignedPhotoUrl(rawPhoto) : null;

          return {
            id: match.id,
            name: profile.full_name,
            age: profile.age,
            city: profile.city,
            country: profile.country,
            image,
            lastActive: getLastActiveLabel(profile.last_seen),
            newMatch: Date.now() - new Date(match.created_at).getTime() < 24 * 60 * 60 * 1000,
            type: (match as any).type || 'mutual',
          } satisfies DisplayMatch;
        })
      );

      if (!cancelled) {
        setMatches(resolvedMatches.filter((match): match is DisplayMatch => match !== null));
        setLoading(false);
      }
    };

    fetchMatches();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-bold">Your Matches</h1>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-12 shadow-card">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Mutual Matches */}
              <div>
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Mutual Matches
                </h2>
                {matches.filter((m) => m.type === 'mutual').length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                    <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No mutual matches yet. Keep discovering!</p>
                    <Link to="/discover">
                      <Button variant="hero" size="sm" className="mt-4">
                        Discover Profiles
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.filter((m) => m.type === 'mutual').map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Message Conversations */}
              {matches.filter((m) => m.type === 'direct_message').length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Direct Message Conversations
                  </h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Premium conversations you initiated — not mutual matches
                  </p>
                  <div className="space-y-3">
                    {matches.filter((m) => m.type === 'direct_message').map((match) => (
                      <MatchCard key={match.id} match={match} isDM />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Matches;
