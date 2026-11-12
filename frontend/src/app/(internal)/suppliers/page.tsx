"use client";

import { useRef, useState } from "react";
import { Loader2, Check, Upload, Building2, Landmark } from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { API_BASE_URL as API } from "@/lib/constants";

export default function SupplierOnboardPage() {
  const [f, setF] = useState({
    company_name: "", contact_name: "", email: "", phone: "", country: "Uganda", address: "",
    category: "", description: "",
    bank_name: "", bank_account_name: "", bank_account_number: "", bank_branch: "", bank_swift: "",
    website: "", // honeypot
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.company_name.trim() || !f.email.trim()) { setError("Company name and email are required."); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(f).forEach(([k, v]) => form.append(k, v));
      if (files) Array.from(files).slice(0, 6).forEach((file) => form.append("documents[]", file));
      if (turnstileToken) form.append("turnstile_token", turnstileToken);
      const res = await fetch(`${API}/suppliers/onboard`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Submission failed." }));
        throw new Error(err.message ?? "Submission failed.");
      }
      setSubmitted(true);
    } catch (err) {
      // Token is single-use — refresh it for a retry.
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-8 border border-gold">
        <Check aria-hidden="true" className="w-6 h-6 text-gold-ink" strokeWidth={1.75} />
      </div>
      <h1 className="t-h1 text-ink mb-4">Details submitted</h1>
      <p className="t-lead text-ink-soft">Thank you. Our operations team will review your application and be in touch.</p>
    </div>
  );

  return (
    <div>
      <p className="t-label text-ink-muted mb-8 q-rise">Supplier registration</p>
      <h1 className="t-h1 text-ink max-w-[40rem] q-rise">
        Become a Vitorra supplier
      </h1>
      <p className="t-lead text-ink-soft max-w-[38rem] mt-6 mb-14 q-rise">
        Tell us about your company, share your documents and bank details, and our team will review your application.
      </p>

      <form onSubmit={submit} className="space-y-5">
        {/* Company */}
        <Section icon={Building2} title="Company details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company name *"><input value={f.company_name} onChange={(e) => set("company_name", e.target.value)} className={cls} /></Field>
            <Field label="Contact person"><input value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={cls} /></Field>
            <Field label="Email *"><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={cls} /></Field>
            <Field label="Phone"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={cls} /></Field>
            <Field label="Country"><input value={f.country} onChange={(e) => set("country", e.target.value)} className={cls} /></Field>
            <Field label="What do you supply?"><input value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Packaging, logistics, raw materials" className={cls} /></Field>
          </div>
          <div className="mt-4"><Field label="Address"><input value={f.address} onChange={(e) => set("address", e.target.value)} className={cls} /></Field></div>
          <div className="mt-4"><Field label="About your company (optional)"><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-edge px-3.5 py-3 t-body border border-line-strong bg-white text-ink outline-none focus:border-ink" /></Field></div>
        </Section>

        {/* Bank */}
        <Section icon={Landmark} title="Bank details" note="Stored securely (encrypted) and only seen by our finance team.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bank name"><input value={f.bank_name} onChange={(e) => set("bank_name", e.target.value)} className={cls} /></Field>
            <Field label="Account name"><input value={f.bank_account_name} onChange={(e) => set("bank_account_name", e.target.value)} className={cls} /></Field>
            <Field label="Account number"><input value={f.bank_account_number} onChange={(e) => set("bank_account_number", e.target.value)} className={cls} /></Field>
            <Field label="Branch"><input value={f.bank_branch} onChange={(e) => set("bank_branch", e.target.value)} className={cls} /></Field>
            <Field label="SWIFT / BIC (international)"><input value={f.bank_swift} onChange={(e) => set("bank_swift", e.target.value)} className={cls} /></Field>
          </div>
        </Section>

        {/* Documents */}
        <Section icon={Upload} title="Documents" note="Registration certificate, contract, tax documents — up to 6 files (PDF, DOC, images).">
          <label className="flex items-center gap-3 rounded-edge px-4 min-h-14 border border-dashed border-line-strong bg-paper-deep cursor-pointer transition-colors hover:border-ink">
            <Upload aria-hidden="true" className="w-5 h-5 text-gold-ink" />
            <span className={`t-small ${files?.length ? "text-ink" : "text-ink-muted"}`}>{files?.length ? `${files.length} file(s) selected` : "Choose files"}</span>
            <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFiles(e.target.files)} />
          </label>
        </Section>

        {/* Honeypot */}
        <input type="text" value={f.website} onChange={(e) => set("website", e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <Turnstile ref={turnstileRef} action="supplier" onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

        {error && <p role="alert" className="t-small text-alert-ink">{error}</p>}

        <button type="submit" disabled={submitting} className="q-btn w-full bg-ink text-paper hover:bg-black disabled:opacity-60">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit for review"}
        </button>
      </form>
    </div>
  );
}

const cls = "w-full h-12 rounded-edge px-3.5 t-body border border-line-strong bg-white text-ink outline-none focus:border-ink transition-colors";

function Section({ icon: Icon, title, note, children }: { icon: typeof Building2; title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-frame border border-line bg-paper p-6 md:p-8">
      <div className="flex items-center gap-3 mb-2"><Icon aria-hidden="true" className="w-4 h-4 text-gold-ink" /><h2 className="t-h3 text-ink">{title}</h2></div>
      {note && <p className="t-small text-ink-muted mb-6">{note}</p>}
      <div className={note ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="t-label text-ink-muted block mb-2">{label}</label>
      {children}
    </div>
  );
}
