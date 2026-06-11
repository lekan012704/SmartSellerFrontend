import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Shield, Trash2, Pencil, Users, Key, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RoleAPI, AccountAPI, type RoleDto, type UserDto } from "@/services";
import { ApiError, companyStore } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Helper to unwrap API envelope
const unwrap = (res: unknown): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray((res as any)?.data)) return (res as any).data;
  return [];
};

const Roles = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPerms, setAllPerms] = useState<string[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RoleDto | null>(null);
  const [usersOpen, setUsersOpen] = useState(false);
  const [usersInRole, setUsersInRole] = useState<UserDto[]>([]);
  const [usersInRoleLoading, setUsersInRoleLoading] = useState(false);
  const [permsForUserOpen, setPermsForUserOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permSearch, setPermSearch] = useState("");

  // Permission keys match what the API actually returns (no "Permissions." prefix)
  const canCreate = hasPermission("Role.Create");
  const canEdit = hasPermission("Role.Edit");
  const canDelete = hasPermission("Role.Delete");
  const canAssign = hasPermission("User.AssignRole");

  const [form, setForm] = useState({
    roleName: "",
    description: "",
    isActive: true,
    claims: [] as string[],
  });

  const [userPermForm, setUserPermForm] = useState({
    userId: "",
    permissions: [] as string[],
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        RoleAPI.list().catch(() => []),
        RoleAPI.allPermissions().catch(() => []),
      ]);
      setRoles(unwrap(rolesRes));
      setAllPerms(unwrap(permsRes));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load";
      toast({ title: "Couldn't load roles", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const cid = companyStore.get();
    if (!cid) return;
    try {
      const res = await AccountAPI.getUsersByCompany(cid);
      setUsers(unwrap(res));
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadAll();
    loadUsers();
  }, []);

  const filteredPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return allPerms;
    return allPerms.filter((p) => p.toLowerCase().includes(q));
  }, [allPerms, permSearch]);

  const togglePerm = (p: string, list: string[], setter: (l: string[]) => void) => {
    if (list.includes(p)) setter(list.filter((x) => x !== p));
    else setter([...list, p]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await RoleAPI.create(form);
      toast({ title: "Role created" });
      setCreateOpen(false);
      setForm({ roleName: "", description: "", isActive: true, claims: [] });
      loadAll();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast({ title: "Couldn't create role", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (r: RoleDto) => {
    setEditing(r);
    setForm({
      roleName: r.roleName || r.name || "",
      description: r.description || "",
      isActive: r.isActive ?? true,
      claims: r.claims || [],
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await RoleAPI.update({
        roleId: editing.roleId || editing.id || "",
        ...form,
      });
      toast({ title: "Role updated" });
      setEditOpen(false);
      setEditing(null);
      loadAll();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast({ title: "Couldn't update", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (r: RoleDto) => {
    const id = r.roleId || r.id;
    if (!id) return;
    if (!confirm(`Delete role "${r.roleName || r.name}"?`)) return;
    try {
      await RoleAPI.remove(id);
      toast({ title: "Role deleted" });
      loadAll();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast({ title: "Couldn't delete", description: msg, variant: "destructive" });
    }
  };

  const openUsersInRole = async (r: RoleDto) => {
    const id = r.roleId || r.id;
    if (!id) return;
    setEditing(r);
    setUsersOpen(true);
    setUsersInRoleLoading(true);
    try {
      const res = await RoleAPI.usersInRole(id);
      setUsersInRole(unwrap(res));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast({ title: "Couldn't load users", description: msg, variant: "destructive" });
      setUsersInRole([]);
    } finally {
      setUsersInRoleLoading(false);
    }
  };

  const assignRoleToUser = async (userId: string, roleName: string) => {
    try {
      await RoleAPI.assignRole({ userId, roleName });
      toast({ title: "Role assigned" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast({ title: "Couldn't assign", description: msg, variant: "destructive" });
    }
  };

  const handleUserPerms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await RoleAPI.assignPermissionsToUser(userPermForm);
      toast({ title: "Permissions assigned" });
      setPermsForUserOpen(false);
      setUserPermForm({ userId: "", permissions: [] });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast({ title: "Couldn't assign", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" /> Roles & Permissions
            </h1>
            <p className="text-muted-foreground">Define roles and grant access across your team.</p>
          </div>
          <div className="flex gap-2">
            {canAssign && (
              <Button variant="outline" onClick={() => setPermsForUserOpen(true)}>
                <Key className="h-4 w-4 mr-2" /> Grant user permissions
              </Button>
            )}
            {canCreate && (
              <Button
                onClick={() => {
                  setForm({ roleName: "", description: "", isActive: true, claims: [] });
                  setCreateOpen(true);
                }}
                className="gradient-primary text-primary-foreground border-0 shadow-glow"
              >
                <Plus className="h-4 w-4 mr-2" /> New role
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
            <TabsTrigger value="permissions">All permissions ({allPerms.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : roles.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">No roles defined yet.</Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((r) => (
                  <Card key={r.roleId || r.id || r.roleName} className="p-4 hover:shadow-glow transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{r.roleName || r.name}</h3>
                        {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                      </div>
                      {r.isActive === false ? (
                        <Badge variant="outline">Inactive</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-0">Active</Badge>
                      )}
                    </div>
                    {r.claims && r.claims.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-3">{r.claims.length} permission{r.claims.length !== 1 ? "s" : ""}</p>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => openUsersInRole(r)}>
                        <Users className="h-3.5 w-3.5 mr-1" /> Users
                      </Button>
                      {canEdit && (
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(r)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <Card className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search permissions..." value={permSearch} onChange={(e) => setPermSearch(e.target.value)} className="pl-10" />
              </div>
              {filteredPerms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No permissions.</p>
              ) : (
                <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPerms.map((p) => (
                    <div key={p} className="text-xs font-mono px-2 py-1.5 rounded bg-secondary/40">
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create role */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>Pick the permissions this role should have.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input placeholder="Role name" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} required />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <PermPicker all={allPerms} selected={form.claims} onToggle={(p) => togglePerm(p, form.claims, (l) => setForm({ ...form, claims: l }))} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground border-0">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit role */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3">
            <Input placeholder="Role name" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} required />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
            <PermPicker all={allPerms} selected={form.claims} onToggle={(p) => togglePerm(p, form.claims, (l) => setForm({ ...form, claims: l }))} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground border-0">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Users in role */}
      <Dialog open={usersOpen} onOpenChange={setUsersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Users in {editing?.roleName || editing?.name}</DialogTitle>
          </DialogHeader>
          {usersInRoleLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : usersInRole.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users in this role.</p>
          ) : (
            <div className="space-y-2">
              {usersInRole.map((u) => (
                <div key={u.id || u.userId || u.email} className="flex items-center justify-between p-2 rounded bg-secondary/40">
                  <div>
                    <p className="text-sm font-medium">{u.fullName || u.userName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {canAssign && users.length > 0 && (
            <div className="border-t border-border pt-3 mt-2">
              <p className="text-xs text-muted-foreground mb-2">Add a user to this role</p>
              <div className="flex flex-wrap gap-1">
                {users.map((u) => (
                  <Button
                    key={u.id || u.userId || u.email}
                    size="sm"
                    variant="outline"
                    onClick={() => assignRoleToUser(u.id, editing?.roleName || editing?.name || "")}
                  >
                    + {u.userName}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grant user permissions */}
      <Dialog open={permsForUserOpen} onOpenChange={setPermsForUserOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grant permissions to a user</DialogTitle>
            <DialogDescription>Override role defaults for this specific user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUserPerms} className="space-y-3">
            {users.length > 0 ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">User</label>
                <select
                  value={userPermForm.userId}
                  onChange={(e) => setUserPermForm({ ...userPermForm, userId: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u.id || u.userId || u.email} value={u.id}>{u.fullName || u.userName} ({u.email})</option>
                  ))}
                </select>
              </div>
            ) : (
              <Input
                placeholder="User ID (GUID)"
                value={userPermForm.userId}
                onChange={(e) => setUserPermForm({ ...userPermForm, userId: e.target.value })}
                required
              />
            )}
            <PermPicker
              all={allPerms}
              selected={userPermForm.permissions}
              onToggle={(p) => togglePerm(p, userPermForm.permissions, (l) => setUserPermForm({ ...userPermForm, permissions: l }))}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPermsForUserOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground border-0">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const PermPicker = ({
  all,
  selected,
  onToggle,
}: {
  all: string[];
  selected: string[];
  onToggle: (p: string) => void;
}) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (q ? all.filter((p) => p.toLowerCase().includes(q.toLowerCase())) : all),
    [all, q],
  );
  if (all.length === 0) {
    return (
      <div className="text-xs text-muted-foreground p-3 rounded bg-secondary/40">
        Permissions list unavailable.
      </div>
    );
  }
  return (
    <div className="border border-border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{selected.length} selected</p>
        <Input placeholder="Filter..." value={q} onChange={(e) => setQ(e.target.value)} className="h-7 max-w-xs" />
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {filtered.map((p) => (
          <label key={p} className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded hover:bg-secondary/60 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(p)}
              onChange={() => onToggle(p)}
            />
            {p}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Roles;