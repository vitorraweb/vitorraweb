"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, PhoneCall } from "lucide-react";
import { apiStaff } from "@/lib/staff-auth";

/* The part of the HR record staff keep current themselves: their phone and
   who to call in an emergency. HR sees it in People → Employees. */

type Details = { phone: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; emergency_contact_relation: string | null };
const EMPTY = { phone: "", emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relation: "" };

export function ContactDetailsPanel() {
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiStaff<{ data: Details }>("/staff/me").then(({ data }) => setForm({
      phone: data.phone ?? "", emergency_contact_name: data.emergency_contact_name ?? "",
      emergency_contact_phone: data.emergency_contact_phone ?? "", emergency_contact_relation: data.emergency_contact_relation ?? "",
    })).catch(() => setForm(null));
  }, []);

  if (!form) return null;

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => { setSaved(false); setForm({ ...form, [k]: e.target.value }); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await apiStaff("/staff/profile", { method: "PUT", body: JSON.stringify(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]))) });
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save"); }
    finally { setSaving(false); }
  };

  const input = "w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none focus:border-[#C5B27A]";
  const style = { borderColor: "var(--o-line-strong)", background: "var(--o-surface)", color: "var(--o-text)" };
  const label = (t: string) => <span className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "var(--o-faint)" }}>{t}</span>;

  return (
    <form onSubmit={save} className="bg-white rounded-[20px] border p-6 mt-5" style={{ borderColor: "var(--o-line)" }}>
      <div className="flex items-center gap-2 mb-1">
        <PhoneCall className="w-4 h-4" style={{ color: "#C5B27A" }} />
        <h3 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "var(--o-text)" }}>Contact details</h3>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--o-faint)" }}>Who we should call if something happens to you at work. Only HR can see this.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">{label("Your phone")}<input className={input} style={style} value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" /></label>
        <label className="block">{label("Emergency contact")}<input className={input} style={style} value={form.emergency_contact_name} onChange={set("emergency_contact_name")} placeholder="Full name" /></label>
        <label className="block">{label("Relationship")}<input className={input} style={style} value={form.emergency_contact_relation} onChange={set("emergency_contact_relation")} placeholder="e.g. Spouse, Parent" /></label>
        <label className="block sm:col-span-2">{label("Their phone")}<input className={input} style={style} value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} inputMode="tel" /></label>
      </div>
      {error && <p className="text-sm mt-3" style={{ color: "var(--o-danger)" }}>{error}</p>}
      <div className="flex items-center gap-3 mt-5">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50" style={{ background: "var(--o-brand)", color: "var(--o-on-brand)" }}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save details
        </button>
        {saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--o-success)" }}><Check className="w-4 h-4" />Saved</span>}
      </div>
    </form>
  );
}
