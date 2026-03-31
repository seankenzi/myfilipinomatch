import { useState, useEffect } from "react";
import { Heart, LogIn, LogOut, User, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { useNewLikesCount } from "@/hooks/useNewLikesCount";
import VideoBanner from "@/components/VideoBanner";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import logo from "@/assets/myfilipinomatch-logo.png";

const taglines = [
  "Connecting Hearts, Bridging Cultures 💕",
  "Love Without Borders 💖",
  "Where Hearts Meet Across the World 🌏",
  "Your Journey to Love Starts Here ✨",
  "Find Your Perfect Filipino Match 🇵🇭",
  "True Love Knows No Distance 💗",
  "Meet Someone Special Today 🌹",
  "Cross-Cultural Love Stories Start Here 📖",
  "Your Soulmate Could Be a World Away 🌍",
  "Building Bridges, One Heart at a Time 💞",
];

const RotatingTagline = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * taglines.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:block relative h-7 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          className="text-lg lg:text-xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-sm"
          initial={{ scale: 0.6, opacity: 0, filter: "blur(8px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)", backgroundPosition: ["0% center", "200% center"] }}
          exit={{ scale: 0.8, opacity: 0, filter: "blur(4px)" }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
            opacity: { duration: 0.3 },
            filter: { duration: 0.3 },
            backgroundPosition: { duration: 4, repeat: Infinity, ease: "linear" },
          }}
        >
          {taglines[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
interface NavbarProps {
  bannerSubtitle?: string;
}

const Navbar = ({ bannerSubtitle }: NavbarProps) => {
  const { user, loading, isPremium, premiumLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const newLikesCount = useNewLikesCount();

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/discover" : "/"} className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="MyFilipinoMatch" className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0" />
          <span className="text-lg md:text-xl font-display font-bold text-foreground truncate">
            MyFilipinoMatch
          </span>
        </Link>

        {user ? (
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/discover" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Discover
          </Link>
          <Link to="/matches" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Matches
          </Link>
          <Link to="/who-liked-me" className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Who Liked Me
            {newLikesCount > 0 && (
              <span className="absolute -top-2 -right-4 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {newLikesCount > 99 ? "99+" : newLikesCount}
              </span>
            )}
          </Link>
          <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Messages
          </Link>
        </nav>
        ) : (
          <RotatingTagline />
        )}

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              {!premiumLoading && !isPremium && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/premium">
                        <Button
                          variant="hero"
                          size="sm"
                          className="relative gap-1.5 overflow-hidden bg-gradient-to-r from-primary via-accent via-50% to-primary bg-[length:300%_100%] border-0 shadow-md hover:shadow-lg transition-all hover:scale-105 text-sm px-4"
                          style={{ animation: "gradient-shift 3s ease-in-out infinite, pulse-glow 2.5s ease-in-out infinite" }}
                        >
                          <Heart className="h-4 w-4 fill-primary-foreground" style={{ animation: "gentle-bounce 1.5s ease-in-out infinite" }} />
                          <span className="hidden sm:inline">❤️ Upgrade to Annual</span>
                          <span className="sm:hidden">❤️ Upgrade</span>
                          <span className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" style={{ animation: "sparkle 2s ease-in-out infinite" }} />
                          <span className="absolute -bottom-0.5 -left-0.5 h-1.5 w-1.5 rounded-full bg-primary-foreground/80" style={{ animation: "sparkle 2s ease-in-out 1s infinite" }} />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] text-center p-3">
                      <p className="font-semibold text-sm">❤️ Upgrade to Annual</p>
                      <p className="text-xs text-muted-foreground mt-1">🎥 Includes 2 FREE hours of video calls every month</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <NotificationBell />
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="mr-1 h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="mr-1 h-4 w-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-1 h-4 w-4" />
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="sm">
                  Sign up free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
    <VideoBanner subtitle={bannerSubtitle} />
    </>
  );
};

export default Navbar;
