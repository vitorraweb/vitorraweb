"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reserveFet } from "@/lib/api";
import type { FetTier } from "@/lib/fet-pricing";
import type { Order } from "@/types";

/* ─── "Reserve Now, Pay Cash" ─────────────────────────────────────────────────
   Self-serve FET reservation, sitting alongside "Request a quote". Creates a
   real order (no online payment — cash is paid before installation or
   collection). Keeps FetPricing a server component by living entirely here. */

type Form = { customer_name: string; customer_email: string; customer_phone: string; quantity: string; notes: string };
const EMPTY: Form = { customer_name: "", customer_email: "", customer_phone: "", quantity: "1", notes: "" };

export default function ReserveButton({ tier }: { tier: FetTier }) {
  const tr = useTranslations("fetPricing");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [order, setOrder] = useState<Order | null>(null);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const close = () => {
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
    setStatus("idle");
    setOrder(null);
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

  const submit = async () => {
    if (!validate()) return;
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
        {tr("reserveNow")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={close}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-6 md:p-8 bg-white shadow-2xl"
            style={{ border: "1px solid rgba(197,178,122,0.25)" }}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
              aria-label={tr("reserveClose")}
            >
              <X className="w-4 h-4" style={{ color: "#777777" }} />
            </button>

            {status === "success" && order ? (
              <div className="text-center pt-2">
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
                  {tr("reserveCashNotice")}
                </p>
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold"
                  style={{ color: "#7A6020" }}
                >
                  {tr("reserveTrackOrder")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <h3
                  style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#1E1E1E" }}
                  className="mb-1 pr-8"
                >
                  {tr("reserveTitle", { model: tier.model })}
                </h3>
                <p className="text-sm mb-5" style={{ color: "#777777" }}>{tr("reserveSub")}</p>

                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5" style={{ color: "#1E1E1E" }}>
                      {tr("reserveFieldName")} <span style={{ color: "#C5B27A" }}>*</span>
                    </Label>
                    <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} className="h-10 rounded-lg px-3" aria-invalid={!!errors.customer_name} />
                    {errors.customer_name && <p className="mt-1 text-xs" style={{ color: "#C0392B" }}>{errors.customer_name}</p>}
                  </div>

                  <div>
                    <Label className="mb-1.5" style={{ color: "#1E1E1E" }}>
                      {tr("reserveFieldEmail")} <span style={{ color: "#C5B27A" }}>*</span>
                    </Label>
                    <Input type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} className="h-10 rounded-lg px-3" aria-invalid={!!errors.customer_email} />
                    {errors.customer_email && <p className="mt-1 text-xs" style={{ color: "#C0392B" }}>{errors.customer_email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5" style={{ color: "#1E1E1E" }}>{tr("reserveFieldPhone")}</Label>
                      <Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} className="h-10 rounded-lg px-3" />
                    </div>
                    <div>
                      <Label className="mb-1.5" style={{ color: "#1E1E1E" }}>{tr("reserveFieldQuantity")}</Label>
                      <Input type="number" min={1} max={50} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="h-10 rounded-lg px-3" aria-invalid={!!errors.quantity} />
                      {errors.quantity && <p className="mt-1 text-xs" style={{ color: "#C0392B" }}>{errors.quantity}</p>}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5" style={{ color: "#1E1E1E" }}>{tr("reserveFieldNotes")}</Label>
                    <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-20 rounded-lg px-3 py-2" />
                  </div>

                  {status === "error" && (
                    <p className="text-sm" style={{ color: "#C0392B" }}>{tr("reserveError")}</p>
                  )}

                  <p className="text-xs leading-relaxed" style={{ color: "#777777" }}>{tr("reserveCashNotice")}</p>

                  <button
                    type="button"
                    onClick={submit}
                    disabled={status === "submitting"}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity"
                    style={{ background: "#1E1E1E", color: "#FFFFFF", opacity: status === "submitting" ? 0.7 : 1 }}
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {tr("reserveSubmitting")}
                      </>
                    ) : (
                      tr("reserveSubmit")
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
