# Vitorra Holdings — Progress Snapshot

**Last updated:** 30 July 2026
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
| **Prospects segmented by product (FET + SEAL)** — SEAL list loaded, 124 organisations | ✅ **Built** |
| **Email campaigns with attachments, sent from support@vitorra.org** | ✅ **Built** |
| Customer portal (`/account/*`) | ✅ Built |
| **Shared inbox** — customer email replies captured into the system | ✅ **Built** — needs activation (reply subdomain + webhook) |
| **Staff email signatures** — paste your Outlook signature, images included | ✅ **Built** |
| FET pricing + savings calculator + currency helper | ✅ Complete |
| **FET proven-savings loop** (per-vehicle measured savings, fleet rollups, monthly digest) | ✅ **Built (Phases 1–2)** |
| Transactional email (Resend) | ✅ Live in production |
| **Account security — self-service password change + auto-expiring sessions** | ✅ **Done** |
| **Security hardening** (2FA, audit log, login throttle, token scoping, encrypted files, cookie-auth option) | ✅ **Done** |
| **Internal operations platform** (Staff/HR, CEO report, Suppliers, Installments) | ✅ **Built & deployed** |
| **Accounting — "Vitorra Books"** (ledger, invoicing, VAT, AI receipts, recurring) | ✅ **Built & deployed** |
| Coffee shop (storefront/cart/checkout) | ⏸ Built, gated until retail prices confirmed |
| **Online payments — Flutterwave** (cards + MTN/Airtel) across FET reserve, invoices, installments, coffee | ✅ **Built & tested** — needs activation (keys + webhook secret) |
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

## ✅ Online payments — Flutterwave (June–July 2026)

A full, provider-agnostic online-payment integration (cards + MTN/Airtel mobile
money) — the live-payment-gateway item that was previously blocked. Built and
tested; **default-off** until activated, so nothing changed for customers on deploy.

> Originally built against Pesapal (June 2026); switched to **Flutterwave** in
> July 2026 once Vitorra's Flutterwave business account was approved. The
> `Payable`/`PaymentGateway` abstraction made this a same-shaped swap — one new
> gateway class, no changes to checkout, invoicing, or installment code.

- **One gateway, every payable.** A `Payable` abstraction lets one Flutterwave
  integration + one webhook serve **four surfaces**: FET reserve-and-pay, B2B
  invoice "pay online" links, customer installment part-payments, and the coffee
  checkout (still gated on prices). Orders, Invoices and InstallmentPayments all
  implement it; a `PayableResolver` finds the right one from a webhook.
- **How it works:** hosted-redirect flow (like PayPal). Customer → Flutterwave
  page → back to a dedicated **order payment page** (`/order/{ref}`) that
  confirms the payment, with a clear Pay button + retry instead of a silent
  redirect. Invoice pay link is tokenised (`/invoice/{token}`); installments pay
  from `/account`.
- **Books integration:** a paid invoice **auto-settles + auto-posts an approved
  income entry** to Vitorra Books (gateway-verified money bypasses maker–checker
  by design), audit-logged. Installments drive the order's status (partial→paid)
  and generate the receipt on full pay.
- **Admin "Payments" health page** (`/admin/payments`, admin-only) +
  `php artisan flutterwave:status`: a plain-language "are online payments live?"
  checklist that runs a **real test payment** and reports exactly what's missing
  (return URL / keys / webhook secret).
- Tech: `App\Contracts\{Payable,PaymentGateway}`, `FlutterwaveGateway`. Webhook
  requests are verified against a dashboard-issued secret hash, and a webhook is
  never trusted for amount/currency without re-checking with Flutterwave
  directly. Covered by feature tests (Flutterwave, Invoice, Installment,
  PaymentHealth).
- **To activate:** backend `PAYMENT_DRIVER=flutterwave` + Flutterwave keys +
  a webhook secret hash generated in the Flutterwave dashboard (Settings →
  Webhooks) set as `FLUTTERWAVE_SECRET_HASH`; Vercel
  `NEXT_PUBLIC_ONLINE_PAYMENTS=true`. ⚠ Without the webhook secret, completed
  payments won't confirm automatically — check `/admin/payments`.

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

## ✅ Shared inbox + staff email signatures (July 2026)

Until now, a customer who simply **replied to one of our emails** disappeared into
a personal mailbox. Nobody else could see the conversation, and it was invisible to
the business the moment that staff member was away. This closes that hole.

### One conversation, visible to the team
- Staff reply to customers from **`/admin/customers`**, and the whole back-and-forth
  is kept against that customer — not buried in one person's Outlook.
- Customers see and answer the same thread in their own portal
  (**`/account/messages`**), so they don't have to dig through email.
- When a customer replies **from their own email client**, that reply is captured
  into the system automatically and attached to the right customer.

### Replies that look like they came from a person
- Every staff member can paste their **Outlook signature exactly as they copied it**
  — logo, photo, formatting and all — from `/admin/profile` or `/staff/profile`, and
  it appears on their replies. Embedded images are handled properly rather than
  arriving as broken boxes.
- Rich pasted content (bold, links, tables) is accepted in **customer portal replies**
  too, not just staff signatures — a customer pasting a spec or a quote gets it
  through intact.
- Pasted content is sanitised on the way in, so a stray script in someone's email
  can't ride into our system.

### ⏳ Needs a one-time setup before it goes live
Capture of inbound replies is **built and switched off by default** — nothing changed
for customers on deploy. To turn it on:
1. Add an **MX record for a reply subdomain** (`reply.vitorra.org`) pointing at
   Resend's inbound mail server. ⚠ This is a *new subdomain* — it does **not** touch
   the Microsoft 365 records on `vitorra.org`.
2. Verify that subdomain in the Resend dashboard.
3. Create an inbound webhook to `https://api.vitorra.org/api/webhooks/email/inbound`
   and put its signing secret in `RESEND_INBOUND_WEBHOOK_SECRET`.
4. Set `MAIL_INBOUND_CAPTURE_ENABLED=true`.

Check progress at any point with `php artisan inbound-email:status` — it lists
exactly what's still outstanding. Until it's live, staff replies still work; only the
automatic capture of customer replies is dormant.

---

## ✅ Smaller improvements (July 2026)

- **Careers is now in the main navigation**, not just the footer — job seekers can
  find it without scrolling to the bottom of the page (EN + SW).
- **The WhatsApp button keeps gently pulsing** so visitors actually notice it,
  instead of sitting still and being missed.

---

## ✅ Prospects split by product + one-click email campaigns (July 2026)

Until now the prospect database held one list — the 163 FET leads. Sales is now
working **two products separately**, so the database was split by product line and
given a proper campaign tool.

### The SEAL prospect list is in the system
The marketing team's SEAL workbook is loaded: **124 organisations across 9 industries**
— hospitals (29), pharmacies (21), manufacturing (17), travel companies (16),
sports associations (13), mines & quarries (10), first responders (10),
boda bodas (6) and biker associations (2). 107 have an email address, 117 a phone.

- **FET and SEAL are now separate lists.** A product switcher at the top of
  `/admin/prospects` shows one product at a time, and the industries shown change
  with it — hospitals and pharmacies for SEAL, cargo and schools for FET.
- **A company can now sit on both lists.** 17 manufacturers appear on the FET *and*
  SEAL sheets; previously the system would have silently kept only the first and
  quietly dropped the other 17 from SEAL. Each is now tracked separately, because
  a fuel-saving conversation and a wound-spray conversation are different sales.
- **Messy source data was cleaned, not guessed at.** Phone numbers were
  standardised to international format (+256…), "not publicaly listed" placeholders
  became blanks, and duplicated sheets were merged. Rows the system could not read
  with confidence are **flagged in the list rather than invented** — see below.

### Campaigns: one email, the whole list, documents attached
Select any set of prospects and send them all one email:

- **Attach documents** — the SEAL product deck, a price list, a datasheet (up to 5
  files, 8 MB each). Attachments are **encrypted on our server**, so a stolen backup
  reveals nothing.
- **Sent from `support@vitorra.org`, not from whoever wrote it.** Replies come back
  to the shared inbox where any of the team can pick them up — a prospect answering
  months later still reaches someone, even if that staff member has moved on.
- **Subject line and personalisation** — write `{name}` anywhere in the subject or
  message and each recipient sees their own organisation's name.
- **Save as template** — keep a good subject + message for reuse straight from the
  compose box, filed under the product it belongs to.
- **Honest reporting.** The progress bar shows how many were genuinely delivered,
  how many failed, how many had **no email on file**, and how many **shared an inbox
  with another prospect** (we email that address once, never twice). Selecting 25
  rows no longer implies 25 emails went out.
- **A large send can't break.** Emails go out in small batches in the background, so
  a 160-recipient campaign never times out and never half-sends with no record.
  Closing the screen doesn't stop it — it finishes on its own. Prospects move from
  "not contacted" to "contacted" automatically as their email goes out.

> Tested end-to-end (11 new automated checks, 262 passing in total): sender address,
> attachments, personalisation, batching, duplicate suppression, and a failed
> address being recorded without stopping the rest of the campaign.

### ⚠ Needs a human look — 7 SEAL rows
The importer flagged these rather than guessing. They're in the system and visible
in `/admin/prospects`; the marketing team can fix them in place:

| Organisation | Problem |
|---|---|
| Union boda | Email has no domain ending (`support@bodabodaunion`) |
| Bethesda Medical Centre | Email incomplete (`bethesdamedicalcenter54@gmail`) |
| C&A pharmacy | Email has two @ signs — real address unclear |
| Delights Automart Kakiri Stone Quarry | Email is `delightskakiriquarry@.` |
| Atim Ki Kuma Quarry Mine (Gulu) | No email and no phone |
| Nangwa Quarry Services Ltd | No email and no phone |
| King travel company limited | Phone has one digit too many |

Also: one row in the sports-associations sheet (Lugogo Indoor Stadium,
`info.fubauganda@gmail.com`) has **no organisation name** and was left out rather
than guessed — it looks like the Federation of Uganda Basketball Associations, and
needs 10 seconds from marketing to confirm and add.

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
1. ~~**Live payment gateway**~~ ✅ **Built (Flutterwave)** — now an **activation** task, not a build: set `PAYMENT_DRIVER=flutterwave` + keys, generate a webhook secret hash in the Flutterwave dashboard and set `FLUTTERWAVE_SECRET_HASH`, set `NEXT_PUBLIC_ONLINE_PAYMENTS=true`. Verify with `/admin/payments` or `php artisan flutterwave:status`. Sandbox-test, then go live.
2. **Confirm coffee retail prices** → enter in `/admin/products`, then flip the coffee shop on (one flag) — Flutterwave checkout already wired.

**Operations setup (not code)**
3. **Fix the 7 flagged SEAL rows** (above) in `/admin/prospects`, and confirm the
   unnamed sports-association row — 10 minutes of marketing's time before the first
   SEAL campaign goes out.
4. **Before the first real campaign:** confirm `support@vitorra.org` is an accepted
   sender in Resend (it's on the already-verified `vitorra.org` domain, so this
   should just work — worth one test send to a team address first). Optionally set
   `MAIL_CAMPAIGN_ADDRESS` to send campaigns from a different shared mailbox.

   > To test on yourself: `php artisan prospects:add-tester john@vitorra.org --name="Vitorra Holdings (John)"`
   > puts your address on the list under the **Internal test** industry — kept out of
   > the real verticals, so it never inflates a count or gets swept into a live send.
   > Filter to it in `/admin/prospects`, tick it, and send a campaign to yourself.
5. **Switch on the shared inbox** — add the `reply.vitorra.org` MX record, verify it in
   Resend, set `RESEND_INBOUND_WEBHOOK_SECRET` + `MAIL_INBOUND_CAPTURE_ENABLED=true`.
   Track it with `php artisan inbound-email:status`. ⚠ New subdomain only — never touch
   the Microsoft 365 records on `vitorra.org`.
6. Set **executive-report recipients** in `/admin/settings`.
7. Grant the new **People / Executive / Suppliers / Accounting** modules to existing ops accounts in `/admin/staff` — and **"Accounting — approve"** to the **Senior Finance Officer** (admins already have everything).
8. Set `ANTHROPIC_API_KEY` on prod to enable **CV + receipt auto-read** (both work manually without it).
9. Optionally link **Suppliers** in the public site footer (Careers is now in the main nav).
10. Change the seeded `changeme123` admin/ops passwords (now self-service in `/admin/profile`, or `php artisan staff:set-role` / `staff:invite`).
11. **Optional — switch login to HttpOnly cookies** (extra XSS hardening): set `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN=.vitorra.org`, `SESSION_SECURE_COOKIE=true` (backend) + `NEXT_PUBLIC_AUTH_MODE=cookie` (Vercel). Reversible by unsetting; default stays token-based.
12. **Point the reception TV at `vitorra.org/display`** — open it full-screen (kiosk mode) in the front-desk browser; it self-refreshes and needs no further setup.

**Growth — next upgrades** (from `planning/10-platform-upgrades-brief.md`)
13. **WhatsApp + SMS notifications** (order/payment/delivery updates) — needs Solomon's approval + a one-time business setup; small per-message cost.
14. **Anti-spam on forms** (Cloudflare Turnstile) — free, ~10-min account setup, then wire in.
15. **Wire up Sentry** (DSNs already configured) — catch errors before customers do.
16. **Expand French site-wide** — translate the remaining sections into `fr.json` + add "fr" to the main switcher.
17. **One-click unsubscribe for prospect campaigns** — cold outreach currently asks recipients to reply with "unsubscribe" (which the shared inbox catches once item 5 is live). A proper one-click link, like the newsletter already has, would improve deliverability once campaign volume grows.
18. Later (need a small server): on-site search, self-hosted newsletter, live chat, logistics maps.

**Reliability**
19. Confirm Sentry is live in prod; add uptime alerts, automated DB backups, CI/CD.

**Content / lower priority**
20. Native-speaker review of the Swahili (and new French) copy; blog posts; client testimonials; coffee photos; hero videos.

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
> Scheduled jobs (holiday reminders, **holidays:sync**, executive report, application purge, invoice reminders, recurring finance, backups, daily digest, **fet:digest**, **campaigns:send**) ride the existing `php artisan schedule:run` cron.
> **Next deploy — one-off to load the SEAL list:** `php artisan prospects:import --product=SEAL` (idempotent; safe to re-run, never overwrites edits).
> **Next deploy adds a Composer dependency** (libphonenumber) — run `composer install` as above, then a one-off `php artisan holidays:sync` to backfill holidays.
