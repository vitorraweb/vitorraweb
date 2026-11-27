import { readConsent } from "@/lib/cookies";

/* ─── Meta Pixel (Facebook / Instagram ads) ───────────────────────────────────
   The Vitorra Digital starter websites are advertised on Facebook and
   Instagram. Meta can only optimise an ad (and say what it produced) if the
   site tells it which visits became a lead. This module is that report.

   - Off unless NEXT_PUBLIC_META_PIXEL_ID is set on Vercel (the pixel ID from
     Meta Events Manager; public by design). No ID lives in the code.
   - Strictly opt-in. Unlike Google, Meta has no cookieless mode: the pixel
     sets an advertising cookie the moment it loads. So nothing is loaded,
     and no request reaches Meta, until the visitor presses "Accept all" on
     the cookie banner. Declining later revokes it on the page.
   - Never on staff screens or private client links (the component checks
     the route; see components/MetaPixel.tsx).
   - Events carry no name, email or phone (no "advanced matching"). Each lead
     carries an event ID made from the lead's own number, so Meta counts a
     lead once, and a later server-side feed (Conversions API) could reuse it.
   ─────────────────────────────────────────────────────────────────────────── */

const configured = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
/** Only a real pixel ID (digits) is accepted; anything else disables the pixel. */
export const META_PIXEL_ID = /^\d{6,20}$/.test(configured) ? configured : "";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

let started = false;

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof f === "function" ? f : null;
}

/**
 * Load the pixel and count this page view. A no-op without an ID, without
 * consent, or when already running. The bootstrap is Meta's standard queue
 * stub: calls made before fbevents.js arrives are replayed when it does.
 */
export function startMetaPixel(): boolean {
  if (!META_PIXEL_ID || typeof window === "undefined") return false;
  if (readConsent() !== "accepted") return false;
  if (started) {
    fbq()?.("consent", "grant");
    return false;
  }
  started = true;
  try {
    const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
    if (!w.fbq) {
      const n = function (this: unknown) {
        // Meta's stub queues the raw arguments object; fbevents.js replays it.
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        if (n.callMethod) n.callMethod(...Array.from(args));
        else n.queue!.push(args);
      } as Fbq;
      w.fbq = n;
      if (!w._fbq) w._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    w.fbq!("init", META_PIXEL_ID);
    w.fbq!("track", "PageView");
    return true;
  } catch {
    return false; /* advertising must never break a page */
  }
}

/** Follow a change of cookie choice made on this page. */
export function applyMetaConsent(accepted: boolean): void {
  if (accepted) {
    startMetaPixel();
    return;
  }
  try { fbq()?.("consent", "revoke"); } catch { /* ignore */ }
}

/** A page view after an in-app navigation (the first one is sent on start). */
export function metaPageView(): void {
  if (!started || readConsent() !== "accepted") return;
  try { fbq()?.("track", "PageView"); } catch { /* ignore */ }
}

/**
 * Report a standard Meta event ("Lead", "Contact") or, with `custom`, one of
 * our own. Silently does nothing when the pixel is not running.
 */
export function trackMeta(
  event: string,
  params: Record<string, string | number> = {},
  eventId?: string,
  custom = false,
): void {
  if (!started || readConsent() !== "accepted") return;
  try {
    fbq()?.(custom ? "trackCustom" : "track", event, params, eventId ? { eventID: eventId } : undefined);
  } catch {
    /* reporting must never break a submission */
  }
}
