import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface VideoBannerProps {
  subtitle?: string;
}

const VideoBanner = ({ subtitle }: VideoBannerProps) => {
  const navigate = useNavigate();
  const { user, isPremium, premiumLoading } = useAuth();

  if (user && (premiumLoading || isPremium)) return null;

  return (
    <div
      className="w-full cursor-pointer border-b border-primary/10 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 transition-colors hover:from-primary/15 hover:via-accent/15 hover:to-primary/15"
      onClick={() => navigate("/premium")}
    >
      <div className="container flex items-center gap-3 px-4 py-3">
        <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 sm:flex">
          <Video className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            🎥 Meet Matches Face-to-Face
          </p>
          <p className="text-xs text-muted-foreground">
            {subtitle ?? "Upgrade to Annual and get 2 FREE hours of video calls every month"}{" "}
            <span className="text-primary">❤️ Build real connections faster</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoBanner;
