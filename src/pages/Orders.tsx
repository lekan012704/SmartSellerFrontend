import { useEffect, useState } from "react";
import {
  Search, Package, Plus, Eye, Trash2, X,
  Truck, Globe, Loader2, User, Phone,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { OrderAPI, type CreateOrderItem, type OrderSummaryDto } from "@/services";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ComingSoonModal from "@/components/ComingSoonModal";

// ── status meta — mirrors backend OrderStatus enum ────────────────────────────
// 0=NewOrder, 1=PaymentPending, 2=Paid, 3=ReadyForDispatch,
// 4=InTransit, 5=Delivered, 6=Cancelled
const STATUS_META: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "New Order",          color: "text-info",        bg: "bg-info/10"        },
  1: { label: "Payment Pending",    color: "text-warning",     bg: "bg-warning/10"     },
  2: { label: "Paid",               color: "text-success",     bg: "bg-success/10"     },
  3: { label: "Ready for Dispatch", color: "text-accent",      bg: "bg-accent/10"      },
  4: { label: "In Transit",         color: "text-blue-400",    bg: "bg-blue-400/10"    },
  5: { label: "Delivered",          color: "text-success",     bg: "bg-success/10"     },
  6: { label: "Cancelled",          color: "text-destructive", bg: "bg-destructive/10" },
};

const STATUS_FILTERS: { label: string; value: number | "all" }[] = [
  { label: "All",               value: "all" },
  { label: "New Order",         value: 0     },
  { label: "Payment Pending",   value: 1     },
  { label: "Paid",              value: 2     },
  { label: "Ready for Dispatch",value: 3     },
  { label: "In Transit",        value: 4     },
  { label: "Delivered",         value: 5     },
  { label: "Cancelled",         value: 6     },
];

interface UIItem extends CreateOrderItem { id: string; }

const emptyItem = (): UIItem => ({
  id: crypto.randomUUID(),
  productName: "", description: "", price: 0, quantity: 1,
  packageLength: 12, packageWidth: 10, packageHeight: 10, categoryId: 1, weight: 1,
});

const Field = ({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) => (
  <div>
    <label className="text-sm font-medium mb-1 block">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const Orders = () => {
  const { toast } = useToast();

  const [orders,       setOrders]       = useState<OrderSummaryDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<number | "all">("all");

  const [formOpen,       setFormOpen]       = useState(false);
  const [viewOpen,       setViewOpen]       = useState(false);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [deliveryOpen,   setDeliveryOpen]   = useState(false);
  const [manualOpen,     setManualOpen]     = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const [viewing,    setViewing]    = useState<OrderSummaryDto | null>(null);
  const [deleting,   setDeleting]   = useState<OrderSummaryDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [customerName,    setCustomerName]    = useState("");
  const [customerEmail,   setCustomerEmail]   = useState("");
  const [customerPhone,   setCustomerPhone]   = useState("");
  const [whatsAppNumber,  setWhatsAppNumber]  = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee,     setDeliveryFee]     = useState(0);
  const [items,           setItems]           = useState<UIItem[]>([emptyItem()]);

  const [driverName,  setDriverName]  = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  const resetForm = () => {
    setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
    setWhatsAppNumber(""); setDeliveryAddress(""); setDeliveryFee(0);
    setItems([emptyItem()]);
  };
  const resetManual = () => { setDriverName(""); setDriverPhone(""); };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filter: Parameters<typeof OrderAPI.list>[0] = {};
      if (search.trim())          filter.Search = search.trim();
      if (filterStatus !== "all") filter.Status = filterStatus;
      const data = await OrderAPI.list(filter);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Failed to load orders",
        description: err instanceof ApiError ? err.message : "Could not load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(loadOrders, 350);
    return () => clearTimeout(t);
  }, [search, filterStatus]); // eslint-disable-line

  const calcTotal = (its: UIItem[], fee: number) =>
    its.reduce((s, i) => s + i.price * i.quantity, 0) + fee;

  const updateItem = (idx: number, patch: Partial<UIItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const handleFormSubmit = () => {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast({ title: "Missing fields", description: "Name, email and phone are required", variant: "destructive" });
      return;
    }
    if (items.some((i) => !i.productName.trim())) {
      toast({ title: "Missing product", description: "Every item needs a product name", variant: "destructive" });
      return;
    }
    setFormOpen(false);
    setDeliveryOpen(true);
  };

  const handleManualDeliveryChosen = () => {
    setDeliveryOpen(false);
    resetManual();
    setManualOpen(true);
  };

  const submitManualOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        customerName, customerEmail, customerPhone, whatsAppNumber,
        deliveryAddress, deliveryFee,
        driverName:  driverName  || undefined,
        driverPhone: driverPhone || undefined,
        orderItems: items.map(({ id: _id, ...rest }) => rest),
      };
      const res = await OrderAPI.create(payload);
      toast({ title: "Order created", description: `Order ${res?.id ?? ""} added.` });
      setManualOpen(false);
      resetForm(); resetManual();
      await loadOrders();
    } catch (err) {
      toast({
        title: "Create failed",
        description: err instanceof ApiError ? err.message : "Could not create order",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await OrderAPI.remove(deleting.id);
      toast({ title: "Deleted", description: `Order ${deleting.id.slice(0, 8)} removed` });
      setDeleteOpen(false); setDeleting(null);
      await loadOrders();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof ApiError ? err.message : "Delete failed", variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, newStatus: number) => {
    try {
      await OrderAPI.updateStatus(id, newStatus);
      toast({ title: "Status updated" });
      await loadOrders();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof ApiError ? err.message : "Update failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage all your orders</p>
          </div>
          <Button
            onClick={() => { resetForm(); setFormOpen(true); }}
            className="gradient-primary text-primary-foreground border-0 shadow-glow gap-2"
          >
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <Button
                key={String(s.value)} size="sm"
                variant={filterStatus === s.value ? "default" : "outline"}
                className={filterStatus === s.value ? "gradient-primary text-primary-foreground border-0" : ""}
                onClick={() => setFilterStatus(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50">
                  {["Order", "Customer", "Date", "Total", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3
                        ${i === 2 ? "hidden lg:table-cell" : ""}
                        ${i === 5 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                ) : orders.map((order) => {
                  const meta = STATUS_META[order.status] ?? STATUS_META[0];
                  return (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono">{order.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {order.customerName?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm font-medium">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ${Number(order.totalDue).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, Number(e.target.value))}
                          className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 ${meta.bg} ${meta.color} cursor-pointer`}
                        >
                          {Object.entries(STATUS_META).map(([v, m]) => (
                            <option key={v} value={v}>{m.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => { setViewing(order); setViewOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                            onClick={() => { setDeleting(order); setDeleteOpen(true); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== NEW ORDER FORM ===== */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
            <DialogDescription>Fill in customer and item details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Customer Name" required>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" />
              </Field>
              <Field label="Phone Number" required>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+234 800 000 0000" />
              </Field>
              <Field label="WhatsApp Number">
                <Input value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} placeholder="+1234567890" />
              </Field>
              <Field label="Delivery Address">
                <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="123 Main St" />
              </Field>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Order Items</label>
                <Button size="sm" variant="outline" onClick={() => setItems((p) => [...p, emptyItem()])}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="border border-border rounded-lg p-3 space-y-2 relative">
                    {items.length > 1 && (
                      <button
                        onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Product Name *</label>
                        <Input value={item.productName} onChange={(e) => updateItem(idx, { productName: e.target.value })} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Description</label>
                        <Input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} className="h-8 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Price</label>
                          <Input type="number" min={0} step={0.01} value={item.price} onChange={(e) => updateItem(idx, { price: +e.target.value })} className="h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Qty</label>
                          <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: +e.target.value })} className="h-8 text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {(["packageLength", "packageWidth", "packageHeight", "weight", "categoryId"] as const).map((f, fi) => (
                        <div key={f}>
                          <label className="text-xs text-muted-foreground">{["L (cm)", "W (cm)", "H (cm)", "Weight", "Cat ID"][fi]}</label>
                          <Input
                            type="number"
                            step={f === "weight" ? 0.1 : 1}
                            value={item[f]}
                            onChange={(e) => updateItem(idx, { [f]: +e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="max-w-xs">
              <Field label="Delivery Fee ($)">
                <Input type="number" min={0} step={0.01} value={deliveryFee} onChange={(e) => setDeliveryFee(+e.target.value)} />
              </Field>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
              <span className="text-sm font-medium">Estimated Total</span>
              <span className="text-lg font-bold">${calcTotal(items, deliveryFee).toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleFormSubmit} className="gradient-primary text-primary-foreground border-0">Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELIVERY METHOD CHOOSER ===== */}
      <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Delivery Method</DialogTitle>
            <DialogDescription>How should this order be delivered?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <button
              onClick={handleManualDeliveryChosen}
              className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold group-hover:text-primary transition-colors">Manual Delivery</p>
                <p className="text-sm text-muted-foreground">Handle delivery yourself — add driver details next</p>
              </div>
            </button>
            <button
              onClick={() => { setDeliveryOpen(false); setComingSoonOpen(true); }}
              className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 relative">
                <Globe className="h-5 w-5 text-accent" />
                <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full bg-primary text-primary-foreground">SOON</span>
              </div>
              <div>
                <p className="font-semibold group-hover:text-primary transition-colors">Global Logistics</p>
                <p className="text-sm text-muted-foreground">Ship via DHL, FedEx, UPS — coming soon!</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MANUAL DELIVERY DETAILS ===== */}
      <Dialog open={manualOpen} onOpenChange={(o) => { if (!o) { setManualOpen(false); setDeliveryOpen(true); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Delivery</DialogTitle>
            <DialogDescription>Fill in driver details to complete the order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Driver details</p>
              <div className="space-y-2.5">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Driver name" value={driverName}
                    onChange={(e) => setDriverName(e.target.value)} className="pl-10 h-10" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Driver phone number" value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)} className="pl-10 h-10" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Customer summary</p>
              <div className="rounded-lg bg-secondary/50 border border-border p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate max-w-[180px]">{customerEmail}</span>
                </div>
                {deliveryAddress && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium truncate max-w-[180px]">{deliveryAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setManualOpen(false); setDeliveryOpen(true); }}>Back</Button>
            <Button onClick={submitManualOrder} disabled={submitting}
              className="gradient-primary text-primary-foreground border-0">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== COMING SOON ===== */}
      <ComingSoonModal
        open={comingSoonOpen}
        onOpenChange={(o) => { setComingSoonOpen(o); if (!o) setDeliveryOpen(true); }}
      />

      {/* ===== VIEW ORDER ===== */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Order details
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">{viewing?.id}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground block">Customer</span>
                  <span className="font-medium">{viewing.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Date</span>
                  <span className="font-medium">{new Date(viewing.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[viewing.status]?.bg} ${STATUS_META[viewing.status]?.color}`}>
                    {STATUS_META[viewing.status]?.label}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Due</span>
                  <span className="font-bold text-base">${Number(viewing.totalDue).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DELETE ===== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Orders;