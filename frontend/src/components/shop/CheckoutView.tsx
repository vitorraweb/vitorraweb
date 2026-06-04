"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Loader2, ShoppingBag, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CurrencyToggle from "./CurrencyToggle";
import { useCart, lineKey } from "@/lib/cart";
import { formatPrice } from "@/lib/coffee-catalog";
import { createOrder } from "@/lib/api";

interface Form {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  country: string;
  postcode: string;
  notes: string;
}

const EMPTY: Form = {
  name: "", email: "", phone: "",
  line1: "", line2: "", city: "", country: "Uganda", postcode: "",
  notes: "",
};

export default function CheckoutView() {
  const { lines, currency, subtotal, count, clear, ready } = useCart();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [reference, setReference] = useState<string>("");

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Your name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.line1.trim()) e.line1 = "Street address is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.country.trim()) e.country = "Country is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) {
      toast.error("Please check the highlighted fields.");
      return;
    }
    setStatus("submitting");
    try {
      const order = await createOrder({
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim() || undefined,
        currency,
        shipping_address: {
          line1: form.line1.trim(),
          line2: form.line2.trim() || undefined,
          city: form.city.trim(),
          country: form.country.trim(),
          postcode: form.postcode.trim() || undefined,
        },
        items: lines.map((l) => ({
          slug: l.slug,
          quantity: l.qty,
          grind: l.grind || undefined,
          weight: l.weight || undefined,
        })),
        notes: form.notes.trim() || undefined,
      });
      setReference(order.reference);
      setStatus("success");
      clear();
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  /* ── Loading / empty ──────────────────────────────────────────────────── */
  if (!ready) {
    return (
      <div className="container-max py-10 text-center text-sm" style={{ color: "#999999" }}>
        Loading…
      </div>
    );
  }

  if (status !== "success" && count === 0) {
    return (
      <div className="container-max">
        <div className="rounded-[32px] text-center py-16 px-6" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
            <ShoppingBag className="w-7 h-7" />
          </span>
          <h2 className="mb-3" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 700, color: "#1E1E1E" }}>
            Nothing to check out.
          </h2>
          <p className="mb-8 max-w-sm mx-auto" style={{ fontSize: "15px", color: "#666666" }}>
            Your cart is empty — add a bag of GOLD and come back.
          </p>
          <Link href="/shop" className="btn-primary">Browse the shop<ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    );
  }

  /* ── Success ──────────────────────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className="container-max">
        <div className="bg-white rounded-[32px] border border-black/[0.06] p-8 md:p-12 text-center shadow-card max-w-2xl mx-auto">
          <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "rgba(197,178,122,0.15)", border: "1px solid rgba(197,178,122,0.5)" }}>
            <Check className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2.5} />
          </div>
          <h2 className="mb-3" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(26px,3.4vw,40px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>
            Order received.
          </h2>
          <p className="max-w-md mx-auto mb-2" style={{ fontSize: "15px", lineHeight: 1.7, color: "#555555" }}>
            Thank you, {form.name.split(" ")[0] || "there"}. We&apos;ve emailed a confirmation to{" "}
            <span style={{ color: "#1E1E1E", fontWeight: 600 }}>{form.email}</span>.
          </p>
          <p className="mb-6" style={{ fontSize: "14px", color: "#777777" }}>
            Your order reference is{" "}
            <span className="font-bold tracking-wide" style={{ color: "#1E1E1E" }}>{reference}</span>.
          </p>
          <div className="rounded-[18px] p-5 mb-8 text-left max-w-md mx-auto" style={{ background: "#FAF8F4", border: "1px solid rgba(197,178,122,0.2)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#7A6020" }}>What happens next</p>
            <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>
              Our team will confirm stock, delivery, and payment with you within 24 hours.
              Secure online card &amp; mobile-money checkout is coming soon.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop" className="btn-secondary">Continue shopping</Link>
            <Link href="/" className="btn-primary">Back to home<ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Checkout form + summary ──────────────────────────────────────────── */
  return (
    <div className="container-max grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12 items-start">
      {/* Form */}
      <div className="bg-white rounded-[28px] border border-black/[0.06] p-6 md:p-9 shadow-card">
        <h2 className="mb-6" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#1E1E1E" }}>
          Your details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" error={errors.name} className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.name} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.email} />
          </Field>
          <Field label="Phone" hint="Optional">
            <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+256 …" className="h-11 rounded-xl px-3.5" />
          </Field>
        </div>

        <h3 className="mt-8 mb-4 text-sm font-bold uppercase tracking-[0.1em]" style={{ color: "#999999" }}>
          Delivery address
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Street address" error={errors.line1} className="sm:col-span-2">
            <Input value={form.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Plot 12, Kololo" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.line1} />
          </Field>
          <Field label="Apartment, suite, etc." hint="Optional" className="sm:col-span-2">
            <Input value={form.line2} onChange={(e) => set("line2", e.target.value)} placeholder="" className="h-11 rounded-xl px-3.5" />
          </Field>
          <Field label="City / Town" error={errors.city}>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Kampala" className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.city} />
          </Field>
          <Field label="Country" error={errors.country}>
            <Input value={form.country} onChange={(e) => set("country", e.target.value)} className="h-11 rounded-xl px-3.5" aria-invalid={!!errors.country} />
          </Field>
          <Field label="Postcode" hint="Optional">
            <Input value={form.postcode} onChange={(e) => set("postcode", e.target.value)} placeholder="" className="h-11 rounded-xl px-3.5" />
          </Field>
        </div>

        <h3 className="mt-8 mb-4 text-sm font-bold uppercase tracking-[0.1em]" style={{ color: "#999999" }}>
          Order notes <span className="font-medium normal-case tracking-normal" style={{ color: "#BBBBBB" }}>· optional</span>
        </h3>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Delivery instructions, gift message…" className="min-h-24 rounded-xl px-3.5 py-3" />
      </div>

      {/* Summary */}
      <div className="rounded-[24px] p-6 md:p-7 lg:sticky lg:top-24" style={{ background: "#FFFFFF", border: "1px solid rgba(197,178,122,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}>
            Your order
          </h2>
          <CurrencyToggle />
        </div>

        <ul className="space-y-3 pb-5 mb-5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {lines.map((l) => {
            const unit = currency === "USD" ? l.price_usd : l.price_ugx;
            return (
              <li key={lineKey(l)} className="flex gap-3 items-center">
                <div className="relative rounded-[12px] overflow-hidden shrink-0" style={{ width: 52, height: 52, backgroundColor: "#F4F1EB" }}>
                  <Image src={l.image} alt={l.name} fill sizes="52px" className="object-cover" />
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "#C5B27A" }}>
                    {l.qty}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#1E1E1E" }}>{l.name}</p>
                  <p className="text-xs truncate" style={{ color: "#999999" }}>{l.weight} · {l.grind}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "#1E1E1E" }}>
                  {formatPrice(unit * l.qty, currency)}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2.5 pb-5 mb-5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "#666666" }}>Subtotal</span>
            <span className="font-semibold tabular-nums" style={{ color: "#1E1E1E" }}>{formatPrice(subtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "#666666" }}>Delivery</span>
            <span style={{ color: "#999999" }}>Confirmed on order</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold" style={{ color: "#1E1E1E" }}>Total</span>
          <span className="tabular-nums" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "26px", fontWeight: 700, color: "#1E1E1E" }}>
            {formatPrice(subtotal, currency)}
          </span>
        </div>

        <button type="button" onClick={submit} disabled={status === "submitting"} className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed">
          {status === "submitting" ? (<><Loader2 className="w-4 h-4 animate-spin" />Placing order…</>) : (<>Place order<ArrowRight className="w-4 h-4" /></>)}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs mt-4" style={{ color: "#999999" }}>
          <ShieldCheck className="w-3.5 h-3.5" />
          No payment taken now — we confirm payment &amp; delivery within 24h.
        </p>
      </div>
    </div>
  );
}

/* ── Labelled field wrapper ───────────────────────────────────────────────── */
function Field({
  label, error, hint, className, children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 justify-between">
        <span style={{ color: "#1E1E1E" }}>{label}</span>
        {hint && <span className="text-xs font-normal" style={{ color: "#BBBBBB" }}>{hint}</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs" style={{ color: "#C0392B" }}>{error}</p>}
    </div>
  );
}
