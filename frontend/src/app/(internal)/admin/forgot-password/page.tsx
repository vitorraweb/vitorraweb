"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ConsoleAuthShell, AuthField, AuthLink, AuthNotice } from "@/components/admin/ConsoleAuthShell";
import { apiAdmin } from "@/lib/auth";

export default function AdminForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Enter your email address."); return; }
    setError(""); setLoading(true);
    try {
      await apiAdmin("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConsoleAuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      footnote={<AuthLink href="/admin/login">Back to sign in</AuthLink>}
    >
      {sent ? (
        <AuthNotice tone="ok">
          If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox, and your spam folder if it hasn&apos;t arrived in a few minutes.
        </AuthNotice>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@vitorra.org" autoComplete="username" required autoFocus className="c-input w-full !h-10" />
          </AuthField>
          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          <button type="submit" disabled={loading} className="c-btn c-btn-primary w-full !h-10">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : "Send reset link"}
          </button>
        </form>
      )}
    </ConsoleAuthShell>
  );
}
