"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { getPaymentStatus, payOrder } from "@/lib/api";

/* ─── Payment return / confirmation ───────────────────────────────────────────
   Where Pesapal sends the customer back after the hosted checkout. Mobile-money
   approvals are async, so we actively poll the backend (which reconciles with
   Pesapal) for a short window rather than trusting the redirect alone:
     • checking → spinner while we confirm
     • paid     → receipt + what-happens-next
     • pending  → not confirmed yet (still processing, or abandoned) → retry / refresh
     • error    → no reference, or the lookup failed                              */

type Phase = "checking" | "paid" | "pending" | "error";

const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 2500;

export default function PaymentReturn({ reference }: { reference: string | null }) {
  const t = useTranslations("payment");
  const [phase, setPhase] = useState<Phase>(reference ? "checking" : "error");
  const [retrying, setRetrying] = useState(false);
  const cancelled = useRef(false);

  /** Poll the backend up to MAX_ATTEMPTS; resolve to paid as soon as it confirms.
   *  Phase only changes after an await (never synchronously), so re-running this
   *  from an effect can't cascade renders — callers reset to "checking" first. */
  const poll = useCallback(async () => {
    if (!reference) return;
    cancelled.current = false;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (cancelled.current) return;
      try {
        const { payment_status } = await getPaymentStatus(reference);
        if (cancelled.current) return;
        if (payment_status === "paid") {
          setPhase("paid");
          return;
        }
      } catch {
        // Transient — keep trying; only surface an error if we never succeed.
        if (attempt === MAX_ATTEMPTS - 1) {
          if (!cancelled.current) setPhase("error");
          return;
        }
      }
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }

    if (!cancelled.current) setPhase("pending"); // not confirmed within the window
  }, [reference]);

  useEffect(() => {
    // Kick off on a microtask so no setState runs synchronously in the effect body.
    Promise.resolve().then(poll);
    return () => {
      cancelled.current = true;
    };
  }, [poll]);

  /** Re-open the Pesapal hosted page for the same order. */
  const tryAgain = async () => {
    if (!reference || retrying) return;
    setRetrying(true);
    try {
      const payment = await payOrder(reference);
      if (payment.redirect_url) {
        window.location.href = payment.redirect_url;
        return;
      }
    } catch {
      /* fall through — leave the buttons available */
    }
    setRetrying(false);
  };

  /* ── Checking ───────────────────────────────────────────────────────────── */
  if (phase === "checking") {
    return (
      <Card>
        <Loader2 className="w-8 h-8 mx-auto mb-6 animate-spin" style={{ color: "#7A6020" }} />
        <Title>{t("checkingTitle")}</Title>
        <Body>{t("checkingBody")}</Body>
        <Secured label={t("secured")} />
      </Card>
    );
  }

  /* ── Paid ───────────────────────────────────────────────────────────────── */
  if (phase === "paid") {
    return (
      <Card>
        <Badge tone="ok">
          <Check className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2.5} />
        </Badge>
        <Title>{t("successTitle")}</Title>
        <Body>{reference ? t("successBody", { reference }) : t("successTitle")}</Body>
        <div className="rounded-[18px] p-5 mt-6 mb-7 text-left" style={{ background: "#FAF8F4", border: "1px solid rgba(197,178,122,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#7A6020" }}>{t("successNextLabel")}</p>
          <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{t("successNextBody")}</p>
        </div>
        <Link href="/account/orders" className="btn-primary w-full justify-center">
          {t("trackOrder")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Card>
    );
  }

  /* ── Error (no reference / lookup failed) ───────────────────────────────── */
  if (phase === "error") {
    return (
      <Card>
        <Badge tone="err">
          <XCircle className="w-7 h-7" style={{ color: "#C0392B" }} strokeWidth={2} />
        </Badge>
        <Title>{t("errorTitle")}</Title>
        <Body>{reference ? t("errorBody") : t("missingRef")}</Body>
        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          <Link href="/account/orders" className="btn-secondary flex-1 justify-center">{t("trackOrder")}</Link>
          <Link href="/contact" className="btn-primary flex-1 justify-center">{t("contactUs")}</Link>
        </div>
      </Card>
    );
  }

  /* ── Pending (not confirmed within the polling window) ──────────────────── */
  return (
    <Card>
      <Badge tone="wait">
        <Clock className="w-7 h-7" style={{ color: "#7A6020" }} strokeWidth={2} />
      </Badge>
      <Title>{t("pendingTitle")}</Title>
      <Body>{reference ? t("pendingBody", { reference }) : t("pendingTitle")}</Body>
      <div className="flex flex-col gap-3 mt-7">
        <button type="button" onClick={() => { setPhase("checking"); poll(); }} className="btn-secondary w-full justify-center">{t("refresh")}</button>
        <button type="button" onClick={tryAgain} disabled={retrying} className="btn-primary w-full justify-center" style={{ opacity: retrying ? 0.7 : 1 }}>
          {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("tryAgain")}<ArrowRight className="w-4 h-4" /></>}
        </button>
        <Link href="/account/orders" className="text-center text-sm font-semibold mt-1" style={{ color: "#7A6020" }}>
          {t("trackOrder")}
        </Link>
      </div>
    </Card>
  );
}

/* ── Presentational helpers (keep the design-system styling in one place) ──── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[32px] border border-black/[0.06] p-8 md:p-12 text-center shadow-card max-w-lg w-full mx-auto">
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mb-3"
      style={{
        fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
        fontSize: "clamp(26px,3.4vw,40px)",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "#1E1E1E",
      }}
    >
      {children}
    </h1>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-md mx-auto" style={{ fontSize: "15px", lineHeight: 1.7, color: "#555555" }}>
      {children}
    </p>
  );
}

function Badge({ tone, children }: { tone: "ok" | "err" | "wait"; children: React.ReactNode }) {
  const bg = tone === "err" ? "rgba(192,57,43,0.1)" : "rgba(197,178,122,0.15)";
  const border = tone === "err" ? "rgba(192,57,43,0.4)" : "rgba(197,178,122,0.5)";
  return (
    <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: bg, border: `1px solid ${border}` }}>
      {children}
    </div>
  );
}

function Secured({ label }: { label: string }) {
  return (
    <p className="inline-flex items-center gap-1.5 mt-6 text-xs" style={{ color: "#999999" }}>
      <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#7A6020" }} />
      {label}
    </p>
  );
}
