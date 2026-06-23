"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import {
  getInvoicePaymentStatus,
  getPublicInvoice,
  payInvoice,
  type PublicInvoice,
} from "@/lib/api";

/* ─── B2B invoice — view & pay online ─────────────────────────────────────────
   Reached from the tokenized link in the invoice email. Shows the invoice and,
   when it's payable online (UGX/USD, still owing), a Pesapal "Pay now" button.
   After returning from Pesapal (?paid=1) it polls the backend (which reconciles
   with the provider) until the payment confirms.                              */

function formatMoney(amount: number, currency: string): string {
  if (currency === "UGX") return `UGX ${amount.toLocaleString()}`;
  const sym = currency === "USD" ? "$" : "€";
  return `${sym}${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Phase = "loading" | "view" | "redirecting" | "confirming" | "pending" | "paid" | "void" | "notfound";

const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 2500;

export default function InvoicePay({ token, justPaid }: { token: string; justPaid: boolean }) {
  const t = useTranslations("invoice");
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const cancelled = useRef(false);

  const settle = useCallback((inv: PublicInvoice) => {
    setInvoice(inv);
    if (inv.status === "paid") setPhase("paid");
    else if (inv.status === "void") setPhase("void");
    else setPhase("view");
  }, []);

  /** Poll the backend (which reconciles with Pesapal) after a return. */
  const poll = useCallback(async () => {
    cancelled.current = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (cancelled.current) return;
      try {
        const s = await getInvoicePaymentStatus(token);
        if (cancelled.current) return;
        if (s.payment_status === "paid") {
          setPhase("paid");
          setInvoice((prev) => (prev ? { ...prev, status: "paid", balance: 0 } : prev));
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
    if (!cancelled.current) setPhase("pending");
  }, [token]);

  useEffect(() => {
    cancelled.current = false;
    getPublicInvoice(token)
      .then((inv) => {
        if (cancelled.current) return;
        // Returning from Pesapal but not yet marked paid → confirm in the background.
        if (justPaid && inv.status !== "paid" && inv.status !== "void") {
          setInvoice(inv);
          setPhase("confirming");
          poll();
        } else {
          settle(inv);
        }
      })
      .catch(() => !cancelled.current && setPhase("notfound"));
    return () => {
      cancelled.current = true;
    };
  }, [token, justPaid, settle, poll]);

  const pay = async () => {
    setPhase("redirecting");
    try {
      const res = await payInvoice(token);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
        return;
      }
      setPhase("view"); // online unavailable — drop back to the invoice
    } catch {
      setPhase("view");
    }
  };

  /* ── Centered status states ─────────────────────────────────────────────── */
  if (phase === "loading") {
    return <Centered><Loader2 className="w-8 h-8 mx-auto mb-5 animate-spin" style={{ color: "#7A6020" }} /><Body>{t("loading")}</Body></Centered>;
  }
  if (phase === "notfound") {
    return (
      <Centered>
        <Badge tone="err"><XCircle className="w-7 h-7" style={{ color: "#C0392B" }} strokeWidth={2} /></Badge>
        <Title>{t("notFoundTitle")}</Title><Body>{t("notFoundBody")}</Body>
        <Link href="/contact" className="btn-primary w-full justify-center mt-7">{t("contactUs")}</Link>
      </Centered>
    );
  }
  if (phase === "redirecting") {
    return <Centered><Loader2 className="w-8 h-8 mx-auto mb-5 animate-spin" style={{ color: "#7A6020" }} /><Body>{t("redirecting")}</Body></Centered>;
  }
  if (phase === "confirming") {
    return (
      <Centered>
        <Loader2 className="w-8 h-8 mx-auto mb-6 animate-spin" style={{ color: "#7A6020" }} />
        <Title>{t("confirmingTitle")}</Title><Body>{t("confirmingBody")}</Body>
        <Secured label={t("secured")} />
      </Centered>
    );
  }
  if (phase === "paid" && invoice) {
    return (
      <Centered>
        <Badge tone="ok"><Check className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2.5} /></Badge>
        <Title>{t("paidTitle")}</Title><Body>{t("paidBody", { number: invoice.number })}</Body>
      </Centered>
    );
  }
  if (phase === "void" && invoice) {
    return (
      <Centered>
        <Badge tone="err"><XCircle className="w-7 h-7" style={{ color: "#C0392B" }} strokeWidth={2} /></Badge>
        <Title>{t("voidTitle")}</Title><Body>{t("voidBody", { number: invoice.number })}</Body>
        <Link href="/contact" className="btn-secondary w-full justify-center mt-7">{t("contactUs")}</Link>
      </Centered>
    );
  }
  if (phase === "pending" && invoice) {
    return (
      <Centered>
        <Badge tone="wait"><Clock className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2} /></Badge>
        <Title>{t("pendingTitle")}</Title><Body>{t("pendingBody")}</Body>
        <div className="flex flex-col gap-3 mt-7">
          <button type="button" onClick={() => { setPhase("confirming"); poll(); }} className="btn-secondary w-full justify-center">{t("refresh")}</button>
          <button type="button" onClick={pay} className="btn-primary w-full justify-center">{t("tryAgain")}<ArrowRight className="w-4 h-4" /></button>
        </div>
      </Centered>
    );
  }

  if (!invoice) return null;

  /* ── The invoice itself (view + pay) ────────────────────────────────────── */
  const fmt = (a: number) => formatMoney(a, invoice.currency);

  return (
    <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-card max-w-2xl w-full mx-auto overflow-hidden">
      <div className="p-7 md:p-10">
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <span className="eyebrow block mb-1.5">Vitorra Holdings</span>
            <h1 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, color: "#1E1E1E" }}>
              {t("title", { number: invoice.number })}
            </h1>
          </div>
          {invoice.is_overdue && (
            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.08em]" style={{ background: "rgba(192,57,43,0.1)", color: "#C0392B" }}>
              {t("overdue")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-3 mb-7 text-sm">
          <Meta label={t("billedTo")} value={invoice.customer_name} />
          {invoice.issue_date && <Meta label={t("issued")} value={invoice.issue_date} />}
          {invoice.due_date && <Meta label={t("due")} value={invoice.due_date} />}
        </div>

        {/* Line items */}
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAF8F4" }}>
                <th className="text-left font-semibold px-4 py-2.5" style={{ color: "#7A6020" }}>{t("colDescription")}</th>
                <th className="text-center font-semibold px-2 py-2.5" style={{ color: "#7A6020" }}>{t("colQty")}</th>
                <th className="text-right font-semibold px-4 py-2.5" style={{ color: "#7A6020" }}>{t("colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <td className="px-4 py-2.5" style={{ color: "#1E1E1E" }}>{it.description}</td>
                  <td className="px-2 py-2.5 text-center" style={{ color: "#666" }}>{it.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-numeric" style={{ color: "#1E1E1E" }}>{fmt(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
          <Row label={t("subtotal")} value={fmt(invoice.subtotal)} />
          {invoice.vat_total > 0 && <Row label={t("vat")} value={fmt(invoice.vat_total)} />}
          <Row label={t("total")} value={fmt(invoice.total)} strong />
          {invoice.amount_paid > 0 && <Row label={t("paid")} value={`− ${fmt(invoice.amount_paid)}`} />}
          <div className="pt-2 mt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
            <Row label={t("balanceDue")} value={fmt(invoice.balance)} strong gold />
          </div>
        </div>
      </div>

      {/* Pay action */}
      <div className="px-7 md:px-10 py-6 border-t" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
        {invoice.online_payable ? (
          <>
            <button type="button" onClick={pay} className="btn-primary w-full justify-center">
              {t("payNow", { amount: fmt(invoice.balance) })}
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="inline-flex items-center gap-1.5 mt-3 text-xs" style={{ color: "#888" }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#7A6020" }} />
              {t("payNotice")}
            </p>
          </>
        ) : (
          <p className="text-sm text-center" style={{ color: "#777" }}>{t("notPayableNotice")}</p>
        )}
      </div>
    </div>
  );
}

/* ── Presentational helpers ────────────────────────────────────────────────── */

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-[32px] border border-black/[0.06] p-8 md:p-12 text-center shadow-card max-w-lg w-full mx-auto">{children}</div>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-3" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(26px,3.4vw,40px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>{children}</h1>;
}
function Body({ children }: { children: React.ReactNode }) {
  return <p className="max-w-md mx-auto" style={{ fontSize: "15px", lineHeight: 1.7, color: "#555" }}>{children}</p>;
}
function Badge({ tone, children }: { tone: "ok" | "err" | "wait"; children: React.ReactNode }) {
  const bg = tone === "err" ? "rgba(192,57,43,0.1)" : "rgba(197,178,122,0.15)";
  const border = tone === "err" ? "rgba(192,57,43,0.4)" : "rgba(197,178,122,0.5)";
  return <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: bg, border: `1px solid ${border}` }}>{children}</div>;
}
function Secured({ label }: { label: string }) {
  return <p className="inline-flex items-center gap-1.5 mt-6 text-xs" style={{ color: "#999" }}><ShieldCheck className="w-3.5 h-3.5" style={{ color: "#7A6020" }} />{label}</p>;
}
function Meta({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: "#aaa" }}>{label}</p><p style={{ color: "#1E1E1E", fontWeight: 600 }}>{value}</p></div>;
}
function Row({ label, value, strong, gold }: { label: string; value: string; strong?: boolean; gold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: gold ? "#7A6020" : "#777", fontWeight: strong ? 700 : 400 }}>{label}</span>
      <span className="font-numeric" style={{ color: gold ? "#7A6020" : "#1E1E1E", fontWeight: strong ? 800 : 500 }}>{value}</span>
    </div>
  );
}
