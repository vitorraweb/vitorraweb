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

### Week 0 — Discovery Planning (2026-05-20 to 2026-05-21)

- Full audit of existing codebase completed
- Rebuild strategy documented and agreed (Next.js + Laravel)
- Marketing Discovery framework designed — 55 structured questions across 7 categories
- Planning documents created in `planning/`

### Week 1 — Discovery Complete & BRD Signed Off (2026-05-30)

- Full Trello board extracted — all 55 discovery questions answered by Marketing + Director
- Complete BRD written: `planning/04-brd-complete.md`
- Phase 1 System Design written: `planning/05-phase1-system-design.md`
- **Phase 0 status: COMPLETE.**

### Week 1 — Build Started (2026-05-30)

- Frontend scaffolded: Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- Backend scaffolded: Laravel 13 + PHP 8.3 (SQLite for dev; PostgreSQL planned for prod)
- Design system adopted: Mastercard architecture × Vitorra Gold identity
- Initial homepage built, Hero carousel, trust bar, product cards

### Week 2–3 — Major UI Sprint (2026-06-03 to present)

**This is the most significant build sprint to date.** Full premium redesign across all public pages.

### Week 3 — Coffee Shop + Checkout Backend (2026-06-03)

- **Coffee Shop built** end-to-end: storefront `/shop`, product detail `/shop/[slug]`, cart `/shop/cart`, checkout `/shop/checkout`. Client-side cart with localStorage, UGX/USD currency toggle, cart count in header.
- **Checkout backend wired:** orders restructured into header + `order_items` (multi-item carts with grind/options). Public `POST /orders` recomputes all prices server-side (never trusts the client), checks stock, generates an order reference.
- **Order emails:** customer confirmation + team notification (dev log driver; real provider at launch).
- **Payments made provider-agnostic:** `PaymentGateway` contract + interim `ManualGateway`, webhook route ready. Provider (Flutterwave/PayPal/Stripe) slots in once the business account exists — see Payment Strategy.
- **Bugs fixed:** contact-form email crash (reserved `$message` variable collision) and outdated `replyTo()` usage across enquiry/contact/order mail (Laravel 13). Contact + enquiry emails now functional.
- Full coffee catalogue seeded (GOLD 250g / 1kg / gift box) matching the storefront.

### Week 3 — FET Pricing + Calculator & Coffee Gated (2026-06-04)

- **FET full-line pricing applied.** The supplier pricing sheet (`FET_full_line_pricing.pdf`) was distilled into **4 public device tiers** (FET-PRO-FI → FIV). Shown openly on the FET page as a pricing guide. Prices are displayed in **EUR as supplied** — a deliberate Director decision that overrides the BRD's "UGX/USD only, no EUR" rule.
- **FET savings calculator built** (`FetCalculator.tsx`) — customer picks a vehicle tier and **fleet size**, sets annual km / fuel price / expected-savings %, and sees estimated **annual saving, payback period, and CO₂ avoided** (fleet figures scale with vehicle count — the key B2B lever). The savings slider is **anchored to the 13.9% field-verified result**. Device cost auto-fills from the real tier price. Every result deep-links to a prefilled `/enquire?sector=FET` (calculator summary handed to the enquiry form). FET remains **enquiry-based** — no cart, not merged with coffee.
- **Coffee Shop taken offline** behind a single flag `COFFEE_SHOP_ENABLED` (`frontend/src/lib/config.ts`) because real retail prices aren't confirmed yet. While off: `/shop` is a premium "retail launching soon" page → enquiry form; `/shop/[slug]`, `/cart`, `/checkout` redirect to `/shop`; the Coffee Shop nav link + cart icon are hidden; coffee product-page "Shop now" CTAs soften to "Register interest." **Interim is enquiry-only** (no waitlist capture). All e-commerce code is intact — flip the flag to `true` to restore the store.
- **EnquiryForm** refactored to take prefill via server props (no mount effect) so the calculator/pricing context flows in cleanly.

### Week 3 — Intelligent (product-aware) Enquiry Form (2026-06-04)

- The enquiry form is now **adaptive**: choosing a product reveals only that product's question set (FET, SEAL, Coffee wholesale/export, Logistics), with branching (`showIf`) — e.g. Coffee → Export reveals destination country + export-document checkboxes; Logistics → Hazardous shows a documentation note. Goal: **capture a quote-ready brief so the ops/sales team never has to chase the customer for details.**
- **Schema-driven** — all question sets live in one file, `frontend/src/lib/enquiry-schema.ts`. Add/change a question there; the single renderer (`EnquiryForm`) and the data pipeline pick it up automatically. Field types: single / multi / number / text, with inline + dynamic guidance (e.g. coffee MOQ: 10kg local / 60kg export).
- **Structured data end-to-end:** answers are sent as `requirements` — an ordered list of `{ key, label, value }` display pairs. New `requirements` JSON column on `enquiries` (migration `2026_06_04_000001`), model cast to array, server-side validation. The **team-notification email renders the structured brief** (label: value) so everything arrives at a glance. `message` is now optional context (still required for a General enquiry).
- The FET calculator/pricing deep-links pre-fill `vehicle_type` + `fleet_size` answers, so a fleet buyer lands mid-form with their vehicle already set.
- **Deliberately deterministic** (no AI) for launch reliability — an AI layer (free-text → structured, auto-drafted replies) is a possible future enhancement.
- **Auto-routing + admin display (built 2026-06-04):** each enquiry is auto-assigned to the owning team on submission (FET→Sales & Operations, SEAL→Medical Sales, Coffee→Marketing, Logistics→Operations) via `backend/config/enquiries.php`; `assigned_to` is set and the notification is sent to that team's inbox (env-overridable per team, falls back to `MAIL_TEAM_ADDRESS`). The **admin enquiry panel** now renders the structured requirements as a labelled brief, shows the routed-team badge, filters by product as well as status, and lets an admin **reassign** an enquiry to another team or a specific person (PATCH supports partial updates — status or assignee independently).

### Week 3 — Reporting Dashboard (2026-06-04)

- The admin **dashboard** (`/admin`) is now a reporting view fed by an enriched `GET /admin/stats`: headline KPIs (total enquiries + month-on-month delta, conversion rate, open enquiries, avg first-response time), **enquiries by product** (bar chart) and **enquiry pipeline** (new→in_progress→quoted→converted→closed), plus an **orders & revenue** panel. Revenue is reported **per currency** (UGX shillings / USD cents are never summed together) and is light by design while the coffee shop is gated. `avg first-response time` is real: `replied_at` is now stamped the first time an enquiry leaves "new". Serves both the CEO (exec summary) and Ops (operational) reporting needs from one screen.

### Week 3 — FET Application Data & Downloads (2026-06-04)

- Source docs added to project root: `2026-02-05_Engine overview_Cars_SUV_Sportcars`, `..._Commercial Vehicle_til_40t`, and a Hyundai ix35 field report (all FET).
- **Example vehicles** added per FET tier (`fet-pricing.ts` → shown in the pricing cards; FAQ "will it fit?" made concrete) — e.g. Corolla/Golf/Hiace (FI), Tiguan/RAV4/X5/Sprinter (FII), distribution trucks 5–18t (FIII), long-haul ≤40t (FIV).
- **Two downloadable, cleaned PDFs** on the FET page (pricing section): a **Vehicle Application Guide** and a **Product Datasheet**, in `frontend/public/downloads/`. Generated by `scripts/generate_fet_pdfs.py` (reportlab) — branded, single-page each.
  - ⚠ Both deliberately **omit the base RRP** column (€250/450/750/1450 = pre-margin cost basis; publishing it would expose margin — BRD restriction). Datasheet shows only the **public Kampala selling prices**. The Hyundai registration page (VIN + owner signature) is never used.
- **Hyundai ix35 field report (−0.6 L/100km, ~6.5%, sharper throttle):** held — not published. Needs written customer consent (BRD) and is weaker than the signed CTI/VW-T5 report. Add later as an anonymous 2nd result once consent is confirmed; never the registration page.

### Week 3 — FET Prospects CRM (2026-06-04)

- The marketing team's `FUEL ECO TEC PROSPECTS.xlsx` (165 companies across 10 industry verticals, with outreach status on some sheets) is now a **Prospects CRM in the admin panel**.
- **Cleaned import pipeline** (not a raw load — the sheet had inconsistent headers, a title row, an empty sheet, column drift, 8 bad emails, dupes): `scripts/import_prospects.py` (openpyxl) normalises → `backend/database/data/fet-prospects.json`; `php artisan prospects:import` upserts idempotently (firstOrCreate by name+category — never clobbers manual edits). **163 imported.**
- **`prospects` table** (migration `2026_06_04_000002`): name, category (vertical), product, location, phone, email, outreach_status (not_contacted→contacted→delivered/bounced→responded→qualified→converted/not_interested), feedback, follow_up, assigned_to, flags (bad_email/no_contact), source.
- **Admin `/admin/prospects`:** filter by industry + status, search, pagination, inline status/assignment/feedback/follow-up editing, data-hygiene flags, and a **CSV upload importer** (marketing can add new lists themselves — category-scoped, dedupes). Dashboard has a **FET prospect outreach** tile (total / reached / converted / needs-fixing + top industries). Dashboard `GET /admin/stats` extended with a `prospects` block.
- **Admin CSV importer hardened (2026-06-06):** the upload importer now detects fields by **content, not column position** (mirrors `import_prospects.py`) — strips the BOM, finds the real header row (skipping any title rows), then per row takes name = first cell, email = the cell containing `@`, phone = cells with 7+ digits (joined by ` / `), location = first text cell, scanning only the columns before the status column. Fixes the launch bug where the marketing workbook's title row + drifted columns made every uploaded prospect flag `no_contact`. Re-uploads of the team's exact sheet (saved as CSV) now parse correctly. Cleanup/restore of the 163 clean leads on a fresh prod DB: `php artisan prospects:import --fresh`.
- **Next (not built):** one-click **convert prospect → enquiry** (links the CRM into the enquiry pipeline + conversion metric); email/WhatsApp outreach once those providers are live.

### Week 3 — Blog CMS + XSS fix (2026-06-04)

- **Blog CMS built** (`/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]/edit`): list/filter by status, create/edit/delete, auto-slug (unique), draft ↔ publish (stamps/clears `published_at`), SEO fields. Backend `BlogAdminController` (admin CRUD) + routes. Shared `BlogEditor` component. **Closes BRD pending #5 (Blog admin CRUD)** — the team can now write & publish posts.
- **Critical blog XSS gap CLOSED.** Posts are authored in **Markdown**; the public API renders to **sanitised HTML server-side** via Laravel's bundled CommonMark (`Str::markdown` with `html_input=strip`, `allow_unsafe_links=false`) — raw HTML/`<script>`/`javascript:` links are stripped. `BlogController::show` now returns `content_html` (sanitised) and hides raw `content`; the public post page renders `content_html`. No new dependency. (Was Known Issue → Critical #1.)

### Week 3 — System Settings (2026-06-04)

- **`/admin/settings`** (admin-role only) — a key/value settings store + screen so launch config is changeable without code/`.env` edits: **Tax** (Uganda VAT toggle + rate + "registration in progress" notice — dormant until switched on), **Currency** (live vs **manual USD→UGX override**), **Shipping** (coffee Kampala/national rates + international note), **Notifications** (team email, WhatsApp number).
- Backend: `settings` table (migration `2026_06_04_000003`), `Setting` model (cached defaults-merged-with-stored, `get/put`), `SettingsController` (index/update), routes under an inner `role:admin` group.
- **Wired now:** the manual exchange-rate override — `GET /exchange-rate` returns the manual rate (with `source: manual|live`) when set. **Stored, not yet wired:** VAT + shipping into checkout (coffee shop is gated; consume these when it relaunches). Closes the admin-audit "System Settings" gap and supports the BRD's "tax-ready, activatable without code changes."

### Week 3 — Product Management (2026-06-04)

- **`/admin/products`** (admin + ops) — manage the product catalogue: list/filter by category, create/edit/delete, publish toggle, prices (UGX + USD), stock, images (one URL per line), and meta (tagline/weight/roast/origin/tasting-notes/badge). Especially for **editing coffee prices/stock when real prices land** (the coffee SKUs live in this table).
- Backend `ProductAdminController` (CRUD, auto-unique slug, **USD dollars ↔ `price_usd_cents`** conversion, category case-normalised, meta whitelist). Routes under the admin group. Shared `ProductEditor` component (new + edit). Closes the admin-audit "Product management" gap.
- Note: the public `/products/*` marketing pages are hardcoded React (not catalogue-driven); this manages the **products table** (the coffee shop SKUs + any future catalogue items).

### Week 3 — Customer Management (2026-06-04)

- **`/admin/customers`** (admin + ops) — a contact directory of **everyone who's engaged**, since there are no registered accounts yet (orders/enquiries are guest). Aggregated **by email** across `enquiries` + `orders` + `contact_messages`: search, per-contact counts, last-activity, and an expandable detail showing that person's full history (enquiries / orders / messages) + an **editable internal note**.
- Backend `CustomerController` (`index` aggregate, `detail?email=`, `note` upsert); emails matched case-insensitively (e.g. `BUYER@` and `buyer@` merge); most-recent non-empty name/company/phone/country wins. Notes live in a new `customer_notes` table (migration `2026_06_04_000004`) keyed by email. Closes the admin-audit "Customer management" gap.
- When customer **accounts** (registration/portal) are built later, this can fold in registered users too.

### Week 3 — Users & Roles (2026-06-04)

- **`/admin/users`** (admin-only) — manage team accounts so staff have their own logins instead of sharing the two seeded ones: add user (name/email/role/temp password), edit name/email/role, reset password, remove. Each member can now be Victor, Thurayya, Sarah, etc.
- Roles are **`admin`** (full access incl. settings + user management) and **`ops`** (day-to-day; no settings/users) — the two the `RequireRole` middleware actually enforces. **Lockout guards:** can't delete your own account, and can't delete or demote the **last admin**. Passwords hashed via the model cast.
- Backend `UserAdminController` under the inner `role:admin` group. Finer roles (marketing/CEO-view from the BRD) are a future step — they'd need new middleware/route mappings to mean anything. Closes the admin-audit "Users & roles" gap.

### Week 3 — Media Library (2026-06-04)

- **`/admin/media`** (admin + ops) — upload images / PDFs / videos, browse a thumbnail grid, **copy a URL** to paste into blog cover images, product images, etc., and delete. Filter by type.
- Backend `MediaController` + `media` table (migration `2026_06_04_000005`); files stored on the Laravel **`public` disk** (`storage/app/public/media`, served at `APP_URL/storage/...` via `php artisan storage:link` — **run that in prod**). 20 MB/file cap, type-whitelisted (jpg/png/webp/gif/svg/pdf/mp4/webm).
- **Closes Known Issue (Critical #2):** uploads sit behind the admin auth + `role:admin,ops` guard — no longer "open to all logged-in users." (Cloud storage — Cloudinary/S3 per BRD — is a swap of the Laravel disk at launch; no code rewrite.)
- Note: to render a backend `/storage/...` image through Next's `<Image>` you'd add the backend host to `next.config` remotePatterns; the media grid uses plain `<img>` and blog markdown images render as plain `<img>`, so those already work.

### Week 3 — Customer Portal (2026-06-04)

- **`/account/*` built** (was 8 empty folders): register, login, dashboard, orders, order detail, enquiries, documents, profile. Premium portal shell (public Header/Footer + tab nav), guarded; **separate customer auth** (its own localStorage token key) so it never collides with an admin session.
- Backend: `POST /auth/register` (creates a `customer`-role user + token) + an **`account` API** under `auth:sanctum` (`/account/orders`, `/orders/{reference}`, `/enquiries`, `/documents`, `/profile` GET+PUT). Controller `AccountController`.
- **How a customer sees "their" data:** orders/enquiries are guest records keyed by email, so the portal shows records matching the **logged-in user's email** (case-insensitive). When real B2C ordering resumes (coffee), and/or enquiries start linking `user_id`, this still works. Closes the admin-audit "Customer portal" gap (the last fully-unbuilt area).
- **Entry points (how customers reach it):** a person icon in the **header** pill nav (+ "My Account" in the mobile menu), a **"Create an account to track this enquiry"** prompt on the enquiry success screen, and a footer "My Account" link. All route to `/account/dashboard`, which redirects to `/account/login` when signed out.

### Week 3 — SEO essentials + Mobile responsiveness (2026-06-04)

- **SEO:** `app/robots.ts` (`/robots.txt` — blocks /admin, /account, checkout), `app/sitemap.ts` (`/sitemap.xml` — public pages + live blog posts, graceful fallback), and a generated branded **Open Graph / Twitter card** (`app/opengraph-image.tsx`, dark + gold) applied site-wide. Closes Known-Issue #7.
- **Mobile (Android + iOS) hardening:** explicit `viewport` (device-width, `viewport-fit: cover`), `overflow-x: clip` (no horizontal scroll, keeps sticky working), `text-size-adjust` + tap-highlight reset, **16px inputs on phones** (kills iOS focus-zoom), `100dvh` auth screen (iOS address-bar fix), safe-area insets on the floating nav + cookie banner.
- **Mobile fixes:** product/shop **hero content no longer slides under the fixed nav** (heroes switched `justify-end` → `mt-auto` + top clearance, so tall content can't overflow upward); **hero CTAs go full-width on phones** (`.hero-cta`); customer-portal **tabs scroll horizontally** on mobile instead of wrapping. (Visual device-width QA still recommended.)

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
