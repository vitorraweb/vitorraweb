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
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5" style={{ background: "rgba(34,197,94,0.12)" }}>
        <Check className="w-8 h-8" style={{ color: "#16A34A" }} />
      </div>
      <h1 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#1E1E1E" }}>Details submitted</h1>
      <p className="text-sm" style={{ color: "#666" }}>Thank you. Our operations team will review your application and be in touch.</p>
    </div>
  );

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "#C5B27A" }}>Supplier registration</p>
      <h1 className="mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E", lineHeight: 1.1 }}>
        Become a Vitorra supplier
      </h1>
      <p className="text-base max-w-2xl mb-8" style={{ color: "#555", lineHeight: 1.7 }}>
        Tell us about your company, share your documents and bank details, and our team will review your application.
      </p>

      <form onSubmit={submit} className="space-y-5">
        {/* Company */}
        <Section icon={Building2} title="Company details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company name *"><input value={f.company_name} onChange={(e) => set("company_name", e.target.value)} className={cls} style={st} /></Field>
            <Field label="Contact person"><input value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={cls} style={st} /></Field>
            <Field label="Email *"><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={cls} style={st} /></Field>
            <Field label="Phone"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={cls} style={st} /></Field>
            <Field label="Country"><input value={f.country} onChange={(e) => set("country", e.target.value)} className={cls} style={st} /></Field>
            <Field label="What do you supply?"><input value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Packaging, logistics, raw materials" className={cls} style={st} /></Field>
          </div>
          <div className="mt-4"><Field label="Address"><input value={f.address} onChange={(e) => set("address", e.target.value)} className={cls} style={st} /></Field></div>
          <div className="mt-4"><Field label="About your company (optional)"><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:border-[#C5B27A]" style={st} /></Field></div>
        </Section>

        {/* Bank */}
        <Section icon={Landmark} title="Bank details" note="Stored securely (encrypted) and only seen by our finance team.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bank name"><input value={f.bank_name} onChange={(e) => set("bank_name", e.target.value)} className={cls} style={st} /></Field>
            <Field label="Account name"><input value={f.bank_account_name} onChange={(e) => set("bank_account_name", e.target.value)} className={cls} style={st} /></Field>
            <Field label="Account number"><input value={f.bank_account_number} onChange={(e) => set("bank_account_number", e.target.value)} className={cls} style={st} /></Field>
            <Field label="Branch"><input value={f.bank_branch} onChange={(e) => set("bank_branch", e.target.value)} className={cls} style={st} /></Field>
            <Field label="SWIFT / BIC (international)"><input value={f.bank_swift} onChange={(e) => set("bank_swift", e.target.value)} className={cls} style={st} /></Field>
          </div>
        </Section>

        {/* Documents */}
        <Section icon={Upload} title="Documents" note="Registration certificate, contract, tax documents — up to 6 files (PDF, DOC, images).">
          <label className="flex items-center gap-3 rounded-xl px-4 py-3 border cursor-pointer" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#FAFAF8" }}>
            <Upload className="w-5 h-5" style={{ color: "#C5B27A" }} />
            <span className="text-sm" style={{ color: files?.length ? "#1E1E1E" : "#999" }}>{files?.length ? `${files.length} file(s) selected` : "Choose files"}</span>
            <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFiles(e.target.files)} />
          </label>
        </Section>

        {/* Honeypot */}
        <input type="text" value={f.website} onChange={(e) => set("website", e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <Turnstile ref={turnstileRef} action="supplier" onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full" style={{ justifyContent: "center", opacity: submitting ? 0.6 : 1 }}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit for review"}
        </button>
      </form>
    </div>
  );
}

const cls = "w-full h-11 rounded-xl px-3.5 text-sm border outline-none focus:border-[#C5B27A]";
const st = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

function Section({ icon: Icon, title, note, children }: { icon: typeof Building2; title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[24px] border border-black/[0.06] p-6 md:p-7">
      <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4" style={{ color: "#C5B27A" }} /><h2 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "#1E1E1E" }}>{title}</h2></div>
      {note && <p className="text-xs mb-4" style={{ color: "#999" }}>{note}</p>}
      <div className={note ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "#999" }}>{label}</label>
      {children}
    </div>
  );
}
