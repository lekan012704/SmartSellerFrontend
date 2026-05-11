import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Users, Shield, Key, Building2, ArrowRight } from "lucide-react";
import { RoleAPI, AccountAPI, type RoleDto, type UserDto } from "@/services";
import { companyStore } from "@/lib/api";

const AdminOverview = () => {
  const [stats, setStats] = useState({ users: 0, roles: 0, perms: 0 });
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const cid = companyStore.get();
    Promise.all([
      RoleAPI.list().catch(() => [] as RoleDto[]),
      RoleAPI.allPermissions().catch(() => [] as string[]),
      cid ? AccountAPI.getUsersByCompany(cid).catch(() => [] as UserDto[]) : Promise.resolve([] as UserDto[]),
      AccountAPI.getCompanyName().catch(() => null),
    ]).then(([roles, perms, users, name]) => {
      setStats({ users: users.length, roles: roles.length, perms: perms.length });
      if (typeof name === "string") setCompanyName(name);
      else if (name && typeof name === "object") setCompanyName(name.companyName || name.name || "");
    });
  }, []);

  const cards = [
    { to: "/admin/users", label: "Users", value: stats.users, icon: Users, gradient: "from-blue-500 to-cyan-600" },
    { to: "/admin/roles", label: "Roles", value: stats.roles, icon: Shield, gradient: "from-purple-500 to-pink-600" },
    { to: "/admin/permissions", label: "Permissions", value: stats.perms, icon: Key, gradient: "from-amber-500 to-orange-600" },
    { to: "/admin/company", label: "Company", value: companyName || "—", icon: Building2, gradient: "from-emerald-500 to-teal-600" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground">Manage users, roles, permissions, and company settings.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.to} to={c.to}>
              <Card className="p-5 hover:shadow-glow transition-all hover:-translate-y-0.5 cursor-pointer group">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-4`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-2xl font-bold truncate">{c.value}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="font-semibold mb-2">Quick guide</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Use <strong>Users</strong> to onboard staff and toggle account status.</li>
            <li>Use <strong>Roles</strong> to bundle permissions into reusable groups.</li>
            <li>Use <strong>Permissions</strong> to browse the full system catalogue.</li>
            <li>Use <strong>Company</strong> to update your business profile.</li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
