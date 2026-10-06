"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Upload, Check, ArrowLeft, Sparkles } from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { API_BASE_URL as API } from "@/lib/constants";

type Opening = {
  title: string; slug: string; department: string | null; location: string | null;
  employment_type: string; description: string | null; closes_at: string | null;
};
type Extracted = {
  name: string; email: string; phone: string; location: string;
  years_experience: number; skills: string[]; education: string[]; last_role: string;
};

export default function ApplyPage() {
  const t = useTranslations("careersPortal");
  const slug = String(useParams().slug ?? "");
  const [opening, setOpening] = useState<Opening | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [cvToken, setCvToken] = useState<string | null>(null);
  const [cvName, setCvName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const typeLabel = (type: string) =>
    ({ full_time: t("typeFullTime"), part_time: t("typePartTime"), contract: t("typeContract"), internship: t("typeInternship") } as Record<string, string>)[type] ?? type;

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/careers/openings/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOpening(d.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  const onCv = async (file: File | null) => {
    if (!file) return;
    setUploading(true); setError(""); setAutofilled(false);
    try {
      const form = new FormData();
      form.append("cv", file);
      const res = await fetch(`${API}/careers/extract`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const d = (await res.json()) as { cv_token: string; original_name: string; extracted: Extracted | null };
      setCvToken(d.cv_token); setCvName(d.original_name);
      if (d.extracted) {
        if (d.extracted.name) setName(d.extracted.name);
        if (d.extracted.email) setEmail(d.extracted.email);
        if (d.extracted.phone) setPhone(d.extracted.phone);
        if (d.extracted.location) setLocation(d.extracted.location);
        setAutofilled(true);
      }
    } catch {
      setError(t("errCvRead"));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cvToken) { setError(t("errCvFirst")); return; }
    if (!name.trim() || !email.trim()) { setError(t("errNameEmail")); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/careers/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ cv_token: cvToken, slug, name, email, phone, location, cover_note: coverNote, website, turnstile_token: turnstileToken || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: t("errSubmit") }));
        throw new Error(err.message ?? t("errSubmit"));
      }
      setSubmitted(true);
    } catch (err) {
      // Token is single-use — refresh it for a retry.
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setError(err instanceof Error ? err.message : t("errSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Quiet Authority presentation; all logic above is unchanged. ── */
  if (notFound) return (
    <div className="py-20 max-w-[32rem]">
      <p className="t-h2 text-ink">{t("roleClosed")}</p>
      <div className="mt-6"><Link href="/careers" className="q-link t-small text-ink">{t("seeAllRoles")}</Link></div>
    </div>
  );
  if (!opening) return <p className="flex items-center gap-2 t-small text-ink-muted"><Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />{t("loading")}</p>;

  if (submitted) return (
    <div className="max-w-xl py-16">
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold mb-8">
        <Check aria-hidden="true" className="w-6 h-6 text-gold-ink" strokeWidth={1.75} />
      </span>
      <h1 className="t-h1 text-ink">{t("appReceivedTitle")}</h1>
      <p className="t-lead text-ink-soft mt-5">{t("appReceivedBody", { title: opening.title })}</p>
      <div className="mt-8"><Link href="/careers" className="q-link t-small text-ink">{t("backToRoles")}</Link></div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      <div className="lg:col-span-5 lg:sticky lg:top-28">
        <Link href="/careers" className="q-link t-small text-ink-muted">
          <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />{t("allRoles")}
        </Link>
        <h1 className="t-h1 text-ink mt-10">{opening.title}</h1>
        <p className="t-label text-ink-muted mt-6 flex flex-wrap gap-x-4 gap-y-1">
          {opening.department && <span>{opening.department}</span>}
          {opening.location && <span>{opening.location}</span>}
          <span className="text-gold-ink">{typeLabel(opening.employment_type)}</span>
        </p>
        {opening.description && (
          <p className="t-body text-ink-soft mt-8 whitespace-pre-line border-t border-line pt-8">{opening.description}</p>
        )}
      </div>

      <form onSubmit={submit} className="lg:col-span-7 rounded-frame border border-line bg-paper p-6 md:p-10">
        <h2 className="t-h3 text-ink mb-8">{t("applyHeading")}</h2>

        {/* CV upload — read automatically to pre-fill the form */}
        <Field label={t("cvLabel")} hint={t("cvHint")}>
          <label className="flex items-center gap-3 rounded-edge px-4 min-h-14 border border-dashed border-line-strong bg-paper-deep cursor-pointer transition-colors hover:border-ink">
            {uploading ? <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin text-gold-ink" /> : <Upload aria-hidden="true" className="w-5 h-5 text-gold-ink" />}
            <span className={`t-small ${cvName ? "text-ink" : "text-ink-muted"}`}>{uploading ? t("cvReading") : cvName || t("cvChoose")}</span>
            <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => onCv(e.target.files?.[0] ?? null)} />
          </label>
          {autofilled && (
            <p role="status" className="mt-3 inline-flex items-center gap-1.5 t-small text-gold-ink">
              <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />{t("cvAutofilled")}
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
          <Field label={t("fieldName")}><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" /></Field>
          <Field label={t("fieldEmail")}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" /></Field>
          <Field label={t("fieldPhone")}><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} autoComplete="tel" /></Field>
          <Field label={t("fieldLocation")}><input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="mt-5">
          <Field label={t("fieldNote")}>
            <textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={5} className="w-full rounded-edge px-3.5 py-3 t-body border border-line-strong bg-white text-ink outline-none focus:border-ink transition-colors" />
          </Field>
        </div>

        {/* Honeypot — hidden from users */}
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <div className="mt-6">
          <Turnstile ref={turnstileRef} action="careers" onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
        </div>

        {error && <p role="alert" className="t-small text-alert-ink mt-4">{error}</p>}

        <button type="submit" disabled={submitting || uploading} className="q-btn mt-8 w-full bg-ink text-paper hover:bg-black disabled:opacity-60">
          {submitting ? <><Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />{t("submitting")}</> : t("submit")}
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full h-12 rounded-edge px-3.5 t-body border border-line-strong bg-white text-ink outline-none focus:border-ink transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="t-label text-ink-muted block mb-2">{label}</label>
      {children}
      {hint && <p className="mt-2 t-small text-ink-muted">{hint}</p>}
    </div>
  );
}
