import { Bell, Heart, MessageCircle, Users, CreditCard, Check, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeIcon: Record<string, typeof Heart> = {
  match: Users,
  message: MessageCircle,
  like: Heart,
  subscription: CreditCard,
  online: Users,
};

const typeColor: Record<string, string> = {
  match: "text-primary",
  message: "text-blue-500",
  like: "text-pink-500",
  subscription: "text-amber-500",
  online: "text-green-500",
};

export default function Notifications() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const linkFor = (n: Notification) =>
    n.type === "message" && n.related_match_id
      ? "/messages"
      : n.type === "match"
        ? "/matches"
        : n.related_user_id
          ? `/profile/${n.related_user_id}`
          : "#";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-6 pb-24 md:pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <Check className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm">We'll let you know when something happens!</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {notifications.map((n) => {
              const Icon = typeIcon[n.type] || Bell;
              const color = typeColor[n.type] || "text-muted-foreground";
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-4 border-b border-border last:border-b-0 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("mt-0.5 shrink-0", color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Link
                    to={linkFor(n)}
                    className="flex-1 min-w-0"
                    onClick={() => !n.read && markAsRead(n.id)}
                  >
                    <p className={cn("text-sm font-medium", !n.read ? "text-foreground" : "text-muted-foreground")}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
