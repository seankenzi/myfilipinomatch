import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VideoBannerProps {
  subtitle?: string;
}

const VideoBanner = ({ subtitle }: VideoBannerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setIsPremium(data?.is_premium === true));
  }, [user]);

  if (isPremium) return null;

  return (
    <div
      className="w-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/10 cursor-pointer hover:from-primary/15 hover:via-accent/15 hover:to-primary/15 transition-colors"
      onClick={() => navigate("/premium")}
    >
      <div className="container flex items-center gap-3 py-3 px-4">
        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 flex-shrink-0">
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
