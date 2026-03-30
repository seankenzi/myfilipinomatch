import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Crown, Lock, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedPhotoUrls } from "@/lib/storage";
import OnlineStatus from "@/components/OnlineStatus";
import { markLikesVisited } from "@/hooks/useNewLikesCount";
import { useQueryClient } from "@tanstack/react-query";

interface LikerProfile {
  id: string;
  full_name: string;
  age: number | null;
  avatar_url: string | null;
  photos: string[] | null;
  country: string | null;
  city: string | null;
  is_verified: boolean | null;
  last_seen: string | null;
  created_at: string;
  liked_at: string;
}

const getFlagEmoji = (country: string | null) => {
  if (!country) return "";
  const flags: Record<string, string> = {
    Philippines: "🇵🇭", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
    Canada: "🇨🇦", Australia: "🇦🇺", Germany: "🇩🇪", Japan: "🇯🇵",
    "South Korea": "🇰🇷", France: "🇫🇷", Italy: "🇮🇹", Spain: "🇪🇸",
    Netherlands: "🇳🇱", Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰",
    Singapore: "🇸🇬",
  };
  return flags[country] || "🌍";
};

const WhoLikedMe = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Mark visit and reset badge count
  useEffect(() => {
    if (!user) return;
    markLikesVisited(user.id);
    queryClient.invalidateQueries({ queryKey: ["new-likes-count", user.id] });
    return () => {
      if (user) {
        markLikesVisited(user.id);
        queryClient.invalidateQueries({ queryKey: ["new-likes-count", user.id] });
      }
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      // Check premium status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      const premium = profileData?.is_premium === true;
      setIsPremium(premium);

      // Get likes where current user is the liked person
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("liker_id, created_at")
        .eq("liked_id", user.id)
        .order("created_at", { ascending: false });

      if (likesError || !likesData || likesData.length === 0) {
        setLikers([]);
        setLoading(false);
        return;
      }

      // Get liker profiles via the secure RPC
      const likerIds = likesData.map((l) => l.liker_id);
      const likerProfiles: LikerProfile[] = [];

      // Fetch each profile via secure function
      const profilePromises = likerIds.map((id) =>
        supabase.rpc("get_profile_by_id", { profile_id: id })
      );
      const results = await Promise.all(profilePromises);

      results.forEach((result, index) => {
        if (result.data && result.data.length > 0) {
          const p = result.data[0];
          likerProfiles.push({
            ...p,
            liked_at: likesData[index].created_at,
          } as LikerProfile);
        }
      });

      // Resolve signed photo URLs
      const allPhotoPaths: string[] = [];
      likerProfiles.forEach((p) => {
        const photo = p.photos?.[0] || p.avatar_url;
        if (photo) allPhotoPaths.push(photo);
      });

      if (allPhotoPaths.length > 0) {
        const signedUrls = await getSignedPhotoUrls(allPhotoPaths);
        const urlMap = new Map<string, string>();
        allPhotoPaths.forEach((path, i) => urlMap.set(path, signedUrls[i]));

        likerProfiles.forEach((p) => {
          if (p.photos?.[0]) p.photos[0] = urlMap.get(p.photos[0]) || p.photos[0];
          if (p.avatar_url) p.avatar_url = urlMap.get(p.avatar_url) || p.avatar_url;
        });
      }

      setLikers(likerProfiles);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleLikeBack = async (likerId: string) => {
    if (!user) return;
    const { error } = await supabase.from("likes").insert({ liker_id: user.id, liked_id: likerId });
    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Send "someone liked you" email to the liked person
    if (!error || error.code === "23505") {
      const { data: likedProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", likerId)
        .maybeSingle();
      if (likedProfile?.email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "profile-liked",
            recipientEmail: likedProfile.email,
            idempotencyKey: `profile-liked-${user.id}-${likerId}`,
            templateData: { likerName: user.user_metadata?.full_name?.split(" ")[0] || "" },
          },
        }).catch(() => {});
      }
    }

    // Check for mutual match
    const { error: matchError } = await supabase.rpc("create_match_if_mutual", { other_user_id: likerId });
    if (!matchError) {
      toast({ title: "🎉 It's a Match!", description: "You liked each other! Start a conversation now." });
      if (user.email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "match-notification",
            recipientEmail: user.email,
            idempotencyKey: `match-notif-${user.id}-${likerId}`,
          },
        }).catch(() => {});
      }
    } else {
      toast({ title: "Liked!", description: "You liked them back." });
    }
  };

  const getPhotoUrl = (profile: LikerProfile) => {
    return profile.photos?.[0] || profile.avatar_url || null;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl px-4 pb-24 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              Who Liked You
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {likers.length > 0
                ? `${likers.length} ${likers.length === 1 ? "person" : "people"} liked your profile`
                : "See who's interested in you"}
            </p>
          </div>
          {!isPremium && likers.length > 0 && (
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate("/premium")}
              className="gap-1.5"
            >
              <Crown className="h-4 w-4" />
              Reveal All
            </Button>
          )}
        </div>

        {/* Premium upsell banner for free users */}
        {!isPremium && likers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {likers.length} {likers.length === 1 ? "person has" : "people have"} liked you!
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to Premium to see who they are and match instantly.
              </p>
            </div>
            <Button variant="hero" size="sm" onClick={() => navigate("/premium")} className="shrink-0">
              ❤️ Upgrade
            </Button>
          </motion.div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : likers.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No likes yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Complete your profile and add great photos to attract more attention!
            </p>
            <Button className="mt-4" onClick={() => navigate("/discover")}>
              Browse Profiles
            </Button>
          </motion.div>
        ) : (
          /* Likers grid */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <AnimatePresence>
              {likers.map((liker, index) => {
                const photoUrl = getPhotoUrl(liker);
                return (
                  <motion.div
                    key={liker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                    onClick={() => {
                      if (isPremium) navigate(`/profile/${liker.id}`);
                      else {
                        toast({
                          title: "Premium Feature",
                          description: "Upgrade to see who liked you!",
                        });
                        navigate("/premium");
                      }
                    }}
                  >
                    {/* Photo */}
                    <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={isPremium ? liker.full_name : "Someone"}
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            !isPremium ? "blur-lg scale-110" : ""
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl opacity-40">
                          👤
                        </div>
                      )}

                      {/* Blur overlay for free users */}
                      {!isPremium && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/30 backdrop-blur-sm">
                          <div className="rounded-full bg-card/80 p-3 shadow-lg mb-2">
                            <Lock className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-xs font-medium text-foreground bg-card/80 px-2 py-0.5 rounded-full">
                            Premium Only
                          </span>
                        </div>
                      )}

                      {/* Time badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-[10px] bg-card/80 backdrop-blur-sm">
                          {timeAgo(liker.liked_at)}
                        </Badge>
                      </div>

                      {/* Verified badge */}
                      {isPremium && liker.is_verified && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-[10px] bg-card/80 backdrop-blur-sm gap-0.5">
                            ✓ Verified
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {isPremium
                            ? `${liker.full_name.split(" ")[0]}${liker.age ? `, ${liker.age}` : ""}`
                            : "???"}
                        </h3>
                        {isPremium && liker.last_seen && (
                          <OnlineStatus lastSeen={liker.last_seen} size="sm" />
                        )}
                      </div>
                      {isPremium && liker.country && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {getFlagEmoji(liker.country)} {[liker.city, liker.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {!isPremium && (
                        <p className="text-xs text-muted-foreground mt-0.5">Tap to reveal</p>
                      )}

                      {/* Like back button for premium */}
                      {isPremium && (
                        <Button
                          size="sm"
                          className="mt-2 w-full gap-1 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeBack(liker.id);
                          }}
                        >
                          <Heart className="h-3 w-3" />
                          Like Back
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default WhoLikedMe;
