/* ─── Feature flags ───────────────────────────────────────────────────────
   Central, dependency-free switches for launch gating. Importable from both
   server and client components (no runtime, just constants).

   COFFEE_SHOP_ENABLED — the coffee retail store (browse → cart → checkout).
   Held OFF until real retail prices are confirmed by the business. While off:
     • /shop shows a premium "retail launching soon" page → enquiry form
     • /shop/[slug], /shop/cart, /shop/checkout redirect to /shop
     • the "Coffee Shop" nav link and cart icon are hidden
     • coffee product-page "Shop now" CTAs soften to "Enquire"
   Flip to `true` (one line) the day prices land — all the e-commerce code is
   left intact, nothing is deleted.                                          */
export const COFFEE_SHOP_ENABLED = false;

/* ONLINE_PAYMENTS_ENABLED — whether to offer "pay online" (Flutterwave: cards +
   MTN/Airtel mobile money) anywhere a customer can be charged (FET reservations
   now; coffee checkout / invoices / installments as they come online).
   Driven by an env var so it can be switched the day the live Flutterwave account
   is ready, without a code change — set NEXT_PUBLIC_ONLINE_PAYMENTS=true on Vercel.
   While off: FET reservations stay "reserve, pay offline" exactly as before, and
   no payment buttons appear. The backend PAYMENT_DRIVER must be set to
   "flutterwave" in tandem (this flag only controls what the customer is offered). */
export const ONLINE_PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_ONLINE_PAYMENTS === "true";

/* TURNSTILE_SITE_KEY — Cloudflare Turnstile site key for the public-form bot
   check (enquiry, contact, newsletter, supplier, careers). Free, privacy-
   friendly. Default-off: when this env var is unset the widget renders nothing
   and the forms submit exactly as before (the backend skips verification too).
   Set NEXT_PUBLIC_TURNSTILE_SITE_KEY on Vercel + TURNSTILE_SECRET_KEY on the
   backend to switch it on.                                                    */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const TURNSTILE_ENABLED = TURNSTILE_SITE_KEY.length > 0;

/* SWAHILI_ENABLED — shows the language switcher and exposes the Swahili (/sw)
   experience. Swahili copy falls back to English for any untranslated key, so
   the site never breaks; this flag simply controls whether visitors are
   offered the switch. Independent of COFFEE_SHOP_ENABLED.                      */
export const SWAHILI_ENABLED = true;
