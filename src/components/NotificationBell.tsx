import { useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useConfirmations";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const handleClick = (n: any) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.action_url) {
      navigate(n.action_url);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <Card className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl shadow-lg max-h-96 overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {!notifications?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune notification</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg text-sm hover:bg-muted/50 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <p className={cn("text-sm", !n.read && "font-medium")}>{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
