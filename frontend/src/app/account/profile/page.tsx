"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { apiCustomer, customerAuth } from "@/lib/customer-auth";

type Profile = { name: string; email: string; company: string | null; phone: string | null; country: string | null };

const inputCls = "w-full h-12 rounded-2xl px-4 text-[15px] bg-white outline-none border border-black/10 focus:border-[#C5B27A] transition-colors";
const labelCls = "block text-[11px] font-bold uppercase tracking-[0.14em] mb-2";

export default function AccountProfile() {
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiCustomer<{ data: Profile }>("/account/profile").then((r) => setP(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const set = (k: keyof Profile, v: string) => { setP((x) => (x ? { ...x, [k]: v } : x)); setSaved(false); };

  const save = async () => {
    if (!p) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await apiCustomer<{ data: Profile & { id: number; role: string } }>("/account/profile", {
        method: "PUT",
        body: JSON.stringify({ name: p.name, company: p.company, phone: p.phone, country: p.country }),
      });
      const u = customerAuth.getUser();
      if (u) customerAuth.save(customerAuth.getToken() ?? "", { ...u, name: res.data.name });
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  if (error && !p) return <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>;
  if (!p) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-[28px] border border-black/[0.05] shadow-card p-7 md:p-9">
        <h2 className="mb-6" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>
          Your details
        </h2>
        <div className="space-y-5">
          <Field label="Full name"><input value={p.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
          <Field label="Email" hint="Contact us to change your email address."><input value={p.email} disabled className={`${inputCls} cursor-not-allowed`} style={{ background: "#F2F2F2", color: "#999" }} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company"><input value={p.company ?? ""} onChange={(e) => set("company", e.target.value)} placeholder="Optional" className={inputCls} /></Field>
            <Field label="Phone"><input value={p.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" className={inputCls} /></Field>
          </div>
          <Field label="Country"><input value={p.country ?? ""} onChange={(e) => set("country", e.target.value)} className={inputCls} /></Field>

          {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
          <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ height: "46px", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save changes
            </button>
            {saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#16A34A" }}><Check className="w-4 h-4" />Saved</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls} style={{ color: "#8a8a8a" }}>{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs" style={{ color: "#999" }}>{hint}</p>}
    </div>
  );
}
