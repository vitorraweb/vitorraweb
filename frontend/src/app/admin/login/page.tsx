"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, apiAdmin } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]       = useState(false);
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
      const res = await apiAdmin<{ data: { two_factor_required?: boolean; token: string; expires_at: string | null; user: { id: number; name: string; email: string; role: string } } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password, code: code || undefined }) }
      );
      // Password was right but this account needs a second factor.
      if (res.data.two_factor_required) {
        setTwoFactor(true);
        setLoading(false);
        return;
      }
      const role = res.data.user.role?.toLowerCase();
      if (role !== "admin" && role !== "ops") {
        // Revoke the token we just issued — this account has no admin-panel access.
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
        fetch(`${base}/auth/logout`, {
          method: "POST",
          headers: { Accept: "application/json", Authorization: `Bearer ${res.data.token}` },
        }).catch(() => { /* best-effort */ });
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: "#1E1E1E" }}>
      <div className="hero-aurora-right" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "rgba(197,178,122,0.12)", border: "1px solid rgba(197,178,122,0.25)" }}>
            <Image src="/logo.png" alt="Vitorra Holdings" width={40} height={40} />
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
            Vitorra<span style={{ color: "#C5B27A" }}> Admin</span>
          </h1>
          <p className="mt-1.5 text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.4)" }}>Internal use only</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-2xl space-y-5" style={{ border: "1px solid rgba(197,178,122,0.18)" }}>
          {expired && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(197,178,122,0.12)", color: "#7A6020", border: "1px solid rgba(197,178,122,0.3)" }}>
              Your session expired for security. Please sign in again.
            </div>
          )}
          <div>
            <Label className="mb-2" style={{ color: "#1E1E1E" }}>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@vitorra.org" className="h-11 rounded-xl px-3.5 focus-visible:ring-[#C5B27A]/30 focus-visible:border-[#C5B27A]" required />
          </div>
          <div>
            <Label className="mb-2" style={{ color: "#1E1E1E" }}>Password</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl px-3.5 pr-10 focus-visible:ring-[#C5B27A]/30 focus-visible:border-[#C5B27A]" required />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {twoFactor && (
            <div>
              <Label className="mb-2" style={{ color: "#1E1E1E" }}>Authentication code</Label>
              <Input
                type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
                value={code} onChange={e => setCode(e.target.value)}
                placeholder="6-digit code or recovery code"
                className="h-11 rounded-xl px-3.5 tracking-widest focus-visible:ring-[#C5B27A]/30 focus-visible:border-[#C5B27A]"
              />
              <p className="mt-2 text-xs" style={{ color: "#999" }}>Open your authenticator app and enter the current code. Lost your device? Use a recovery code.</p>
            </div>
          )}
          {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : twoFactor ? "Verify & sign in" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Vitorra Holdings Limited
        </p>
      </div>
    </div>
  );
}
