"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, Loader2, Mail, Minus, Phone, Plus, ShieldCheck, User, X } from "lucide-react";
import { payOrder, reserveFet } from "@/lib/api";
import { ONLINE_PAYMENTS_ENABLED } from "@/lib/config";
import { formatEur, type FetTier } from "@/lib/fet-pricing";
import type { Order } from "@/types";

/* ─── "Reserve Now, Pay Cash" ─────────────────────────────────────────────────
   Self-serve FET reservation, sitting alongside "Request a quote". Creates a
   real order (no online payment — cash is paid before installation or
   collection). On phones it opens as a bottom sheet; on desktop, a centered
   dialog — keeps FetPricing a server component by living entirely here. */

type Form = { customer_name: string; customer_email: string; customer_phone: string; quantity: string; notes: string };
const EMPTY: Form = { customer_name: "", customer_email: "", customer_phone: "", quantity: "1", notes: "" };

/* Field styling mirrors the customer-portal profile form (Vitorra design
   system: rounded, gold focus ring) instead of the generic shadcn defaults. */
const fieldCls = "w-full h-12 rounded-2xl px-3.5 text-[14px] bg-white outline-none border transition-all focus:border-[#C5B27A] focus:ring-[3px] focus:ring-[#C5B27A]/15";
const fieldWithIconCls = `${fieldCls} pl-11`;
const labelCls = "block text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5";
const errBorder = "#C0392B";
const okBorder = "rgba(0,0,0,0.1)";

function Field({
  label,
  required,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls} style={{ color: "#8a8a8a" }}>
        {label} {required && <span style={{ color: "#7A6020" }}>*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#B8AA88" }}
          />
        )}
        {children}
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: errBorder }}>{error}</p>}
    </div>
  );
}

export default function ReserveButton({ tier }: { tier: FetTier }) {
  const tr = useTranslations("fetPricing");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "redirecting" | "success" | "error">("idle");
  const [order, setOrder] = useState<Order | null>(null);
  // True when the order was reserved but online payment couldn't be started —
  // the reservation is safe; we just soften the success copy.
  const [payFailed, setPayFailed] = useState(false);

  // Whether to offer paying online (Pesapal). When off, this stays the original
  // "reserve, pay offline" flow, byte-for-byte.
  const online = ONLINE_PAYMENTS_ENABLED;

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const adjustQuantity = (delta: number) => {
    setForm((f) => {
      const next = Math.min(50, Math.max(1, (Number(f.quantity) || 1) + delta));
      return { ...f, quantity: String(next) };
    });
    if (errors.quantity) setErrors((e) => ({ ...e, quantity: "" }));
  };

  const close = () => {
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
    setStatus("idle");
    setOrder(null);
    setPayFailed(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = tr("reserveErrName");
    if (!form.customer_email.trim()) e.customer_email = tr("reserveErrEmailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) e.customer_email = tr("reserveErrEmailInvalid");
    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) e.quantity = tr("reserveErrQuantity");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /**
   * Reserve the unit, then (when paying online) start a Pesapal payment and hand
   * the customer over to the hosted page. `payNow=false` is the offline path —
   * the order is created and the team follows up, exactly as before.
   * The reservation is always saved first, so a payment hiccup never loses it.
   */
  const submit = async (payNow: boolean) => {
    if (!validate()) return;
    setPayFailed(false);
    setStatus("submitting");
    try {
      const { order } = await reserveFet({
        tier: tier.id,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone || undefined,
        quantity: Number(form.quantity),
        notes: form.notes || undefined,
      });
      setOrder(order);

      if (payNow && online) {
        try {
          const payment = await payOrder(order.reference);
          if (payment.redirect_url) {
            setStatus("redirecting");
            window.location.href = payment.redirect_url;
            return; // leaving the page — Pesapal takes over
          }
          // No redirect (e.g. backend still on the manual driver): treat as a
          // saved reservation rather than a failure.
        } catch {
          setPayFailed(true);
        }
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 mt-3 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "#C5B27A", color: "#1E1E1E" }}
      >
        {online ? tr("reserveNowPay") : tr("reserveNow")}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 animate-[vitorra-fade-in_0.2s_ease-out]"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={close}
            aria-hidden="true"
          />

          {/* Bottom sheet on phones, centered dialog from sm: up */}
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
            <div
              className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[24px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-[reserve-in_0.3s_cubic-bezier(0.22,1,0.36,1)_both]"
              style={{ border: "1px solid rgba(197,178,122,0.25)" }}
            >
              {/* Drag-handle affordance — mobile sheet only */}
              <div className="sm:hidden flex justify-center pt-3 pb-1" aria-hidden="true">
                <div className="w-9 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
              </div>

              <button
                type="button"
                onClick={close}
                className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
                aria-label={tr("reserveClose")}
              >
                <X className="w-4 h-4" style={{ color: "#777777" }} />
              </button>

              <div className="p-6 pt-2 sm:pt-6 md:p-8 md:pt-6">
                {status === "redirecting" ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-5 animate-spin" style={{ color: "#7A6020" }} />
                    <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                      {tr("reserveRedirecting")}
                    </p>
                  </div>
                ) : status === "success" && order ? (
                  <div className="text-center py-2">
                    <div
                      className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full"
                      style={{ background: "rgba(197,178,122,0.15)", border: "1px solid rgba(197,178,122,0.5)" }}
                    >
                      <Check className="w-6 h-6" style={{ color: "#7A6020" }} strokeWidth={2.5} />
                    </div>
                    <h3
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}
                      className="mb-2"
                    >
                      {tr("reserveSuccessTitle")}
                    </h3>
                    <p className="text-sm leading-relaxed mb-1" style={{ color: "#454545" }}>
                      {tr("reserveSuccess", { reference: order.reference })}
                    </p>
                    <p className="text-sm leading-relaxed mt-3" style={{ color: "#777777" }}>
                      {payFailed ? tr("reservePayFailed") : tr("reserveCashNotice")}
                    </p>
                    <Link
                      href="/account/orders"
                      onClick={close}
                      className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold"
                      style={{ color: "#7A6020" }}
                    >
                      {tr("reserveTrackOrder")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Tier + price recap — what you're reserving, at a glance */}
                    <div className="flex items-start justify-between gap-3 mb-4 pr-8">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
                      >
                        {tier.model}
                      </span>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "#aaaaaa" }}>
                          {tr("from")}
                        </p>
                        <p className="font-numeric" style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1, color: "#1E1E1E" }}>
                          {formatEur(tier.priceEur)}
                        </p>
                      </div>
                    </div>

                    <h3
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}
                      className="mb-1"
                    >
                      {online ? tr("reserveTitlePay", { model: tier.model }) : tr("reserveTitle", { model: tier.model })}
                    </h3>
                    <p className="text-sm mb-6" style={{ color: "#777777" }}>
                      {online ? tr("reserveSubPay") : tr("reserveSub")}
                    </p>

                    <div className="space-y-4">
                      <Field label={tr("reserveFieldName")} required error={errors.customer_name} icon={User}>
                        <input
                          value={form.customer_name}
                          onChange={(e) => set("customer_name", e.target.value)}
                          className={fieldWithIconCls}
                          style={{ borderColor: errors.customer_name ? errBorder : okBorder }}
                        />
                      </Field>

                      <Field label={tr("reserveFieldEmail")} required error={errors.customer_email} icon={Mail}>
                        <input
                          type="email"
                          value={form.customer_email}
                          onChange={(e) => set("customer_email", e.target.value)}
                          className={fieldWithIconCls}
                          style={{ borderColor: errors.customer_email ? errBorder : okBorder }}
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-3">
                        <Field label={tr("reserveFieldPhone")} icon={Phone}>
                          <input
                            type="tel"
                            value={form.customer_phone}
                            onChange={(e) => set("customer_phone", e.target.value)}
                            className={fieldWithIconCls}
                            style={{ borderColor: okBorder }}
                          />
                        </Field>

                        <Field label={tr("reserveFieldQuantity")} error={errors.quantity}>
                          <div
                            className="flex items-center h-12 rounded-2xl border overflow-hidden"
                            style={{ borderColor: errors.quantity ? errBorder : okBorder }}
                          >
                            <button
                              type="button"
                              onClick={() => adjustQuantity(-1)}
                              className="w-9 h-full flex items-center justify-center transition-colors hover:bg-black/5"
                              style={{ color: "#7A6020" }}
                              aria-label="−"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={50}
                              value={form.quantity}
                              onChange={(e) => set("quantity", e.target.value)}
                              className="font-numeric flex-1 h-full w-0 min-w-0 text-center text-[15px] font-bold outline-none border-x bg-transparent"
                              style={{ borderColor: "rgba(0,0,0,0.06)", color: "#1E1E1E" }}
                            />
                            <button
                              type="button"
                              onClick={() => adjustQuantity(1)}
                              className="w-9 h-full flex items-center justify-center transition-colors hover:bg-black/5"
                              style={{ color: "#7A6020" }}
                              aria-label="+"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </Field>
                      </div>

                      <Field label={tr("reserveFieldNotes")}>
                        <textarea
                          value={form.notes}
                          onChange={(e) => set("notes", e.target.value)}
                          rows={3}
                          className={`${fieldCls} h-auto py-2.5 resize-none`}
                          style={{ borderColor: okBorder }}
                        />
                      </Field>
                    </div>
                  </>
                )}
              </div>

              {/* Sticky footer — notice + submit stay reachable below the keyboard */}
              {status !== "redirecting" && !(status === "success" && order) && (
                <div
                  className="sticky bottom-0 px-6 md:px-8 pt-3 bg-white border-t"
                  style={{ borderColor: "rgba(0,0,0,0.06)", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
                >
                  {status === "error" && (
                    <p className="text-sm mb-2" style={{ color: errBorder }}>{tr("reserveError")}</p>
                  )}
                  <p
                    className="inline-flex items-center gap-1.5 text-xs leading-relaxed mb-3"
                    style={{ color: "#777777" }}
                  >
                    {online && <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "#7A6020" }} />}
                    {online ? tr("reserveOnlineNotice") : tr("reserveCashNotice")}
                  </p>
                  <button
                    type="button"
                    onClick={() => submit(online)}
                    disabled={status === "submitting"}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold transition-opacity"
                    style={{ background: "#1E1E1E", color: "#FFFFFF", opacity: status === "submitting" ? 0.7 : 1 }}
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {tr("reserveSubmitting")}
                      </>
                    ) : (
                      online ? tr("reserveSubmitPay") : tr("reserveSubmit")
                    )}
                  </button>

                  {/* Offline fallback — keep the original "reserve, we'll contact you"
                      motion available for buyers who want an invoice / bank transfer. */}
                  {online && (
                    <button
                      type="button"
                      onClick={() => submit(false)}
                      disabled={status === "submitting"}
                      className="w-full mt-2.5 text-center text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ color: "#7A6020" }}
                    >
                      {tr("reservePayOffline")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
