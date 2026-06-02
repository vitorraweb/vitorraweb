"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { submitContact } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/* General contact form. Submission is simulated until the backend endpoint
   exists — swap the marked line for a real submitContact() call. */

type Form = { name: string; email: string; subject: string; message: string };
const EMPTY: Form = { name: "", email: "", subject: "", message: "" };

export default function ContactForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Your name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.message.trim()) e.message = "Please enter a message.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setStatus("submitting");
    try {
            await submitContact(form);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-white rounded-[28px] border border-black/[0.06] p-8 md:p-12 text-center shadow-card">
        <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "rgba(197,178,122,0.15)", border: "1px solid rgba(197,178,122,0.5)" }}>
          <Check className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2.5} />
        </div>
        <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(24px,3vw,32px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }} className="mb-3">
          Message sent.
        </h2>
        <p className="max-w-sm mx-auto mb-8" style={{ fontSize: "15px", lineHeight: 1.7, color: "#555555" }}>
          Thanks, {form.name.split(" ")[0] || "there"}. We&apos;ll get back to{" "}
          <span style={{ color: "#1E1E1E", fontWeight: 600 }}>{form.email}</span> within 24 hours.
        </p>
        <Link href="/" className="btn-secondary">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] border border-black/[0.06] p-6 md:p-9 shadow-card">
      <h2 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}>
        Send us a message
      </h2>
      <p className="text-sm mb-6" style={{ color: "#777777" }}>We typically reply within 24 hours.</p>

      <div className="space-y-5">
        <Field label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.name} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Email" required error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.email} />
          </Field>
          <Field label="Subject">
            <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Optional" className="h-11 rounded-xl px-3.5" />
          </Field>
        </div>
        <Field label="Message" required error={errors.message}>
          <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="How can we help?" className="min-h-32 rounded-xl px-3.5 py-3" aria-invalid={!!errors.message} />
        </Field>

        {status === "error" && (
          <p className="text-sm" style={{ color: "#C0392B" }}>
            Something went wrong. Please try again or email{" "}
            <a href="mailto:support@vitorra.org" className="underline">support@vitorra.org</a>.
          </p>
        )}

        <button type="button" onClick={submit} disabled={status === "submitting"} className="btn-primary w-full sm:w-auto" style={{ opacity: status === "submitting" ? 0.7 : 1, justifyContent: "center" }}>
          {status === "submitting" ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <>Send message<ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2" style={{ color: "#1E1E1E" }}>
        {label}
        {required && <span style={{ color: "#C5B27A" }}> *</span>}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-sm" style={{ color: "#C0392B" }}>{error}</p>}
    </div>
  );
}
