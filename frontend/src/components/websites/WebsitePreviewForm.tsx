"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { requestWebsitePreview } from "@/lib/api";
import { isValidPhone } from "@/lib/phone";
import { CONTACT_PHONE } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";

/* The free-preview request on /websites. Phone is required: the service runs
   on WhatsApp. Lands in Enquiries as a WEB lead (WebsitePreviewController). */

export const BUSINESS_TYPES = ["shop", "salon", "restaurant", "hardware", "hotel", "school", "clinic", "services", "farm", "other"] as const;

const WA = CONTACT_PHONE.replace(/[^0-9]/g, "");

export function WebsitePreviewForm({ id = "preview" }: { id?: string }) {
  const t = useTranslations("websites.form");
  const [form, setForm] = useState({ name: "", business: "", phone: "", email: "", business_type: "", online_link: "", sells: "", add_ads: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [token, setToken] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t("errName");
    if (!form.business.trim()) errs.business = t("errBusiness");
    if (!isValidPhone(form.phone)) errs.phone = t("errPhone");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = t("errEmail");
    if (!form.business_type) errs.business_type = t("errType");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState("sending");
    try {
      await requestWebsitePreview({
        name: form.name.trim(), business: form.business.trim(), phone: form.phone.trim(), email: form.email.trim(),
        business_type: form.business_type, online_link: form.online_link.trim() || undefined,
        sells: form.sells.trim() || undefined, add_ads: form.add_ads,
      }, token || undefined);
      setState("done");
    } catch {
      setState("error");
      turnstile.current?.reset();
      setToken("");
    }
  };

  const inputCls = "mt-1.5 h-12 rounded-[2px] px-3 text-[14px] bg-white border-line-strong shadow-none focus-visible:ring-0 focus-visible:border-ink";
  const selectCls = "mt-1.5 w-full h-12 rounded-[2px] px-3 text-[14px] bg-white border border-line-strong text-ink outline-none focus:border-ink";
  const err = (k: string) => errors[k] && <p id={`${id}-${k}-err`} role="alert" className="mt-1 t-small text-alert-ink">{errors[k]}</p>;

  if (state === "done") {
    const text = encodeURIComponent(t("waFollowUp", { business: form.business.trim() }));
    return (
      <div role="status" className="bg-paper border border-line p-6 sm:p-8">
        <p className="t-label text-gold-ink">{t("doneLabel")}</p>
        <p className="t-h3 text-ink mt-3">{t("doneTitle", { name: form.name.trim().split(" ")[0] })}</p>
        <p className="t-body text-ink-soft mt-3">{t("doneBody")}</p>
        <a href={`https://wa.me/${WA}?text=${text}`} target="_blank" rel="noopener noreferrer" className="q-btn bg-ink text-paper hover:bg-black mt-6">
          <WhatsAppIcon className="h-4 w-4" />{t("doneCta")}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="bg-paper border border-line p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor={`${id}-name`}>{t("name")}</Label>
        <Input id={`${id}-name`} autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-err` : undefined} className={inputCls} />
        {err("name")}
      </div>
      <div>
        <Label htmlFor={`${id}-business`}>{t("business")}</Label>
        <Input id={`${id}-business`} autoComplete="organization" value={form.business} onChange={(e) => set("business", e.target.value)} aria-invalid={!!errors.business} aria-describedby={errors.business ? `${id}-business-err` : undefined} className={inputCls} />
        {err("business")}
      </div>
      <div>
        <Label htmlFor={`${id}-phone`}>{t("phone")}</Label>
        <Input id={`${id}-phone`} type="tel" autoComplete="tel" inputMode="tel" placeholder="07XX XXX XXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${id}-phone-err` : undefined} className={inputCls} />
        {err("phone")}
      </div>
      <div>
        <Label htmlFor={`${id}-email`}>{t("email")}</Label>
        <Input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-err` : undefined} className={inputCls} />
        {err("email")}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${id}-type`}>{t("type")}</Label>
        <select id={`${id}-type`} value={form.business_type} onChange={(e) => set("business_type", e.target.value)} aria-invalid={!!errors.business_type} aria-describedby={errors.business_type ? `${id}-business_type-err` : undefined} className={selectCls}>
          <option value="">{t("choose")}</option>
          {BUSINESS_TYPES.map((b) => <option key={b} value={b}>{t(`types.${b}`)}</option>)}
        </select>
        {err("business_type")}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${id}-link`}>{t("link")}</Label>
        <Input id={`${id}-link`} placeholder={t("linkPh")} value={form.online_link} onChange={(e) => set("online_link", e.target.value)} className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${id}-sells`}>{t("sells")}</Label>
        <textarea id={`${id}-sells`} rows={3} placeholder={t("sellsPh")} value={form.sells} onChange={(e) => set("sells", e.target.value)} className="mt-1.5 w-full rounded-[2px] px-3 py-2.5 text-[14px] bg-white border border-line-strong text-ink outline-none focus:border-ink" />
      </div>
      <label className="sm:col-span-2 flex items-start gap-3 t-small text-ink cursor-pointer">
        <input type="checkbox" checked={form.add_ads} onChange={(e) => set("add_ads", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-ink)]" />
        <span>{t("ads")}</span>
      </label>
      <div className="sm:col-span-2">
        <Turnstile ref={turnstile} action="website_preview" onVerify={setToken} onExpire={() => setToken("")} />
        <button type="submit" disabled={state === "sending"} className="q-btn w-full justify-center bg-ink text-paper hover:bg-black disabled:opacity-60">
          {state === "sending" && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {state === "sending" ? t("sending") : t("submit")}
        </button>
        {state === "error" && <p role="alert" className="mt-3 t-small text-alert-ink">{t("error")}</p>}
        <p className="mt-3 t-small text-ink-muted">{t("privacy")}</p>
      </div>
    </form>
  );
}
