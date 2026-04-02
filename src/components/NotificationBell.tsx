import { Bell, Heart, MessageCircle, Users, CreditCard, Check, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = typeIcon[notification.type] || Bell;
  const color = typeColor[notification.type] || "text-muted-foreground";

  const linkTo =
    notification.type === "message" && notification.related_match_id
      ? "/messages"
      : notification.type === "match"
        ? "/matches"
        : notification.related_user_id
          ? `/profile/${notification.related_user_id}`
          : "/notifications";

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className={cn("mt-0.5 shrink-0", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <Link
        to={linkTo}
        className="flex-1 min-w-0"
        onClick={() => !notification.read && onRead(notification.id)}
      >
        <p className={cn("text-sm font-medium", !notification.read && "text-foreground", notification.read && "text-muted-foreground")}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground truncate">{notification.body}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </Link>
      <div className="flex gap-1 shrink-0">
        {!notification.read && (
          <button
            onClick={() => onRead(notification.id)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8} collisionPadding={16}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <Link
              to="/notifications"
              className="text-xs text-primary hover:underline block text-center"
            >
              View all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
