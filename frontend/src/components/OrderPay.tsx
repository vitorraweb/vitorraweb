"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { getOrder, getPaymentStatus, payOrder } from "@/lib/api";
import type { Order } from "@/types";

/* ─── Order payment page ──────────────────────────────────────────────────────
   The single, durable place to pay for an order online (FET reservations + the
   coffee shop). Reached from the confirmation email's "Pay now" link, from the
   reserve flow, and as the gateway's return URL (?paid=1). Shows the order, a
   Pay button when it's still owing, and confirms payment on return — so paying
   is never a one-shot redirect that can silently fail.                         */

function money(currency: string, amount: number): string {
  return currency === "UGX"
    ? `UGX ${amount.toLocaleString()}`
    : `${currency === "USD" ? "$" : "€"}${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Phase = "loading" | "view" | "redirecting" | "confirming" | "pending" | "paid" | "payfailed" | "notfound";

const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 2500;

export default function OrderPay({ reference, justPaid }: { reference: string; justPaid: boolean }) {
  const t = useTranslations("payment");
  const [order, setOrder] = useState<Order | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const cancelled = useRef(false);

  const poll = useCallback(async () => {
    cancelled.current = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (cancelled.current) return;
      try {
        const s = await getPaymentStatus(reference);
        if (cancelled.current) return;
        if (s.payment_status === "paid") {
          setPhase("paid");
          setOrder((prev) => (prev ? { ...prev, payment_status: "paid" } : prev));
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
    if (!cancelled.current) setPhase("pending");
  }, [reference]);

  useEffect(() => {
    cancelled.current = false;
    getOrder(reference)
      .then((o) => {
        if (cancelled.current) return;
        setOrder(o);
        if (o.payment_status === "paid") setPhase("paid");
        else if (justPaid) { setPhase("confirming"); poll(); }
        else setPhase("view");
      })
      .catch(() => !cancelled.current && setPhase("notfound"));
    return () => { cancelled.current = true; };
  }, [reference, justPaid, poll]);

  const pay = async () => {
    setPhase("redirecting");
    try {
      const res = await payOrder(reference);
      const url = res.redirect_url;
      if (url) { window.location.assign(url); return; }
      setPhase("payfailed"); // gateway returned no checkout (not live / submit error)
    } catch {
      setPhase("payfailed");
    }
  };

  if (phase === "loading") {
    return <Centered><Loader2 className="w-8 h-8 mx-auto mb-5 animate-spin" style={{ color: "#7A6020" }} /></Centered>;
  }
  if (phase === "notfound") {
    return (
      <Centered>
        <Badge tone="err"><XCircle className="w-7 h-7" style={{ color: "#C0392B" }} strokeWidth={2} /></Badge>
        <Title>{t("errorTitle")}</Title><Body>{t("missingRef")}</Body>
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
        <Title>{t("checkingTitle")}</Title><Body>{t("checkingBody")}</Body>
        <Secured label={t("secured")} />
      </Centered>
    );
  }
  if (phase === "paid" && order) {
    return (
      <Centered>
        <Badge tone="ok"><Check className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2.5} /></Badge>
        <Title>{t("successTitle")}</Title><Body>{t("successBody", { reference: order.reference })}</Body>
        <div className="rounded-[18px] p-5 mt-6 mb-7 text-left" style={{ background: "#FAF8F4", border: "1px solid rgba(197,178,122,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#7A6020" }}>{t("successNextLabel")}</p>
          <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{t("successNextBody")}</p>
        </div>
        <Link href="/account/orders" className="btn-primary w-full justify-center">{t("trackOrder")}<ArrowRight className="w-4 h-4" /></Link>
      </Centered>
    );
  }
  if (phase === "pending" && order) {
    return (
      <Centered>
        <Badge tone="wait"><Clock className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2} /></Badge>
        <Title>{t("pendingTitle")}</Title><Body>{t("pendingBody", { reference: order.reference })}</Body>
        <div className="flex flex-col gap-3 mt-7">
          <button type="button" onClick={() => { setPhase("confirming"); poll(); }} className="btn-secondary w-full justify-center">{t("refresh")}</button>
          <button type="button" onClick={pay} className="btn-primary w-full justify-center">{t("tryAgain")}<ArrowRight className="w-4 h-4" /></button>
        </div>
      </Centered>
    );
  }
  if (phase === "payfailed" && order) {
    return (
      <Centered>
        <Badge tone="err"><XCircle className="w-7 h-7" style={{ color: "#C0392B" }} strokeWidth={2} /></Badge>
        <Title>{t("payFailedTitle")}</Title><Body>{t("payFailedBody")}</Body>
        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          <button type="button" onClick={pay} className="btn-secondary flex-1 justify-center">{t("tryAgain")}</button>
          <Link href="/contact" className="btn-primary flex-1 justify-center">{t("contactUs")}</Link>
        </div>
      </Centered>
    );
  }

  if (!order) return null;

  /* ── View: order summary + Pay button ───────────────────────────────────── */
  return (
    <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-card max-w-lg w-full mx-auto overflow-hidden">
      <div className="p-7 md:p-9">
        <span className="eyebrow block mb-1.5">Vitorra Holdings</span>
        <h1 className="mb-1" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, color: "#1E1E1E" }}>
          {t("payTitle")}
        </h1>
        <p className="text-sm mb-6" style={{ color: "#999" }}>{order.reference}</p>

        <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#aaa" }}>{t("orderSummary")}</p>
        <div className="rounded-2xl border divide-y" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm" style={{ color: "#1E1E1E" }}>{it.product_name}<span style={{ color: "#999" }}> · {t("qty")} {it.quantity}</span></span>
              <span className="text-sm font-numeric shrink-0" style={{ color: "#1E1E1E" }}>{money(order.currency, it.line_total)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-7 md:px-9 py-6 border-t" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
        <button type="button" onClick={pay} className="btn-primary w-full justify-center">
          {t("payNow", { amount: money(order.currency, order.total) })}
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="inline-flex items-center gap-1.5 mt-3 text-xs" style={{ color: "#888" }}>
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#7A6020" }} />
          {t("payNotice")}
        </p>
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
