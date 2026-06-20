/**
 * Admin Login Page
 * Dashboard authentication with email/password.
 * No public sign-up, no role selector.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const redirectTo = requestedRedirect?.startsWith("/dashboard")
    ? requestedRedirect
    : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        requiresTwoFactor ? "/api/auth/two-factor/verify-totp" : "/api/auth/sign-in/email",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requiresTwoFactor ? { code: totpCode } : { email: email.trim().toLowerCase(), password }),
      });

      // Defensive JSON parsing — check content type before calling .json()
      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json") ? await res.json() : null;
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Invalid email, password, or verification code");
      }

      if (data.twoFactorRedirect) {
        setRequiresTwoFactor(true);
        setPassword("");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mb-5 flex justify-center">
              <Image
                src="/images/fusionzone-mark.svg"
                alt="FusionZone"
                width={92}
                height={80}
                priority
                className="h-20 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {requiresTwoFactor ? "Verify Two-Factor Code" : "Staff Sign In"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {requiresTwoFactor
                ? "Enter the code from your authenticator app"
                : "Sign in to access the FusionZone dashboard"}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!requiresTwoFactor ? (
              <>
              <div>
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="you@fusionzone.example"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/admin/forgot-password"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium text-foreground">
                  Authentication Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-center text-lg tracking-widest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="000000"
                  required
                  minLength={6}
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setRequiresTwoFactor(false);
                    setTotpCode("");
                  }}
                  className="mt-3 text-xs font-medium text-primary hover:text-primary/80"
                >
                  Use a different account
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {requiresTwoFactor ? "Verifying..." : "Signing in..."}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  {requiresTwoFactor ? "Verify Code" : "Sign In"}
                </>
              )}
            </button>
          </form>

          {/* Return to Site */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link
              href="/"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Return to site
            </Link>
          </p>

          {/* Account Notice */}
          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <span className="text-foreground">
                Ask an Owner or Admin to create one.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
