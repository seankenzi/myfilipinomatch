import { useState, useEffect, useCallback } from "react";
import {
  Heart, X, MapPin, Shield, Filter, ChevronDown, Star, Flag,
  LayoutGrid, Layers, Globe, Send, Sparkles, Clock, UserPlus,
  ChevronLeft, ChevronRight, SlidersHorizontal
} from "lucide-react";
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
      <img
        src={photos[photoIndex]}
        alt={`${name} photo ${photoIndex + 1}`}
        className="h-full w-full object-cover transition-opacity duration-300"
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

const Discover = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [dragX, setDragX] = useState(0);
  const [expandedBio, setExpandedBio] = useState(false);

  // View toggle
  const [viewMode, setViewMode] = useState<"swipe" | "list">("swipe");

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterIntent, setFilterIntent] = useState<string>("all");
  const [filterCity, setFilterCity] = useState("");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterAgeRange, setFilterAgeRange] = useState<[number, number]>([18, 65]);

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

    const { data: likesData } = await supabase
      .from("likes")
      .select("liked_id")
      .eq("liker_id", user.id);

    const alreadyLiked = new Set((likesData || []).map((l) => l.liked_id));
    setLikedIds(alreadyLiked);

    let query = supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .eq("onboarding_completed", true)
      .order("created_at", { ascending: false });

    if (filterCountry !== "all") query = query.eq("country", filterCountry);
    if (filterIntent !== "all") query = query.eq("relationship_intent", filterIntent);
    if (filterGender !== "all") query = query.eq("gender", filterGender);
    if (filterCity.trim()) query = query.ilike("city", `%${filterCity.trim()}%`);
    if (filterAgeRange[0] > 18) query = query.gte("age", filterAgeRange[0]);
    if (filterAgeRange[1] < 65) query = query.lte("age", filterAgeRange[1]);

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error loading profiles", description: error.message, variant: "destructive" });
    } else {
      setProfiles((data || []) as Profile[]);
      setCurrentIndex(0);
    }
    setLoading(false);
  }, [user, filterCountry, filterIntent, filterCity, filterGender, filterAgeRange]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // For swipe view, filter out already liked profiles
  const swipeProfiles = profiles.filter((p) => !likedIds.has(p.id));
  const currentProfile = swipeProfiles[currentIndex];

  const handleLike = async (profile: Profile) => {
    if (!user) return;

    const { error } = await supabase.from("likes").insert({
      liker_id: user.id,
      liked_id: profile.id,
    });

    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

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

    if (action === "like") await handleLike(currentProfile);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
      setDragX(0);
      setExpandedBio(false);
    }, 300);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) handleSwipeAction("like");
    else if (info.offset.x < -threshold) handleSwipeAction("pass");
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
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-4 pb-24 md:pb-6">
        <div className="w-full max-w-lg">

          {/* Top Bar */}
          <div className="mb-4 flex items-center gap-2">
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
                Grid
              </button>
            </div>

            <div className="flex-1" />

            <span className="text-xs text-muted-foreground">{profiles.length} people</span>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-card transition-all ${
                showFilters || activeFilterCount > 0
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
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
                          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
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

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                      setFilterCountry("all");
                      setFilterIntent("all");
                      setFilterCity("");
                      setFilterGender("all");
                      setFilterAgeRange([18, 65]);
                    }}>
                      Reset All
                    </Button>
                    <Button size="sm" className="flex-1 gradient-hero text-primary-foreground" onClick={() => {
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

          {/* Trust banner */}
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-secondary/5 px-3 py-2">
            <Shield className="h-4 w-4 text-secondary flex-shrink-0" />
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
                  <Button variant="outline" className="mt-6" onClick={() => { setCurrentIndex(0); fetchProfiles(); }}>
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
                        className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated cursor-grab active:cursor-grabbing select-none"
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

                        {/* Photo Gallery */}
                        <div className="relative aspect-[3/4] max-h-[450px]">
                          <PhotoGallery photos={getProfilePhotos(currentProfile)} name={currentProfile.full_name} />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/5 pointer-events-none" />

                          {/* Country flag */}
                          {currentProfile.country && (
                            <div className="absolute top-4 right-4 z-20 rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-sm shadow-card">
                              {getFlagEmoji(currentProfile.country)}
                            </div>
                          )}

                          {/* Report button */}
                          <button
                            onClick={() => handleReport(currentProfile)}
                            className="absolute top-4 left-4 z-20 rounded-full bg-card/70 backdrop-blur-sm p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Flag className="h-4 w-4" />
                          </button>

                          {/* Name overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-5 z-10 pointer-events-none">
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: 'var(--font-display)' }}>
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
                          {/* Badges row */}
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
                            {currentProfile.user_type && (
                              <Badge variant="outline" className="gap-1 text-[11px] capitalize">
                                {currentProfile.user_type === "foreigner" ? "🌐" : "🇵🇭"} {currentProfile.user_type}
                              </Badge>
                            )}
                          </div>

                          {/* Bio */}
                          {currentProfile.bio && (
                            <div>
                              <p
                                className={`text-sm text-muted-foreground leading-relaxed ${!expandedBio ? "line-clamp-3" : ""}`}
                              >
                                {currentProfile.bio}
                              </p>
                              {currentProfile.bio.length > 120 && (
                                <button
                                  onClick={() => setExpandedBio(!expandedBio)}
                                  className="text-xs text-primary font-medium mt-1 hover:underline"
                                >
                                  {expandedBio ? "Show less" : "Read more"}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Interests */}
                          {currentProfile.interests && currentProfile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {currentProfile.interests.map((interest) => (
                                <span
                                  key={interest}
                                  className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/70"
                                >
                                  {interest}
                                </span>
                              ))}
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
                            <img src={getProfilePhotos(profile)[0]} alt={profile.full_name} className="h-full w-full object-cover" />
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
                  <div className="grid grid-cols-2 gap-3">
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
                        <div className="relative aspect-[3/4]">
                          {getProfilePhotos(profile).length > 0 ? (
                            <img src={getProfilePhotos(profile)[0]} alt={profile.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-3xl">👤</div>
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

                          {/* Name on photo */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h4 className="text-sm font-bold text-primary-foreground truncate">
                              {profile.full_name.split(" ")[0]}{profile.age ? `, ${profile.age}` : ""}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-primary-foreground/70 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              <span className="truncate">{profile.city || profile.country || "—"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick info */}
                        <div className="p-2.5 space-y-1.5">
                          {profile.relationship_intent && (
                            <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {formatIntent(profile.relationship_intent)}
                            </span>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleListLike(profile)}
                              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/10 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Heart className="h-3 w-3" /> Like
                            </button>
                            <button
                              onClick={() => handlePriorityLike(profile)}
                              className="flex items-center justify-center rounded-lg bg-accent/10 px-2.5 py-1.5 text-accent hover:bg-accent/20 transition-colors"
                            >
                              <Star className="h-3 w-3 fill-accent" />
                            </button>
                            <button
                              onClick={() => handleReport(profile)}
                              className="flex items-center justify-center rounded-lg bg-muted px-2.5 py-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Flag className="h-3 w-3" />
                            </button>
                          </div>
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

      <BottomNav />
    </div>
  );
};

export default Discover;
