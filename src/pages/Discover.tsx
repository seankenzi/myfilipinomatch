import { useState } from "react";
import { Heart, X, MapPin, Shield, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import profile1 from "@/assets/profile-1.jpg";
import profile3 from "@/assets/profile-3.jpg";

const mockProfiles = [
  {
    id: 1,
    name: "Maria",
    age: 26,
    city: "Manila",
    country: "Philippines",
    bio: "Passionate about cooking traditional Filipino food and exploring new places. Looking for someone genuine who wants to build a future together.",
    interests: ["Cooking", "Travel", "Music", "Family"],
    intent: "Long-term",
    relocation: "Open to relocating",
    verified: true,
    photos: [profile1],
  },
  {
    id: 2,
    name: "Jasmine",
    age: 24,
    city: "Cebu",
    country: "Philippines",
    bio: "Nurse by profession, traveler by heart. I believe in genuine connections that go beyond borders. Seeking someone kind, honest, and family-oriented.",
    interests: ["Healthcare", "Beaches", "Reading", "Dancing"],
    intent: "Marriage",
    relocation: "Planning to visit",
    verified: true,
    photos: [profile3],
  },
  {
    id: 3,
    name: "Anna",
    age: 28,
    city: "Davao",
    country: "Philippines",
    bio: "Teacher and artist. I love painting sunsets and believe that the best things in life are shared with someone special.",
    interests: ["Art", "Teaching", "Nature", "Photography"],
    intent: "Long-term",
    relocation: "Willing to move",
    verified: false,
    photos: [profile1],
  },
];

const Discover = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const currentProfile = mockProfiles[currentIndex];

  const handleAction = (action: "like" | "pass") => {
    setDirection(action === "like" ? "right" : "left");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mockProfiles.length);
      setDirection(null);
    }, 300);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-6 pb-24 md:pb-6">
        {/* Filters */}
        <div className="mb-6 w-full max-w-md">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-card"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filters
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          {showFilters && (
            <div className="mt-2 rounded-xl border border-border bg-card p-4 shadow-card animate-slide-up space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Age Range</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" placeholder="18" className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm" />
                  <span className="text-muted-foreground self-center">to</span>
                  <input type="number" placeholder="45" className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Relationship Intent</label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm">
                  <option>Any</option>
                  <option>Long-term</option>
                  <option>Marriage</option>
                </select>
              </div>
              <Button size="sm" variant="hero" className="w-full">Apply Filters</Button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="relative w-full max-w-md">
          <AnimatePresence mode="wait">
            {currentProfile && (
              <motion.div
                key={currentProfile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  x: direction === "left" ? -200 : direction === "right" ? 200 : 0,
                  rotate: direction === "left" ? -10 : direction === "right" ? 10 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated"
              >
                {/* Photo */}
                <div className="relative aspect-[3/4] max-h-[480px]">
                  <img
                    src={currentProfile.photos[0]}
                    alt={currentProfile.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-primary-foreground">
                        {currentProfile.name}, {currentProfile.age}
                      </h2>
                      {currentProfile.verified && (
                        <Shield className="h-5 w-5 text-secondary fill-secondary/30" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-primary-foreground/80">
                      <MapPin className="h-3.5 w-3.5" />
                      {currentProfile.city}, {currentProfile.country}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {currentProfile.intent}
                    </span>
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                      {currentProfile.relocation}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentProfile.bio}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-6">
          <button
            onClick={() => handleAction("pass")}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-card shadow-card transition-all hover:shadow-card-hover hover:scale-105 active:scale-95"
          >
            <X className="h-7 w-7 text-muted-foreground" />
          </button>
          <button
            onClick={() => handleAction("like")}
            className="flex h-20 w-20 items-center justify-center rounded-full gradient-hero shadow-elevated transition-all hover:shadow-card-hover hover:scale-105 active:scale-95"
          >
            <Heart className="h-9 w-9 text-primary-foreground fill-primary-foreground" />
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Discover;
