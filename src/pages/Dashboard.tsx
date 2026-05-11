import { useEffect, useState, useRef } from "react";
import {
  Package, DollarSign, Clock, TrendingUp,
  AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { OrderAPI, OrderStatus, type DashboardStatsDto, type OrderSummaryDto } from "@/services";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Mirrors backend: NewOrder=0, PaymentPending=1, Paid=2,
// ReadyForDispatch=3, InTransit=4, Delivered=5, Cancelled=6
const STATUS_META: Record<number, { label: string; color: string; bg: string; border: string }> = {
  [OrderStatus.NewOrder]:         { label: "New Order",          color: "text-info",        bg: "bg-info/10",        border: "border-info/30"        },
  [OrderStatus.PaymentPending]:   { label: "Payment Pending",    color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30"     },
  [OrderStatus.Paid]:             { label: "Paid",               color: "text-success",     bg: "bg-success/10",     border: "border-success/30"     },
  [OrderStatus.ReadyForDispatch]: { label: "Ready for Dispatch", color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/30"      },
  [OrderStatus.InTransit]:        { label: "In Transit",         color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/30"    },
  [OrderStatus.Delivered]:        { label: "Delivered",          color: "text-success",     bg: "bg-success/10",     border: "border-success/30"     },
  [OrderStatus.Cancelled]:        { label: "Cancelled",          color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

const Dashboard = () => {
  const { toast } = useToast();

  const [stats,   setStats]   = useState<DashboardStatsDto | null>(null);
  const [orders,  setOrders]  = useState<OrderSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const dragOrderId    = useRef<string | null>(null);
  const dragFromStatus = useRef<number | null>(null);
  const [draggingId,  setDraggingId]  = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [updating,    setUpdating]    = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawStats, rawOrders] = await Promise.all([
        OrderAPI.stats().catch((e) => { console.warn("Stats failed:", e); return null; }),
        OrderAPI.list().catch(() => [] as OrderSummaryDto[]),
      ]);

      const s = (rawStats as any)?.data ?? rawStats;
      setStats(s as DashboardStatsDto | null);

      const o = Array.isArray(rawOrders) ? rawOrders : (rawOrders as any)?.data ?? [];
      setOrders(o);

      if (!s) setError("Could not load dashboard stats — check your connection.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const fmt = (n: number) => `$${Number(n || 0).toFixed(2)}`;

  const statsCards = [
    { label: "Sales (this month)", value: stats ? fmt(stats.totalSalesMonth)                             : "—", icon: DollarSign, color: "text-success" },
    { label: "Orders to fulfill",  value: stats ? String(stats.ordersToFulfill)                          : "—", icon: Package,    color: "text-primary" },
    { label: "Pending payment",    value: stats ? String(stats.pendingPayment)                           : "—", icon: Clock,      color: "text-warning" },
    { label: "Revenue growth",     value: stats ? `${Number(stats.revenueGrowthPercentage).toFixed(1)}%` : "—", icon: TrendingUp, color: "text-accent"  },
  ];

  const grouped = (status: number) => orders.filter((o) => o.status === status);

  // ── drag handlers ─────────────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, order: OrderSummaryDto) => {
    dragOrderId.current    = order.id;
    dragFromStatus.current = order.status;
    setDraggingId(order.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
    dragOrderId.current    = null;
    dragFromStatus.current = null;
  };

  const onDragOver = (e: React.DragEvent, status: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };

  const onDragLeave = () => setDragOverCol(null);

  const onDrop = async (e: React.DragEvent, newStatus: number) => {
    e.preventDefault();
    setDragOverCol(null);

    const orderId    = dragOrderId.current;
    const fromStatus = dragFromStatus.current;

    if (!orderId || fromStatus === null || fromStatus === newStatus) return;

    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    );

    setUpdating(orderId);
    try {
      await OrderAPI.updateStatus(orderId, newStatus);
      toast({
        title: "Status updated",
        description: `Moved to ${STATUS_META[newStatus].label}`,
      });
    } catch (err) {
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: fromStatus } : o)
      );
      toast({
        title: "Update failed",
        description: err instanceof ApiError ? err.message : "Could not update status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your orders and business</p>
          </div>
          {error && (
            <Button size="sm" variant="outline" onClick={load} className="gap-2 shrink-0">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Couldn't reach the API</p>
              <p className="text-muted-foreground text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((s) => (
            <div key={s.label} className="p-4 rounded-xl glass animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold font-display min-h-[2rem]">
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  : s.value}
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl glass">
            <p className="text-sm text-muted-foreground mb-1">Sales — year to date</p>
            <p className="text-3xl font-bold font-display">
              {loading
                ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : stats ? fmt(stats.totalSalesYear) : "—"}
            </p>
          </div>
          <div className="p-5 rounded-xl glass">
            <p className="text-sm text-muted-foreground mb-1">Orders this month</p>
            <p className="text-3xl font-bold font-display">
              {loading
                ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : stats?.totalOrdersMonth ?? "—"}
            </p>
          </div>
        </div>

        {/* Kanban board */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Order Board</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Drag cards between columns to update status
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(STATUS_META).map(([statusStr, meta]) => {
              const status = Number(statusStr);
              const list   = grouped(status);
              const isOver = dragOverCol === status;

              return (
                <div
                  key={status}
                  className="flex-shrink-0 w-56 lg:w-64"
                  onDragOver={(e) => onDragOver(e, status)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, status)}
                >
                  {/* column header */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${meta.bg}`}>
                    <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                    <span className="ml-auto text-xs font-medium bg-background/60 px-2 py-0.5 rounded-full">
                      {list.length}
                    </span>
                  </div>

                  {/* drop zone */}
                  <div
                    className={`space-y-2 p-2 rounded-b-xl min-h-[160px] transition-all duration-150
                      ${isOver
                        ? `${meta.bg} border-2 ${meta.border} border-dashed`
                        : "bg-secondary/30 border-2 border-transparent"
                      }`}
                  >
                    {loading && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {!loading && list.length === 0 && (
                      <div className={`flex items-center justify-center h-24 rounded-lg border-2 border-dashed transition-colors
                        ${isOver ? `${meta.border} opacity-60` : "border-border"}`}>
                        <p className={`text-xs ${isOver ? meta.color : "text-muted-foreground"}`}>
                          {isOver ? "Drop here" : "No orders"}
                        </p>
                      </div>
                    )}

                    {list.map((o) => {
                      const isDragging = draggingId === o.id;
                      const isUpdating = updating === o.id;
                      return (
                        <div
                          key={o.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, o)}
                          onDragEnd={onDragEnd}
                          className={`p-3 rounded-lg bg-card border border-border transition-all select-none
                            cursor-grab active:cursor-grabbing
                            ${isDragging ? "opacity-40 scale-95 shadow-none" : "hover:shadow-card hover:border-primary/30"}
                            ${isUpdating ? "opacity-60 pointer-events-none" : ""}
                          `}
                        >
                          {isUpdating && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">Saving…</span>
                            </div>
                          )}
                          <p className="text-xs font-mono text-muted-foreground">{o.id.slice(0, 8)}…</p>
                          <p className="text-sm font-medium truncate mt-1">{o.customerName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-semibold text-primary">
                              ${Number(o.totalDue).toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;