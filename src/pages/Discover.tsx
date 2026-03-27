import { useState, useEffect, useCallback } from "react";
import {
  Heart, X, MapPin, Shield, Filter, ChevronDown, Star, Flag, Ban,
  LayoutGrid, Layers, MessageCircle, Globe, Send, Sparkles, Clock, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  country: string | null;
  city: string | null;
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

const Discover = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [dragX, setDragX] = useState(0);

  // View toggle
  const [viewMode, setViewMode] = useState<"swipe" | "list">("swipe");

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterIntent, setFilterIntent] = useState<string>("all");
  const [filterCity, setFilterCity] = useState("");

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

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch already liked profiles
    const { data: likesData } = await supabase
      .from("likes")
      .select("liked_id")
      .eq("liker_id", user.id);

    const alreadyLiked = new Set((likesData || []).map((l) => l.liked_id));
    setLikedIds(alreadyLiked);

    // Build query
    let query = supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .eq("onboarding_completed", true)
      .order("created_at", { ascending: false });

    if (filterCountry !== "all") {
      query = query.eq("country", filterCountry);
    }
    if (filterIntent !== "all") {
      query = query.eq("relationship_intent", filterIntent);
    }
    if (filterCity.trim()) {
      query = query.ilike("city", `%${filterCity.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error loading profiles", description: error.message, variant: "destructive" });
    } else {
      // Filter out already liked
      const filtered = (data || []).filter((p) => !alreadyLiked.has(p.id));
      setProfiles(filtered as Profile[]);
      setCurrentIndex(0);
    }
    setLoading(false);
  }, [user, filterCountry, filterIntent, filterCity]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const currentProfile = profiles[currentIndex];

  const handleLike = async (profile: Profile) => {
    if (!user) return;

    const { error } = await supabase.from("likes").insert({
      liker_id: user.id,
      liked_id: profile.id,
    });

    if (error) {
      if (error.code === "23505") {
        // Already liked
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    // Check if mutual like (match)
    const { data: mutualLike } = await supabase
      .from("likes")
      .select("id")
      .eq("liker_id", profile.id)
      .eq("liked_id", user.id)
      .maybeSingle();

    if (mutualLike) {
      toast({
        title: "🎉 It's a Match!",
        description: `You and ${profile.full_name} liked each other!`,
      });
    }

    setLikedIds((prev) => new Set(prev).add(profile.id));
  };

  const handleSwipeAction = async (action: "like" | "pass") => {
    if (!currentProfile) return;
    setDirection(action === "like" ? "right" : "left");

    if (action === "like") {
      await handleLike(currentProfile);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
      setDragX(0);
    }, 300);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipeAction("like");
    } else if (info.offset.x < -threshold) {
      handleSwipeAction("pass");
    }
    setDragX(0);
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

  const sendIntroMessage = async () => {
    if (!introTarget || !user) return;

    // Like first
    await handleLike(introTarget);

    // TODO: Store intro message when messaging before match is implemented
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
      toast({ title: "Report submitted", description: "We'll review this profile. Thank you for keeping our community safe." });
    }
    setReportDialog(false);
  };

  const getProfilePhoto = (profile: Profile) => {
    if (profile.photos && profile.photos.length > 0) return profile.photos[0];
    if (profile.avatar_url) return profile.avatar_url;
    return null;
  };

  // Separate new members (joined within 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newMembers = profiles.filter((p) => new Date(p.created_at) > sevenDaysAgo);

  const noMoreProfiles = currentIndex >= profiles.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-4 pb-24 md:pb-6">
        <div className="w-full max-w-lg">

          {/* Top Bar: View Toggle + Filters */}
          <div className="mb-4 flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-xl border border-border bg-card p-1 shadow-card">
              <button
                onClick={() => setViewMode("swipe")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === "swipe"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Cards
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                List
              </button>
            </div>

            <div className="flex-1" />

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-card transition-all ${
                showFilters || filterCountry !== "all" || filterIntent !== "all" || filterCity
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {(filterCountry !== "all" || filterIntent !== "all" || filterCity) && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {[filterCountry !== "all", filterIntent !== "all", !!filterCity].filter(Boolean).length}
                </span>
              )}
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
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
                <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Location (Country)</label>
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
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">City</label>
                    <Input
                      className="mt-1"
                      placeholder="Search by city..."
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Relationship Intent</label>
                    <Select value={filterIntent} onValueChange={setFilterIntent}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="long-term">Long-term</SelectItem>
                        <SelectItem value="marriage">Marriage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                      setFilterCountry("all");
                      setFilterIntent("all");
                      setFilterCity("");
                    }}>
                      Clear
                    </Button>
                    <Button size="sm" className="flex-1 gradient-hero text-primary-foreground" onClick={() => {
                      setShowFilters(false);
                      fetchProfiles();
                    }}>
                      Apply
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust messaging */}
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-secondary/5 px-3 py-2">
            <Shield className="h-4 w-4 text-secondary" />
            <p className="text-[11px] text-secondary font-medium">
              All profiles are reviewed for authenticity. Report anything suspicious.
            </p>
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
                <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-20 shadow-card">
                  <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">You've seen everyone!</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
                    Check back later or adjust your filters to discover more people.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => {
                    setCurrentIndex(0);
                    fetchProfiles();
                  }}>
                    Refresh
                  </Button>
                </div>
              ) : currentProfile && (
                <>
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
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.8}
                        onDrag={(_, info) => setDragX(info.offset.x)}
                        onDragEnd={handleDragEnd}
                        className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated cursor-grab active:cursor-grabbing"
                      >
                        {/* Swipe indicators */}
                        <AnimatePresence>
                          {dragX > 50 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: Math.min(dragX / 150, 1) }}
                              exit={{ opacity: 0 }}
                              className="absolute top-8 left-6 z-20 rotate-[-15deg] rounded-xl border-4 border-secondary px-4 py-2"
                            >
                              <span className="text-2xl font-bold text-secondary">LIKE</span>
                            </motion.div>
                          )}
                          {dragX < -50 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: Math.min(Math.abs(dragX) / 150, 1) }}
                              exit={{ opacity: 0 }}
                              className="absolute top-8 right-6 z-20 rotate-[15deg] rounded-xl border-4 border-destructive px-4 py-2"
                            >
                              <span className="text-2xl font-bold text-destructive">PASS</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Photo */}
                        <div className="relative aspect-[3/4] max-h-[420px]">
                          {getProfilePhoto(currentProfile) ? (
                            <img
                              src={getProfilePhoto(currentProfile)!}
                              alt={currentProfile.full_name}
                              className="h-full w-full object-cover"
                              loading="eager"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <span className="text-4xl">👤</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />

                          {/* Country flag */}
                          {currentProfile.country && (
                            <div className="absolute top-4 right-4 rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-sm shadow-card">
                              {getFlagEmoji(currentProfile.country)}
                            </div>
                          )}

                          {/* Report button */}
                          <button
                            onClick={() => handleReport(currentProfile)}
                            className="absolute top-4 left-4 rounded-full bg-card/70 backdrop-blur-sm p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Flag className="h-4 w-4" />
                          </button>

                          {/* Name overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-bold text-primary-foreground font-display">
                                {currentProfile.full_name}{currentProfile.age ? `, ${currentProfile.age}` : ""}
                              </h2>
                              {currentProfile.is_verified && (
                                <Shield className="h-5 w-5 text-secondary fill-secondary/30" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/80">
                              <MapPin className="h-3.5 w-3.5" />
                              {[currentProfile.city, currentProfile.country].filter(Boolean).join(", ") || "Location not set"}
                            </div>
                          </div>
                        </div>

                        {/* Profile info */}
                        <div className="p-5 space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            {currentProfile.is_verified && (
                              <Badge variant="secondary" className="gap-1 border-0 bg-secondary/10 text-secondary text-[11px]">
                                <Shield className="h-3 w-3" /> Verified
                              </Badge>
                            )}
                            {currentProfile.relationship_intent && (
                              <Badge variant="default" className="gap-1 border-0 bg-primary/10 text-primary text-[11px]">
                                <Heart className="h-3 w-3" /> {formatIntent(currentProfile.relationship_intent)}
                              </Badge>
                            )}
                            {currentProfile.relocation_intent && currentProfile.relocation_intent !== "not-willing" && (
                              <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/20 text-[11px]">
                                <Globe className="h-3 w-3" /> {formatRelocation(currentProfile.relocation_intent)}
                              </Badge>
                            )}
                            {currentProfile.international_preference && (
                              <Badge variant="outline" className="gap-1 text-[11px]">
                                🌏 Open International
                              </Badge>
                            )}
                          </div>

                          {/* Bio */}
                          {currentProfile.bio && (
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {currentProfile.bio}
                            </p>
                          )}

                          {/* Interests */}
                          {currentProfile.interests && currentProfile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {currentProfile.interests.slice(0, 6).map((interest) => (
                                <span
                                  key={interest}
                                  className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {interest}
                                </span>
                              ))}
                              {currentProfile.interests.length > 6 && (
                                <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                                  +{currentProfile.interests.length - 6}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleSwipeAction("pass")}
                      className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-card shadow-card transition-all hover:shadow-card-hover hover:scale-105 active:scale-95"
                    >
                      <X className="h-6 w-6 text-muted-foreground" />
                    </button>

                    {/* Priority Like */}
                    <button
                      onClick={() => handlePriorityLike(currentProfile)}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-accent/10 shadow-card transition-all hover:shadow-card-hover hover:scale-105 active:scale-95"
                    >
                      <Star className="h-5 w-5 text-accent fill-accent" />
                    </button>

                    <button
                      onClick={() => handleSwipeAction("like")}
                      className="flex h-16 w-16 items-center justify-center rounded-full gradient-hero shadow-elevated transition-all hover:shadow-card-hover hover:scale-105 active:scale-95"
                    >
                      <Heart className="h-7 w-7 text-primary-foreground fill-primary-foreground" />
                    </button>
                  </div>

                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    Swipe or tap • ⭐ sends a priority like with intro
                  </p>
                </>
              )}
            </>
          ) : (
            /* =================== LIST VIEW =================== */
            <div className="space-y-6">
              {/* New Members Section */}
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
                      <div
                        key={profile.id}
                        className="flex-shrink-0 w-24 text-center"
                      >
                        <div className="relative mx-auto h-20 w-20 rounded-full overflow-hidden border-2 border-accent/30 shadow-card">
                          {getProfilePhoto(profile) ? (
                            <img src={getProfilePhoto(profile)!} alt={profile.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-xl">👤</div>
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

              {/* All Profiles List */}
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
                  <div className="space-y-3">
                    {profiles.map((profile) => (
                      <motion.div
                        key={profile.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="rounded-2xl border border-border bg-card shadow-card overflow-hidden transition-all hover:shadow-card-hover"
                      >
                        <div className="flex gap-4 p-4">
                          {/* Photo */}
                          <div className="relative h-28 w-24 flex-shrink-0 rounded-xl overflow-hidden">
                            {getProfilePhoto(profile) ? (
                              <img src={getProfilePhoto(profile)!} alt={profile.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted text-2xl">👤</div>
                            )}
                            {profile.country && (
                              <div className="absolute top-1 right-1 text-sm">{getFlagEmoji(profile.country)}</div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-foreground truncate">
                                {profile.full_name}{profile.age ? `, ${profile.age}` : ""}
                              </h4>
                              {profile.is_verified && (
                                <Shield className="h-4 w-4 flex-shrink-0 text-secondary fill-secondary/30" />
                              )}
                            </div>

                            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {[profile.city, profile.country].filter(Boolean).join(", ") || "—"}
                            </div>

                            {/* Badges */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {profile.relationship_intent && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  {formatIntent(profile.relationship_intent)}
                                </span>
                              )}
                              {profile.relocation_intent && profile.relocation_intent !== "not-willing" && (
                                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                                  {formatRelocation(profile.relocation_intent)}
                                </span>
                              )}
                            </div>

                            {profile.bio && (
                              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{profile.bio}</p>
                            )}

                            {/* Interests */}
                            {profile.interests && profile.interests.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {profile.interests.slice(0, 3).map((i) => (
                                  <span key={i} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{i}</span>
                                ))}
                                {profile.interests.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{profile.interests.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex border-t border-border">
                          <button
                            onClick={() => handleReport(profile)}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Flag className="h-3 w-3" /> Report
                          </button>
                          <div className="w-px bg-border" />
                          <button
                            onClick={() => handlePriorityLike(profile)}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-accent font-medium hover:bg-accent/5 transition-colors"
                          >
                            <Star className="h-3 w-3 fill-accent" /> Priority
                          </button>
                          <div className="w-px bg-border" />
                          <button
                            onClick={() => handleListLike(profile)}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-primary font-medium hover:bg-primary/5 transition-colors"
                          >
                            <Heart className="h-3 w-3 fill-primary" /> Like
                          </button>
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
            <Button
              size="sm"
              variant="destructive"
              onClick={submitReport}
              disabled={!reportReason}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Discover;
