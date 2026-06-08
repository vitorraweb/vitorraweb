"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { registerCustomer } from "@/lib/customer-auth";
import AuthShell from "@/components/account/AuthShell";

const inputCls = "w-full h-12 rounded-2xl px-4 text-[15px] bg-white outline-none border border-black/10 focus:border-[#C5B27A] transition-colors";
const labelCls = "block text-[11px] font-bold uppercase tracking-[0.14em] mb-2";

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
      <span className="eyebrow mb-4 inline-flex">{t("createAccount")}</span>
      <h1 className="mb-2" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(30px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>
        {t("registerTitle")}
      </h1>
      <p className="text-sm mb-8" style={{ color: "#777" }}>{t("registerSub")}</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>{t("fullName")}</label>
          <input required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={t("namePlaceholder")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>{t("email")}</label>
          <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder={t("emailPlaceholder")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} style={{ color: "#8a8a8a" }}>{t("password")}</label>
          <input required type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder={t("passwordPlaceholder")} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ color: "#8a8a8a" }}>{t("company")}</label>
            <input value={f.company} onChange={(e) => set("company", e.target.value)} placeholder={t("optional")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#8a8a8a" }}>{t("phone")}</label>
            <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t("optional")} className={inputCls} />
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center" style={{ height: "48px", opacity: busy ? 0.7 : 1 }}>
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" />{t("creating")}</> : <>{t("createAccount")}<ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-sm mt-8" style={{ color: "#777" }}>
        {t("haveAccount")} <Link href="/account/login" className="font-semibold" style={{ color: "#7A6020" }}>{t("signIn")}</Link>
      </p>
    </AuthShell>
  );
}
