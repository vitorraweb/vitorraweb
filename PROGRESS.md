# Vitorra Holdings — Progress Snapshot

**Last updated:** 8 June 2026
**Live site:** [vitorra.org](https://vitorra.org) · **API:** api.vitorra.org · **Branch:** `master` (production), `feat/i18n-swahili` (active dev)

> High-level "what's done / what's live / what's left." The week-by-week build
> history lives in `planning/08-rebuild-progress-log.md`; the project brief and
> design system live in `CLAUDE.md` and `planning/`.

---

## Status at a glance

| Area | State |
|------|-------|
| Brand identity & premium design | ✅ Shipped |
| Public marketing pages (Home, About, 4 products, Enquire, Contact, Trust, Blog) | ✅ Complete |
| **Swahili language (whole customer site)** | ✅ **Complete & live** |
| Blog — pages, CMS, content storage, bilingual authoring | ✅ Complete |
| Admin panel (dashboard, enquiries, customers, prospects, blog, media, products, settings, users, orders) | ✅ Functional |
| Customer portal (`/account/*`) | ✅ Built |
| FET pricing + savings calculator + **currency helper** | ✅ Complete |
| Coffee shop (storefront/cart/checkout) | ⏸ Built, gated until retail prices confirmed |
| Live payment gateway | ⛔ Blocked on business account |
| Transactional email provider | ⛔ Pending (Resend) |
| Monitoring, backups, CI/CD | ⛔ Not yet set up |

---

## ✅ Recently shipped (June 2026)

### Swahili language across the whole site
The entire customer-facing site now switches to **Swahili** via a 🌐 EN/SW toggle in the nav, on real `/sw/` web addresses that Google indexes separately.
- Covers: homepage, About, Contact, all 4 product pages (incl. the FET calculator, pricing, and enquiry form), Trust, Shop holding page, the **customer portal**, all **4 legal pages**, and the **blog**.
- English addresses are unchanged; the admin panel stays English by design.
- SEO done properly: per-language page titles/descriptions, `<html lang>`, and a dual-language sitemap with `hreflang` pairing.
- Translations are AI-generated (per the go-live decision) — a native-speaker pass on the **legal** pages is still advisable before heavy promotion.

### Blog — now a real, bilingual publishing system
- Public blog list + article pages, styled to the brand.
- Admin **blog editor** with create/edit/publish, plus a **Swahili tab** so the team can write each post in both languages (any blank Swahili field falls back to English).
- Content is stored safely (Markdown → sanitised HTML) and served per-language with English fallback.

### FET Uganda launch — featured on the site
- The **June 2026 press launch** (covered by Ugnews Line) is now a published, bilingual **blog article** with the event photos and quotes.
- The **homepage "Blog & Insights" section** features the launch (real photos, accurate copy, links to the FET page and the press coverage), and automatically shows real posts as they're published.
- 5 press photos optimised for web (25 MB → 1.1 MB, rotation-corrected).

### Currency conversion helper (new)
- FET prices (quoted in EUR) now show their **≈ UGX / ≈ USD** equivalents, so local buyers grasp the cost instantly.
- A reusable **currency converter** (UGX · USD · EUR) sits on the FET page.
- Backed by the live exchange-rate service (USD **and** EUR rates), with a manual override and a safe fallback. Live rate flips on once the API key is set on the server.

### Contact page + phone numbers
- New **primary phone +256 740 026 294** (the line that always goes through) is now used site-wide for calls and WhatsApp; the previous number is kept as a secondary line. **Both** appear on the footer and contact page.
- **Contact page redesigned** to the homepage's premium standard: dark cinematic hero (gold aurora + grain), quick-contact chips, refined detail cards, clean dark→light→map flow. Fully bilingual.

### Smaller polish
- Replaced the default Next.js favicon with the **Vitorra mark**.
- Faster, earlier scroll-reveal animations (content feels snappier).
- Moved the long build log out of `CLAUDE.md` to keep it under its size limit.

---

## ✅ Already in place (earlier in the rebuild)

- Premium redesign + design system (Cormorant Garamond + DM Sans, gold/charcoal palette, Stripe/Mastercard-inspired effects).
- All public pages, the 9-member team, FET test data + public pricing.
- Admin panel: dashboard, enquiries, **prospects CRM** (163 real leads imported), customers, blog CMS, media library, product management, system settings, users & roles, orders.
- Customer portal (register/login, orders, enquiries, documents, profile).
- Backend APIs: products, blog, enquiry/contact (with team-notification emails), guest checkout (server-side price recompute), exchange rate, settings.
- SEO essentials (robots, sitemap, Open Graph card) + mobile hardening.
- Security fixes: blog XSS closed (sanitised server-side); media uploads behind admin auth.
- Live deployment: frontend on Vercel, backend on Namecheap cPanel (MySQL), DNS/email on GoDaddy (Microsoft 365 untouched).

---

## ⏳ Remaining / pending

**Revenue-blocking**
1. **Live payment gateway** — needs a business account (provider-agnostic skeleton ready for Flutterwave/PayPal).
2. **Transactional email provider** — Resend (order/enquiry emails are built; dev uses a log driver, so the team isn't yet emailed on new contacts/enquiries in production).
3. **Confirm coffee retail prices** → then flip the coffee shop on (one flag) after entering prices in `/admin/products`.

**Operations / pre-launch**
4. Error monitoring (Sentry), uptime alerts (UptimeRobot/BetterStack), automated DB backups, CI/CD.
5. Change the seeded `changeme123` admin/ops passwords.

**Content / lower priority**
6. Native-speaker review of the Swahili **legal** pages.
7. Blog content (team to write posts), client testimonials (consent), coffee product photos, hero videos for SEAL/Coffee/Logistics.
8. WhatsApp Business notifications, Careers page.

---

## 🚀 Server steps still needed on production (Namecheap)

These are one-time backend deploy actions (frontend auto-deploys via Vercel):

```bash
cd /home/okelvaxj/vitorraweb && git pull origin master
cd backend
php artisan migrate --force                              # blog translations table
php artisan db:seed --class=PressLaunchPostSeeder --force # publish the FET launch article
php artisan storage:link                                  # serve admin media uploads
php artisan config:clear && php artisan config:cache      # pick up new code + EXCHANGE_RATE_API_KEY
```

Plus: confirm the live exchange-rate key is active at `api.vitorra.org/api/exchange-rate`
(should show real `ugx_per_usd` **and** `eur_per_usd`, not the 3750 / 0.92 fallbacks).
