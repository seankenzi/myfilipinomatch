import { useState } from "react";
import { Video, Heart, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const VideoBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative w-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/10 cursor-pointer hover:from-primary/15 hover:via-accent/15 hover:to-primary/15 transition-colors"
        onClick={() => navigate("/premium")}
      >
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                🎥 Meet Matches Face-to-Face
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to Annual and get 2 FREE hours of video calls every month{" "}
                <span className="text-primary">❤️ Build real connections faster</span>
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoBanner;
