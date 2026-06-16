# Rebuild Progress Log — Vitorra Holdings Limited

> Week-by-week build history. Moved out of `CLAUDE.md` to keep that file lean (it has a 40k-char limit). For current state, what's built, and what's pending, see the relevant sections in `CLAUDE.md`. Full file history also lives in git.

---

## Week 0 — Discovery Planning (2026-05-20 to 2026-05-21)

- Full audit of existing codebase completed
- Rebuild strategy documented and agreed (Next.js + Laravel)
- Marketing Discovery framework designed — 55 structured questions across 7 categories
- Planning documents created in `planning/`

## Week 1 — Discovery Complete & BRD Signed Off (2026-05-30)

- Full Trello board extracted — all 55 discovery questions answered by Marketing + Director
- Complete BRD written: `planning/04-brd-complete.md`
- Phase 1 System Design written: `planning/05-phase1-system-design.md`
- **Phase 0 status: COMPLETE.**

## Week 1 — Build Started (2026-05-30)

- Frontend scaffolded: Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- Backend scaffolded: Laravel 13 + PHP 8.3 (SQLite for dev; PostgreSQL planned for prod)
- Design system adopted: Mastercard architecture × Vitorra Gold identity
- Initial homepage built, Hero carousel, trust bar, product cards

## Week 2–3 — Major UI Sprint (2026-06-03 to present)

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

## Week 4 — Admin Sales & Marketing Upgrade (2026-06-16)

### Communication Hub — Edit customer info + reply templates (2026-06-16)

- **Edit customer info:** because the customer directory is aggregated (no single customer row), added an `override_*` layer via the `customer_notes` table. New fields: `override_name`, `override_phone`, `override_company`, `override_country`. Staff click "Edit info" in the customer detail panel to correct mistakes; overrides take highest priority over all source-record values. Backend: `PUT /admin/customers/info`, migration `2026_06_16_000004`.
- **Reply templates:** a full CRUD system for reusable email templates (`/admin/templates`). Staff create templates with a name, optional category, subject, and body. When composing a reply in the customer panel, a "Use template" dropdown fills subject + body in one click. Backend: `reply_templates` table (migration `2026_06_16_000006`), `ReplyTemplate` model + `ReplyTemplateController`, routes under `perm:customers`. Frontend: `/admin/templates` page with inline create/edit, category filter chips, delete-with-confirm.
- **Newsletter admin UI** (`/admin/newsletter`): 3-tab page — (1) Subscriber list with status filter, email search, pagination; (2) Compose & broadcast (subject + body, subscriber count preview, send); (3) Broadcast history (past sends, recipient count, sender, timestamp). Backend: `newsletter_broadcasts` table (migration `2026_06_16_000005`), `NewsletterBroadcast` model, `broadcast()` and `broadcasts()` on `NewsletterController`. Nav updated with Newsletter (Send icon) and Templates (LayoutTemplate icon).

### Customer Tags / Labels (2026-06-16)

- Added a **tag/label system** to the customer directory. Staff can add any free-text label (e.g. "VIP", "FET Lead", "Follow up") to any customer and remove them individually. Tags are stored as a JSON array in `customer_notes` (migration `2026_06_16_000007`, `tags` column). Each add/remove saves immediately via `PUT /admin/customers/tags`. Displayed as gold chips in the customer detail panel.
- `CustomerNote` model updated: `tags` added to `$fillable` + cast to array.

### CSV Exports (2026-06-16)

- **Customers export:** `GET /admin/customers/export` streams a CSV with columns: Email, Name, Company, Phone, Country, Tags, Stage, Enquiries, Orders, Messages, First Seen, Last Activity. Gold "Export" button in the customer page header.
- **Enquiries export:** `GET /admin/enquiries/export` streams a CSV with columns: ID, Date, Name, Email, Company, Phone, Country, Product, Status, Assigned To, Message. Export button added to the enquiries page header.
- **Prospects export:** `GET /admin/prospects/export` streams a CSV with columns: Name, Industry, Email, Phone, Location, Status, Assigned To, Feedback, Follow-up. Export button added to the prospects page header.
- All three use Laravel's `response()->stream()` (memory-efficient) and a `downloadCsv(path, filename)` utility in `frontend/src/lib/auth.ts` that fetches with the Bearer token and triggers a browser file download (avoids the `<a href>` Bearer-auth limitation).

### Prospect → Enquiry Conversion (2026-06-16)

- **One-click convert:** a "Convert to enquiry" button appears in every expanded prospect detail row. Clicking it calls `POST /admin/prospects/{id}/convert`, which creates a new `Enquiry` record from the prospect's data (name, email, phone, company, location → country, product category → FET) and updates the prospect's `outreach_status` to `converted`. The button is replaced by a green "✓ Converted to enquiry" label after success.
- Closes the long-standing CRM gap: a qualified prospect can now flow directly into the enquiry pipeline with one action — no manual data re-entry.

### Bulk Email to Selected Prospects (2026-06-16)

- **Row checkboxes** on the prospects page (left of each row). Selected rows highlight with a gold border. When any rows are selected, a **sticky dark action bar** appears at the bottom of the screen showing the count and a "Bulk email (N with email)" button.
- **Bulk email modal:** subject input, body textarea, "Use template" dropdown (loads from the reply templates system), Send button. Calls `POST /admin/prospects/bulk-email` with the selected IDs, subject, and body. The backend sends personalised emails via Resend to prospects that have an email address, marks `not_contacted` → `contacted`, and returns sent/skipped counts. The result is shown in the modal before it closes.
- Backend: `ProspectOutreach` Mailable + `emails/prospect-outreach` blade view (includes prospect's first name + sender's reply-to). `bulkEmail()` method on `ProspectController`.
- Selection clears automatically when filters/search/page changes.

### Newsletter Deliverability Fix + Welcome Email (2026-06-16)

- **Welcome email on subscribe (was missing entirely):** the `subscribe()` endpoint previously saved the record and returned JSON with no email sent. Now every new subscriber (and any re-subscriber) receives a branded HTML welcome email (`WelcomeSubscriber` mailable + `emails/welcome-subscriber` blade view — dark header, gold accents, unsubscribe footer link).
- **Broadcast inbox placement fix:** the `NewsletterBroadcast` mailable was missing three headers that Gmail looks for when routing bulk mail. Added: `List-Unsubscribe` (with the per-subscriber token URL), `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (Google's Feb 2024 one-click requirement), and `Precedence: bulk`. The broadcast blade view was also upgraded from bare plain text to a full branded HTML email (matching the welcome email design) — necessary for correct MIME typing and better spam scores.

### Access Control — confirmed correct for all staff (2026-06-16)

- Verified that all new features map to existing permission modules that marketing staff already hold by default: `customers` (tags, export, templates), `enquiries` (export), `prospects` (bulk email, convert, export), `newsletter` (broadcast).
- Marketing members (Thurayya, Sarah, Nagawa) need `role=ops` + `department=marketing` accounts created via `/admin/users` or `php artisan staff:invite <email>` — the department default covers all marketing-relevant modules automatically. Admins (Solomon) get full access automatically.
