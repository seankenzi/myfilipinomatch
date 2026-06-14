import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Shield, Heart, Star, Flag, MessageCircle } from "lucide-react";
import OnlineStatus from "@/components/OnlineStatus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { useSignedPhotos } from "@/hooks/useSignedPhotos";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  province: string | null;
  bio: string | null;
  interests: string[] | null;
  relationship_intent: string | null;
  relocation_intent: string | null;
  photos: string[] | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  user_type: string | null;
  international_preference: boolean | null;
  education: string | null;
  language: string | null;
  want_children: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  relationship_status: string | null;
  created_at: string;
  last_seen: string | null;
  onboarding_completed?: boolean | null;
  is_flagged?: boolean | null;
}

const getFlagEmoji = (country: string) => {
  const flags: Record<string, string> = {
    Philippines: "🇵🇭", "United States": "🇺🇸", Canada: "🇨🇦", "United Kingdom": "🇬🇧",
    Australia: "🇦🇺", Japan: "🇯🇵", "South Korea": "🇰🇷", Germany: "🇩🇪",
    France: "🇫🇷", Italy: "🇮🇹", Spain: "🇪🇸", Netherlands: "🇳🇱",
    Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Singapore: "🇸🇬",
  };
  return flags[country] || "🌍";
};

const formatIntent = (intent: string) => {
  const map: Record<string, string> = {
    serious: "Serious Relationship", casual: "Casual Dating",
    marriage: "Marriage", friendship: "Friendship",
    long_term: "Long-term Relationship",
  };
  return map[intent] || intent;
};

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  // Reset photo index when viewing a different profile
  useEffect(() => { setActivePhoto(0); }, [id]);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagging, setFlagging] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      // Try the RPC first (requires onboarding_completed = true)
      const { data } = await supabase.rpc("get_profile_by_id", { profile_id: id });
      let profileData = data && data.length > 0 ? data[0] : null;

      // Admin fallback is still constrained to public-profile eligibility so admins
      // don't accidentally see incomplete/no-photo/flagged accounts as normal profiles.
      if (!profileData && isAdmin) {
        const { data: directData } = await supabase
          .from("profiles")
          .select("id, full_name, age, gender, country, city, province, bio, interests, relationship_intent, relocation_intent, photos, avatar_url, is_verified, is_premium, user_type, international_preference, education, language, want_children, height_cm, weight_kg, relationship_status, created_at, last_seen, onboarding_completed, is_flagged")
          .eq("id", id)
          .maybeSingle();

        const directPhotos = directData?.photos || [];
        profileData = directData?.onboarding_completed && !directData?.is_flagged && directPhotos.length >= 3
          ? directData
          : null;
      }

      setProfile(profileData as Profile | null);
      setLoading(false);
    };
    const checkLiked = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", user.id)
        .eq("liked_id", id);
      setLiked((data || []).length > 0);
    };
    const checkMatch = async () => {
      if (!user) return;
      // Check mutual matches
      const { data } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${user.id})`);
      if (data && data.length > 0) { setMatchId(data[0].id); return; }
      // Check DM conversations
      const { data: dmData } = await supabase
        .from("dm_conversations" as any)
        .select("id")
        .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${id}),and(initiator_id.eq.${id},recipient_id.eq.${user.id})`) as any;
      if (dmData && dmData.length > 0) setMatchId(`dm:${dmData[0].id}`);
    };
    const checkPremium = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      setIsPremium(data?.is_premium === true);
    };
    fetchProfile();
    checkLiked();
    checkMatch();
    checkPremium();
  }, [id, user, isAdmin]);

  const rawPhotos = profile
    ? [...new Set([
        ...(profile.photos || []),
        ...(profile.avatar_url && !(profile.photos || []).includes(profile.avatar_url)
          ? [profile.avatar_url]
          : []),
      ].filter(Boolean))] as string[]
    : [];
  
  const photos = useSignedPhotos(rawPhotos, "detail");

  const handleLike = async () => {
    if (!user || !profile) return;
    if (liked) return;
    const { error } = await supabase.from("likes").insert({ liker_id: user.id, liked_id: profile.id });
    if (!error) {
      setLiked(true);
      toast({ title: "Liked!", description: `You liked ${profile.full_name.split(" ")[0]}` });
      // Send "someone liked you" email to the liked person
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "profile-liked",
          recipientUserId: profile.id,
          idempotencyKey: `profile-liked-${user.id}-${profile.id}`,
          templateData: { likerName: user.user_metadata?.full_name?.split(" ")[0] || "" },
        },
      }).catch(() => {});
      // Check for mutual match
      const { data: mutual } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", profile.id)
        .eq("liked_id", user.id);
      if (mutual && mutual.length > 0) {
        await supabase.rpc("create_match_if_mutual", { other_user_id: profile.id });
        toast({ title: "It's a Match! 🎉", description: `You and ${profile.full_name.split(" ")[0]} liked each other!` });
        if (user.email) {
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "match-notification",
              recipientEmail: user.email,
              idempotencyKey: `match-notif-${user.id}-${profile.id}`,
              templateData: { matchName: profile.full_name.split(" ")[0] },
            },
          }).catch(() => {});
        }
      }
    }
  };

  const submitPhotoFlag = async () => {
    if (!user || !profile) return;
    setFlagging(true);
    const photoUrl = rawPhotos[activePhoto] || rawPhotos[0] || "";
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: profile.id,
      reason: "inappropriate_photo",
      details: `Reported photo #${activePhoto + 1}: ${photoUrl}`,
    });
    setFlagging(false);
    setFlagDialogOpen(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Photo reported",
        description: "Thanks — our team will review this photo shortly.",
      });
    }
  };



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Profile not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={profile ? `${profile.full_name}${profile.age ? `, ${profile.age}` : ""} | MyFilipinoMatch` : "Profile | MyFilipinoMatch"}
        description={profile?.bio ? profile.bio.slice(0, 155) : "View this profile on MyFilipinoMatch"}
        noIndex
      />
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Photo gallery */}
          {photos.length > 0 && photos[0] ? (
            <div className="relative w-full max-w-xs mx-auto overflow-hidden rounded-2xl aspect-[3/4] bg-muted">
              {photos[activePhoto] ? (
                <>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted z-0">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                  <img
                    key={activePhoto}
                    src={photos[activePhoto]}
                    alt={`${profile.full_name} photo ${activePhoto + 1}`}
                    className="relative z-10 h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                    // @ts-expect-error fetchpriority is a valid HTML attribute, not yet in React types
                    fetchpriority="high"
                  />
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {photos.length > 1 && (
                <>
                  <div className="absolute top-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`h-1 rounded-full transition-all ${
                          i === activePhoto ? "w-6 bg-primary-foreground" : "w-3 bg-primary-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setActivePhoto((p) => (p > 0 ? p - 1 : photos.length - 1))}
                    className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card/60 p-2 backdrop-blur-sm transition-colors hover:bg-card/80"
                  >
                    <ArrowLeft className="h-4 w-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => setActivePhoto((p) => (p < photos.length - 1 ? p + 1 : 0))}
                    className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card/60 p-2 backdrop-blur-sm transition-colors hover:bg-card/80 rotate-180"
                  >
                    <ArrowLeft className="h-4 w-4 text-foreground" />
                  </button>
                </>
              )}
              {user && profile && user.id !== profile.id && (
                <button
                  onClick={() => setFlagDialogOpen(true)}
                  aria-label="Report this photo as inappropriate"
                  title="Report photo"
                  className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-destructive/90"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl aspect-[3/4] max-w-sm mx-auto bg-muted text-6xl">👤</div>
          )}

          {/* Name & basic info */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold font-display text-foreground">
                {profile.full_name}{profile.age ? `, ${profile.age}` : ""}
              </h1>
              {profile.is_verified && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <div className="flex justify-center">
              <OnlineStatus lastSeen={profile.last_seen} size="md" showText />
            </div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[profile.city, profile.province, profile.country].filter(Boolean).join(", ") || "Location not set"}
              {profile.country && <span className="ml-1">{getFlagEmoji(profile.country)}</span>}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {profile.relationship_intent && (
              <Badge variant="outline" className="text-xs">{formatIntent(profile.relationship_intent)}</Badge>
            )}
            {profile.user_type && (
              <Badge variant="outline" className="text-xs capitalize">{profile.user_type}</Badge>
            )}
            {profile.international_preference && (
              <Badge variant="outline" className="text-xs">🌍 Open to long-distance dating</Badge>
            )}
            {profile.relocation_intent && (
              <Badge variant="outline" className="text-xs">✈️ Relocation: {profile.relocation_intent.replace(/-/g, " ")}</Badge>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">About</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          {(profile.education || profile.language || profile.height_cm || profile.weight_kg || profile.want_children || profile.relationship_status) && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {profile.relationship_status && (
                  <div><span className="text-muted-foreground">Status:</span> <span className="capitalize">{profile.relationship_status}</span></div>
                )}
                {profile.education && (
                  <div><span className="text-muted-foreground">Education:</span> {profile.education}</div>
                )}
                {profile.language && (
                  <div><span className="text-muted-foreground">Language:</span> {profile.language}</div>
                )}
                {profile.height_cm && (
                  <div><span className="text-muted-foreground">Height:</span> {profile.height_cm} cm</div>
                )}
                {profile.weight_kg && (
                  <div><span className="text-muted-foreground">Weight:</span> {profile.weight_kg} kg</div>
                )}
                {profile.want_children && (
                  <div className="col-span-2"><span className="text-muted-foreground">Children:</span> <span className="capitalize">{profile.want_children.replace(/-/g, " ")}</span></div>
                )}
              </div>
            </div>
          )}
          {user && user.id !== profile.id && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleLike}
                disabled={liked}
                className="flex-1 gap-2"
                variant={liked ? "secondary" : "default"}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
                {liked ? "Liked" : "Like"}
              </Button>
              <Button
                onClick={async () => {
                  if (matchId) {
                    // Navigate to existing match or DM conversation
                    if (matchId.startsWith('dm:')) {
                      navigate(`/messages?dm=${matchId.slice(3)}`);
                    } else {
                      navigate(`/messages?match=${matchId}`);
                    }
                  } else if (isPremium) {
                    // Premium user: create a DM conversation (separate from matches)
                    const { data: insertData, error } = await supabase
                      .from("dm_conversations" as any)
                      .insert({ initiator_id: user.id, recipient_id: profile.id } as any)
                      .select("id")
                      .single() as any;
                    if (!error && insertData) {
                      setMatchId(`dm:${insertData.id}`);
                      navigate(`/messages?dm=${insertData.id}`);
                    } else if (error?.code === "23505") {
                      // DM conversation already exists, fetch it
                      const { data: existing } = await supabase
                        .from("dm_conversations" as any)
                        .select("id")
                        .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${profile.id}),and(initiator_id.eq.${profile.id},recipient_id.eq.${user.id})`)
                        .single() as any;
                      if (existing) {
                        setMatchId(`dm:${existing.id}`);
                        navigate(`/messages?dm=${existing.id}`);
                      }
                    } else {
                      toast({ title: "Error", description: "Could not start conversation. Please try again." });
                    }
                  } else {
                    toast({ title: "Match required", description: "Upgrade to Premium to message anyone directly, or wait for a mutual match!" });
                    navigate("/premium");
                  }
                }}
                variant="outline"
                className="flex-1 gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {isPremium && !matchId ? "Direct Message ✨" : "Message"}
              </Button>
            </div>
          )}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
};

export default ProfileDetail;
