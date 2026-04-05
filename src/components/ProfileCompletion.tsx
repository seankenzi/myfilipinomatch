import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import {
  Camera, FileText, Heart, MapPin, Globe, GraduationCap, Shield, Sparkles,
} from "lucide-react";

interface ProfileData {
  full_name: string;
  age: number | null;
  gender: string;
  country: string;
  city: string;
  bio: string;
  interests: string[];
  relationship_intent: string;
  relocation_intent: string;
  photos: string[];
  is_verified: boolean;
}

interface ProfileCompletionProps {
  profile: ProfileData;
  onEditClick: () => void;
}

interface CompletionItem {
  key: string;
  label: string;
  prompt: string;
  icon: React.ElementType;
  done: boolean;
  action?: () => void;
}

const ProfileCompletion = ({ profile, onEditClick }: ProfileCompletionProps) => {
  const navigate = useNavigate();

  const items = useMemo<CompletionItem[]>(() => [
    {
      key: "photos",
      label: "Add photos",
      prompt: "Profiles with 3+ photos get 5x more likes",
      icon: Camera,
      done: profile.photos.length >= 3,
    },
    {
      key: "bio",
      label: "Write a bio",
      prompt: "Tell others what makes you unique",
      icon: FileText,
      done: profile.bio.length >= 150,
      action: onEditClick,
    },
    {
      key: "basics",
      label: "Complete basics",
      prompt: "Add your name, age & gender",
      icon: Sparkles,
      done: !!profile.full_name && !!profile.age && !!profile.gender,
      action: onEditClick,
    },
    {
      key: "location",
      label: "Add location",
      prompt: "Help matches near you find your profile",
      icon: MapPin,
      done: !!profile.country && !!profile.city,
      action: onEditClick,
    },
    {
      key: "intent",
      label: "Set relationship intent",
      prompt: "Let others know what you're looking for",
      icon: Heart,
      done: !!profile.relationship_intent,
      action: onEditClick,
    },
    {
      key: "relocation",
      label: "Relocation preference",
      prompt: "Are you open to moving for the right person?",
      icon: Globe,
      done: !!profile.relocation_intent,
      action: onEditClick,
    },
    {
      key: "interests",
      label: "Add interests",
      prompt: "Share hobbies to find common ground",
      icon: GraduationCap,
      done: profile.interests.length >= 3,
      action: onEditClick,
    },
    {
      key: "verified",
      label: "Get verified",
      prompt: "Verified profiles get up to 3x more matches",
      icon: Shield,
      done: profile.is_verified,
      action: () => navigate("/verification"),
    },
  ], [profile, onEditClick, navigate]);

  const completedCount = items.filter((i) => i.done).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const incomplete = items.filter((i) => !i.done);

  if (percentage === 100) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-sm">Profile Completion</h2>
        <span className="text-xs font-bold text-primary">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2 mb-4" />

      {incomplete.length > 0 && (
        <div className="space-y-2">
          {incomplete.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.action}
                className="flex items-start gap-3 w-full rounded-xl bg-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.prompt}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;
