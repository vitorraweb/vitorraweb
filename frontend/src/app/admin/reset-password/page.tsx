"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ConsoleAuthShell, AuthField, AuthLink, AuthNotice, PasswordInput } from "@/components/admin/ConsoleAuthShell";
import { apiAdmin } from "@/lib/auth";

export default function AdminResetPasswordPage() {
  const [email, setEmail]     = useState("");
  const [token, setToken]     = useState("");
  const [ready, setReady]     = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  // Same pattern as the login page's ?expired=1 handling — read the URL
  // manually rather than useSearchParams, so this stays a plain client
  // component with no Suspense-boundary requirement.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");
    setToken(params.get("token") ?? "");
    setReady(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) { setError("Both fields are required."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setError(""); setLoading(true);
    try {
      await apiAdmin("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, password, password_confirmation: confirm }),
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <ConsoleAuthShell
      title="Choose a new password"
      subtitle={email ? `For ${email}` : undefined}
      footnote={<AuthLink href="/admin/login">Back to sign in</AuthLink>}
    >
      {!email || !token ? (
        <div className="space-y-4">
          <AuthNotice tone="error">This reset link is incomplete. Please request a new one.</AuthNotice>
          <Link href="/admin/forgot-password" className="c-btn c-btn-primary w-full !h-10">Request a new link</Link>
        </div>
      ) : done ? (
        <div className="space-y-4">
          <AuthNotice tone="ok">Your password has been reset. You can sign in with it now.</AuthNotice>
          <Link href="/admin/login" className="c-btn c-btn-primary w-full !h-10">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthField label="New password" hint="At least 12 characters. Avoid a password you use anywhere else.">
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" autoFocus show={show} onToggle={() => setShow((s) => !s)} />
          </AuthField>
          <AuthField label="Confirm new password">
            <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" show={show} onToggle={() => setShow((s) => !s)} />
          </AuthField>
          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          <button type="submit" disabled={loading} className="c-btn c-btn-primary w-full !h-10">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting…</> : "Reset password"}
          </button>
        </form>
      )}
    </ConsoleAuthShell>
  );
}
