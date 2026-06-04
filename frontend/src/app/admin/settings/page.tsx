"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";

type Settings = {
  vat_enabled: boolean; vat_rate: number; vat_notice: string;
  exchange_rate_mode: "live" | "manual"; exchange_rate_manual: number;
  shipping_kampala_ugx: number; shipping_national_ugx: number; shipping_international_note: string;
  notify_email: string; notify_whatsapp: string;
};

const inputCls = "w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

export default function SettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiAdmin<{ data: Settings }>("/admin/settings")
      .then((res) => setForm(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setSaved(false);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      await apiAdmin("/admin/settings", { method: "PUT", body: JSON.stringify(form) });
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  if (error && !form) return <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>;
  if (!form) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="System Settings" subtitle="Operate tax, currency, shipping, and notifications without code changes." />

      <div className="space-y-5">
        {/* Tax */}
        <Section title="Tax — Uganda VAT" note="Dormant until VAT registration completes. Applies to checkout when switched on.">
          <Toggle label="Charge VAT at checkout" value={form.vat_enabled} onChange={(v) => set("vat_enabled", v)} />
          <Row label="VAT rate (%)">
            <input type="number" min={0} max={100} value={form.vat_rate} onChange={(e) => set("vat_rate", Number(e.target.value))} className={inputCls} style={inputStyle} />
          </Row>
          <Row label="Notice shown while unregistered">
            <input value={form.vat_notice} onChange={(e) => set("vat_notice", e.target.value)} className={inputCls} style={inputStyle} />
          </Row>
        </Section>

        {/* Currency */}
        <Section title="Currency & exchange rate" note="Manual overrides the live USD→UGX rate everywhere it's shown.">
          <Row label="Rate source">
            <select value={form.exchange_rate_mode} onChange={(e) => set("exchange_rate_mode", e.target.value as Settings["exchange_rate_mode"])} className={inputCls} style={inputStyle}>
              <option value="live">Live (exchange-rate API)</option>
              <option value="manual">Manual override</option>
            </select>
          </Row>
          <Row label="Manual rate — UGX per 1 USD" hint={form.exchange_rate_mode === "manual" ? "Active now." : "Used when source is set to Manual."}>
            <input type="number" min={1} value={form.exchange_rate_manual} onChange={(e) => set("exchange_rate_manual", Number(e.target.value))} className={inputCls} style={inputStyle} />
          </Row>
        </Section>

        {/* Shipping */}
        <Section title="Shipping (coffee)" note="Used at coffee checkout when the shop goes live.">
          <Row label="Kampala delivery (UGX)">
            <input type="number" min={0} value={form.shipping_kampala_ugx} onChange={(e) => set("shipping_kampala_ugx", Number(e.target.value))} className={inputCls} style={inputStyle} />
          </Row>
          <Row label="Uganda national (UGX)">
            <input type="number" min={0} value={form.shipping_national_ugx} onChange={(e) => set("shipping_national_ugx", Number(e.target.value))} className={inputCls} style={inputStyle} />
          </Row>
          <Row label="International note">
            <input value={form.shipping_international_note} onChange={(e) => set("shipping_international_note", e.target.value)} className={inputCls} style={inputStyle} />
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" note="Where team alerts are sent.">
          <Row label="Team email">
            <input type="email" value={form.notify_email} onChange={(e) => set("notify_email", e.target.value)} className={inputCls} style={inputStyle} />
          </Row>
          <Row label="WhatsApp number" hint="For future order/enquiry alerts.">
            <input value={form.notify_whatsapp} onChange={(e) => set("notify_whatsapp", e.target.value)} placeholder="+256…" className={inputCls} style={inputStyle} />
          </Row>
        </Section>

        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save settings
          </button>
          {saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#16A34A" }}><Check className="w-4 h-4" />Saved</span>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-black/[0.05] p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: "#1E1E1E" }}>{title}</h2>
      {note && <p className="text-xs mb-4" style={{ color: "#999" }}>{note}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] sm:items-center gap-2 sm:gap-4">
      <div>
        <span className="block text-sm font-medium" style={{ color: "#1E1E1E" }}>{label}</span>
        {hint && <span className="block text-xs" style={{ color: "#999" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium" style={{ color: "#1E1E1E" }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
        style={{ background: value ? "#C5B27A" : "#D8D8D8" }}
      >
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: value ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}
