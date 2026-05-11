import { useState, useEffect } from "react";
import {
  Search, Users, Mail, Phone, MapPin, ShoppingBag,
  Plus, Eye, Trash2, Loader2, Pencil,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CustomerAPI, CustomerDto } from "@/services";

const Customers = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  // ── data ───────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  // ── modals ─────────────────────────────────────────────────────────────────
  const [addOpen,    setAddOpen]    = useState(false);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);

  const [viewingCustomer,  setViewingCustomer]  = useState<CustomerDto | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerDto | null>(null);
  const [editingCustomer,  setEditingCustomer]  = useState<CustomerDto | null>(null);

  // ── add-form state ─────────────────────────────────────────────────────────
  const [formName,     setFormName]     = useState("");
  const [formEmail,    setFormEmail]    = useState("");
  const [formPhone,    setFormPhone]    = useState("");
  const [formWhatsApp, setFormWhatsApp] = useState("");
  const [formAddress,  setFormAddress]  = useState("");

  // ── edit-form state ────────────────────────────────────────────────────────
  const [editName,     setEditName]     = useState("");
  const [editEmail,    setEditEmail]    = useState("");
  const [editPhone,    setEditPhone]    = useState("");
  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editAddress,  setEditAddress]  = useState("");

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone("");
    setFormWhatsApp(""); setFormAddress("");
  };

  const openEditModal = (c: CustomerDto) => {
    setEditingCustomer(c);
    setEditName(c.name ?? "");
    setEditEmail(c.email ?? "");
    setEditPhone(c.phoneNumber ?? "");
    setEditWhatsApp(c.whatsAppNumber ?? "");
    setEditAddress(c.address ?? "");
    setEditOpen(true);
  };

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchCustomers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await CustomerAPI.list();
      // Merge: if server returns null for a field we have locally, keep local value
      setCustomers(prev => {
        const localMap = new Map(prev.map(c => [c.id, c]));
        return data.map(serverItem => {
          const local = localMap.get(serverItem.id);
          if (!local) return serverItem;
          return {
            ...serverItem,
            name:           serverItem.name           ?? local.name,
            phoneNumber:    serverItem.phoneNumber     ?? local.phoneNumber,
            whatsAppNumber: serverItem.whatsAppNumber  ?? local.whatsAppNumber,
            address:        serverItem.address         ?? local.address,
          };
        });
      });
    } catch (err: any) {
      if (!silent) toast({
        title: "Failed to load customers",
        description: err?.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await CustomerAPI.create({
        name:           formName,
        email:          formEmail,
        phoneNumber:    formPhone,
        whatsAppNumber: formWhatsApp,
        address:        formAddress,
      });
      toast({ title: "Customer added!", description: `${formName} added successfully` });
      setAddOpen(false);
      resetForm();
      await fetchCustomers();
    } catch (err: any) {
      toast({ title: "Create failed", description: err?.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editingCustomer) return;
    if (!editName.trim() || !editEmail.trim()) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Build the updated customer object locally
    const updated: CustomerDto = {
      ...editingCustomer,
      name:           editName,
      email:          editEmail,
      phoneNumber:    editPhone    || editingCustomer.phoneNumber,
      whatsAppNumber: editWhatsApp || editingCustomer.whatsAppNumber,
      address:        editAddress  || editingCustomer.address,
    };

    try {
      await CustomerAPI.edit(editingCustomer.id, {
        name:           editName,
        email:          editEmail,
        phoneNumber:    editPhone,
        whatsAppNumber: editWhatsApp,
        address:        editAddress,
      });

      // Optimistic update — don't rely on refetch returning correct data
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));

      toast({ title: "Customer updated!", description: `${editName} updated successfully` });
      setEditOpen(false);
      setEditingCustomer(null);

      // Refetch silently in background to sync — won't overwrite good local data
      fetchCustomers(true).catch(() => {});
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setSaving(true);
    try {
      await CustomerAPI.delete(deletingCustomer.id);
      toast({ title: "Deleted", description: `${deletingCustomer.name ?? "Customer"} removed` });
      setDeleteOpen(false);
      setDeletingCustomer(null);
      await fetchCustomers();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phoneNumber ?? "").includes(q) ||
      (c.whatsAppNumber ?? "").includes(q)
    );
  });

  // ── derived stats ──────────────────────────────────────────────────────────
  const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent  ?? 0), 0);
  const totalOrders  = customers.reduce((s, c) => s + (c.totalOrders ?? 0), 0);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">Track and manage your customer base</p>
          </div>
          <Button onClick={() => { resetForm(); setAddOpen(true); }}
            className="gradient-primary text-primary-foreground border-0 shadow-glow gap-2">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-bold mt-1">{customers.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card hidden md:block">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg. Order Value</p>
            <p className="text-2xl font-bold mt-1">${(totalRevenue / Math.max(totalOrders, 1)).toFixed(2)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading customers…</span>
          </div>
        ) : (
          <>
            {/* Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(c => (
                <div key={c.id}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-card transition-shadow space-y-3">

                  {/* Top row */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                      {(c.name ?? c.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{c.name ?? "—"}</p>
                        {c.isActive === false && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium shrink-0">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />{c.email}
                      </p>
                    </div>

                    {/* Actions — Eye | Edit | Delete */}
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setViewingCustomer(c); setViewOpen(true); }}
                        title="View details">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => openEditModal(c)}
                        title="Edit customer">
                        <Pencil className="h-3.5 w-3.5 text-blue-400" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => { setDeletingCustomer(c); setDeleteOpen(true); }}
                        title="Delete customer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.whatsAppNumber || c.phoneNumber || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.address || "—"}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ShoppingBag className="h-3.5 w-3.5" />{c.totalOrders ?? 0} orders
                    </span>
                    <span className="font-bold">${(c.totalSpent ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{search ? "No customers match your search" : "No customers yet"}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── ADD CUSTOMER MODAL ───────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to your list</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+1234567890" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">WhatsApp Number</label>
              <Input value={formWhatsApp} onChange={e => setFormWhatsApp(e.target.value)} placeholder="+1234567890" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Address</label>
              <Input value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="123 Main St" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetForm(); }} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="gradient-primary text-primary-foreground border-0" disabled={saving}>
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                : "Add Customer"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT CUSTOMER MODAL ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditingCustomer(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Edit Customer
            </DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+1234567890" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">WhatsApp Number</label>
              <Input value={editWhatsApp} onChange={e => setEditWhatsApp(e.target.value)} placeholder="+1234567890" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Address</label>
              <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="123 Main St" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingCustomer(null); }} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="gradient-primary text-primary-foreground border-0" disabled={saving}>
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                : "Save Changes"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── VIEW MODAL ───────────────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Customer Details
            </DialogTitle>
            <DialogDescription>Full customer profile</DialogDescription>
          </DialogHeader>

          {viewingCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                  {(viewingCustomer.name ?? viewingCustomer.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{viewingCustomer.name ?? "—"}</p>
                    {viewingCustomer.isActive === false && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{viewingCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground block">Phone</span>
                  <span className="font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />{viewingCustomer.phoneNumber || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">WhatsApp</span>
                  <span className="font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />{viewingCustomer.whatsAppNumber || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Address</span>
                  <span className="font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{viewingCustomer.address || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Orders</span>
                  <span className="font-medium">{viewingCustomer.totalOrders ?? 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Spent</span>
                  <span className="font-medium">${(viewingCustomer.totalSpent ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Last Order</span>
                  <span className="font-medium">
                    {viewingCustomer.lastOrderDate
                      ? new Date(viewingCustomer.lastOrderDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Customer Since</span>
                  <span className="font-medium">
                    {viewingCustomer.createdAt
                      ? new Date(viewingCustomer.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DELETE MODAL ─────────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{deletingCustomer?.name ?? "this customer"}</span>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting…</>
                : "Delete"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Customers;