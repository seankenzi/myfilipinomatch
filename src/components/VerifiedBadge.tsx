import { Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const VerifiedBadge = ({ size = "sm", showTooltip = true, className = "" }: VerifiedBadgeProps) => {
  const badge = (
    <Shield
      className={`${sizeMap[size]} text-secondary fill-secondary/30 flex-shrink-0 ${className}`}
    />
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Photo Verified Profile</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default VerifiedBadge;
