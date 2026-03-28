import { Heart, MessageCircle, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import profile1 from "@/assets/profile-1.jpg";
import profile3 from "@/assets/profile-3.jpg";

const mockMatches = [
  { id: 1, name: "Maria", age: 26, city: "Manila", image: profile1, lastActive: "2 min ago", newMatch: true },
  { id: 2, name: "Jasmine", age: 24, city: "Cebu", image: profile3, lastActive: "1 hour ago", newMatch: false },
];

const mockLikedYou = [
  { id: 3, name: "???", image: profile1, blurred: true },
  { id: 4, name: "???", image: profile3, blurred: true },
];

const Matches = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-bold">Your Matches</h1>

          {/* Who Liked You - Premium */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Crown className="h-5 w-5 text-accent" />
                Who Liked You
              </h2>
              <span className="text-sm text-muted-foreground">{mockLikedYou.length} people</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {mockLikedYou.map((p) => (
                <div key={p.id} className="relative flex-shrink-0">
                  <div className="h-28 w-28 overflow-hidden rounded-2xl">
                    <img
                      src={p.image}
                      alt="Hidden profile"
                      className="h-full w-full object-cover blur-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-accent" />
                  </div>
                </div>
              ))}
              <div className="flex flex-shrink-0 items-center">
                <Button variant="hero" size="sm" onClick={() => navigate("/premium")}>
                  Upgrade to see
                </Button>
              </div>
            </div>
          </div>

          {/* Matches */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Mutual Matches</h2>
            {mockMatches.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No matches yet. Keep discovering!</p>
                <Link to="/discover">
                  <Button variant="hero" size="sm" className="mt-4">
                    Discover Profiles
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {mockMatches.map((match) => (
                  <Link
                    key={match.id}
                    to="/messages"
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
                  >
                    <div className="relative">
                      <img
                        src={match.image}
                        alt={match.name}
                        loading="lazy"
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      {match.newMatch && (
                        <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-card gradient-hero" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{match.name}, {match.age}</h3>
                        {match.newMatch && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{match.city}, Philippines</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{match.lastActive}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Matches;
