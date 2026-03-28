import { cn } from "@/lib/utils";

interface OnlineStatusProps {
  lastSeen: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const isUserOnline = (lastSeen: string | null | undefined) => {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
};

export const formatLastSeen = (lastSeen: string | null | undefined): string => {
  if (!lastSeen) return "Never active";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return "Over a week ago";
};

const OnlineStatus = ({ lastSeen, className, size = "sm", showText = false }: OnlineStatusProps) => {
  const online = isUserOnline(lastSeen);

  const sizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  if (showText) {
    return (
      <span className={cn("flex items-center gap-1.5", className)}>
        <span
          className={cn(
            "rounded-full block flex-shrink-0",
            sizeClasses[size],
            online ? "bg-green-500" : "bg-muted-foreground/40"
          )}
        />
        <span className={cn("text-xs", online ? "text-green-500 font-medium" : "text-muted-foreground")}>
          {online ? "Online" : formatLastSeen(lastSeen)}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "rounded-full border-2 border-card block",
        sizeClasses[size],
        online ? "bg-green-500" : "bg-muted-foreground/40",
        className
      )}
      title={online ? "Online" : formatLastSeen(lastSeen)}
    />
  );
};

export default OnlineStatus;
