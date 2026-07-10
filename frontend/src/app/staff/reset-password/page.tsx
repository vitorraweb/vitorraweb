"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiStaff } from "@/lib/staff-auth";

export default function StaffResetPasswordPage() {
  const [email, setEmail]     = useState("");
  const [token, setToken]     = useState("");
  const [ready, setReady]     = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

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
      await apiStaff("/auth/reset-password", {
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: "#1E1E1E" }}>
      <div className="hero-aurora-right" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "rgba(197,178,122,0.12)", border: "1px solid rgba(197,178,122,0.25)" }}>
            <Image src="/logo.png" alt="Vitorra Holdings" width={40} height={40} />
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
            Vitorra<span style={{ color: "#C5B27A" }}> Team</span>
          </h1>
          <p className="mt-1.5 text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.4)" }}>Choose a new password</p>
        </div>

        <div className="bg-white rounded-[24px] p-7 shadow-2xl" style={{ border: "1px solid rgba(197,178,122,0.18)" }}>
          {!email || !token ? (
            <div className="text-center py-2">
              <p className="text-sm" style={{ color: "#C0392B" }}>This reset link is missing information. Please request a new one.</p>
              <Link href="/staff/forgot-password" className="inline-block mt-6 text-sm font-semibold" style={{ color: "#7A6020" }}>Request a new link</Link>
            </div>
          ) : done ? (
            <div className="text-center py-2">
              <p className="text-sm leading-relaxed" style={{ color: "#454545" }}>Your password has been reset.</p>
              <Link href="/staff/login" className="inline-block mt-6 text-sm font-semibold" style={{ color: "#7A6020" }}>Sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label className="mb-2" style={{ color: "#1E1E1E" }}>New password</Label>
                <div className="relative">
                  <Input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl px-3.5 pr-10 focus-visible:ring-[#C5B27A]/30 focus-visible:border-[#C5B27A]" required autoFocus />
                  <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="mb-2" style={{ color: "#1E1E1E" }}>Confirm new password</Label>
                <Input type={show ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl px-3.5 focus-visible:ring-[#C5B27A]/30 focus-visible:border-[#C5B27A]" required />
              </div>
              <p className="text-xs" style={{ color: "#999999" }}>At least 12 characters.</p>
              {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting…</> : "Reset password"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Vitorra Holdings Limited — internal
        </p>
      </div>
    </div>
  );
}
