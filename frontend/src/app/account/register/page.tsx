"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { registerCustomer } from "@/lib/customer-auth";
import AuthShell from "@/components/account/AuthShell";

const inputCls = "w-full h-12 rounded-2xl px-4 text-[15px] bg-white outline-none border border-black/10 focus:border-[#C5B27A] transition-colors";
const labelCls = "block text-[11px] font-bold uppercase tracking-[0.14em] mb-2";

export default function CustomerRegister() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", company: "", phone: "", country: "Uganda" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true); setError("");
    try { await registerCustomer(f); router.push("/account/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : "Registration failed"); setBusy(false); }
  };

  return (
    <AuthShell lead="Join" accent="Vitorra.">
      <span className="eyebrow mb-4 inline-flex">Create account</span>
      <h1 className="mb-2" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(30px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>
        Let&apos;s get started
      </h1>
      <p className="text-sm mb-8" style={{ color: "#777" }}>Track your orders, enquiries, and documents in one place.</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>Full name</label>
          <input required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>Email</label>
          <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>Password</label>
          <input required type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="8+ characters" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ color: "#8a8a8a" }}>Company</label>
            <input value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="Optional" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#8a8a8a" }}>Phone</label>
            <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" className={inputCls} />
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center" style={{ height: "48px", opacity: busy ? 0.7 : 1 }}>
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : <>Create account<ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-sm mt-8" style={{ color: "#777" }}>
        Already have an account? <Link href="/account/login" className="font-semibold" style={{ color: "#7A6020" }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
