"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { loginCustomer } from "@/lib/customer-auth";
import AuthShell from "@/components/account/AuthShell";

const inputCls = "w-full h-12 rounded-2xl px-4 text-[15px] bg-white outline-none border border-black/10 focus:border-[#C5B27A] transition-colors";
const labelCls = "block text-[11px] font-bold uppercase tracking-[0.14em] mb-2";

export default function CustomerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await loginCustomer(email, password); router.push("/account/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : "Login failed"); setBusy(false); }
  };

  return (
    <AuthShell lead="Welcome" accent="back.">
      <span className="eyebrow mb-4 inline-flex">Sign in</span>
      <h1 className="mb-2" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(30px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>
        Your account
      </h1>
      <p className="text-sm mb-8" style={{ color: "#777" }}>Access your orders, enquiries, and documents.</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
        </div>
        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center" style={{ height: "48px", opacity: busy ? 0.7 : 1 }}>
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : <>Sign in<ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-sm mt-8" style={{ color: "#777" }}>
        New to Vitorra? <Link href="/account/register" className="font-semibold" style={{ color: "#7A6020" }}>Create an account</Link>
      </p>
    </AuthShell>
  );
}
