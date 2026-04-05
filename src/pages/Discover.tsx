import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, X, MapPin, Shield, Filter, ChevronDown, Star, Flag,
  LayoutGrid, Layers, Globe, Send, Sparkles, Clock, UserPlus,
  ChevronLeft, ChevronRight, SlidersHorizontal, Undo2, Zap, Lock, Crown, Video, Gem, User
} from "lucide-react";
import OnlineStatus from "@/components/OnlineStatus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoBanner from "@/components/VideoBanner";
import VideoCallModal from "@/components/VideoCallModal";
import VideoCall from "@/components/VideoCall";
import { getSignedPhotoUrls } from "@/lib/storage";

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
  created_at: string;
  last_seen: string | null;
}

const COUNTRIES = [
  "Philippines", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "Japan", "South Korea", "France", "Italy", "Spain",
  "Netherlands", "Sweden", "Norway", "Denmark", "Singapore"
];

const formatIntent = (intent: string | null) => {
  if (!intent) return null;
  return intent.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatRelocation = (relocation: string | null) => {
  if (!relocation) return null;
  return relocation.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getFlagEmoji = (country: string | null) => {
  if (!country) return "";
  const flags: Record<string, string> = {
    "Philippines": "🇵🇭", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
    "Canada": "🇨🇦", "Australia": "🇦🇺", "Germany": "🇩🇪", "Japan": "🇯🇵",
    "South Korea": "🇰🇷", "France": "🇫🇷", "Italy": "🇮🇹", "Spain": "🇪🇸",
    "Netherlands": "🇳🇱", "Sweden": "🇸🇪", "Norway": "🇳🇴", "Denmark": "🇩🇰",
    "Singapore": "🇸🇬",
  };
  return flags[country] || "🌍";
};

// Shimmer skeleton for loading images
const ImageSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-muted ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-10 w-10 rounded-full bg-muted-foreground/10" />
    </div>
  </div>
);

// Static placeholder for profiles with no photo (no shimmer)
const NoPhotoPlaceholder = ({ className = "", variant = "card" }: { className?: string; variant?: "card" | "avatar" }) => (
  <div className={`relative overflow-hidden ${variant === "avatar" ? "bg-primary/10" : "bg-muted"} ${className}`}>
    <div className="flex h-full w-full items-center justify-center">
      {variant === "avatar" ? (
        <User className="h-6 w-6 text-primary/30" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
          <User className="h-10 w-10" />
          <span className="text-xs font-medium">No Photo</span>
        </div>
      )}
    </div>
  </div>
);

// Image with shimmer skeleton placeholder
const SkeletonImage = ({ src, alt, className = "", loading = "lazy" as "lazy" | "eager" }: { src: string; alt: string; className?: string; loading?: "lazy" | "eager" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isSignedUrl = src.startsWith("http");

  if (error) return <NoPhotoPlaceholder className={className} />;

  return (
    <div className={`relative ${className}`}>
      {(!loaded || !isSignedUrl) && (
        <ImageSkeleton className="absolute inset-0" />
      )}
      {isSignedUrl && (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading={loading}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

// Photo gallery component for swipe cards
const PhotoGallery = ({ photos, name }: { photos: string[]; name: string }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <span className="text-6xl opacity-40">👤</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full group">
      <SkeletonImage
        src={photos[photoIndex]}
        alt={`${name} photo ${photoIndex + 1}`}
        className="h-full w-full"
        loading="eager"
      />
      {/* Photo indicator dots */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }}
              className={`h-1 flex-1 rounded-full transition-all duration-300 max-w-12 ${
                i === photoIndex
                  ? "bg-primary-foreground shadow-sm"
                  : "bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
      {/* Tap zones for navigation */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setPhotoIndex((prev) => Math.max(0, prev - 1)); }}
            className="absolute left-0 top-0 h-full w-1/3 z-10"
            aria-label="Previous photo"
          />
          <button
            onClick={(e) => { e.stopPropagation(); setPhotoIndex((prev) => Math.min(photos.length - 1, prev + 1)); }}
            className="absolute right-0 top-0 h-full w-1/3 z-10"
            aria-label="Next photo"
          />
          {/* Arrow hints on hover */}
          {photoIndex > 0 && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="rounded-full bg-card/70 backdrop-blur-sm p-1.5">
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </div>
            </div>
          )}
          {photoIndex < photos.length - 1 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="rounded-full bg-card/70 backdrop-blur-sm p-1.5">
                <ChevronRight className="h-4 w-4 text-foreground" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const getProfilePhotos = (profile: Profile): string[] => {
  const photos: string[] = [];
  if (profile.photos && profile.photos.length > 0) photos.push(...profile.photos);
  else if (profile.avatar_url) photos.push(profile.avatar_url);
  return photos;
};

const DAILY_LIKE_LIMIT = 10;

const Discover = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [dragX, setDragX] = useState(0);
  const [expandedBio, setExpandedBio] = useState(false);
  const [swiped, setSwiped] = useState(false);

  // View toggle
  const isMobile = window.innerWidth < 768;
  const [viewMode, setViewMode] = useState<"swipe" | "list">(isMobile ? "swipe" : "list");

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterIntent, setFilterIntent] = useState<string>("all");
  const [filterCity, setFilterCity] = useState("");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterAgeRange, setFilterAgeRange] = useState<[number, number]>([18, 65]);

  // Advanced filters (premium-only)
  const [filterEducation, setFilterEducation] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterChildren, setFilterChildren] = useState<string>("all");
  const [filterHeightRange, setFilterHeightRange] = useState<[number, number]>([140, 210]);

  // Intro message dialog
  const [introDialog, setIntroDialog] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const [introTarget, setIntroTarget] = useState<Profile | null>(null);

  // Report dialog
  const [reportDialog, setReportDialog] = useState(false);
  const [reportTarget, setReportTarget] = useState<Profile | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  // Already liked/passed IDs
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Premium & limits
  const [isPremium, setIsPremium] = useState(false);
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0);

  // Undo pass
  const [lastPassedProfile, setLastPassedProfile] = useState<Profile | null>(null);
  const [lastPassedIndex, setLastPassedIndex] = useState<number | null>(null);

  // Video call modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalTarget, setVideoModalTarget] = useState<string>("");

  // Direct video call
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [videoCallMatchId, setVideoCallMatchId] = useState<string | null>(null);
  const [videoCallUserName, setVideoCallUserName] = useState("");

  // Boost
  const [isBoosted, setIsBoosted] = useState(false);
  const [boostExpiresAt, setBoostExpiresAt] = useState<string | null>(null);

  // Fetch premium status, daily likes, and boost status
  useEffect(() => {
    if (!user) return;
    const fetchUserStatus = async () => {
      // Check premium
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      setIsPremium(profileData?.is_premium === true);

      // Count today's likes
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("liker_id", user.id)
        .gte("created_at", todayStart.toISOString());
      setDailyLikesUsed(count || 0);

      // Check active boost
      const { data: boostData } = await supabase
        .from("profile_boosts")
        .select("expires_at")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1);
      if (boostData && boostData.length > 0) {
        setIsBoosted(true);
        setBoostExpiresAt(boostData[0].expires_at);
      }
    };
    fetchUserStatus();
  }, [user]);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: likesData } = await supabase
      .from("likes")
      .select("liked_id")
      .eq("liker_id", user.id);

    const alreadyLiked = new Set((likesData || []).map((l) => l.liked_id));
    setLikedIds(alreadyLiked);

    // Use secure browse_profiles RPC (excludes email, sorts by boosts server-side)
    const rpcParams: Record<string, any> = {};
    if (filterCountry !== "all") rpcParams.filter_country = filterCountry;
    if (filterGender !== "all") rpcParams.filter_gender = filterGender;
    if (filterAgeRange[0] > 18) rpcParams.filter_min_age = filterAgeRange[0];
    if (filterAgeRange[1] < 65) rpcParams.filter_max_age = filterAgeRange[1];

    const { data, error } = await supabase.rpc("browse_profiles", rpcParams);

    if (error) {
      toast({ title: "Error loading profiles", description: error.message, variant: "destructive" });
    } else {
      let allProfiles = (data || []) as Profile[];

      // Apply client-side filters not supported by RPC
      if (filterIntent !== "all") {
        allProfiles = allProfiles.filter((p) => p.relationship_intent === filterIntent);
      }
      if (filterCity.trim()) {
        const cityLower = filterCity.trim().toLowerCase();
        allProfiles = allProfiles.filter((p) => p.city?.toLowerCase().includes(cityLower));
      }
      if (isPremium) {
        if (filterEducation !== "all") allProfiles = allProfiles.filter((p) => (p as any).education === filterEducation);
        if (filterLanguage !== "all") allProfiles = allProfiles.filter((p) => (p as any).language === filterLanguage);
        if (filterChildren !== "all") allProfiles = allProfiles.filter((p) => (p as any).want_children === filterChildren);
        if (filterHeightRange[0] > 140) allProfiles = allProfiles.filter((p) => (p as any).height_cm && (p as any).height_cm >= filterHeightRange[0]);
        if (filterHeightRange[1] < 210) allProfiles = allProfiles.filter((p) => (p as any).height_cm && (p as any).height_cm <= filterHeightRange[1]);
      }
      
      // Show profiles immediately (before signing) so the grid renders fast
      setProfiles([...allProfiles]);
      setCurrentIndex(0);
      setLoading(false);

      // Collect ALL photo paths to sign
      const allPaths: string[] = [];
      const pathSet = new Set<string>();
      allProfiles.forEach((p) => {
        const photos = p.photos?.length ? p.photos : p.avatar_url ? [p.avatar_url] : [];
        photos.forEach((photo) => {
          if (photo && !pathSet.has(photo)) {
            pathSet.add(photo);
            allPaths.push(photo);
          }
        });
      });

      if (allPaths.length === 0) return;

      // Sign in batches of 15 and update UI progressively
      const BATCH = 15;
      for (let i = 0; i < allPaths.length; i += BATCH) {
        const batch = allPaths.slice(i, i + BATCH);
        getSignedPhotoUrls(batch).then((signed) => {
          // Build map: raw path → signed URL (or empty string for missing files)
          const map = new Map<string, string>();
          batch.forEach((p, idx) => {
            map.set(p, signed[idx] || "");
          });
          setProfiles((prev) => prev.map((profile) => {
            let changed = false;
            const newPhotos = profile.photos?.map((ph) => {
              if (map.has(ph)) { changed = true; return map.get(ph)!; }
              return ph;
            }).filter(Boolean) || null;
            const newAvatar = profile.avatar_url && map.has(profile.avatar_url)
              ? (changed = true, map.get(profile.avatar_url)!)
              : profile.avatar_url;
            // Clear avatar if it resolved to empty
            const finalAvatar = newAvatar || null;
            return changed ? { ...profile, photos: newPhotos && newPhotos.length > 0 ? newPhotos : null, avatar_url: finalAvatar } : profile;
          }));
        });
      }
    }
  }, [user, filterCountry, filterIntent, filterCity, filterGender, filterAgeRange, isPremium, filterEducation, filterLanguage, filterChildren, filterHeightRange]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // For swipe view, show all profiles (including previously liked/passed)
  const swipeProfiles = profiles;
  const currentProfile = swipeProfiles[currentIndex];

  const dailyLikesRemaining = Math.max(0, DAILY_LIKE_LIMIT - dailyLikesUsed);
  const canLike = isPremium || dailyLikesRemaining > 0;

  const handleLike = async (profile: Profile) => {
    if (!user) return;

    if (!canLike) {
      toast({
        title: "Daily like limit reached",
        description: "Upgrade to Premium for unlimited likes!",
      });
      navigate("/premium");
      return;
    }

    const { error } = await supabase.from("likes").insert({
      liker_id: user.id,
      liked_id: profile.id,
    });

    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Send "someone liked you" email to the liked person
    if (!error || error.code === "23505") {
      const { data: likedProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", profile.id)
        .maybeSingle();
      if (likedProfile?.email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "profile-liked",
            recipientEmail: likedProfile.email,
            idempotencyKey: `profile-liked-${user.id}-${profile.id}`,
            templateData: { likerName: user.user_metadata?.full_name?.split(" ")[0] || "" },
          },
        }).catch(() => {});
      }
    }

    setDailyLikesUsed((prev) => prev + 1);

    const { data: mutualLike } = await supabase
      .from("likes")
      .select("id")
      .eq("liker_id", profile.id)
      .eq("liked_id", user.id)
      .maybeSingle();

    if (mutualLike) {
      // Create match via secure server-side function that validates mutual likes
      const { error: matchError } = await supabase.rpc("create_match_if_mutual", { other_user_id: profile.id });
      if (!matchError) {
        toast({
          title: "🎉 It's a Match!",
          description: `You and ${profile.full_name} liked each other!`,
        });
        // Send match notification email
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

    setLikedIds((prev) => new Set(prev).add(profile.id));
  };

  const handleSwipeAction = async (action: "like" | "pass") => {
    if (!currentProfile) return;

    // Track passed profile for undo
    if (action === "pass") {
      setLastPassedProfile(currentProfile);
      setLastPassedIndex(currentIndex);
    }

    setSwiped(true);
    setDirection(action === "like" ? "right" : "left");

    if (action === "like") await handleLike(currentProfile);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
      setDragX(0);
      setSwiped(false);
      setExpandedBio(false);
    }, 300);
  };

  const handleUndoPass = () => {
    if (!isPremium) {
      toast({ title: "Premium feature", description: "Upgrade to Premium to undo passes!" });
      navigate("/premium");
      return;
    }
    if (lastPassedProfile && lastPassedIndex !== null) {
      setCurrentIndex(lastPassedIndex);
      setLastPassedProfile(null);
      setLastPassedIndex(null);
      toast({ title: "Undo!", description: `${lastPassedProfile.full_name.split(" ")[0]} is back.` });
    }
  };

  const handleBoostProfile = async () => {
    if (!user) return;
    if (!isPremium) {
      toast({ title: "Premium feature", description: "Upgrade to Premium to boost your profile!" });
      navigate("/premium");
      return;
    }
    if (isBoosted) {
      toast({ title: "Already boosted", description: "Your profile is already boosted!" });
      return;
    }
    const { error } = await supabase.from("profile_boosts").insert({ user_id: user.id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setIsBoosted(true);
      setBoostExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      toast({ title: "🚀 Profile Boosted!", description: "You'll appear at the top of Discover for 24 hours!" });
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 60;
    const velocityThreshold = 300;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > swipeThreshold || velocity > velocityThreshold) handleSwipeAction("like");
    else if (offset < -swipeThreshold || velocity < -velocityThreshold) handleSwipeAction("pass");
    else setDragX(0);
  };

  const handleListLike = async (profile: Profile) => {
    await handleLike(profile);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  };

  const handlePriorityLike = (profile: Profile) => {
    setIntroTarget(profile);
    setIntroMessage("");
    setIntroDialog(true);
  };

  const handleVideoCallClick = async (profile: Profile) => {
    if (!isPremium) {
      setVideoModalTarget(profile.full_name);
      setVideoModalOpen(true);
      return;
    }

    if (!user) return;

    // Look up existing match
    const { data: matchesData } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    const existingMatch = matchesData?.find((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      return otherId === profile.id;
    });

    if (existingMatch) {
      setVideoCallMatchId(existingMatch.id);
      setVideoCallUserName(profile.full_name);
      setVideoCallOpen(true);
    } else {
      // Also check DM conversations
      const { data: dmData } = await supabase
        .from("dm_conversations" as any)
        .select("id")
        .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${profile.id}),and(initiator_id.eq.${profile.id},recipient_id.eq.${user.id})`)
        .maybeSingle() as any;

      if (dmData) {
        setVideoCallMatchId(dmData.id);
        setVideoCallUserName(profile.full_name);
        setVideoCallOpen(true);
      } else {
        toast({
          title: "💬 Direct Message first",
          description: `Use Direct Message ✨ to connect with ${profile.full_name.split(" ")[0]}, then you can video call.`,
        });
      }
    }
  };

  const sendIntroMessage = async () => {
    if (!introTarget || !user) return;
    await handleLike(introTarget);
    toast({
      title: "Priority like sent!",
      description: `Your intro was sent to ${introTarget.full_name}. They'll see it when you match.`,
    });
    setIntroDialog(false);
    setIntroMessage("");
    if (viewMode === "swipe") {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== introTarget.id));
    }
  };

  const handleReport = (profile: Profile) => {
    setReportTarget(profile);
    setReportReason("");
    setReportDetails("");
    setReportDialog(true);
  };

  const submitReport = async () => {
    if (!reportTarget || !user || !reportReason) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportTarget.id,
      reason: reportReason,
      details: reportDetails || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report submitted", description: "We'll review this profile. Thank you." });
    }
    setReportDialog(false);
  };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newMembers = profiles.filter((p) => new Date(p.created_at) > sevenDaysAgo);
  const noMoreProfiles = currentIndex >= swipeProfiles.length;

  const activeFilterCount = [
    filterCountry !== "all",
    filterIntent !== "all",
    filterGender !== "all",
    !!filterCity,
    filterAgeRange[0] > 18 || filterAgeRange[1] < 65,
    isPremium && filterEducation !== "all",
    isPremium && filterLanguage !== "all",
    isPremium && filterChildren !== "all",
    isPremium && (filterHeightRange[0] > 140 || filterHeightRange[1] < 210),
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex flex-1 flex-col items-center px-4 py-4 pb-24 md:pb-6">
        <div className="w-full max-w-6xl">

          {/* Hero section */}
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/10 p-4 text-center">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              ❤️ Don't just match — actually connect
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              🎥 Video calls help you build real relationships faster
            </p>
          </div>

          {/* Top Bar */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex rounded-xl border border-border bg-card p-1 shadow-card">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-medium transition-all min-h-[44px] ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("swipe")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-medium transition-all min-h-[44px] ${
                  viewMode === "swipe"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-4 w-4" />
                Cards
              </button>
            </div>

            <div className="flex-1" />

            <span className="text-xs text-muted-foreground">{profiles.length} people</span>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-card transition-all min-h-[44px] ${
                showFilters || activeFilterCount > 0
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                  {/* Age Range */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      Age Range
                      <span className="text-foreground font-semibold">{filterAgeRange[0]} – {filterAgeRange[1]}{filterAgeRange[1] >= 65 ? "+" : ""}</span>
                    </label>
                    <div className="mt-2 px-1">
                      <Slider
                        min={18}
                        max={65}
                        step={1}
                        value={filterAgeRange}
                        onValueChange={(v) => setFilterAgeRange(v as [number, number])}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Gender</label>
                    <div className="mt-1.5 flex gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "male", label: "Men" },
                        { value: "female", label: "Women" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFilterGender(opt.value)}
                          className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-all min-h-[44px] ${
                            filterGender === opt.value
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Country</label>
                    <Select value={filterCountry} onValueChange={setFilterCountry}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>{getFlagEmoji(c)} {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">City</label>
                    <Input
                      className="mt-1"
                      placeholder="Search by city..."
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                    />
                  </div>

                  {/* Relationship Intent */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Looking for</label>
                    <Select value={filterIntent} onValueChange={setFilterIntent}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="long-term">Long-term Relationship</SelectItem>
                        <SelectItem value="marriage">Marriage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Filters - Premium Only */}
                  <div className={`space-y-4 ${!isPremium ? "relative" : ""}`}>
                    {!isPremium && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/80 backdrop-blur-[2px]">
                        <button onClick={() => navigate("/premium")} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevated hover:bg-primary/90 transition-all">
                          <Crown className="h-4 w-4" /> Unlock Advanced Filters
                        </button>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Crown className="h-3 w-3" /> Premium Filters
                      </p>
                    </div>
                    {/* Education */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Education</label>
                      <Select value={filterEducation} onValueChange={setFilterEducation}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="High School">High School</SelectItem>
                          <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                          <SelectItem value="Master's">Master's</SelectItem>
                          <SelectItem value="Doctorate">Doctorate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Language */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Language</label>
                      <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Tagalog">Tagalog</SelectItem>
                          <SelectItem value="Japanese">Japanese</SelectItem>
                          <SelectItem value="Korean">Korean</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Children */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Children</label>
                      <Select value={filterChildren} onValueChange={setFilterChildren}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="want">Wants children</SelectItem>
                          <SelectItem value="dont-want">Doesn't want</SelectItem>
                          <SelectItem value="have-want-more">Has & wants more</SelectItem>
                          <SelectItem value="have-dont-want-more">Has & doesn't want more</SelectItem>
                          <SelectItem value="not-sure">Not sure yet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Height Range */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        Height Range
                        <span className="text-foreground font-semibold">{filterHeightRange[0]} – {filterHeightRange[1]} cm</span>
                      </label>
                      <div className="mt-2 px-1">
                        <Slider
                          min={140}
                          max={210}
                          step={1}
                          value={filterHeightRange}
                          onValueChange={(v) => setFilterHeightRange(v as [number, number])}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 min-h-[44px]" onClick={() => {
                      setFilterCountry("all");
                      setFilterIntent("all");
                      setFilterCity("");
                      setFilterGender("all");
                      setFilterAgeRange([18, 65]);
                      setFilterEducation("all");
                      setFilterLanguage("all");
                      setFilterChildren("all");
                      setFilterHeightRange([140, 210]);
                    }}>
                      Reset All
                    </Button>
                    <Button size="sm" className="flex-1 min-h-[44px] gradient-hero text-primary-foreground" onClick={() => {
                      setShowFilters(false);
                      fetchProfiles();
                    }}>
                      Show Results
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status bar: daily likes + boost */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl bg-secondary/5 px-3 py-2.5 flex-1 min-w-0 min-h-[44px]">
              <Shield className="h-4 w-4 text-secondary flex-shrink-0" />
              <p className="text-[11px] text-secondary font-medium truncate">
                All profiles are reviewed for authenticity.
              </p>
            </div>
            {!isPremium && (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs shadow-card min-h-[44px]">
                  <Heart className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">{dailyLikesRemaining}</span>
                  <span className="text-muted-foreground">likes left</span>
                </div>
              </div>
            )}
            <button
              onClick={handleBoostProfile}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium shadow-card transition-all min-h-[44px] active:scale-95 ${
                isBoosted
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card text-muted-foreground hover:border-accent/30 hover:text-accent"
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${isBoosted ? "fill-accent" : ""}`} />
              {isBoosted ? "Boosted" : "Boost"}
              {!isPremium && <Crown className="h-3 w-3 text-accent" />}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Finding people for you...</p>
            </div>
          ) : viewMode === "swipe" ? (
            /* =================== SWIPE VIEW =================== */
            <>
              {noMoreProfiles ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-20 shadow-card max-w-lg mx-auto">
                  <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">You've seen everyone!</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
                    Check back later or adjust your filters to discover more people.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => { setCurrentIndex(0); fetchProfiles(); }}>
                    Refresh
                  </Button>
                </div>
              ) : currentProfile && (
                <div className="flex flex-col lg:flex-row gap-6 lg:items-start lg:justify-center">
                  {/* Left: Swipe Card */}
                  <div className="w-full max-w-md mx-auto lg:mx-0 lg:flex-shrink-0">
                    <div className="relative w-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentProfile.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
                            rotate: direction === "left" ? -15 : direction === "right" ? 15 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                          drag="x"
                          dragSnapToOrigin={!swiped}
                          dragElastic={0.9}
                          onDrag={(_, info) => setDragX(info.offset.x)}
                          onDragEnd={handleDragEnd}
                          className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated cursor-grab active:cursor-grabbing select-none touch-pan-y"
                        >
                          <AnimatePresence>
                            {dragX > 50 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: Math.min(dragX / 150, 1) }} exit={{ opacity: 0 }} className="absolute top-8 left-6 z-20 rotate-[-15deg] rounded-xl border-4 border-secondary px-4 py-2">
                                <span className="text-2xl font-bold text-secondary">LIKE</span>
                              </motion.div>
                            )}
                            {dragX < -50 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: Math.min(Math.abs(dragX) / 150, 1) }} exit={{ opacity: 0 }} className="absolute top-8 right-6 z-20 rotate-[15deg] rounded-xl border-4 border-destructive px-4 py-2">
                                <span className="text-2xl font-bold text-destructive">PASS</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="relative aspect-[3/4]">
                            <PhotoGallery photos={getProfilePhotos(currentProfile)} name={currentProfile.full_name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/5 pointer-events-none" />
                            {currentProfile.country && (
                              <div className="absolute top-4 right-4 z-20 rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-sm shadow-card">{getFlagEmoji(currentProfile.country)}</div>
                            )}
                            <button onClick={() => handleReport(currentProfile)} className="absolute top-4 left-4 z-20 rounded-full bg-card/70 backdrop-blur-sm p-2 text-muted-foreground hover:text-destructive transition-colors">
                              <Flag className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-5 z-10 pointer-events-none">
                              <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                                  {currentProfile.full_name}{currentProfile.age ? `, ${currentProfile.age}` : ""}
                                </h2>
                                {currentProfile.is_verified && <Shield className="h-5 w-5 text-secondary fill-secondary/30" />}
                                <OnlineStatus lastSeen={currentProfile.last_seen} size="md" />
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/80">
                                <MapPin className="h-3.5 w-3.5" />
                                {[currentProfile.city, currentProfile.province, currentProfile.country].filter(Boolean).join(", ") || "Location not set"}
                              </div>
                            </div>
                          </div>

                          {/* Profile info - mobile only */}
                          <div className="p-5 space-y-3 lg:hidden">
                            <div className="flex flex-wrap gap-1.5">
                              {currentProfile.is_verified && (
                                <Badge variant="secondary" className="gap-1 border-0 bg-secondary/10 text-secondary text-[11px]"><Shield className="h-3 w-3" /> Verified</Badge>
                              )}
                              {currentProfile.relationship_intent && (
                                <Badge variant="default" className="gap-1 border-0 bg-primary/10 text-primary text-[11px]"><Heart className="h-3 w-3" /> {formatIntent(currentProfile.relationship_intent)}</Badge>
                              )}
                              {currentProfile.relocation_intent && currentProfile.relocation_intent !== "not-willing" && (
                                <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/20 text-[11px]"><Globe className="h-3 w-3" /> {formatRelocation(currentProfile.relocation_intent)}</Badge>
                              )}
                              {currentProfile.international_preference && (
                                <Badge variant="outline" className="gap-1 text-[11px]">🌏 Open to long-distance dating</Badge>
                              )}
                              {currentProfile.user_type && (
                                <Badge variant="outline" className="gap-1 text-[11px] capitalize">{currentProfile.user_type === "foreigner" ? "🌐" : "🇵🇭"} {currentProfile.user_type}</Badge>
                              )}
                            </div>
                            {currentProfile.bio && (
                              <div>
                                <p className={`text-sm text-muted-foreground leading-relaxed ${!expandedBio ? "line-clamp-3" : ""}`}>{currentProfile.bio}</p>
                                {currentProfile.bio.length > 120 && (
                                  <button onClick={() => setExpandedBio(!expandedBio)} className="text-xs text-primary font-medium mt-1 hover:underline">{expandedBio ? "Show less" : "Read more"}</button>
                                )}
                              </div>
                            )}
                            {currentProfile.interests && currentProfile.interests.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {currentProfile.interests.map((interest) => (
                                  <span key={interest} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/70">{interest}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-4">
                      {lastPassedProfile && (
                        <button onClick={handleUndoPass} className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent/40 bg-card shadow-card transition-all hover:shadow-card-hover hover:scale-105 active:scale-95" title="Undo last pass">
                          <Undo2 className="h-4 w-4 text-accent" />
                        </button>
                      )}
                      <button onClick={() => handleSwipeAction("pass")} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-card shadow-card transition-all hover:shadow-card-hover hover:scale-105 active:scale-95">
                        <X className="h-6 w-6 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (currentProfile) {
                            void handleVideoCallClick(currentProfile);
                          }
                        }}
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-secondary bg-secondary/10 shadow-card transition-all hover:shadow-card-hover hover:scale-105 active:scale-95"
                        title="Video Call"
                      >
                        <Video className="h-5 w-5 text-secondary" />
                      </button>
                      <button onClick={() => handlePriorityLike(currentProfile)} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-accent/10 shadow-card transition-all hover:shadow-card-hover hover:scale-105 active:scale-95">
                        <Star className="h-5 w-5 text-accent fill-accent" />
                      </button>
                      <button onClick={() => handleSwipeAction("like")} className={`flex h-16 w-16 items-center justify-center rounded-full gradient-hero shadow-elevated transition-all hover:shadow-card-hover hover:scale-105 active:scale-95 ${!canLike ? "opacity-50" : ""}`}>
                        <Heart className="h-7 w-7 text-primary-foreground fill-primary-foreground" />
                      </button>
                    </div>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                      Swipe or tap • ⭐ priority like
                      {lastPassedProfile && " • ↩ undo pass"}
                      {!isPremium && ` • ${dailyLikesRemaining} likes left today`}
                    </p>
                  </div>

                  {/* Right: Desktop Side Panel */}
                  <div className="hidden lg:block lg:flex-1 lg:max-w-md lg:sticky lg:top-24">
                    <motion.div
                      key={currentProfile.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold font-display text-foreground">
                            {currentProfile.full_name}{currentProfile.age ? `, ${currentProfile.age}` : ""}
                          </h2>
                          {currentProfile.is_verified && <Shield className="h-4 w-4 text-secondary fill-secondary/30" />}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {[currentProfile.city, currentProfile.province, currentProfile.country].filter(Boolean).join(", ") || "Location not set"}
                          {currentProfile.country && <span className="ml-1">{getFlagEmoji(currentProfile.country)}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {currentProfile.is_verified && (
                          <Badge variant="secondary" className="gap-1 border-0 bg-secondary/10 text-secondary text-xs"><Shield className="h-3 w-3" /> Verified</Badge>
                        )}
                        {currentProfile.relationship_intent && (
                          <Badge variant="default" className="gap-1 border-0 bg-primary/10 text-primary text-xs"><Heart className="h-3 w-3" /> {formatIntent(currentProfile.relationship_intent)}</Badge>
                        )}
                        {currentProfile.relocation_intent && currentProfile.relocation_intent !== "not-willing" && (
                          <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/20 text-xs"><Globe className="h-3 w-3" /> {formatRelocation(currentProfile.relocation_intent)}</Badge>
                        )}
                        {currentProfile.international_preference && (
                          <Badge variant="outline" className="gap-1 text-xs">🌏 Open to long-distance dating</Badge>
                        )}
                        {currentProfile.user_type && (
                          <Badge variant="outline" className="gap-1 text-xs capitalize">{currentProfile.user_type === "foreigner" ? "🌐" : "🇵🇭"} {currentProfile.user_type}</Badge>
                        )}
                      </div>

                      {currentProfile.bio && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1.5">About</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{currentProfile.bio}</p>
                        </div>
                      )}

                      {currentProfile.interests && currentProfile.interests.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2">Interests</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {currentProfile.interests.map((interest) => (
                              <span key={interest} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/70">{interest}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/profile/${currentProfile.id}`)}>
                        View Full Profile
                      </Button>
                    </motion.div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* =================== GRID/LIST VIEW =================== */
            <div className="space-y-6">
              {/* New Members */}
              {newMembers.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">New Members</h3>
                    <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">
                      {newMembers.length}
                    </Badge>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {newMembers.slice(0, 8).map((profile) => (
                      <div key={profile.id} className="flex-shrink-0 w-24 text-center">
                        <div className="relative mx-auto h-20 w-20 rounded-full overflow-hidden border-2 border-accent/30 shadow-card">
                          {getProfilePhotos(profile).length > 0 ? (
                            <SkeletonImage src={getProfilePhotos(profile)[0]} alt={`${profile.full_name} profile photo`} className="h-full w-full rounded-full" />
                          ) : (
                            <NoPhotoPlaceholder className="h-full w-full rounded-full" variant="avatar" />
                          )}
                          {profile.is_verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                              <Shield className="h-3.5 w-3.5 text-secondary fill-secondary/30" />
                            </div>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs font-medium text-foreground truncate">{profile.full_name.split(" ")[0]}</p>
                        <p className="text-[10px] text-muted-foreground">{getFlagEmoji(profile.country)} {profile.age || ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid of Profile Cards */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">All Profiles</h3>
                  <span className="text-[11px] text-muted-foreground">({profiles.length})</span>
                </div>

                {profiles.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card py-12 text-center shadow-card">
                    <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No profiles found. Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {profiles.map((profile) => (
                      <motion.div
                        key={profile.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group rounded-2xl border border-border bg-card shadow-card overflow-hidden transition-all hover:shadow-card-hover"
                      >
                        {/* Photo */}
                        <div className="relative aspect-[3/4] cursor-pointer" onClick={() => navigate(`/profile/${profile.id}`)}>
                            {getProfilePhotos(profile).length > 0 ? (
                              <SkeletonImage src={getProfilePhotos(profile)[0]} alt={`${profile.full_name} profile photo`} className="h-full w-full" />
                            ) : (
                              <NoPhotoPlaceholder className="h-full w-full" />
                            )}
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />

                          {/* Country flag */}
                          {profile.country && (
                            <div className="absolute top-2 right-2 text-sm">{getFlagEmoji(profile.country)}</div>
                          )}

                          {/* Verified badge */}
                          {profile.is_verified && (
                            <div className="absolute top-2 left-2 rounded-full bg-card/80 backdrop-blur-sm p-1">
                              <Shield className="h-3 w-3 text-secondary fill-secondary/30" />
                            </div>
                          )}

                          {/* Badges row - positioned above name overlay to avoid covering face */}
                          {((profile as any).is_premium || likedIds.has(profile.id)) && (
                            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 px-2">
                              {(profile as any).is_premium && (
                                <div className="rounded-full bg-accent/90 backdrop-blur-sm px-2 py-0.5 flex items-center gap-1 shadow-sm">
                                  <Gem className="h-2.5 w-2.5 text-primary-foreground" />
                                  <span className="text-[9px] font-bold text-primary-foreground">Annual Member</span>
                                </div>
                              )}
                              {likedIds.has(profile.id) && (
                                <div className="rounded-full bg-primary/90 backdrop-blur-sm px-2.5 py-0.5 flex items-center gap-1 shadow-sm">
                                  <Heart className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
                                  <span className="text-[10px] font-semibold text-primary-foreground">Liked</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Name on photo */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="flex items-center gap-1">
                              <h4 className="text-sm font-bold text-primary-foreground truncate">
                                {profile.full_name.split(" ")[0]}{profile.age ? `, ${profile.age}` : ""}
                              </h4>
                              <OnlineStatus lastSeen={profile.last_seen} size="sm" />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-primary-foreground/70 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              <span className="truncate">{profile.city || profile.country || "—"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick info */}
                        <div className="p-2.5 space-y-2">
                          {profile.relationship_intent && (
                            <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {formatIntent(profile.relationship_intent)}
                            </span>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-1.5">
                            {likedIds.has(profile.id) ? (
                              <div className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/20 h-9 text-[11px] font-medium text-primary">
                                <Heart className="h-3.5 w-3.5 fill-primary" /> Liked
                              </div>
                            ) : (
                              <button
                                onClick={() => handleListLike(profile)}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/10 h-9 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors active:scale-95"
                              >
                                <Heart className="h-3.5 w-3.5" /> Like
                              </button>
                            )}
                            <button
                              onClick={() => void handleVideoCallClick(profile)}
                              className="flex items-center justify-center rounded-lg bg-secondary/10 w-9 h-9 shrink-0 text-secondary hover:bg-secondary/20 transition-colors active:scale-95"
                              title="Video Call"
                            >
                              <Video className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePriorityLike(profile)}
                              className="flex items-center justify-center rounded-lg bg-accent/10 w-9 h-9 shrink-0 text-accent hover:bg-accent/20 transition-colors active:scale-95"
                            >
                              <Star className="h-4 w-4 fill-accent" />
                            </button>
                            <button
                              onClick={() => handleReport(profile)}
                              className="flex items-center justify-center rounded-lg bg-muted w-9 h-9 shrink-0 text-muted-foreground hover:text-destructive transition-colors active:scale-95"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Video call microcopy */}
                          {!isPremium && (
                            <p className="text-[9px] text-muted-foreground text-center">
                              🎥 Video call available with Annual
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Intro Message Dialog */}
      <Dialog open={introDialog} onOpenChange={setIntroDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent fill-accent" />
              Send a Priority Like
            </DialogTitle>
            <DialogDescription>
              Stand out! Write a short intro to {introTarget?.full_name}. They'll see it when you match.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Hi! I noticed we both love..."
            value={introMessage}
            onChange={(e) => setIntroMessage(e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-right text-[11px] text-muted-foreground">{introMessage.length}/200</p>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              className="gradient-hero text-primary-foreground gap-1.5"
              onClick={sendIntroMessage}
              disabled={!introMessage.trim()}
            >
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5" />
              Report Profile
            </DialogTitle>
            <DialogDescription>
              Help us keep the community safe. Why are you reporting {reportTarget?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <Select value={reportReason} onValueChange={setReportReason}>
            <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fake-profile">Fake profile</SelectItem>
              <SelectItem value="inappropriate-content">Inappropriate content</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="scam">Scam / fraud</SelectItem>
              <SelectItem value="underage">Underage user</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Additional details (optional)..."
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            rows={2}
          />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" variant="destructive" onClick={submitReport} disabled={!reportReason}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Call Upgrade Modal */}
      <VideoCallModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        userName={videoModalTarget}
      />

      {/* Direct Video Call */}
      {videoCallMatchId && (
        <VideoCall
          matchId={videoCallMatchId}
          otherUserName={videoCallUserName}
          open={videoCallOpen}
          onClose={() => { setVideoCallOpen(false); setVideoCallMatchId(null); }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Discover;
