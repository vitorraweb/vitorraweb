/* ─── Lead attribution ────────────────────────────────────────────────────────
   Remembers how this visitor reached the site, so an enquiry can say which
   channel produced it. Until this existed there was no way to answer "we spend
   on Google Ads — what did it produce?", which is the question that came up in
   the 27 August operations review.

   ── Why it has to be captured on arrival ────────────────────────────────────
   The UTM tags and the `gclid` live on the LANDING url and are gone the moment
   the visitor clicks through to another page. `document.referrer` is likewise
   only the external site on that first page — after any internal navigation it
   reads as vitorra.org, which is useless. So the capture runs once, early, and
   the answer is parked for the rest of the session.

   ── Session, not persistent ─────────────────────────────────────────────────
   sessionStorage rather than localStorage: a visit that starts from a Google ad
   today should not still be credited to that ad when the same person types the
   address in next month. One visit, one attribution.

   Nothing here identifies a person. It records which link was clicked, not who
   clicked it, so it needs no consent banner treatment beyond what the site
   already does.
   ─────────────────────────────────────────────────────────────────────────── */

const KEY = "vitorra_attribution";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landing_page?: string;
  first_seen_at?: string;
}

const PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

/** Values longer than this are truncated rather than dropped — a mangled tag is
    still evidence, and the backend truncates again anyway. */
const MAX = 300;

function read(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    // Private mode, blocked storage, or malformed JSON. Attribution is a
    // nice-to-have; it must never break a form.
    return null;
  }
}

/**
 * Capture the current URL's campaign tags and referrer.
 *
 * Called on mount from the root layout. Safe to call repeatedly: an existing
 * record is kept unless this page view carries its own campaign tags, which
 * means a fresh click on a fresh ad and should take precedence.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const found: Attribution = {};

    for (const p of PARAMS) {
      const v = url.searchParams.get(p);
      if (v) found[p] = v.slice(0, MAX);
    }

    const hasCampaign = Object.keys(found).length > 0;
    const existing = read();

    // An existing record wins unless this view is itself a tagged arrival.
    if (existing && !hasCampaign) return;

    // Only an external referrer is worth recording; our own pages tell us
    // nothing we do not already know.
    const ref = document.referrer;
    if (ref && !ref.includes(window.location.host)) {
      found.referrer = ref.slice(0, MAX);
    }

    // Nothing to say: no tags, no external referrer. Leave storage empty so the
    // backend resolves this as "direct" rather than recording an empty object.
    if (!hasCampaign && !found.referrer) return;

    found.landing_page = (url.pathname + url.search).slice(0, MAX);
    found.first_seen_at = new Date().toISOString();

    sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    /* never let attribution break a page render */
  }
}

/** What to send with a form submission. Empty object when nothing was captured. */
export function getAttribution(): Attribution {
  return read() ?? {};
}
