"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { loginCustomer } from "@/lib/customer-auth";
import AuthShell from "@/components/account/AuthShell";

const inputCls = "w-full h-12 rounded-edge px-3.5 t-body bg-white text-ink outline-none border border-line-strong focus:border-ink transition-colors";
const labelCls = "block t-label text-ink-muted mb-2";

export default function CustomerLogin() {
  const t = useTranslations("account");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await loginCustomer(email, password); router.push("/account/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : t("loginFailed")); setBusy(false); }
  };

  return (
    <AuthShell lead={t("loginLead")} accent={t("loginAccent")}>
      <p className="t-label text-ink-muted mb-6">{t("signIn")}</p>
      <h1 className="t-h1 text-ink">
        {t("loginTitle")}
      </h1>
      <p className="t-body text-ink-muted mt-4 mb-10">{t("loginSub")}</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>{t("email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} className={inputCls} autoComplete="email" />
        </div>
        <div>
          <label className={labelCls}>{t("password")}</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className={inputCls} />
        </div>
        {error && <p role="alert" className="t-small text-alert-ink">{error}</p>}
        <button type="submit" disabled={busy} className="q-btn w-full bg-ink text-paper hover:bg-black disabled:opacity-70">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" />{t("signingIn")}</> : <>{t("signIn")}<ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="t-small text-ink-muted mt-10 pt-8 border-t border-line">
        {t("newToVitorra")} <Link href="/account/register" className="q-inline-link font-medium">{t("createAccountLink")}</Link>
      </p>
    </AuthShell>
  );
}
