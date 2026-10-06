"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save, Check, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { apiCustomer, customerAuth, changeCustomerPassword } from "@/lib/customer-auth";

type Profile = { name: string; email: string; company: string | null; phone: string | null; country: string | null };

const inputCls = "w-full h-12 rounded-frame px-4 text-[15px] bg-paper outline-none border border-black/10 focus:border-ink transition-colors";
const labelCls = "block text-[11px] font-bold uppercase tracking-[0.14em] mb-2";

export default function AccountProfile() {
  const t = useTranslations("account");
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiCustomer<{ data: Profile }>("/account/profile").then((r) => setP(r.data)).catch((e) => setError(e instanceof Error ? e.message : t("failedToLoad")));
  }, [t]);

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
    } catch (e) { setError(e instanceof Error ? e.message : t("saveFailed")); }
    finally { setSaving(false); }
  };

  if (error && !p) return <p className="text-sm text-alert-ink">{error}</p>;
  if (!p) return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  return (
    <div className="max-w-2xl">
      <div className="bg-paper rounded-frame border border-line p-7 md:p-9">
        <h2 className="mb-6 t-h3 text-ink">
          {t("yourDetails")}
        </h2>
        <div className="space-y-5">
          <Field label={t("fullName")}><input value={p.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
          <Field label={t("email")} hint={t("emailHint")}><input value={p.email} disabled className={`${inputCls} cursor-not-allowed bg-paper-deep text-ink-muted`} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("company")}><input value={p.company ?? ""} onChange={(e) => set("company", e.target.value)} placeholder={t("optional")} className={inputCls} /></Field>
            <Field label={t("phone")}><input value={p.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder={t("optional")} className={inputCls} /></Field>
          </div>
          <Field label={t("country")}><input value={p.country ?? ""} onChange={(e) => set("country", e.target.value)} className={inputCls} /></Field>

          {error && <p className="text-sm text-alert-ink">{error}</p>}
          <div className="flex items-center gap-3 pt-3 border-t border-line">
            <button onClick={save} disabled={saving} className="q-btn bg-ink text-paper hover:bg-black disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{t("saveChanges")}
            </button>
            {saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ok-ink"><Check className="w-4 h-4" />{t("saved")}</span>}
          </div>
        </div>
      </div>

      <PasswordCard t={t} />
    </div>
  );
}

function PasswordCard({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setDone(false);
    if (next.length < 8) { setError(t("passwordTooShortNew")); return; }
    if (next !== confirm) { setError(t("passwordMismatch")); return; }
    setSaving(true);
    try {
      await changeCustomerPassword(current, next);
      setDone(true); setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-paper rounded-frame border border-line p-7 md:p-9 mt-6">
      <h2 className="flex items-center gap-2 mb-6 t-h3 text-ink">
        <ShieldCheck className="w-5 h-5 text-gold" />{t("changePassword")}
      </h2>
      <div className="space-y-5">
        <Field label={t("currentPassword")}>
          <PwInput value={current} onChange={setCurrent} show={show} autoComplete="current-password" />
        </Field>
        <Field label={t("newPassword")} hint={t("passwordHint")}>
          <PwInput value={next} onChange={setNext} show={show} autoComplete="new-password" />
        </Field>
        <Field label={t("confirmPassword")}>
          <PwInput value={confirm} onChange={setConfirm} show={show} autoComplete="new-password" />
        </Field>

        <label className="flex items-center gap-2 text-xs cursor-pointer text-ink-muted">
          <input type="checkbox" checked={show} onChange={() => setShow((s) => !s)} className="w-3.5 h-3.5 rounded accent-ink" />
          {t("showPasswords")}
        </label>
        <p className="text-xs text-ink-muted">{t("passwordOtherDevices")}</p>

        {error && <p className="text-sm text-alert-ink">{error}</p>}
        <div className="flex items-center gap-3 pt-3 border-t border-line">
          <button type="submit" disabled={saving || !current || !next || !confirm} className="q-btn bg-ink text-paper hover:bg-black disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}{t("updatePassword")}
          </button>
          {done && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ok-ink"><Check className="w-4 h-4" />{t("passwordChanged")}</span>}
        </div>
      </div>
    </form>
  );
}

function PwInput({ value, onChange, show, autoComplete }: { value: string; onChange: (v: string) => void; show: boolean; autoComplete: string }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="relative">
      <input
        type={show || reveal ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`${inputCls} pr-11`}
      />
      <button type="button" onClick={() => setReveal((r) => !r)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" tabIndex={-1}>
        {show || reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={`${labelCls} text-ink-muted`}>{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
