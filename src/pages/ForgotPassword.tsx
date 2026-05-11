import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountAPI } from "@/services";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AccountAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not send reset email";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">SmartSeller</span>
        </Link>

        {sent ? (
          <div className="rounded-xl glass p-6 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold">Check your inbox</h1>
            <p className="text-muted-foreground text-sm">
              If <span className="font-medium text-foreground">{email}</span> belongs to an account, we've sent password reset instructions.
            </p>
            <Link to="/reset-password" className="text-primary text-sm hover:underline">I have a reset token →</Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold mb-2">Forgot password</h1>
            <p className="text-muted-foreground mb-6">Enter your email and we'll send a reset link.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-12 gradient-primary text-primary-foreground border-0 shadow-glow">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          </>
        )}

        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground mt-6 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
