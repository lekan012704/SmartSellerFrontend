import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Key, Search } from "lucide-react";
import { RoleAPI } from "@/services";

const PermissionCatalogue = () => {
  const [perms, setPerms] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  RoleAPI.allPermissions()
    .then((res) => {
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];

      setPerms(list);
    })
    .catch(() => setPerms([]))
    .finally(() => setLoading(false));
}, []);

  // Group by middle segment: Permissions.Order.View -> "Order"
  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    const filtered = q ? perms.filter((p) => p.toLowerCase().includes(q.toLowerCase())) : perms;
    filtered.forEach((p) => {
      const parts = p.split(".");
      const group = parts[0] || "Other";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [perms, q]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Key className="h-7 w-7 text-amber-500" /> Permission Catalogue
          </h1>
          <p className="text-muted-foreground">All system permissions, grouped by module.</p>
        </div>

        <Card className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading...</p>
          ) : grouped.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No permissions found.</p>
          ) : (
            <div className="space-y-6">
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm">{group}</h3>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => (
                      <div
                        key={p}
                        className="text-xs font-mono px-2 py-1.5 rounded bg-secondary/40 truncate"
                        title={p}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PermissionCatalogue;
