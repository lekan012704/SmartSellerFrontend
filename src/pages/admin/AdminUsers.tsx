import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Search,
  UserCog,
  UserCheck,
  UserX,
  Trash2,
  Shield,
  KeyRound,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AccountAPI, RoleAPI, type UserDto, type RoleDto } from "@/services";
import { ApiError, companyStore } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Team = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [companyId, setCompanyId] = useState(companyStore.get() || "");
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPerms, setAllPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editing, setEditing] = useState<UserDto | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    userName: "",
    role: "",
    isActive: true,
  });

  const [roleForm, setRoleForm] = useState({
    userId: "",
    userName: "",
    roleName: "",
  });

  const [permForm, setPermForm] = useState({
    userId: "",
    userName: "",
    permissions: [] as string[],
  });

  const canCreate = hasPermission("User.Create");
  const canEdit = hasPermission("User.Edit");
  const canActivate = hasPermission("User.Activate");
  const canDeactivate = hasPermission("User.Deactivate");
  const canDelete = hasPermission("User.Delete");
  const canAssignRole = hasPermission("User.AssignRole");
  const canAssignPermission = true;

  const extractArray = <T,>(res: unknown): T[] => {
    if (Array.isArray(res)) return res as T[];
    if (Array.isArray((res as any)?.data)) return (res as any).data;
    if (Array.isArray((res as any)?.Data)) return (res as any).Data;
    return [];
  };

  const getRoleName = (r: RoleDto) => r.name || r.roleName || "";

  const loadRoles = async () => {
    try {
      const res = await RoleAPI.list();
      setRoles(extractArray<RoleDto>(res));
    } catch {
      setRoles([]);
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await RoleAPI.allPermissions();
      setAllPerms(extractArray<string>(res));
    } catch {
      setAllPerms([]);
    }
  };

  const loadUsers = async () => {
    if (!companyId) return;
    setLoading(true);

    try {
      const res = await AccountAPI.getUsersByCompany(companyId);
      setUsers(extractArray<UserDto>(res));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load team";
      toast({ title: "Couldn't load team", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
    if (companyId) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter(
      (u) =>
        u.userName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const resetForm = () =>
    setForm({
      email: "",
      password: "",
      fullName: "",
      phoneNumber: "",
      userName: "",
      role: roles[0] ? getRoleName(roles[0]) : "",
      isActive: true,
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await AccountAPI.registerUser({
        ...form,
        dateCreated: new Date().toISOString(),
      });

      toast({ title: "Staff created", description: `${form.userName} added.` });
      setCreateOpen(false);
      resetForm();
      loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create staff";
      toast({ title: "Couldn't create", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (u: UserDto) => {
    setEditing(u);
    setForm({
      email: u.email,
      password: "",
      fullName: u.fullName || "",
      phoneNumber: u.phoneNumber || "",
      userName: u.userName,
      role: u.role,
      isActive: !!u.isActive,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    setSubmitting(true);

    try {
     await AccountAPI.updateUser(editing.id, {
  email: form.email,
  password: form.password,
  fullName: form.fullName,
  phoneNumber: form.phoneNumber,
  userName: form.userName,
  role: form.role,
  isActive: form.isActive,
});

      toast({
        title: "User updated",
        description: `${form.userName} updated successfully.`,
      });

      setEditOpen(false);
      setEditing(null);
      loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update user";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: UserDto) => {
    try {
      if (u.isActive) await AccountAPI.deactivateUser(u.id);
      else await AccountAPI.activateUser(u.id);

      toast({ title: u.isActive ? "User deactivated" : "User activated" });
      loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    }
  };

  const openDelete = (u: UserDto) => {
    setDeletingUser(u);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    setSubmitting(true);

    try {
      await AccountAPI.deleteUser(deletingUser.id);

      toast({
        title: "User deleted",
        description: `${deletingUser.userName} was removed successfully.`,
      });

      setDeleteOpen(false);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete user";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignRole = (u: UserDto) => {
    setRoleForm({
      userId: u.id,
      userName: u.fullName || u.userName,
      roleName: u.role || "",
    });
    setRoleOpen(true);
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleForm.userId || !roleForm.roleName) {
      toast({ title: "Select a role", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      await RoleAPI.assignRole({
        userId: roleForm.userId,
        roleName: roleForm.roleName,
      });

      toast({
        title: "Role assigned",
        description: `${roleForm.userName} is now ${roleForm.roleName}.`,
      });

      setRoleOpen(false);
      loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to assign role";
      toast({ title: "Couldn't assign role", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openPermissions = (u: UserDto) => {
    setPermForm({
      userId: u.id,
      userName: u.fullName || u.userName,
      permissions: [],
    });
    setPermOpen(true);
  };

  const togglePermission = (perm: string) => {
    setPermForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleAssignPermissions = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!permForm.userId) return;

    if (permForm.permissions.length === 0) {
      toast({ title: "Select at least one permission", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      await RoleAPI.assignPermissionsToUser({
        userId: permForm.userId,
        permissions: permForm.permissions,
      });

      toast({
        title: "Permissions assigned",
        description: `${permForm.permissions.length} permission(s) granted to ${permForm.userName}.`,
      });

      setPermOpen(false);
      setPermForm({ userId: "", userName: "", permissions: [] });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to assign permissions";
      toast({ title: "Couldn't assign permissions", description: msg, variant: "destructive" });
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
              <UserCog className="h-7 w-7 text-primary" /> Team
            </h1>
            <p className="text-muted-foreground">Manage staff accounts in your company.</p>
          </div>

          {canCreate && (
            <Button
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
              className="gradient-primary text-primary-foreground border-0 shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" /> Add staff
            </Button>
          )}
        </div>

        {!companyId && (
          <Card className="p-4 border-amber-500/40 bg-amber-500/10">
            <p className="text-sm font-medium mb-2">Company ID required</p>
            <p className="text-xs text-muted-foreground mb-3">
              We didn't capture your company ID at signup. Paste it once and we'll remember it.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Company GUID"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
              <Button
                onClick={() => {
                  companyStore.set(companyId);
                  loadUsers();
                }}
              >
                Save
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {users.length === 0 ? "No staff yet. Click Add staff to invite one." : "No matches."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName || u.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.role || "No role"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.phoneNumber || "—"}</TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {canEdit && (
                          <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                            <UserCog className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}

                        {canAssignRole && (
                          <Button size="sm" variant="outline" onClick={() => openAssignRole(u)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Role
                          </Button>
                        )}

                        {canAssignPermission && (
                          <Button size="sm" variant="outline" onClick={() => openPermissions(u)}>
                            <KeyRound className="h-4 w-4 mr-1" />
                            Permissions
                          </Button>
                        )}

                        {((u.isActive && canDeactivate) || (!u.isActive && canActivate)) && (
                          <Button size="sm" variant="outline" onClick={() => handleToggleActive(u)}>
                            {u.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDelete(u)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Add staff member
            </DialogTitle>
            <DialogDescription>Create a new account under your company.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <Input
                placeholder="Username"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                required
              />
            </div>

            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <Input
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <Input
              placeholder="Phone number"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              required
            />

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              {roles.length > 0 ? (
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => {
                      const name = getRoleName(r);
                      return name ? (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Role name e.g. Manager"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground border-0">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit staff member</DialogTitle>
            <DialogDescription>Update account details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <Input
                placeholder="Username"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                required
              />
            </div>

            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <Input
              placeholder="Phone number"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              required
            />

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              {roles.length > 0 ? (
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => {
                      const name = getRoleName(r);
                      return name ? (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Role name"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                />
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground border-0">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Role */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign role</DialogTitle>
            <DialogDescription>Change role for {roleForm.userName}.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignRole} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              {roles.length > 0 ? (
                <Select
                  value={roleForm.roleName}
                  onValueChange={(v) => setRoleForm({ ...roleForm, roleName: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => {
                      const name = getRoleName(r);
                      return name ? (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Role name"
                  value={roleForm.roleName}
                  onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                  required
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRoleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground border-0">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Permissions */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grant permissions</DialogTitle>
            <DialogDescription>Assign extra permissions to {permForm.userName}.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignPermissions} className="space-y-4">
            {allPerms.length === 0 ? (
              <div className="text-sm text-muted-foreground rounded-lg border border-border p-4">
                Permissions list is unavailable.
              </div>
            ) : (
              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {permForm.permissions.length} selected
                </p>

                <div className="grid gap-2 md:grid-cols-2">
                  {allPerms.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 text-xs font-mono rounded-md p-2 hover:bg-secondary/60 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={permForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPermOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || allPerms.length === 0}
                className="gradient-primary text-primary-foreground border-0"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant permissions"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete user
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deletingUser?.fullName || deletingUser?.userName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Team;