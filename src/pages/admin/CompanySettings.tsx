import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AccountAPI, type ProfileDetailsDto, type CompanyType } from "@/services";
import { ApiError, companyStore } from "@/lib/api";

const CompanySettings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileDetailsDto | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
  const [companyId, setCompanyId] = useState(companyStore.get() || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contactEmail: "",
    phoneNumber: "",
    primaryAddress: "",
  });

  useEffect(() => {
    Promise.all([
      AccountAPI.getProfile().catch(() => null),
      AccountAPI.getCompanyName().catch(() => null),
      AccountAPI.getCompanyTypes().catch(() => [] as CompanyType[]),
    ])
      .then(([p, name, types]) => {
        if (p) {
          setProfile(p);
          setForm({
            contactEmail: p.contactEmail || "",
            phoneNumber: p.phoneNumber || "",
            primaryAddress: p.primaryAddress || "",
          });
        }
        if (typeof name === "string") setCompanyName(name);
        else if (name && typeof name === "object") setCompanyName(name.companyName || name.name || "");
        setCompanyTypes(types);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AccountAPI.updateProfile(form);
      toast({ title: "Company profile updated" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast({ title: "Couldn't save", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveCompanyId = () => {
    companyStore.set(companyId);
    toast({ title: "Company ID saved" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-slide-up max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-emerald-500" /> Company Settings
          </h1>
          <p className="text-muted-foreground">Manage your business profile and identity.</p>
        </div>

        {loading ? (
          <Card className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </Card>
        ) : (
          <>
            <Card className="p-6">
              <h2 className="font-semibold mb-1">Identity</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Business name and store identifier (read-only — managed at registration).
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Company name</label>
                  <Input value={companyName || profile?.storeName || ""} readOnly />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Store name</label>
                  <Input value={profile?.storeName || ""} readOnly />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <form onSubmit={handleSave}>
                <h2 className="font-semibold mb-1">Contact details</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  How customers and staff reach your business.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Contact email</label>
                    <Input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Phone number</label>
                    <Input
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Primary address</label>
                    <Input
                      value={form.primaryAddress}
                      onChange={(e) => setForm({ ...form, primaryAddress: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="h-4 w-4 mr-2" /> Save changes</>)}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold mb-1">Company ID</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Used to fetch staff via <code className="text-xs">get-users-by-company</code>. Captured automatically at signup; paste manually if missing.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Company GUID"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button onClick={saveCompanyId} variant="outline">Save</Button>
              </div>
            </Card>

            {companyTypes.length > 0 && (
              <Card className="p-6">
                <h2 className="font-semibold mb-1">Available company types</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Reference list from <code className="text-xs">get-all-company-types</code>.
                </p>
                <div className="flex flex-wrap gap-2">
                  {companyTypes.map((t) => (
                    <span
                      key={t.id}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-secondary border border-border"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CompanySettings;
