import { Camera, Edit, Shield, MapPin, Heart, Globe, Settings, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import profile1 from "@/assets/profile-1.jpg";

const Profile = () => {
  const mockProfile = {
    name: "Maria Santos",
    age: 26,
    city: "Manila",
    country: "Philippines",
    bio: "Passionate about cooking traditional Filipino food and exploring new places. Looking for someone genuine who wants to build a future together.",
    interests: ["Cooking", "Travel", "Music", "Family", "Photography"],
    intent: "Long-term relationship",
    relocation: "Open to relocating",
    verified: true,
    photos: [profile1],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
        <div className="mx-auto max-w-lg">
          {/* Profile Header */}
          <div className="relative mb-6">
            <div className="relative mx-auto h-32 w-32">
              <img
                src={mockProfile.photos[0]}
                alt={mockProfile.name}
                className="h-full w-full rounded-full object-cover border-4 border-card shadow-elevated"
              />
              <button className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full gradient-hero text-primary-foreground shadow-card">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-bold">{mockProfile.name}, {mockProfile.age}</h1>
                {mockProfile.verified && (
                  <Shield className="h-5 w-5 text-secondary fill-secondary/30" />
                )}
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {mockProfile.city}, {mockProfile.country}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { icon: Heart, label: "Intent", value: "Long-term" },
              { icon: Globe, label: "Relocate", value: "Open" },
              { icon: Shield, label: "Verified", value: "Yes" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
                <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">About Me</h2>
              <button className="text-primary">
                <Edit className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{mockProfile.bio}</p>
          </div>

          {/* Interests */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-semibold">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {mockProfile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Premium CTA */}
          <div className="mb-6 rounded-2xl gradient-hero p-5 text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5" />
              <h2 className="font-semibold">Go Premium</h2>
            </div>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Unlock unlimited messaging, see who liked you, and boost your profile visibility.
            </p>
            <Button variant="secondary" size="sm">
              Upgrade Now
            </Button>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-card transition-all hover:shadow-card-hover">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-destructive shadow-card transition-all hover:shadow-card-hover">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
