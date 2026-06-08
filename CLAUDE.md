# Vitorra Holdings Limited — Project Brief

## Who We Are

**Company:** Vitorra Holdings Limited  
**Website:** vitorra.org  
**Business:** Multi-sector holdings company operating across fuel technology (FET), healthcare (SEAL Wound Spray), premium coffee (Ugandan export), and logistics (freight & supply chain).  
**Primary Market:** Uganda (UGX) + International (USD via PayPal)

---

## Key People

| Role | Name | Contact |
|------|------|---------|
| Director / Boss | Solomon Okello | Decision-maker. Non-technical entrepreneur. Speak in business outcomes, never technical jargon. |
| Engineer / You | John Oluwaseyi | john@vitorra.org / leojohnseyi@gmail.com |
| Head of Operations | Victor Lojum | — |
| Senior Finance Officer | Joseph Rwabu | — |
| Senior Marketing Officer | Thurayya Nakayima | — |
| Finance Officer | Daniel Tuke | — |
| Marketing Officers | Sarah Nuwamanya, Nagawa Shakirah | — |
| IT Officer | John Oluwaseyi | — |
| Brand Designer | Olivia Sandra | — |

> Solomon does not want to hear technical words. Always frame everything as a business problem and business solution — impact on revenue, customers, brand, and risk.

---

## Current State (June 2026)

### Overall Readiness: ~72% Done / 28% Remaining

The priority revenue product (FET) now has a **public full-line pricing guide and an interactive savings calculator** that drives enquiries. The **Coffee Shop has been intentionally taken offline** — held behind a single feature flag until the team confirms real retail prices (coffee is not ready to be sold). The storefront, cart, and checkout code is complete and switches back on in one line. A live payment account remains the blocker on taking card / mobile-money payment (see Payment Strategy).

| Area | Done | Remaining | Status |
|------|------|-----------|--------|
| Brand Identity & Visual Design | **85%** | 15% | Premium redesign shipped |
| Public Pages (Frontend) | **85%** | 15% | Homepage, About, 4 product pages (FET now w/ pricing + calculator), Enquire, Blog done; Coffee Shop gated |
| Technology Foundation (SEO & Growth) | 50% | 50% | ISR on blog/homepage/shop; sitemap pending |
| Security & Customer Trust | 60% | 40% | Server-side price validation added; active risks remain (see Known Issues) |
| Business Operations (Orders, Admin) | 80% | 20% | Checkout built (orders + line items) but paused while coffee is gated; admin order management updated |
| Backend API & Integrations | 55% | 45% | Products, blog, enquiry, contact, orders/checkout wired; payment gateway + email provider pending |
| Reliability & Uptime Systems | 30% | 70% | No monitoring in place |

---

## Rebuild Progress Log

The full week-by-week build history now lives in `planning/08-rebuild-progress-log.md` (moved out to keep this file under its 40k-char limit). The current state, what's built, and what's pending are captured in the sections below; git history holds the rest.

---

## Design System — CURRENT (Updated June 2026)

### Typography (Upgraded from Playfair + Inter)

| Role | Font | Notes |
|------|------|-------|
| Headings H1–H6 | **Cormorant Garamond** | Luxury serif — used by LVMH, premium agencies. High-contrast thin/thick strokes at display sizes. Weights 300–700, normal + italic. CSS var: `--font-playfair` |
| Body + UI | **DM Sans** | Geometric humanist — Notion's font, Google product pages. More distinctive than Inter. Variable font. CSS var: `--font-inter` |

> Both fonts reuse the existing CSS variable names (`--font-playfair`, `--font-inter`) so all components inherit automatically — no component-level changes needed.

### Colour Palette

| Token | Hex | Use |
|-------|-----|-----|
| Vitorra Gold | `#C5B27A` | CTA fills, accents, decorative elements |
| Gold Light | `#D4C49A` | Hover states |
| Gold Dark / Text | `#7A6020` | Readable gold on light surfaces |
| Ivory Canvas | `#F2F2F2` | Default page background |
| Lifted Ivory | `#FAFAF8` | Nested cards, raised sections |
| Charcoal | `#1E1E1E` | Headings, footer, dark hero |
| Body Text | `#454545` | Default body paragraphs |

### Design Language

- **Stripe-inspired** section flow: dramatic dark/light alternation, aurora gradient meshes, clean white product sections
- **Mastercard gestures**: floating pill nav, ghost watermarks, circular team portraits, orbital arcs, stadium cards (40px radius)
- **Premium effects implemented** (see globals.css):
  - `hero-aurora-right` — drifting gold glow on right side of all dark heroes
  - `hero-grain` — film-grain texture overlay on dark sections
  - `float-element` — levitating animation for FET product image
  - `glow-card` — gold border glow on product card hover
  - `stat-card` / `stat-orb` — glassmorphism stat cards with radial gold orb
  - `cta-aurora-1/2/3` — three drifting aurora blobs in Final CTA
  - `auth-cert` — hover gold-left-border on certification list items
  - `authority-grid-bg` — subtle gold grid pattern for authority sections
  - `line-draw` keyframe — gold underline draws left-to-right on stat completion
  - Corner bracket SVGs — luxury editorial framing in FinalCTA
  - Inverted semicircle arc vectors in FinalCTA (mirrors Why Vitorra rising arcs)
  - Digit scramble animation in StatsBand (numbers cycle through random digits then lock)

### Section Flow Principle (All Pages)

Dark → Gold strip → White → Dark → White → Ivory → Dark → Ivory → White. Never two heavy dark sections consecutively.

---

## Pages Built (Frontend — `rebuild` branch)

### Fully Built & Designed

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Homepage | `/` | ✅ Complete | 11-section premium layout |
| About | `/about` | ✅ Complete | 8-section, all 9 team members with photos |
| Fuel Eco Tech | `/products/fuel-eco-tech` | ✅ Complete | VW T5 test data + **public 4-tier pricing guide + savings calculator** (EUR) |
| SEAL Wound Spray | `/products/seal-wound-spray` | ✅ Complete | **Rebuilt from product deck** — chitosan/FDA story, 3 variants, how-it-works, specs, trust signals, safety |
| Vitorra Coffee | `/products/coffee` | ✅ Complete | Aligned with design system |
| Logistics | `/products/logistics` | ✅ Complete | Aligned with design system |
| Enquiry / Quote | `/enquire` | ✅ Complete | Dark hero, sector-adaptive, 3-step form |
| Blog (list) | `/blog` | ✅ Complete | ISR, placeholder state when backend offline |
| Blog (post) | `/blog/[slug]` | ✅ Complete | Dynamic, fetches from API |
| Coffee Shop | `/shop` | ⏸ Gated | Code complete; flag-gated → "launching soon" page until retail prices confirmed |
| Coffee product | `/shop/[slug]` | ⏸ Gated | Built; redirects to `/shop` while gated |
| Cart | `/shop/cart` | ⏸ Gated | Built; redirects to `/shop` while gated |
| Checkout | `/shop/checkout` | ⏸ Gated | Built; redirects to `/shop` while gated |
| Legal pages | `/legal/*` | ✅ Complete | Privacy, T&C, Returns, Cookie Policy |
| Cookie Banner | (component) | ✅ Complete | GDPR-compliant |
| Certifications | `/trust/certifications` | ✅ Complete | URSB registration + cert cards |
| 404 | `/_not-found` | ✅ Complete | Branded |
| Admin panel | `/admin/*` | ✅ Functional | **Dashboard**, enquiries, **customers**, **prospects CRM** (CSV import), **blog CMS** (sanitised), **media library**, **product management**, **system settings** + **users & roles** (admin-only), messages, orders |
| Admin login | `/admin/login` | ✅ Complete | Sanctum auth |
| Contact | `/contact` | ✅ Built | Needs design alignment |

### Pending Build

| Page | Route | Priority |
|------|-------|---------|
| ~~Customer Portal~~ | `/account/*` | ✅ Built (2026-06-04) — register/login, dashboard, orders + detail, enquiries, documents, profile |
| Careers | `/careers` | Low |

---

## Homepage Sections (Current — 11 sections)

1. **Hero** — Cinematic sector-switching (5 sectors, auto-advance, video for FET). Aurora + grain.
2. **Trust Marquee** — Gold strip, seamless credentials ticker, pauses on hover.
3. **Authority** — Compact split panel. Left: "Independently certified. Internationally proven." + large "6" number. Right: 6 certification list items with hover gold-left-border effect.
4. **FET Spotlight** — Dark, gold aurora. Floating product image with 2 badge chips. 3 proof points + quick-fact pills.
5. **Product Suite** — 3 cards (SEAL, Coffee, Logistics) on white with `glow-card` hover.
6. **Testimonials / Proven Results** — VW T5 test report data (13.9% reduction, CTI GmbH signed November 2025). Before/after CSS bars, key findings, 3 metric chips.
7. **Stats Band** — 4 glassmorphism cards on warm ivory. Digit-scramble animation fires on scroll-in. Gold completion line draws after lock.
8. **Sectors Strip** — Centered, Stripe mixed-weight headline. 6 sector icon pills.
9. **Why Vitorra** — Dark glass panels, semi-circle arc vectors.
10. **Team Teaser** — 9 overlapping portrait avatars, tooltip on hover.
11. **Blog Preview** — 3 recent posts (server component). Falls back to editorial placeholders when backend offline.
12. **Certifications** — URSB incorporation credential card.
13. **Final CTA** — White, corner bracket SVGs, inverted arc vectors, 3 aurora clouds, magnetic button.

---

## Key Product Data — FET (Priority Revenue Product)

**VW T5 Test Report (CTI GmbH — November 2025):**
- Vehicle: VW T5, Landesbaubehörde Stadthagen, Hannover, Germany
- Period: January–October 2025
- **Before FET:** 11.52 l/100km over 13,468 km
- **With FET:** 9.92 l/100km (first full month)
- **Reduction: 13.9%** — well above normal operational variation (±3–5%)
- Signed by: Holger Walprecht, CTI GmbH, Lippstadt, 10.11.2025
- Financial: €900–€1,300 annual savings, 3–5 month payback
- Report file: `FUEL ECO TECH PRESENTATION.pdf` + `FET-Test-Report-VW-T5.pdf` in project root

**FET Certifications (all independently issued):**
ISO 9001:2015, ISO 14001:2015, ISO 27001, Zurich Product Liability, AVL Technologies (lab validated), qm-solutions GmbH (German certified)

**FET Full-Line Pricing (from `FET_full_line_pricing.pdf` — Kampala landed + installation, 35% margin):**

| Tier (model) | Fits | Price (EUR, from) |
|--------------|------|-------------------|
| FET-PRO-FI | Compact & mid-range cars, mini-buses (1.4–2.0L) | €365.40 |
| FET-PRO-FII | SUVs, sports, upper-class & large cars (1.5–3.0L) | €630.71 |
| FET-PRO-FIII | Light commercial trucks & vans (3.0–6.7L) | €1,028.69 |
| FET-PRO-FIV | Heavy goods vehicles & haulage (12–13L) | €1,957.30 |

> Prices shown publicly in **EUR as supplied** (Director decision — overrides the BRD's UGX/USD-only rule). Sales motion stays enquiry → free assessment → quote; volume pricing applied at the quote stage. Data file: `frontend/src/lib/fet-pricing.ts`.

---

## Key Product Data — SEAL Hemostatic Wound Spray

Source: `SEAL HEMOSTATIC WOUND SPRAY.pptx` (project root). The SEAL page (`/products/seal-wound-spray`) was rebuilt from this on 2026-06-04.

- **What it is:** an **FDA-cleared (US 510(k))**, **chitosan-based** hemostatic aerosol for rapid bleeding control. Chitosan binds blood cells + platelets to form a fast, stable clot. Sterile chitosan dry-powder formula.
- **Three variants (one formula, three formats):**
  - **SEAL OTC** — 1.5oz, everyday/home/travel.
  - **SEAL PRO** — 2.5oz, ~80 PSI professional grade, first responders & tactical (moderate–severe hemorrhage).
  - **HemoSEAL Pet** — 2.8oz, sting-free, animal first aid (no fur-gluing).
- **Specs:** single-use · **36-month shelf life** · room-temperature storage (no refrigeration) · tested to **MIL-STD-810H** (heat/cold/altitude/humidity) · removal by saline/water + sterile gauze.
- **Trust signals:** FDA 510(k) clearance; field-deployed in EMS/military/tactical (approved by agencies incl. **Maryland EMS**); coagulopathy-tested (animal models); extreme-environment rated; **Made in USA**.
- **Safety (kept on the page — no overpromising):** NOT a tourniquet replacement (but reduces reliance where one can't be applied — neck/groin/underarm); **single-patient use** once activated (multiple wounds on the same patient OK).
- **Regulatory framing for Uganda:** the page presents the product's real **FDA/US** facts and offers full regulatory/compliance docs on enquiry — it does **not** claim Uganda NDA approval (BRD: NDA status pending; no local-approval claims). Efficacy is attributed to the product's testing/clearance, not stated as a Vitorra guarantee.
- **Sales motion:** B2B enquiry → product info → quote (no shop). OTC/Pet imply future B2C, not built at launch.

---

## Team — All Members (Photos in `frontend/public/team/`)

| Name | Role | Tier |
|------|------|------|
| Solomon Okello | Chief Executive Officer | CEO |
| Victor Lojum | Head of Operations | Leadership |
| Joseph Rwabu | Senior Finance Officer | Leadership |
| Thurayya Nakayima | Senior Marketing Officer | Leadership |
| John Oluwaseyi | IT Officer | Officers |
| Sarah Nuwamanya | Marketing Officer | Officers |
| Olivia Sandra | Brand Designer | Officers |
| Daniel Tuke | Finance Officer | Officers |
| Nagawa Shakirah | Marketing Officer | Officers |

All 9 members now have real photos. No placeholder slots remain.

---

## Backend Status (Laravel — `backend/`)

- **Auth:** Sanctum installed, `personal_access_tokens` migration run ✅
- **Database:** SQLite for development (file at `backend/database/database.sqlite`); PostgreSQL planned for prod
- **Migrations:** users, personal_access_tokens, enquiries, contact_messages, products, **orders (header)**, **order_items**, blog_posts, roles
- **Admin accounts seeded:** `admin@vitorra.org` (Admin), `ops@vitorra.org` (Ops) — ⚠ default password `changeme123`, change on first login
- **Coffee catalogue seeded:** GOLD 250g / 1kg / gift box (slugs + prices mirror the storefront)

### API — Implemented ✅

- **Products:** `GET /products`, `/products/{slug}`, `/coffee/products` (returns `price_usd` from cents); **admin CRUD** `GET/POST/GET/PATCH/DELETE /admin/products[/{id}]`
- **Blog:** `GET /blog/posts`, `/blog/posts/{slug}` (serves sanitised `content_html`); **admin CRUD** `GET/POST/GET/PATCH/DELETE /admin/blog/posts[/{id}]`
- **Forms:** `POST /enquiries` (now accepts structured `requirements` JSON from the product-aware form; team email renders the full brief), `POST /contact` — team-notification emails, reply-to → sender
- **Checkout:** `POST /orders` (guest, server-recomputes prices, stock check, reference), `GET /orders/{reference}`
- **Payments (gateway-agnostic):** `POST /orders/{reference}/pay`, `POST /payments/webhook/{provider}`
- **Exchange rate:** `GET /exchange-rate` (cached live rate, config fallback, **admin manual override** via settings)
- **Settings (admin-only):** `GET/PUT /admin/settings` — tax/currency/shipping/notification config
- **Customers:** `GET /admin/customers` (aggregated by email), `GET /admin/customers/detail?email=`, `PUT /admin/customers/note`
- **Users (admin-only):** `GET/POST /admin/users`, `PATCH /admin/users/{id}`, `POST /admin/users/{id}/password`, `DELETE /admin/users/{id}`
- **Media (admin+ops):** `GET/POST /admin/media`, `DELETE /admin/media/{id}` — upload to the public disk
- **Auth:** login, **register** (customer accounts), logout, me
- **Customer portal:** `GET /account/orders`, `/account/orders/{reference}`, `/account/enquiries`, `/account/documents`, `/account/profile` (GET+PUT) — scoped to the user's email
- **Admin:** stats, enquiries, messages, orders (line-item aware), **prospects** (list/filter/search, inline update, CSV import)

### Pending

- **Live payment gateway** — blocked on business account (see Payment Strategy)
- **Real email provider** — Postmark/Resend (dev uses `log` driver)
- **WhatsApp Business** notifications, DHL tracking
- **Decrement stock on payment confirmation** (intentionally not done at order placement)

---

## Payment Strategy (decided 2026-06-03)

- **Stripe is NOT available to a Uganda-registered business** — would require a separate company + bank account in a Stripe-supported country (US/UK/EU). A real legal/accounting step, not just a signup.
- **Decision:** build **provider-agnostic** now, choose the provider once the account is sorted. The Coffee Shop already takes orders; only the card/mobile-money charge waits on this.
- Scaffolded for **Flutterwave** (UGX cards + MTN/Airtel mobile money) + **PayPal** (international USD). Keys in `config/services.php` (empty).
- **Interim:** orders placed as `pending` / unpaid; team confirms payment offline and marks paid in admin.
- **To add a provider:** new class implementing `App\Contracts\PaymentGateway`, add a match arm in `AppServiceProvider`, set `PAYMENT_DRIVER` (`config/payments.php`).

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | **Production branch** (deployed). The rebuild was merged in; the old React/Firebase site lives in history. |
| `rebuild` | Active development branch. Merged to `master` via fast-forward when shipping. |

Repo: `github.com/vitorraweb/vitorraweb`. Recover any old file: `git checkout <old-commit> -- <path>`.

---

## Deployment (live since 2026-06-06)

- **Frontend** → **Vercel**, root directory `frontend/`, at `vitorra.org` + `www.vitorra.org`. Env: `NEXT_PUBLIC_API_URL=https://api.vitorra.org/api`. `frontend/next.config.ts` allows `next/image` from `api.vitorra.org` (uploaded media / blog covers).
- **Backend API** → **Namecheap cPanel** at `api.vitorra.org` (docroot → `backend/public`), PHP 8.3, **MySQL** (prod), deployed via SSH + git. Path on box: `/home/okelvaxj/vitorraweb`. `QUEUE_CONNECTION=sync` (emails send inline — no worker). Redeploy: SSH → `git pull` → `composer install --no-dev` → `php artisan migrate --force` → `php artisan config:cache`.
- **DNS + email at GoDaddy** — nameservers **must stay at GoDaddy** (it runs Microsoft 365 email). ⚠ **Never** touch the M365 MX/SPF/DKIM/autodiscover records or change nameservers. Web records: `A @`/`A api` + `CNAME www`.
- **CORS** (`backend/config/cors.php`): allows apex + www + `localhost:3000` + `FRONTEND_URL`, plus `*.vercel.app` previews (pattern) and comma-separated `CORS_ALLOWED_ORIGINS`. Auth is Bearer-token (stateless), so no cross-subdomain cookie config needed.
- **Fresh-prod note:** dev enquiries/orders were guest test data and don't carry over — empty admin tables on launch are expected. **Prospects** are the only real business data: restore with `php artisan prospects:import --fresh` (loads the 163 cleaned leads from `backend/database/data/fet-prospects.json`).
- **Pending on prod:** live payment gateway + real email provider (Resend planned — use a `send.` subdomain so its SPF/DKIM don't clash with M365); change the seeded `changeme123` admin/ops passwords.
- Full runbook: the deployment plan file (GoDaddy/Vercel/cPanel/Resend steps).

---

## Key Files & Components

| File | Purpose |
|------|---------|
| `frontend/src/app/globals.css` | All design system utilities, keyframes, premium effects |
| `frontend/src/app/layout.tsx` | Font loading (Cormorant Garamond + DM Sans) |
| `frontend/src/app/page.tsx` | Homepage — 11-section layout |
| `frontend/src/components/sections/StatsBand.tsx` | Digit-scramble stat cards |
| `frontend/src/components/sections/Testimonials.tsx` | VW T5 test data section |
| `frontend/src/components/sections/BlogPreview.tsx` | Server component, ISR blog preview |
| `frontend/src/components/sections/FinalCTA.tsx` | White CTA with corner brackets + arc vectors |
| `frontend/src/components/sections/Team.tsx` | Full team constellation (hierarchical) |
| `frontend/src/components/sections/TeamTeaser.tsx` | Homepage 9-avatar stack |
| `frontend/src/components/sections/Hero.tsx` | Sector-switching cinematic hero |
| `frontend/src/lib/constants.ts` | CONTACT_EMAIL, CONTACT_PHONE, API_BASE_URL, PRODUCTS |
| `frontend/src/lib/cart.tsx` | Cart context + `useCart` (localStorage, currency) |
| `frontend/src/lib/config.ts` | Feature flags — `COFFEE_SHOP_ENABLED` (coffee shop gate) |
| `frontend/src/lib/coffee-catalog.ts` | Shop catalogue: API-or-fallback, price formatting |
| `frontend/src/lib/fet-pricing.ts` | FET 4-tier pricing (EUR) + savings-calculator model |
| `frontend/src/lib/enquiry-schema.ts` | Product-aware enquiry question sets (edit here to add/change questions) |
| `scripts/generate_fet_pdfs.py` | Regenerates the FET download PDFs (reportlab) — no RRP/PII |
| `frontend/public/downloads/*` | Public FET PDFs — application guide + datasheet |
| `scripts/import_prospects.py` | Cleans the prospects xlsx → `backend/database/data/fet-prospects.json` |
| `backend/app/Console/Commands/ImportProspects.php` | `php artisan prospects:import` — idempotent prospect loader |
| `backend/app/Http/Controllers/Api/ProspectController.php` | Admin prospects list / inline edit / CSV upload importer |
| `frontend/src/app/admin/prospects/page.tsx` | Prospects CRM UI (filters, search, inline edits, CSV import) |
| `backend/app/Http/Controllers/Api/BlogAdminController.php` | Admin blog CRUD (slug, publish, validation) |
| `frontend/src/components/admin/BlogEditor.tsx` | Markdown post editor (new + edit) |
| `backend/app/Models/Setting.php` | Key/value settings (cached defaults + `get/put`) |
| `backend/app/Http/Controllers/Api/SettingsController.php` | Admin settings read/update |
| `frontend/src/app/admin/settings/page.tsx` | System settings screen (tax/currency/shipping/notifications) |
| `backend/app/Http/Controllers/Api/ProductAdminController.php` | Admin product catalogue CRUD (USD↔cents, slug) |
| `frontend/src/components/admin/ProductEditor.tsx` | Product editor (new + edit) |
| `backend/app/Http/Controllers/Api/CustomerController.php` | Aggregated customer directory (enquiries+orders+messages by email) + notes |
| `frontend/src/app/admin/customers/page.tsx` | Customer directory UI (history + internal note) |
| `backend/app/Http/Controllers/Api/UserAdminController.php` | Team user management (roles, password reset, lockout guards) |
| `frontend/src/app/admin/users/page.tsx` | Users & roles admin screen |
| `backend/app/Http/Controllers/Api/MediaController.php` | Media upload/list/delete (public disk, staff-only) |
| `frontend/src/app/admin/media/page.tsx` | Media library UI (upload, copy URL, delete) |
| `backend/app/Http/Controllers/Api/AccountController.php` | Customer portal API (orders/enquiries/profile/documents by email) |
| `frontend/src/lib/customer-auth.ts` | Customer portal auth (separate token) + register/login |
| `frontend/src/app/account/*` | Customer portal pages (dashboard, orders, enquiries, documents, profile) |
| `frontend/src/components/sections/FetCalculator.tsx` | FET savings calculator — fleet-aware (savings/payback/CO₂), 13.9%-anchored → enquiry |
| `frontend/src/components/sections/FetPricing.tsx` | Public FET full-line pricing guide (4 tiers) |
| `frontend/src/components/shop/ShopComingSoon.tsx` | Premium "retail launching soon" page (shown when coffee gated) |
| `frontend/src/components/shop/*` | ShopGrid, AddToCart, CartView, CheckoutView, CurrencyToggle |
| `backend/app/Http/Controllers/Api/OrderController.php` | Guest checkout — server-side price recompute |
| `backend/app/Contracts/PaymentGateway.php` | Payment provider interface (+ `Services/Payments/ManualGateway`) |
| `backend/config/payments.php` | `PAYMENT_DRIVER` selection |
| `backend/database/seeders/DatabaseSeeder.php` | Admin/ops accounts + coffee catalogue |
| `planning/04-brd-complete.md` | Business Requirements Document (signed off) |
| `planning/05-phase1-system-design.md` | System design + API contract |
| `planning/06-design-system.md` | Design system spec |

---

## PENDING — What Remains

### High Priority (Revenue-blocking)

1. **Live payment gateway** — pick Flutterwave/PayPal (or Stripe via foreign entity) once the business account exists; provider-agnostic skeleton already in place
2. **Real transactional email provider** — Postmark/Resend (order + enquiry emails already built; dev uses `log` driver)
3. **Confirm coffee retail prices** — ⚠ **now gating the live shop.** Coffee retail is switched off (`COFFEE_SHOP_ENABLED = false`) until the team confirms real prices; current placeholders (UGX 38k/135k/82k) are not trusted. Once prices land: edit them in **`/admin/products`** (no code change), then flip the flag back on.
4. **WhatsApp Business** — enquiry/order notifications to Marketing team
5. ~~**Blog admin CRUD**~~ ✅ done (2026-06-04) — `/admin/blog` Markdown CMS (create/edit/publish, sanitised). Team still needs to *write* the posts (content task below).

> Done since last revision: FET full-line pricing guide + savings calculator (EUR), Coffee Shop gated behind a feature flag pending real prices.
> Earlier: Coffee Shop + checkout, orders/order-items API, product/blog/enquiry/contact APIs, order emails, live exchange-rate API.

### Medium Priority

6. **Contact page** — built but needs design alignment with homepage
7. ~~**Customer portal**~~ ✅ done (2026-06-04) — `/account/*` register/login, orders + tracking, enquiry status, documents, profile (invoice download wired to `invoice_url` when present)
8. **Blog content** — team needs to write and publish posts
9. **Testimonials** — written client consent needed before publishing real quotes
10. **Coffee photos** — product photography pending
11. **SEAL/Coffee/Logistics videos** — for hero slides 2–4

### Operations / Pre-Launch

12. **Sentry** error monitoring
13. **UptimeRobot / BetterStack** uptime alerts
14. **Automated daily DB backups**
15. **CI/CD pipeline** (GitHub Actions)
16. ~~**Sitemap + robots.txt**~~ ✅ done (2026-06-04) — `app/sitemap.ts` (pages + live blog posts, graceful fallback) + `app/robots.ts` (blocks /admin, /account, checkout)
17. ~~**Social sharing metadata** (Open Graph)~~ ✅ done (2026-06-04) — generated branded OG/Twitter card (`app/opengraph-image.tsx`, dark + gold) applies site-wide
18. ~~Push `rebuild` branch to GitHub for remote backup~~ ✅ done — branch is on GitHub

### Lower Priority

19. Animation Waves 2–3 (swipe gestures, sticky mobile CTA)
20. Tone-of-voice guide (Marketing)
21. Newsletter unsubscribe flow (GDPR)
22. Careers page

---

## Known Issues (Active — From Original Audit)

### Critical
1. ~~**Security gap in blog content rendering**~~ ✅ **RESOLVED (2026-06-04)** — blog content is authored as Markdown and rendered to sanitised HTML server-side (`Str::markdown` html-strip); public API serves `content_html` only, never raw HTML.
2. ~~**File storage open to all logged-in users**~~ ✅ **RESOLVED (2026-06-04)** — the only upload path (`/admin/media`) is behind admin auth + `role:admin,ops`; type/size-validated.

### High Priority
3. No error or uptime monitoring
4. No automated data backups
5. No CI/CD pipeline

### Medium
6. Exchange rate: live API (set `EXCHANGE_RATE_API_KEY`) with config fallback **and an admin manual override** (`/admin/settings`) — ✅ improved
7. ~~No sitemap or robots.txt~~ ✅ **RESOLVED (2026-06-04)** — `app/sitemap.ts` + `app/robots.ts` + generated OG/Twitter image.

---

## Communication Rules

- Always write reports and updates in **business language** — outcomes, risks, revenue impact
- Never use technical jargon with Solomon or in stakeholder communications
- Email reports go to Solomon (To) with Ops and Marketing (CC)
- John sends from john@vitorra.org (Outlook) — Gmail MCP only reaches leojohnseyi@gmail.com
- When framing progress, lead with what it means for the customer and the business, not what was coded

---

## What "Production Ready" Looks Like for Vitorra

- Visitors immediately understand who Vitorra is, what it does, and why it matters
- The design commands the authority of a premium African holdings company
- Google can find and rank every page — driving organic enquiries without ad spend
- Customers can browse, enquire, and order without confusion
- The team is alerted to any issue before a customer notices it
- Business data is backed up and recoverable
- The platform can scale with business growth without an engineering rewrite
