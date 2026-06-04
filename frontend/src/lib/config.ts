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
