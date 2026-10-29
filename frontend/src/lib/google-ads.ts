import { capture } from "@/lib/posthog";
/* ─── Google Ads tag ──────────────────────────────────────────────────────────
   Marketing pays for Google Ads, and Google can only optimise (and report) on
   what the site tells it: which visits became an enquiry, a call, a
   reservation. This module is that report.

   ── Consent Mode v2 ─────────────────────────────────────────────────────────
   The tag loads for every public visitor, but starts with every storage type
   DENIED. Until the visitor presses "Accept all" Google receives cookieless,
   identifier-redacted pings only (`ads_data_redaction`), which it uses for
   modelled conversions; no advertising cookie is set. Accepting upgrades the
   same page in place; declining keeps it denied. See components/GoogleTag.tsx.

   ── Conversion labels ───────────────────────────────────────────────────────
   Each conversion action created in Google Ads (Goals → Conversions) has a
   label. Set them on Vercel; an action with no label is simply not reported,
   so the site works before Marketing has created them all.
   NEXT_PUBLIC_* values must be read literally to be inlined at build time.
   ─────────────────────────────────────────────────────────────────────────── */

/** The site's Google tag id. Empty disables the tag entirely (e.g. local dev). */
export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? (process.env.NODE_ENV === "production" ? "AW-18227983736" : "");

export type ConversionKind = "enquiry" | "contact" | "reserve" | "newsletter" | "call";

/** The same moments as PostHog events — the console's "Leads from the website" counts the first three. */
const POSTHOG_EVENTS: Record<ConversionKind, string> = {
  enquiry: "enquiry_submitted", contact: "contact_submitted", reserve: "reservation_submitted",
  newsletter: "newsletter_subscribed", call: "call_clicked",
};

const LABELS: Record<ConversionKind, string | undefined> = {
  enquiry: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_ENQUIRY,
  contact: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_CONTACT,
  reserve: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_RESERVE,
  newsletter: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_NEWSLETTER,
  call: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_CALL,
};

/** Routes that are staff tools or unattended screens, never ad landing pages. */
const PRIVATE_PREFIXES = ["/admin", "/staff", "/display", "/scan", "/teams"];

export function isTrackedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return !PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (typeof window === "undefined" || !GOOGLE_ADS_ID) return null;
  const w = window as unknown as { gtag?: Gtag };
  return typeof w.gtag === "function" ? w.gtag : null;
}

/** Consent Mode payload for a choice: everything granted, or everything denied. */
export function consentState(granted: boolean) {
  const v = granted ? "granted" : "denied";
  return { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v };
}

/** Apply the visitor's banner choice to a tag that is already running. */
export function applyConsent(granted: boolean): void {
  const g = gtag();
  if (!g) return;
  g("consent", "update", consentState(granted));
  g("set", "ads_data_redaction", !granted);
}

export interface ConversionDetails {
  /** In major units (shillings, dollars). */
  value?: number;
  currency?: string;
  /** Stops Google counting the same lead twice (e.g. a double-submitted form). */
  transactionId?: string;
  /** Enhanced conversions: Google hashes these in the browser, and only uses them with consent. */
  email?: string;
  phone?: string;
}

/**
 * Report that a visit just produced something worth paying for. Never throws
 * and never delays the form: a blocked tag or a missing label is a no-op.
 */
export function trackConversion(kind: ConversionKind, details: ConversionDetails = {}): void {
  // Product analytics (PostHog) gets the same moment, without any personal data.
  capture(POSTHOG_EVENTS[kind], details.value != null ? { value: details.value, currency: details.currency ?? "UGX" } : {});
  try {
    const label = LABELS[kind];
    const g = gtag();
    if (!g || !label) return;

    if (details.email || details.phone) {
      g("set", "user_data", {
        ...(details.email ? { email: details.email.trim().toLowerCase() } : {}),
        ...(details.phone ? { phone_number: details.phone.replace(/[^\d+]/g, "") } : {}),
      });
    }

    g("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${label}`,
      ...(details.value != null ? { value: details.value, currency: details.currency ?? "UGX" } : {}),
      ...(details.transactionId ? { transaction_id: details.transactionId } : {}),
    });
  } catch {
    /* reporting must never break a submission */
  }
}
