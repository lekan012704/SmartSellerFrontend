import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Zap,
  Lock,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountAPI } from "@/services";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [params] = useSearchParams();

  const [token, setToken] = useState(params.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setToken(params.get("token") || "");
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      toast({
        title: "Token required",
        description: "Please enter the reset token.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await AccountAPI.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      if (res?.succeeded === false) {
        throw new ApiError(
          res.message || "Password change failed",
          400,
          res
        );
      }

      toast({
        title: "Password changed",
        description: "You can now sign in with your new password.",
      });

      navigate("/login");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Password change failed";

      toast({
        title: "Failed",
        description: msg,
        variant: "destructive",
      });
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

          <span className="font-display text-xl font-bold">
            SmartSeller
          </span>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-2">
          Change password
        </h1>

        <p className="text-muted-foreground mb-6">
          Enter the token from your email and set a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              type={showPass ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              required
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              type={showPass ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className="pl-10 h-12"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 gradient-primary text-primary-foreground border-0 shadow-glow"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Change password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;