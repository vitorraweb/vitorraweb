"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, MapPin, Briefcase, Upload, Check, ArrowLeft, Sparkles } from "lucide-react";

type Opening = {
  title: string; slug: string; department: string | null; location: string | null;
  employment_type: string; description: string | null; closes_at: string | null;
};
type Extracted = {
  name: string; email: string; phone: string; location: string;
  years_experience: number; skills: string[]; education: string[]; last_role: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship",
};

export default function ApplyPage() {
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
      setError("We couldn't read that file. Please try a PDF, or fill the form manually.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cvToken) { setError("Please upload your CV first."); return; }
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/careers/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ cv_token: cvToken, slug, name, email, phone, location, cover_note: coverNote, website }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Submission failed." }));
        throw new Error(err.message ?? "Submission failed.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-lg font-semibold mb-2" style={{ color: "#1E1E1E" }}>This role is no longer open</p>
      <Link href="/careers" className="text-sm font-semibold" style={{ color: "#7A6020" }}>← See all open roles</Link>
    </div>
  );
  if (!opening) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  if (submitted) return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5" style={{ background: "rgba(34,197,94,0.12)" }}>
        <Check className="w-8 h-8" style={{ color: "#16A34A" }} />
      </div>
      <h1 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#1E1E1E" }}>Application received</h1>
      <p className="text-sm mb-6" style={{ color: "#666" }}>Thank you for applying for <strong>{opening.title}</strong>. Our team will be in touch if there&apos;s a fit.</p>
      <Link href="/careers" className="text-sm font-semibold" style={{ color: "#7A6020" }}>← Back to all roles</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6" style={{ color: "#7A6020" }}>
        <ArrowLeft className="w-4 h-4" />All roles
      </Link>

      <h1 className="mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>{opening.title}</h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-6" style={{ color: "#999" }}>
        {opening.department && <span className="inline-flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{opening.department}</span>}
        {opening.location && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{opening.location}</span>}
        <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(197,178,122,0.16)", color: "#7A6020" }}>{TYPE_LABEL[opening.employment_type] ?? opening.employment_type}</span>
      </div>

      {opening.description && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mb-6">
          <p className="text-sm whitespace-pre-line" style={{ color: "#454545", lineHeight: 1.7 }}>{opening.description}</p>
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-[24px] border border-black/[0.06] p-7">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] mb-5" style={{ color: "#1E1E1E" }}>Apply</h2>

        {/* CV upload */}
        <Field label="Your CV / resume" hint="PDF preferred — we'll read it to save you typing.">
          <label className="flex items-center gap-3 rounded-xl px-4 py-3 border cursor-pointer" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#FAFAF8" }}>
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C5B27A" }} /> : <Upload className="w-5 h-5" style={{ color: "#C5B27A" }} />}
            <span className="text-sm" style={{ color: cvName ? "#1E1E1E" : "#999" }}>{uploading ? "Reading your CV…" : cvName || "Choose a file (PDF, DOC, DOCX)"}</span>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => onCv(e.target.files?.[0] ?? null)} />
          </label>
          {autofilled && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs" style={{ color: "#16A34A" }}>
              <Sparkles className="w-3.5 h-3.5" />We pre-filled your details from your CV — please check them.
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>
        <div className="mt-4">
          <Field label="Anything you'd like us to know? (optional)">
            <textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={4} className="w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:border-[#C5B27A]" style={inputStyle} />
          </Field>
        </div>

        {/* Honeypot — hidden from users */}
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        {error && <p className="text-sm mt-4" style={{ color: "#C0392B" }}>{error}</p>}

        <button type="submit" disabled={submitting || uploading} className="btn-primary mt-6 w-full" style={{ justifyContent: "center", opacity: submitting || uploading ? 0.6 : 1 }}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit application"}
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full h-11 rounded-xl px-3.5 text-sm border outline-none focus:border-[#C5B27A]";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "#999" }}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs" style={{ color: "#aaa" }}>{hint}</p>}
    </div>
  );
}
