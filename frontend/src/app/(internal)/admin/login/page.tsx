"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ConsoleAuthShell, AuthField, AuthLink, AuthNotice, PasswordInput } from "@/components/admin/ConsoleAuthShell";
import { auth, apiAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/http";
import { API_BASE_URL } from "@/lib/constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false); // second step: code entry
  const [code, setCode]       = useState("");

  // Surface "your session expired" when bounced here after a timeout.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired") === "1") setExpired(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Both fields are required."); return; }
    if (twoFactor && !code) { setError("Enter your authentication code."); return; }
    setError(""); setExpired(false); setLoading(true);
    try {
      const res = await apiAdmin<{ data: { two_factor_required?: boolean; token: string | null; expires_at: string | null; user: { id: number; name: string; email: string; role: string } } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password, code: code || undefined, scope: "admin" }) }
      );
      // Password was right but this account needs a second factor.
      if (res.data.two_factor_required) {
        setTwoFactor(true);
        setLoading(false);
        return;
      }
      const role = res.data.user.role?.toLowerCase();
      if (role !== "admin" && role !== "ops") {
        // Revoke the session/token we just issued — no admin-panel access.
        authFetch(API_BASE_URL, "/auth/logout", res.data.token, { method: "POST" }).catch(() => { /* best-effort */ });
        setError("This account doesn't have admin panel access.");
        return;
      }
      auth.save(res.data.token, res.data.user, res.data.expires_at);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConsoleAuthShell
      title={twoFactor ? "Two-step verification" : "Sign in"}
      subtitle={twoFactor ? "Enter the code from your authenticator app." : "Use your Vitorra staff account to open the console."}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {expired && <AuthNotice>Your session expired for security. Please sign in again.</AuthNotice>}
        {!twoFactor ? (
          <>
            <AuthField label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@vitorra.org" autoComplete="username" autoFocus required className="c-input w-full !h-10" />
            </AuthField>
            <AuthField label="Password" aside={<AuthLink href="/admin/forgot-password">Forgot password?</AuthLink>}>
              <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
            </AuthField>
          </>
        ) : (
          <>
            <p className="text-[12.5px] text-ink-muted">Signing in as <b className="text-ink">{email}</b>.</p>
            <AuthField label="Authentication code" hint="Lost your device? Enter one of your recovery codes instead.">
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
                value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="c-input w-full !h-10 tracking-[0.3em] text-[15px]"
              />
            </AuthField>
          </>
        )}
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <button type="submit" disabled={loading} className="c-btn c-btn-primary w-full !h-10">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : twoFactor ? "Verify and sign in" : "Sign in"}
        </button>
        {twoFactor && (
          <button type="button" onClick={() => { setTwoFactor(false); setCode(""); setError(""); }} className="c-btn c-btn-ghost w-full text-ink-muted">
            Use a different account
          </button>
        )}
      </form>
    </ConsoleAuthShell>
  );
}
