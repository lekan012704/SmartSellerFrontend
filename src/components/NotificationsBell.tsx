import { useEffect, useState } from "react";
import { Bell, Loader2, Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationAPI, type NotificationDto } from "@/services";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await NotificationAPI.list(1, 10);
      const list = Array.isArray(res) ? res : res?.items || [];
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const unread = items.filter((n) => n.isRead === false).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <span className="text-xs text-muted-foreground">{unread} unread</span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-destructive">{error}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">You're all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n, i) => (
                <li
                  key={(n.id as string) || i}
                  className={cn(
                    "px-4 py-3 hover:bg-secondary/50 transition-colors",
                    n.isRead === false && "bg-primary/5",
                  )}
                >
                  {n.title && <p className="text-sm font-medium">{String(n.title)}</p>}
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-0.5">{String(n.message)}</p>
                  )}
                  {n.createdAt && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(String(n.createdAt)).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
