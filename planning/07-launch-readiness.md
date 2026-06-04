# Launch Readiness — Remaining Tasks

**Updated:** 2026-06-04
**Source:** Phase 1 "Definition of Done" (`05-phase1-system-design.md` §10) + BRD integrations (§4.7), reconciled against the current build.
**Legend:** [Eng] engineering · [Business] needs an external account/decision · [Marketing] content/assets

---

## ✅ Recently completed (this build cycle)

Platform / app: FET full-line pricing guide + savings calculator (fleet/CO₂/13.9%-anchored), coffee shop gated behind a flag pending prices, intelligent product-aware enquiry form (structured data + auto-routing + reassign), customer portal (`/account/*`, premium UI), premium auth pages.

Admin panel (now essentially complete): reporting dashboard, enquiries, **prospects CRM** (163 leads imported + CSV importer), **blog CMS**, **product management**, **customer management**, **users & roles**, **media library** (+ cataloged 44 existing assets), **system settings** (tax/currency/shipping/notifications).

Security: **both Critical issues resolved** — blog XSS (server-side markdown sanitisation) and open file uploads (staff-only, validated).

---

## 🔴 URGENT

### Revenue-blocking (cannot take money until done)
1. **Live payment gateway** [Business] — Flutterwave (UGX) + PayPal (USD). Provider-agnostic skeleton is in place; blocked on the business account/legal step. *The #1 blocker.*
2. **Real transactional email provider** [Business→Eng] — Postmark / Resend / Mailgun. Emails are built but use the dev `log` driver, so **order/enquiry emails are not actually being delivered** today. Critical for the live enquiry funnel. (Eng wires it once the account exists.)
3. **Confirm coffee retail prices** [Business] — gates the live shop. Once confirmed: edit in `/admin/products`, then flip `COFFEE_SHOP_ENABLED`.

### Launch-critical, pure-code (no external account — can be done now)
4. ✅ **Sitemap.xml + robots.txt** [Eng] — DONE 2026-06-04. `app/sitemap.ts` (public pages + live blog posts, graceful fallback) + `app/robots.ts` (blocks /admin, /account, checkout).
5. ✅ **Open Graph / social preview images** [Eng] — DONE 2026-06-04. Generated branded OG/Twitter card (`app/opengraph-image.tsx`) applies site-wide; pages contribute their own title/description.

---

## 🟠 PENDING

### Integrations (need external accounts/keys)
6. **WhatsApp Business API** [Business] — enquiry/order alerts to the marketing team (BRD priority).
7. **Live exchange-rate API key** [Business] — set `EXCHANGE_RATE_API_KEY`; today it runs on a config fallback + manual override.
8. **Google Analytics** [Business→Eng] — traffic & conversion tracking.
9. **DHL API** [Business] — international coffee shipping rates + tracking (only relevant once the shop relaunches).

### Reliability & operations (pre-launch)
10. **Sentry** error monitoring [Eng+account].
11. **Uptime monitoring** (UptimeRobot / BetterStack) [Eng+account].
12. **Automated daily database backups** [Eng/infra].
13. **CI/CD pipeline** (GitHub Actions) [Eng].

### Content & assets (Marketing/Business — not engineering)
14. **Blog content** [Marketing] — CMS is ready; write ≥4 launch posts.
15. **Testimonials** [Marketing] — obtain written client consent before publishing.
16. **Coffee product photography** [Marketing].
17. **Hero videos** for SEAL / Coffee / Logistics slides [Marketing].
18. **Certifications/trust documents** [Business] — management to confirm which are public.

---

## 🟢 IMPROVEMENTS (post-launch / polish)

19. **Contact page** [Eng] — built; needs design alignment with the homepage.
20. **Convert prospect → enquiry** [Eng] — one-click, linking the prospects CRM into the enquiry pipeline + conversion metric.
21. **"Pick from media library"** picker inside the blog/product editors [Eng].
22. **Wire VAT + shipping settings into checkout** [Eng] — settings exist; consume them when the coffee shop relaunches.
23. **Dedicated reports pages + CSV export** [Eng] — the dashboard already covers most reporting.
24. **Finer admin roles** (Marketing Manager, CEO read-only view) [Eng] — needs route-middleware mapping.
25. **Hyundai ix35 field report** [Business] — add as a 2nd FET proof point once written consent is obtained (never the registration/VIN page).
26. **Newsletter + GDPR unsubscribe flow** [Eng].
27. **Careers page** [Eng/Marketing] — Phase 2.
28. **Animation waves 2–3** (swipe gestures, sticky mobile CTA) [Eng].
29. **Tone-of-voice guide** [Marketing].

---

## 🧪 Pre-launch QA (Definition of Done)

- **Mobile hardening done (2026-06-04)** [Eng]: explicit viewport (`device-width`, `viewport-fit: cover`), `overflow-x: clip` (no horizontal scroll, sticky preserved), `text-size-adjust` + tap-highlight reset, **16px inputs on phones (kills iOS focus-zoom)**, `100dvh` auth screen (iOS address-bar fix), safe-area insets on the floating nav + cookie banner.
- **Mobile fixes round 2 (2026-06-04)** [Eng]: product/shop hero content no longer slides under the fixed nav on phones (switched heroes from `justify-end` → `mt-auto` + top clearance, so tall content can't overflow upward); hero CTA buttons go **full-width on phones** (`.hero-cta`); customer portal tabs now **scroll horizontally** on mobile instead of wrapping; trimmed auth-screen padding. **Still recommended:** a visual pass on real iPhone/Android widths to catch any page-specific issues.
- Cross-browser + mobile testing (Android/iOS) — visual device pass pending.
- Google PageSpeed ≥ 80 (mobile + desktop).
- End-to-end payment testing (once a gateway is live).
- Confirm all automated emails send (once a provider is live).
- Final SEO audit (sitemap submitted, meta tags, structured data).
