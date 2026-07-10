"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          <p className="mt-1.5 text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.4)" }}>Reset your password</p>
        </div>

        <div className="bg-white rounded-[24px] p-7 shadow-2xl" style={{ border: "1px solid rgba(197,178,122,0.18)" }}>
          {sent ? (
            <div className="text-center py-2">
              <p className="text-sm leading-relaxed" style={{ color: "#454545" }}>
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. Check your inbox.
              </p>
              <Link href="/admin/login" className="inline-block mt-6 text-sm font-semibold" style={{ color: "#7A6020" }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: "#666666" }}>
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <div>
                <Label className="mb-2" style={{ color: "#1E1E1E" }}>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@vitorra.org" className="h-11 rounded-xl px-3.5 focus-visible:ring-[#C5B27A]/30 focus-visible:border-[#C5B27A]" required autoFocus />
              </div>
              {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : "Send reset link"}
              </button>
              <p className="text-center text-sm">
                <Link href="/admin/login" style={{ color: "#7A6020" }} className="font-semibold">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Vitorra Holdings Limited
        </p>
      </div>
    </div>
  );
}
