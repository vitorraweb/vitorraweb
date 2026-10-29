import type { PostHog } from "posthog-js";
import { readConsent } from "@/lib/cookies";

/* ─── PostHog web analytics ───────────────────────────────────────────────────
   Visitors, live sessions, heatmaps and session replays for the public site.

   - Off unless NEXT_PUBLIC_POSTHOG_KEY is set (the project key, public by
     design; the read key for the console lives only on the API server).
   - Events go through our own /ingest path (next.config.ts rewrites), so ad
     blockers that drop third-party analytics still let page views through.
   - Staff screens and private client links (contracts, trials, invoices)
     are never reported: nothing is sent while the visitor is on one.
   - Consent: until a visitor accepts cookies PostHog keeps no cookie or
     storage (memory only — a visit is counted, the person is not remembered)
     and records no replay. Accepting turns on the cookie and session replay;
     declining switches both off again. Inputs are always masked in replays.
   - No names, emails or phone numbers are ever sent.                      */

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;

/* Never in analytics or replays: staff screens, and the client-only pages
   reached by private link (contracts, trials, invoices, orders, the customer
   portal), in any language. */
const PRIVATE = ["/admin", "/staff", "/display", "/scan", "/teams", "/trial", "/contract", "/invoice", "/pay", "/order", "/account", "/unsubscribe", "/shop/checkout"];
const onPublicPage = () => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/^\/(sw|fr)(?=\/|$)/, "") || "/"; // /sw/account → /account
  return !PRIVATE.some((p) => path === p || path.startsWith(`${p}/`));
};

/** Load and start PostHog once (no-op without a key or on a staff screen). */
export function startPostHog(): Promise<PostHog | null> {
  if (!POSTHOG_KEY || typeof window === "undefined") return Promise.resolve(null);
  if (!onPublicPage() && !client) return Promise.resolve(null);
  loading ??= import("posthog-js").then(({ default: posthog }) => {
    const accepted = readConsent() === "accepted";
    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://eu.posthog.com",
      defaults: "2025-05-24",               // page views on every App Router navigation, page-leave events
      persistence: accepted ? "localStorage+cookie" : "memory",
      disable_session_recording: !accepted,
      person_profiles: "identified_only",   // we never identify visitors, so no person profiles are created
      session_recording: { maskAllInputs: true, maskTextSelector: "[data-ph-mask]" },
      // Belt and braces: drop anything captured while on a staff screen.
      before_send: (event) => (onPublicPage() ? event : null),
    });
    client = posthog;
    return posthog;
  }).catch(() => null);
  return loading;
}

/** Follow a change of cookie choice made on this page. */
export function applyPostHogConsent(accepted: boolean): void {
  if (!client) return;
  client.set_config({ persistence: accepted ? "localStorage+cookie" : "memory" });
  if (accepted && onPublicPage()) client.startSessionRecording();
  else client.stopSessionRecording();
}

/** Pause replay on staff screens; resume on public pages (when consented). */
export function followRoute(): void {
  if (!client) return;
  if (onPublicPage() && readConsent() === "accepted") client.startSessionRecording();
  else client.stopSessionRecording();
}

/** A business event (enquiry sent, call tapped…). Properties must not hold personal data. */
export function capture(event: string, properties: Record<string, string | number | boolean | null | undefined> = {}): void {
  try { client?.capture(event, properties); } catch { /* analytics never breaks the page */ }
}
