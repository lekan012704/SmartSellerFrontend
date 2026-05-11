import { useEffect, useState } from "react";
import {
  Save,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import LetterAvatar from "@/components/LetterAvatar";
import { useToast } from "@/hooks/use-toast";
import {
  AccountAPI,
  PaymentAPI,
  type ProfileDetailsDto,
  type BankDto,
} from "@/services";
import { ApiError } from "@/lib/api";

const UserSettings = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  // ====== Profile ======
  const [profile, setProfile] = useState<ProfileDetailsDto>({
    storeName: "",
    contactEmail: "",
    phoneNumber: "",
    primaryAddress: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    AccountAPI.getProfile()
      .then((p) => setProfile(p))
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : "Could not load profile";
        toast({
          title: "Profile unavailable",
          description: msg,
          variant: "destructive",
        });
      })
      .finally(() => setProfileLoading(false));
  }, [toast]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);

    try {
      await AccountAPI.updateProfile({
        contactEmail: profile.contactEmail,
        phoneNumber: profile.phoneNumber,
        primaryAddress: profile.primaryAddress,
      });

      updateProfile(profile.storeName || user?.username || "", profile.contactEmail);
      toast({ title: "Profile saved" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  // ====== Password reset email only ======
  const [resetEmail, setResetEmail] = useState(user?.email || "");
  const [requesting, setRequesting] = useState(false);

  const requestReset = async () => {
    if (!resetEmail.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }

    setRequesting(true);

   try {
  await AccountAPI.forgotPassword({
    email: resetEmail,
    baseUrl: window.location.origin,
  });

  toast({
    title: "Reset email sent",
    description: "Check your inbox for the password reset link.",
  });
}finally {
      setRequesting(false);
    }
  };

  // ====== Billing ======
  const [banks, setBanks] = useState<BankDto[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    ok: boolean;
    name?: string;
    msg?: string;
  } | null>(null);

const loadBanks = async () => {
  setBanksLoading(true);

  try {
    const res = await PaymentAPI.banks();

    const list = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
      ? (res as any).data
      : [];

    setBanks(list);
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : "Could not load banks";
    toast({
      title: "Banks unavailable",
      description: msg,
      variant: "destructive",
    });
  } finally {
    setBanksLoading(false);
  }
};

  const verifyBank = async () => {
    if (!bankCode || !accountNumber) {
      toast({
        title: "Pick a bank and enter account number",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await PaymentAPI.verify({ bankCode, accountNumber });
      setVerifyResult({
        ok: !!res?.success,
        name: res?.accountName,
        msg: res?.message,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Verification failed";
      setVerifyResult({ ok: false, msg });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </div>

        {/* Avatar header */}
        <div className="rounded-xl glass p-6 flex items-center gap-4">
          <LetterAvatar
            name={user?.username || profile.storeName || "U"}
            size="lg"
          />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold truncate">
              {profile.storeName || user?.username}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {profile.contactEmail || user?.email}
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* ===== PROFILE ===== */}
          <TabsContent value="profile">
            <div className="rounded-xl glass p-6 space-y-4">
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Store name
                    </label>
                    <Input
                      value={profile.storeName || ""}
                      disabled
                      className="opacity-70"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set during registration.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Contact email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={profile.contactEmail || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            contactEmail: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.phoneNumber || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Primary address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.primaryAddress || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            primaryAddress: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="gradient-primary text-primary-foreground border-0 shadow-glow"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          {/* ===== PASSWORD ===== */}
          <TabsContent value="password">
            <div className="rounded-xl glass p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">
                  Reset password
                </h2>
              </div>

              <div className="rounded-lg border border-border p-5 space-y-4">
                <p className="text-sm text-muted-foreground">
                  We will send a password reset link to your email address.
                </p>

                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email on your account"
                />

                <Button
                  onClick={requestReset}
                  disabled={requesting}
                  className="gradient-primary text-primary-foreground border-0"
                >
                  {requesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send reset email"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== NOTIFICATIONS ===== */}
          <TabsContent value="notifications">
            <div className="rounded-xl glass p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">
                  Notification preferences
                </h2>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Notifications appear in the bell icon on the top bar.
                Preferences below are local for now.
              </p>

              <div className="space-y-3">
                {["Order updates", "New customers", "Weekly reports"].map(
                  (item) => (
                    <label
                      key={item}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm">{item}</span>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded accent-primary"
                      />
                    </label>
                  )
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== BILLING ===== */}
          <TabsContent value="billing">
            <div className="rounded-xl glass p-6 space-y-5">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">
                  Bank account (Paystack)
                </h2>
              </div>

              <p className="text-sm text-muted-foreground">
                Verify a Nigerian bank account to receive payouts.
              </p>

              {banks.length === 0 ? (
                <Button
                  onClick={loadBanks}
                  disabled={banksLoading}
                  variant="outline"
                >
                  {banksLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Load banks"
                  )}
                </Button>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Bank
                      </label>
                      <select
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select bank</option>
                        {banks.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Account number
                      </label>
                      <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="0123456789"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={verifyBank}
                    disabled={verifying}
                    className="gradient-primary text-primary-foreground border-0"
                  >
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify account"
                    )}
                  </Button>

                  {verifyResult && (
                    <div
                      className={`rounded-lg border p-3 flex items-start gap-2 text-sm ${
                        verifyResult.ok
                          ? "border-success/30 bg-success/5"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      {verifyResult.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      )}

                      <div>
                        {verifyResult.ok ? (
                          <p>
                            <span className="font-medium">Verified:</span>{" "}
                            {verifyResult.name}
                          </p>
                        ) : (
                          <p className="text-destructive">
                            {verifyResult.msg || "Verification failed"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;