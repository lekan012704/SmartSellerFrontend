import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Mail, Lock, Building2, Phone, MapPin, Globe2,
  ArrowRight, Eye, EyeOff, Loader2, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { AccountAPI, type CompanyType } from "@/services";
import { ApiError } from "@/lib/api";

const Signup = () => {
  const [companyName,  setCompanyName]  = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [country,      setCountry]      = useState("");
  const [address,      setAddress]      = useState("");
  const [companyType,  setCompanyType]  = useState<number>(0);
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
  const [showPass,     setShowPass]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const { registerCompany } = useAuth();
  const { toast }           = useToast();
  const navigate            = useNavigate();

  useEffect(() => {
    AccountAPI.getCompanyTypes()
      .then((types) => {
        setCompanyTypes(types || []);
        if (types?.[0]?.id !== undefined) setCompanyType(types[0].id);
      })
      .catch(() => {
        // fail silently — user can still register
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerCompany({
        companyName,
        email,
        password,
        description: "",
        phoneNumber,
        country,
        address,
        companyType,
      });
      toast({ title: "Account created", description: "Welcome to SmartSeller." });
      navigate("/dashboard");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed";
      toast({ title: "Couldn't sign you up", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* left panel */}
      <div className="hidden lg:flex flex-1 gradient-accent items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative text-center text-primary-foreground p-12">
          <Package className="h-20 w-20 mx-auto mb-6 animate-float" />
          <h2 className="font-display text-4xl font-bold mb-4">Start Selling</h2>
          <p className="text-primary-foreground/80 text-lg max-w-sm">
            Create your account and start managing orders in minutes.
          </p>
        </div>
      </div>

      {/* right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up py-8">

          {/* logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">SmartSeller</span>
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">Create company</h1>
          <p className="text-muted-foreground mb-6">Register your business to start selling</p>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* company name */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-10 h-11"
                required
              />
            </div>

            {/* email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11"
                required
              />
            </div>

            {/* password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10 h-11"
                required
              />
            </div>

            {/* country + address */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {/* company type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Company type</Label>
              <Select
                value={String(companyType)}
                onValueChange={(v) => setCompanyType(Number(v))}
                disabled={companyTypes.length === 0}
              >
                <SelectTrigger className="h-11">
                  <SelectValue
                    placeholder={companyTypes.length === 0 ? "Loading types…" : "Select your company type"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {companyTypes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 gradient-primary text-primary-foreground border-0 shadow-glow text-base mt-2"
            >
              {submitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><span>Create Account</span><ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;