"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { submitContact } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";

type Form = { name: string; email: string; subject: string; message: string };
const EMPTY: Form = { name: "", email: "", subject: "", message: "" };

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("errName");
    if (!form.email.trim()) e.email = t("errEmailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("errEmailInvalid");
    if (!form.message.trim()) e.message = t("errMessage");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setStatus("submitting");
    try {
      await submitContact(form, turnstileToken || undefined);
      setStatus("success");
    } catch {
      // Token is single-use — refresh it for a retry.
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-paper rounded-frame border border-line p-8 md:p-12 text-center">
        <div className="mx-auto mb-6 flex items-center justify-center w-14 h-14 rounded-full border border-gold">
          <Check aria-hidden="true" className="w-6 h-6 text-gold-ink" strokeWidth={1.75} />
        </div>
        <h2 className="t-h2 text-ink mb-3">
          {t("successTitle")}
        </h2>
        <p className="max-w-sm mx-auto mb-8 t-body text-ink-soft">
          {t("successBody", { name: form.name.split(" ")[0] || t("fallbackName"), email: form.email })}
        </p>
        <Link href="/" className="q-btn border border-line-strong text-ink hover:border-ink">{t("backHome")}</Link>
      </div>
    );
  }

  return (
    <div className="q-scope bg-paper rounded-frame border border-line p-6 md:p-10">
      <h2 className="t-h3 text-ink mb-1">
        {t("heading")}
      </h2>
      <p className="t-small text-ink-muted mb-8">{t("subheading")}</p>

      <div className="space-y-5">
        <Field label={t("fullName")} required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("fullNamePlaceholder")} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" aria-invalid={!!errors.name} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={t("email")} required error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder={t("emailPlaceholder")} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" aria-invalid={!!errors.email} />
          </Field>
          <Field label={t("subject")}>
            <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder={t("subjectPlaceholder")} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" />
          </Field>
        </div>
        <Field label={t("message")} required error={errors.message}>
          <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder={t("messagePlaceholder")} className="min-h-36 rounded-edge px-3.5 py-3 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" aria-invalid={!!errors.message} />
        </Field>

        {status === "error" && (
          <p role="alert" className="t-small text-alert-ink">
            {t("errorGeneric")}{" "}
            <a href="mailto:support@vitorra.org" className="underline">support@vitorra.org</a>.
          </p>
        )}

        <Turnstile ref={turnstileRef} action="contact" onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

        <button type="button" onClick={submit} disabled={status === "submitting"} className="q-btn w-full sm:w-auto bg-ink text-paper hover:bg-black disabled:opacity-70">
          {status === "submitting" ? <><Loader2 className="w-4 h-4 animate-spin" />{t("sending")}</> : <>{t("send")}<ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 t-label text-ink-muted">
        {label}
        {required && <span className="text-gold-ink"> *</span>}
      </Label>
      {children}
      {error && <p role="alert" className="mt-2 t-small text-alert-ink">{error}</p>}
    </div>
  );
}
