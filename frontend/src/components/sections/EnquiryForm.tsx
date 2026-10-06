"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Fuel, HeartPulse, Coffee, Truck, MessageCircle, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EnquiryFormData, ProductCategory } from "@/types";
import { submitEnquiry } from "@/lib/api";
import {
  getEnquirySchemas,
  visibleFields,
  validateAnswers,
  buildRequirements,
  type UiCategory,
  type Answers,
  type FieldDef,
} from "@/lib/enquiry-schema";

/* ─── Enquiry / quote form ────────────────────────────────────────────────────
   Premium 3-step form (Interest → Details → Contact). Step 2 is product-aware:
   it renders the question set declared for the chosen product in
   `lib/enquiry-schema.ts`, so the team receives a complete, structured brief.
   Builds an EnquiryFormData payload and posts it via `submitEnquiry`.
   ─────────────────────────────────────────────────────────────────────────── */

const CATEGORY_META: { value: UiCategory; labelKey: string; descKey: string; icon: typeof Fuel }[] = [
  { value: "FET", labelKey: "catFetLabel", descKey: "catFetDesc", icon: Fuel },
  { value: "SEAL", labelKey: "catSealLabel", descKey: "catSealDesc", icon: HeartPulse },
  { value: "COFFEE", labelKey: "catCoffeeLabel", descKey: "catCoffeeDesc", icon: Coffee },
  { value: "LOGISTICS", labelKey: "catLogisticsLabel", descKey: "catLogisticsDesc", icon: Truck },
  { value: "GENERAL", labelKey: "catGeneralLabel", descKey: "catGeneralDesc", icon: MessageCircle },
];

type Fields = Omit<EnquiryFormData, "product_category">;
const EMPTY: Fields = { name: "", email: "", company: "", phone: "", country: "Uganda", message: "" };

/* Prefill comes in as props from the server page (which reads the query string),
   so initial state is set directly — no mount effect, no hydration mismatch.
   `initialSector` selects a category and skips to step 2; `initialMessage` (from
   the FET calculator / pricing cards) seeds the request text. */
export default function EnquiryForm({
  initialSector = "",
  initialMessage = "",
  initialAnswers = {},
}: {
  initialSector?: string;
  initialMessage?: string;
  /** Pre-filled schema answers (e.g. vehicle_type / fleet_size from the FET calculator). */
  initialAnswers?: Answers;
}) {
  const t = useTranslations("enquiryForm");
  const te = useTranslations("enquiry");
  const tt = useTranslations("fetTiers");
  const schemas = getEnquirySchemas(te, tt);
  const CATEGORIES = CATEGORY_META.map((c) => ({ ...c, label: t(c.labelKey), desc: t(c.descKey) }));
  const STEPS = [t("stepInterest"), t("stepDetails"), t("stepContact")];

  const prefillCategory =
    initialSector && CATEGORY_META.some((c) => c.value === initialSector)
      ? (initialSector as UiCategory)
      : null;

  const [step, setStep] = useState(prefillCategory ? 1 : 0);
  const [category, setCategory] = useState<UiCategory | null>(prefillCategory);
  const [form, setForm] = useState<Fields>(
    initialMessage ? { ...EMPTY, message: initialMessage } : EMPTY
  );
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const set = (k: keyof Fields, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const setAnswer = (id: string, v: string | string[]) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    if (errors[id]) setErrors((e) => ({ ...e, [id]: "" }));
  };

  // Product-specific question set for the chosen category (empty for General).
  const categoryFields = category ? (schemas[category] ?? []) : [];
  const fields = visibleFields(categoryFields, answers);
  const hasSchema = fields.length > 0;

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0 && !category) e.category = t("errChoose");
    if (s === 1) {
      Object.assign(e, validateAnswers(categoryFields, answers, t("errFieldRequired")));
      if (!form.country.trim()) e.country = t("errCountry");
      // With a question set, the message is optional context; without one
      // (General enquiry), it's the only way to capture the need.
      if (!hasSchema && !form.message.trim()) e.message = t("errTellUs");
    }
    if (s === 2) {
      if (!form.name.trim()) e.name = t("errName");
      if (!form.email.trim()) e.email = t("errEmailRequired");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("errEmailInvalid");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate(step) && setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (!validate(2)) return;
    setStatus("submitting");
    const requirements = buildRequirements(categoryFields, answers);
    const payload: EnquiryFormData = {
      ...form,
      product_category: category === "GENERAL" ? "" : (category as ProductCategory),
      ...(requirements.length ? { requirements } : {}),
    };
    try {
      await submitEnquiry(payload, turnstileToken || undefined);
      setStatus("success");
    } catch {
      // Token is single-use — refresh it for a retry.
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setStatus("error");
    }
  };

  /* ── Success state ──────────────────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className="bg-paper rounded-frame border border-line p-8 md:p-12 text-center">
        <div className="mx-auto mb-6 flex items-center justify-center w-14 h-14 rounded-full border border-gold">
          <Check aria-hidden="true" className="w-6 h-6 text-gold-ink" strokeWidth={1.75} />
        </div>
        <h2 className="t-h2 text-ink mb-3">
          {t("successTitle")}
        </h2>
        <p className="max-w-sm mx-auto mb-6 t-body text-ink-soft">
          {t("successBody", { name: form.name.split(" ")[0] || t("fallbackName"), email: form.email })}
        </p>
        <p className="max-w-sm mx-auto mb-7 t-small text-ink-muted">
          {t("successTrack")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="q-btn border border-line-strong text-ink hover:border-ink">{t("backHome")}</Link>
          <Link href="/account/register" className="q-btn bg-ink text-paper hover:bg-black">{t("createAccount")}<ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    );
  }

  /* ── Form ───────────────────────────────────────────────────────────────── */
  return (
    <div className="q-scope bg-paper rounded-frame border border-line p-6 md:p-10">
      {/* Stepper — numbered like the rest of the site, gold rule fills as you go */}
      <ol className="flex items-center mb-10" aria-label={t("stepInterest")}>
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <span className="flex items-baseline gap-2.5 shrink-0">
                <span className={cn("t-label font-numeric", done || current ? "text-gold-ink" : "text-ink-muted")}>
                  {done ? <Check aria-hidden="true" className="inline w-3.5 h-3.5 -mt-0.5" strokeWidth={2} /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className={cn("hidden sm:block t-small", current ? "text-ink" : "text-ink-muted")}>{label}</span>
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="flex-1 h-px mx-4 bg-line">
                  <span className="block h-full bg-gold origin-left transition-transform duration-500 ease-quiet" style={{ transform: done ? "scaleX(1)" : "scaleX(0)" }} />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Step content */}
      <div key={step} className="hero-enter">
        {step === 0 && (
          <div>
            <h3 className="t-h3 text-ink mb-1">
              {t("step0Heading")}
            </h3>
            <p className="t-small text-ink-muted mb-6">{t("step0Sub")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((c) => {
                const selected = category === c.value;
                const Icon = c.icon;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => { setCategory(c.value); setErrors((e) => ({ ...e, category: "" })); }}
                    aria-pressed={selected}
                    className={cn("flex items-center gap-4 text-left p-5 rounded-edge border transition-colors", selected ? "border-ink bg-paper-deep" : "border-line-strong bg-paper hover:border-ink")}
                  >
                    <span className="flex items-center justify-center w-10 h-10 shrink-0 text-gold-ink">
                      <Icon aria-hidden="true" className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <span>
                      <span className="block font-display text-[1.125rem] leading-tight text-ink">{c.label}</span>
                      <span className="block t-small text-ink-muted mt-0.5">{c.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p role="alert" className="mt-3 t-small text-alert-ink">{errors.category}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h3 className="t-h3 text-ink mb-1">
              {t("step1Heading")}
            </h3>
            {hasSchema && (
              <p className="t-small text-ink-muted">
                {t("step1Sub")}
              </p>
            )}

            {/* Product-specific question set (declared in lib/enquiry-schema). */}
            {fields.map((f) => (
              <DynamicField
                key={f.id}
                field={f}
                value={answers[f.id]}
                error={errors[f.id]}
                help={f.dynamicHelp?.(answers) ?? f.help}
                onChange={(v) => setAnswer(f.id, v)}
              />
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={t("companyLabel")}>
                <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder={t("optional")} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" />
              </Field>
              <Field label={t("countryLabel")} required error={errors.country}>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" aria-invalid={!!errors.country} />
              </Field>
            </div>

            <Field
              label={hasSchema ? t("anythingElse") : t("whatNeed")}
              required={!hasSchema}
              error={errors.message}
            >
              <Textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder={hasSchema ? t("msgPlaceholderSchema") : t("msgPlaceholderGeneral")}
                className="min-h-28 rounded-edge px-3.5 py-3 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0"
                aria-invalid={!!errors.message}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="t-h3 text-ink mb-1">
              {t("step2Heading")}
            </h3>
            <Field label={t("fullName")} required error={errors.name}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("namePlaceholder")} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" aria-invalid={!!errors.name} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={t("email")} required error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder={t("emailPlaceholder")} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" aria-invalid={!!errors.email} />
              </Field>
              <Field label={t("phone")}>
                <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t("optional")} className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0" />
              </Field>
            </div>
            <Turnstile ref={turnstileRef} action="enquiry" onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
            {status === "error" && (
              <p role="alert" className="t-small text-alert-ink">{t("errorGeneric")} {""}
                <a href="mailto:support@vitorra.org" className="underline">support@vitorra.org</a>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-line">
        {step > 0 ? (
          <button type="button" onClick={back} className="q-btn border border-line-strong text-ink hover:border-ink"><ArrowLeft className="w-4 h-4" />{t("back")}</button>
        ) : <span />}

        {step < 2 ? (
          <button type="button" onClick={next} className="q-btn bg-ink text-paper hover:bg-black">{t("continue")}<ArrowRight className="w-4 h-4" /></button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={status === "submitting"} className="q-btn bg-ink text-paper hover:bg-black disabled:opacity-70">
            {status === "submitting" ? <><Loader2 className="w-4 h-4 animate-spin" />{t("sending")}</> : <>{t("submit")}<ArrowRight className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────────────────── */

function Field({ label, required, error, help, children }: { label: string; required?: boolean; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 t-label text-ink-muted">
        {label}
        {required && <span className="text-gold-ink"> *</span>}
      </Label>
      {children}
      {help && !error && <p className="mt-2 t-small text-gold-ink">{help}</p>}
      {error && <p role="alert" className="mt-2 t-small text-alert-ink">{error}</p>}
    </div>
  );
}

/* ─── Schema-driven field renderer ─────────────────────────────────────────────
   Renders one field from the enquiry schema by type. Single/multi are pill
   choices; number/text are inputs. Pure presentation — all state lives in the
   parent's `answers`.                                                          */

function DynamicField({
  field,
  value,
  error,
  help,
  onChange,
}: {
  field: FieldDef;
  value: string | string[] | undefined;
  error?: string;
  help?: string | null;
  onChange: (v: string | string[]) => void;
}) {
  return (
    <Field label={field.label} required={field.required} error={error} help={help ?? undefined}>
      {(field.type === "single" || field.type === "multi") && field.options && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const selected =
              field.type === "multi"
                ? Array.isArray(value) && value.includes(opt.value)
                : value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (field.type === "multi") {
                    const cur = Array.isArray(value) ? value : [];
                    onChange(selected ? cur.filter((v) => v !== opt.value) : [...cur, opt.value]);
                  } else {
                    onChange(opt.value);
                  }
                }}
                className={cn("inline-flex items-center gap-1.5 px-3.5 min-h-10 rounded-edge border text-sm transition-colors", selected ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper text-ink-soft hover:border-ink")}
              >
                {field.type === "multi" && selected && <Check aria-hidden="true" className="w-3.5 h-3.5" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "number" && (
        <div className="relative">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0"
            style={field.unit ? { paddingRight: "5.5rem" } : undefined}
            aria-invalid={!!error}
          />
          {field.unit && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 t-small text-ink-muted">
              {field.unit}
            </span>
          )}
        </div>
      )}

      {field.type === "text" && (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-12 rounded-edge px-3.5 border-line-strong bg-white focus-visible:border-ink focus-visible:ring-0"
          aria-invalid={!!error}
        />
      )}
    </Field>
  );
}
