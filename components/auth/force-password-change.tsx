"use client";

import { useState } from "react";
import { KeyRound, Loader2, LockKeyhole } from "lucide-react";

export function ForcePasswordChange({ userName }: { userName: string }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.newPassword.length < 10) {
      setError("Your new password must be at least 10 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setSaving(true);
    try {
      const passwordResponse = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          revokeOtherSessions: true,
        }),
      });
      const passwordData = await passwordResponse.json().catch(() => null);
      if (!passwordResponse.ok) {
        throw new Error(passwordData?.message || passwordData?.error || "Could not change password.");
      }

      const clearResponse = await fetch("/api/auth/clear-must-change-password", {
        method: "POST",
      });
      const clearData = await clearResponse.json().catch(() => null);
      if (!clearResponse.ok) {
        throw new Error(clearData?.error || "Password changed, but account setup could not be completed.");
      }

      window.location.assign("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not change password.");
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted bg-noise px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Set your new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome, {userName}. Replace your temporary password before accessing the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PasswordField
            label="Temporary password"
            value={form.currentPassword}
            onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={form.newPassword}
            onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={form.confirmPassword}
            onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
            autoComplete="new-password"
          />

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {saving ? "Updating password..." : "Update password and continue"}
          </button>
        </form>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="password"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}
