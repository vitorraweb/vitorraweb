# Vitorra Holdings — Progress Snapshot

**Last updated:** 1 July 2026
**Live site:** [vitorra.org](https://vitorra.org) · **API:** api.vitorra.org · **Branch:** `master` (production)

> High-level "what's done / what's live / what's left." The week-by-week build
> history lives in `planning/08-rebuild-progress-log.md`; the project brief and
> design system live in `CLAUDE.md` and `planning/`.

---

## Status at a glance

| Area | State |
|------|-------|
| Brand identity & premium design | ✅ Shipped |
| Public marketing pages (Home, About, 4 products, Enquire, Contact, Trust, Blog) | ✅ Complete |
| Swahili language (whole customer site) | ✅ Complete & live |
| Blog — pages, bilingual CMS, content storage | ✅ Complete |
| Admin panel (dashboard, enquiries, customers, pipeline, prospects, blog, media, products, settings, users, orders, newsletter, tasks, templates) | ✅ Functional |
| Customer portal (`/account/*`) | ✅ Built |
| FET pricing + savings calculator + currency helper | ✅ Complete |
| **FET proven-savings loop** (per-vehicle measured savings, fleet rollups, monthly digest) | ✅ **Built (Phases 1–2)** |
| Transactional email (Resend) | ✅ Live in production |
| **Account security — self-service password change + auto-expiring sessions** | ✅ **Done** |
| **Security hardening** (2FA, audit log, login throttle, token scoping, encrypted files, cookie-auth option) | ✅ **Done** |
| **Internal operations platform** (Staff/HR, CEO report, Suppliers, Installments) | ✅ **Built & deployed** |
| **Accounting — "Vitorra Books"** (ledger, invoicing, VAT, AI receipts, recurring) | ✅ **Built & deployed** |
| Coffee shop (storefront/cart/checkout) | ⏸ Built, gated until retail prices confirmed |
| **Online payments — Pesapal** (cards + MTN/Airtel) across FET reserve, invoices, installments, coffee | ✅ **Built & tested** — needs activation (keys + IPN) |
| **Multilingual careers portal** (EN / SW / **FR** pilot) | ✅ **Built** |
| **Zero-cost upgrades** (keyless FX, auto holidays, phone validation) | ✅ **Built** |
| **Reception lobby display** (`/display` — clock, weather, FET film, certifications, news ticker) | ✅ **Built** — point the front-desk TV's browser at it |
| Monitoring / backups / CI/CD | ⏳ Sentry DSNs configured; uptime/backups/CI still to verify |

---

## ✅ Internal operations platform (June 2026)

Built from the Head of Finance's brief — a full internal suite on top of the marketing site. All shipped, tested (108 backend tests), and deployed.

### Staff / HR portal — `vitorra.org/staff`
Every employee gets a login (new `employee` role). They can:
- Change their own password; see their **contract & HR documents** (stored privately).
- See their **supervisor**; supervisors see **their team**.
- **Apply for leave** — the system counts working days (excludes weekends + Uganda public holidays), stops two teammates in the same department booking the same dates, respects company-event blackouts, and tracks the annual balance. Sick leave needs a medical document. Supervisors/HR approve; everyone's emailed.
- File a **monthly work report** (checklist + summary); supervisors rate and comment.

**Admin side:** Leave approvals, a **Holidays & events** manager (Uganda 2026 seeded), and a **Probation watch** (who's in their first 3 months, days left, whether they're reporting). Staff get **automatic holiday reminders** ~3 days ahead.

### Recruitment — public `vitorra.org/careers`
Job board + apply page where a candidate **uploads a CV and AI reads it to pre-fill** their details (Claude). Admin reviews applicants through a pipeline (new → review → shortlist → hired/rejected) and downloads CVs. Candidate data auto-deletes after 6 months.

### CEO finance report — `/admin/executive`
A one-glance business dashboard for Solomon (money received, money owed, new orders/enquiries, conversion, demand) with up/down arrows vs. the previous period — and the same summary **emailed automatically every month and week** to the CEO (CC Ops/Finance).

### Supplier onboarding — public `vitorra.org/suppliers`
Suppliers self-register (company info, **encrypted bank details**, documents). Ops reviews, approves/rejects, and can **assign someone to approve**.

### B2B installments
Any order can be set up as a **pay-in-parts plan**; staff record each payment as it arrives and the order's status updates automatically (pending → partially paid → paid). The customer sees the schedule and balance in their account.

### Accounting — "Vitorra Books" — `/admin/accounting`
A multi-currency bookkeeping tool with a **maker–checker** rule: the junior finance officer records entries; the senior officer approves them (only then do they count). Covers:
- **Accounts** (bank/cash/mobile-money balances), a categorised **money ledger** (in/out/transfer), **supplier bills** (what we owe), **budgets** (actual-vs-cap), and reports — profit & loss, cash on hand, and **profit by business line** (FET/SEAL/Coffee/Logistics). These feed the CEO's Executive screen ("from the books").
- **Customer invoicing:** create branded, numbered invoices with VAT, send them as a PDF, track paid/overdue, and **chase late payers automatically**.
- **AI receipt capture:** snap/upload a receipt and it's read automatically to fill in the expense.
- **VAT** tracking (charged vs. paid) with a VAT summary, **recurring** monthly entries (rent/salaries), and a one-click **CSV export for the accountant**.
- Senior vs junior is enforced: the **Senior Finance Officer** needs "Accounting — approve" ticked in `/admin/staff`; the junior records only.

---

## ✅ Security hardening (June 2026)

A focused pass after a full audit of the staff/finance/ops modules, in business terms: protecting confidential staff, finance and supplier data, and the money tools, against stolen passwords, lost devices, and leaked files.

- **Two-factor authentication (2FA):** any staff member can switch on app-based 2FA (Google/Microsoft Authenticator, Authy) from their profile — a code on login on top of the password, with one-time recovery codes for a lost phone. Self-service and optional, so nobody is locked out.
- **Activity log (`/admin/audit`, admin-only):** a tamper-evident record of who opened a contract, medical note, CV or supplier bank details, and who approved/voided money or changed a role — accountability after the fact.
- **Confidential files encrypted at rest:** HR documents, medical notes, supplier documents, CVs and finance receipts are now scrambled on disk, so a stolen backup or server copy is useless without the company key.
- **Tighter access:** medical notes are HR-only (a line manager can approve leave but can't open the doctor's note); staff sessions are short; sign-in is rate-limited against password guessing; an admin-set password reset signs that person out everywhere.
- **Active sessions:** everyone can see their signed-in devices and "sign out other devices" from their profile.
- **Stronger passwords:** 12+ characters and a check against known-breached passwords (in production).
- **Session isolation:** a sign-in is scoped to the portal it was made on, so a staff-portal session can't be used to reach the admin panel.
- **Login can move to HttpOnly cookies** (a further hardening against browser-script attacks) — built and ready, switched on via configuration when the team chooses; the default is unchanged until then.

> Technical detail (engineering): TOTP via `pragmarx/google2fa`; `activity_logs` table + `App\Support\Audit`; `App\Support\SecureFile` (encrypt-on-store, transparent decrypt, legacy-plaintext safe); Sanctum token abilities (`admin`/`staff`/`customer`) gated by `RequireTokenAbility`; `Password::defaults()` (min 12 + `uncompromised()` in prod); cookie mode via `statefulApi()` + `NEXT_PUBLIC_AUTH_MODE`/`SANCTUM_STATEFUL_DOMAINS`. Covered by feature tests (Tier1Security, TwoFactor, TokenScope, Sessions, SecureFile).

---

## ✅ FET proven-savings loop (June 2026)

Turns the priority product's headline — an independent German test measuring a **13.9% fuel cut** — into **measured, per-vehicle proof** for every customer. Built in phases; revenue work that needs none of the open blockers (no payment gateway, no coffee prices).

### Phase 1 — record installs & prove savings
- **Staff** record each device fitted to a customer's vehicle and log fuel readings (`/admin/fet`, new "FET savings" module — on by default for Leadership / Operations / Sales).
- Savings are **measured, not estimated**: fuel use is worked out brim-to-brim from the readings (litres between odometer points ÷ distance) and compared to a baseline — a measured "before" period if available, otherwise a declared figure, otherwise the typical figure for the vehicle class. Shows fuel reduction %, litres, money and CO₂ saved, against the verified 13.9%.
- **Customers** see their own measured savings, **log their own fill-ups**, and download a branded **"Proven Savings" certificate (PDF)** from a new bilingual **Fuel savings** tab in `/account`.
- Number plates are **encrypted at rest** (PII); everything is attributed to the customer's own readings, never claimed as a Vitorra guarantee.

### Phase 2 — make it active
- **Fleet rollups** for B2B customers: a customer's vehicles roll into one headline (distance-weighted average reduction, total fuel + CO₂, money saved kept **separate per currency**). Shown to the customer (`/account/fet`) and book-wide to staff (`/admin/fet`).
- **Monthly savings digest** (`fet:digest`, rides the existing cron): emails each customer their measured savings in business language, with a built-in **nudge to log overdue (45-day+) readings** — so the proof keeps building itself. Silent when there's nothing measured and nothing overdue.

> Pending — **Phase 3** (later, once real install data accumulates): a public, consent-gated "Proven in Uganda" proof section (live counters) + referral / installment-upsell hooks. Capture method, baseline policy and per-install currency are flexible in the schema, so any later choice fits.

---

## ✅ Online payments — Pesapal (June 2026)

A full, provider-agnostic online-payment integration (cards + MTN/Airtel mobile
money) — the live-payment-gateway item that was previously blocked. Built and
tested; **default-off** until activated, so nothing changed for customers on deploy.

- **One gateway, every payable.** A `Payable` abstraction lets one Pesapal
  integration + one webhook serve **four surfaces**: FET reserve-and-pay, B2B
  invoice "pay online" links, customer installment part-payments, and the coffee
  checkout (still gated on prices). Orders, Invoices and InstallmentPayments all
  implement it; a `PayableResolver` finds the right one from a webhook.
- **How it works:** hosted-redirect flow (like PayPal). Customer → Pesapal page →
  back to a dedicated **order payment page** (`/order/{ref}`) that confirms the
  payment, with a clear Pay button + retry instead of a silent redirect. Invoice
  pay link is tokenised (`/invoice/{token}`); installments pay from `/account`.
- **Books integration:** a paid invoice **auto-settles + auto-posts an approved
  income entry** to Vitorra Books (gateway-verified money bypasses maker–checker
  by design), audit-logged. Installments drive the order's status (partial→paid)
  and generate the receipt on full pay.
- **Admin "Payments" health page** (`/admin/payments`, admin-only) +
  `php artisan pesapal:status`: a plain-language "are online payments live?"
  checklist that runs a **real test payment** and reports exactly what's missing
  (return URL / keys / IPN registration).
- Tech: `App\Contracts\{Payable,PaymentGateway}`, `PesapalGateway`,
  `pesapal:register-ipn`. Covered by feature tests (Pesapal, Invoice, Installment,
  PaymentHealth).
- **To activate:** backend `PAYMENT_DRIVER=pesapal` + Pesapal keys +
  `pesapal:register-ipn`; Vercel `NEXT_PUBLIC_ONLINE_PAYMENTS=true`. ⚠ The IPN
  must be registered or Pesapal rejects every payment — check `/admin/payments`.

## ✅ Careers portal — now multilingual (EN / SW / FR)

The public recruitment portal (`/careers`) gained a working language switcher and
a **French pilot** (full EN + SW + FR translations of the job board + apply flow).
It resolves its own language from a cookie (isolated from the marketing site).
French is a real locale now — expanding it site-wide later is just translating
each section + adding "fr" to the main switcher.

## ✅ Zero-cost platform upgrades (free, no accounts)

Three free, no-licence upgrades (see `planning/10-platform-upgrades-brief.md` for
the business one-pager):
- **Live exchange rates without a key** — falls back to a free keyless provider
  (incl. UGX) so FX stays live even without an API key.
- **Auto-synced public holidays** — `holidays:sync` pulls Uganda holidays from
  Nager.Date yearly (idempotent, preserves manual/company entries) for the
  leave/HR module.
- **Phone validation + normalisation** (libphonenumber) — every number is
  validated and stored as E.164 (`+256…`) across checkout, FET reserve, enquiry,
  supplier, careers and profile. Critical for mobile-money + future SMS.

## ✅ Reception lobby display (July 2026)

A premium, always-on screen for the front desk — `vitorra.org/display` — so the
first thing a visitor sees is the brand, not a blank TV.

- **Live and self-updating:** the clock, Kampala weather (5-day forecast), and
  indicative USD/EUR → UGX exchange rates all refresh on their own — nobody
  has to touch the screen.
- **The Fuel Eco Tech film on loop**, with a caption that rotates every few
  seconds through all four business lines: the independently verified 13.9%
  fuel-saving result, SEAL's FDA clearance, Vitorra Coffee, and Logistics.
- **Trust, at a glance:** the real HQ building photo, the six independent
  certifications on an auto-cycling list, and a headline stat (13.9% fuel
  reduction, 6 certifications, SEAL's 36-month shelf life) that rotates with
  a "resolving" number animation.
- **A live news ticker** pulls the latest published blog headlines
  automatically — publish a post and the reception screen updates itself.
- Unattended and English-only by design (same treatment as `/admin`): left
  out of translation, search indexing, analytics, and the cookie banner.

> Technical detail (engineering): `frontend/src/app/display/page.tsx` +
> `components/display/{KioskTopBar,KioskSpotlight,KioskSideRail,KioskTicker}.tsx`
> + `lib/kiosk.ts` (keyless Open-Meteo weather, `/exchange-rate` and
> `/blog/posts` polling hooks). Fixed-viewport kiosk layout — no scrolling.

---

## ✅ Already in place (earlier in the rebuild)

- Premium redesign + design system; all public pages; bilingual EN/SW.
- Admin: dashboard, enquiries, **prospects CRM** (163 leads), customers + pipeline, blog CMS, media, products, settings, users & roles, orders, **newsletter broadcast**, tasks, reply templates.
- Customer portal (register/login, orders + tracking, enquiries, documents, profile).
- Backend APIs: products, blog, enquiry/contact (team-notification emails), guest checkout (server-side price recompute), exchange rate, settings.
- SEO essentials (robots, sitemap, OG card); blog XSS closed; media uploads behind admin auth.
- Live deployment: frontend on Vercel, backend on Namecheap cPanel (MySQL, PHP 8.3), DNS/email on GoDaddy (M365 untouched).

---

## ⏳ Remaining / pending

**Revenue-blocking**
1. ~~**Live payment gateway**~~ ✅ **Built (Pesapal)** — now an **activation** task, not a build: set `PAYMENT_DRIVER=pesapal` + keys, run `pesapal:register-ipn`, set `NEXT_PUBLIC_ONLINE_PAYMENTS=true`. Verify with `/admin/payments`. Sandbox-test, then go live.
2. **Confirm coffee retail prices** → enter in `/admin/products`, then flip the coffee shop on (one flag) — Pesapal checkout already wired.

**Operations setup (not code)**
3. Set **executive-report recipients** in `/admin/settings`.
4. Grant the new **People / Executive / Suppliers / Accounting** modules to existing ops accounts in `/admin/staff` — and **"Accounting — approve"** to the **Senior Finance Officer** (admins already have everything).
5. Set `ANTHROPIC_API_KEY` on prod to enable **CV + receipt auto-read** (both work manually without it).
6. Optionally link **Careers** and **Suppliers** in the public site footer.
7. Change the seeded `changeme123` admin/ops passwords (now self-service in `/admin/profile`, or `php artisan staff:set-role` / `staff:invite`).
8. **Optional — switch login to HttpOnly cookies** (extra XSS hardening): set `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN=.vitorra.org`, `SESSION_SECURE_COOKIE=true` (backend) + `NEXT_PUBLIC_AUTH_MODE=cookie` (Vercel). Reversible by unsetting; default stays token-based.
9. **Point the reception TV at `vitorra.org/display`** — open it full-screen (kiosk mode) in the front-desk browser; it self-refreshes and needs no further setup.

**Growth — next upgrades** (from `planning/10-platform-upgrades-brief.md`)
10. **WhatsApp + SMS notifications** (order/payment/delivery updates) — needs Solomon's approval + a one-time business setup; small per-message cost.
11. **Anti-spam on forms** (Cloudflare Turnstile) — free, ~10-min account setup, then wire in.
12. **Wire up Sentry** (DSNs already configured) — catch errors before customers do.
13. **Expand French site-wide** — translate the remaining sections into `fr.json` + add "fr" to the main switcher.
14. Later (need a small server): on-site search, self-hosted newsletter, live chat, logistics maps.

**Reliability**
15. Confirm Sentry is live in prod; add uptime alerts, automated DB backups, CI/CD.

**Content / lower priority**
16. Native-speaker review of the Swahili (and new French) copy; blog posts; client testimonials; coffee photos; hero videos.

---

## 🚀 Standard backend deploy (Namecheap)

Frontend auto-deploys via Vercel on push to `master`. Backend:

```bash
cd /home/okelvaxj/vitorraweb && git pull origin master
cd backend
# Run composer when dependencies changed (e.g. the 2FA libs / guzzle patch):
/opt/alt/php83/usr/bin/php /usr/local/bin/composer install --no-dev --optimize-autoloader
/opt/alt/php83/usr/bin/php artisan migrate --force
/opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan route:cache
```

> The server's default `php` is 8.2 but the app needs 8.3 — always run artisan with `/opt/alt/php83/usr/bin/php`.
> ⚠ Never rotate `APP_KEY` in production — it would make encrypted files (`SecureFile`) and 2FA secrets unreadable.
> Scheduled jobs (holiday reminders, **holidays:sync**, executive report, application purge, invoice reminders, recurring finance, backups, daily digest, **fet:digest**) ride the existing `php artisan schedule:run` cron.
> **Next deploy adds a Composer dependency** (libphonenumber) — run `composer install` as above, then a one-off `php artisan holidays:sync` to backfill holidays.
