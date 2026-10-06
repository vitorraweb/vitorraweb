"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { registerCustomer } from "@/lib/customer-auth";
import AuthShell from "@/components/account/AuthShell";

const inputCls = "w-full h-12 rounded-edge px-3.5 t-body bg-white text-ink outline-none border border-line-strong focus:border-ink transition-colors";
const labelCls = "block t-label text-ink-muted mb-2";

export default function CustomerRegister() {
  const t = useTranslations("account");
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", company: "", phone: "", country: "Uganda" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8) { setError(t("passwordTooShort")); return; }
    setBusy(true); setError("");
    try { await registerCustomer(f); router.push("/account/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : t("registerFailed")); setBusy(false); }
  };

  return (
    <AuthShell lead={t("registerLead")} accent={t("registerAccent")}>
      <p className="t-label text-ink-muted mb-6">{t("createAccount")}</p>
      <h1 className="t-h1 text-ink">
        {t("registerTitle")}
      </h1>
      <p className="t-body text-ink-muted mt-4 mb-10">{t("registerSub")}</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>{t("fullName")}</label>
          <input required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={t("namePlaceholder")} className={inputCls} autoComplete="name" />
        </div>
        <div>
          <label className={labelCls}>{t("email")}</label>
          <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder={t("emailPlaceholder")} className={inputCls} autoComplete="email" />
        </div>
        <div>
          <label className={labelCls}>{t("password")}</label>
          <input required type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder={t("passwordPlaceholder")} className={inputCls} autoComplete="new-password" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t("company")}</label>
            <input value={f.company} onChange={(e) => set("company", e.target.value)} placeholder={t("optional")} className={inputCls} autoComplete="organization" />
          </div>
          <div>
            <label className={labelCls}>{t("phone")}</label>
            <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t("optional")} className={inputCls} />
          </div>
        </div>
        {error && <p role="alert" className="t-small text-alert-ink">{error}</p>}
        <button type="submit" disabled={busy} className="q-btn w-full bg-ink text-paper hover:bg-black disabled:opacity-70">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" />{t("creating")}</> : <>{t("createAccount")}<ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="t-small text-ink-muted mt-10 pt-8 border-t border-line">
        {t("haveAccount")} <Link href="/account/login" className="q-inline-link font-medium">{t("signIn")}</Link>
      </p>
    </AuthShell>
  );
}
