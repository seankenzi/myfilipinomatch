import { cn } from "@/lib/utils";

interface OnlineStatusProps {
  lastSeen: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const isUserOnline = (lastSeen: string | null | undefined) => {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
};

const OnlineStatus = ({ lastSeen, className, size = "sm" }: OnlineStatusProps) => {
  const online = isUserOnline(lastSeen);

  const sizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span
      className={cn(
        "rounded-full border-2 border-card block",
        sizeClasses[size],
        online ? "bg-green-500" : "bg-muted-foreground/40",
        className
      )}
      title={online ? "Online" : "Offline"}
    />
  );
};

export default OnlineStatus;
