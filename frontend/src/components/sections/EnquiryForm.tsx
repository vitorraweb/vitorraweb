"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fuel, HeartPulse, Coffee, Truck, MessageCircle, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EnquiryFormData, ProductCategory } from "@/types";
// import { submitEnquiry } from "@/lib/api"; // ← enable once the Laravel /enquiries endpoint is live

/* ─── Enquiry / quote form ────────────────────────────────────────────────────
   Premium 3-step form (Interest → Details → Contact) that builds an
   EnquiryFormData payload. Submission is simulated until the backend endpoint
   exists — swap the marked line for `submitEnquiry(payload)`.
   ─────────────────────────────────────────────────────────────────────────── */

type UiCategory = ProductCategory | "GENERAL";

const CATEGORIES: { value: UiCategory; label: string; desc: string; icon: typeof Fuel }[] = [
  { value: "FET", label: "Fuel Eco Tech", desc: "Fuel savings for fleets", icon: Fuel },
  { value: "SEAL", label: "SEAL Wound Spray", desc: "Clinical wound care", icon: HeartPulse },
  { value: "COFFEE", label: "Vitorra Coffee", desc: "Wholesale & export", icon: Coffee },
  { value: "LOGISTICS", label: "Logistics", desc: "Freight & supply chain", icon: Truck },
  { value: "GENERAL", label: "General enquiry", desc: "Something else", icon: MessageCircle },
];

const STEPS = ["Interest", "Details", "Contact"];

type Fields = Omit<EnquiryFormData, "product_category">;
const EMPTY: Fields = { name: "", email: "", company: "", phone: "", country: "Uganda", message: "" };

export default function EnquiryForm() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<UiCategory | null>(null);
  const [form, setForm] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  // Optional prefill from a product page, e.g. /enquire?sector=FET
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("sector")?.toUpperCase();
    if (s && CATEGORIES.some((c) => c.value === s)) {
      setCategory(s as UiCategory);
      setStep(1);
    }
  }, []);

  const set = (k: keyof Fields, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0 && !category) e.category = "Please choose what we can help with.";
    if (s === 1) {
      if (!form.message.trim()) e.message = "Tell us a little about what you need.";
      if (!form.country.trim()) e.country = "Country is required.";
    }
    if (s === 2) {
      if (!form.name.trim()) e.name = "Your name is required.";
      if (!form.email.trim()) e.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate(step) && setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (!validate(2)) return;
    setStatus("submitting");
    const payload: EnquiryFormData = {
      ...form,
      product_category: category === "GENERAL" ? "" : (category as ProductCategory),
    };
    try {
      // await submitEnquiry(payload); // ← enable when the backend is live
      await new Promise((r) => setTimeout(r, 900)); // simulated submission
      void payload;
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  /* ── Success state ──────────────────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className="bg-white rounded-[28px] border border-black/[0.06] p-8 md:p-12 text-center shadow-card">
        <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "rgba(197,178,122,0.15)", border: "1px solid rgba(197,178,122,0.5)" }}>
          <Check className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2.5} />
        </div>
        <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(24px,3vw,32px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }} className="mb-3">
          Enquiry received.
        </h2>
        <p className="max-w-sm mx-auto mb-8" style={{ fontSize: "15px", lineHeight: 1.7, color: "#555555" }}>
          Thank you, {form.name.split(" ")[0] || "there"}. Our team will reply to{" "}
          <span style={{ color: "#1E1E1E", fontWeight: 600 }}>{form.email}</span> within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-secondary">Back to home</Link>
          <Link href="/products/coffee" className="btn-primary">Explore products<ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    );
  }

  /* ── Form ───────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-white rounded-[28px] border border-black/[0.06] p-6 md:p-9 shadow-card">
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <div key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors"
                  style={{
                    background: done || current ? "#C5B27A" : "#F2F2F2",
                    color: done || current ? "#1E1E1E" : "#999999",
                  }}
                >
                  {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="hidden sm:block text-sm font-semibold" style={{ color: current ? "#1E1E1E" : "#999999" }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="flex-1 h-px mx-3" style={{ background: "rgba(0,0,0,0.08)" }}>
                  <span className="block h-full transition-transform duration-500" style={{ background: "#C5B27A", transformOrigin: "left", transform: done ? "scaleX(1)" : "scaleX(0)" }} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div key={step} className="hero-enter">
        {step === 0 && (
          <div>
            <h3 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}>
              What can we help you with?
            </h3>
            <p className="text-sm mb-6" style={{ color: "#777777" }}>Choose the area closest to your needs.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((c) => {
                const selected = category === c.value;
                const Icon = c.icon;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => { setCategory(c.value); setErrors((e) => ({ ...e, category: "" })); }}
                    className="flex items-center gap-3 text-left p-4 rounded-2xl border transition-all hover-lift"
                    style={{
                      borderColor: selected ? "#C5B27A" : "rgba(0,0,0,0.08)",
                      background: selected ? "rgba(197,178,122,0.08)" : "#FFFFFF",
                    }}
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: selected ? "#C5B27A" : "#F2F2F2", color: selected ? "#1E1E1E" : "#888888" }}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: "#1E1E1E" }}>{c.label}</span>
                      <span className="block text-xs" style={{ color: "#888888" }}>{c.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="mt-3 text-sm" style={{ color: "#C0392B" }}>{errors.category}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h3 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}>
              Tell us about your needs
            </h3>
            <Field label="What do you need?" required error={errors.message}>
              <Textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="e.g. Fuel savings assessment for a fleet of 40 trucks, or 500kg of green coffee for export…"
                className="min-h-28 rounded-xl px-3.5 py-3"
                aria-invalid={!!errors.message}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Company / Organisation">
                <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Optional" className="h-11 rounded-xl px-3.5" />
              </Field>
              <Field label="Country" required error={errors.country}>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.country} />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}>
              How can we reach you?
            </h3>
            <Field label="Full name" required error={errors.name}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.name} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Email" required error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.email} />
              </Field>
              <Field label="Phone">
                <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" className="h-11 rounded-xl px-3.5" />
              </Field>
            </div>
            {status === "error" && (
              <p className="text-sm" style={{ color: "#C0392B" }}>Something went wrong. Please try again or email {""}
                <a href="mailto:support@vitorra.org" className="underline">support@vitorra.org</a>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        {step > 0 ? (
          <button type="button" onClick={back} className="btn-secondary"><ArrowLeft className="w-4 h-4" />Back</button>
        ) : <span />}

        {step < 2 ? (
          <button type="button" onClick={next} className="btn-primary">Continue<ArrowRight className="w-4 h-4" /></button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={status === "submitting"} className="btn-primary" style={{ opacity: status === "submitting" ? 0.7 : 1 }}>
            {status === "submitting" ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <>Submit enquiry<ArrowRight className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────────────────── */

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
