# Vitorra Holdings — Progress Snapshot

**Last updated:** 31 August 2026 (evening)
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
| **Site could not reach the API** (blocked sign-in + all forms) | ✅ **Fixed & live** — API now served through the site itself |
| **Leave approval — two people required** (Operations + Finance), nobody signs their own | ✅ **Built** — needs backend deploy |
| **Staff offboarding** (`staff:offboard`) + departed accounts can no longer sign in | ✅ **Built** — needs backend deploy |
| **FET Trial Manager** — run a client fuel trial end to end, from their own spreadsheet to a client-ready report | ✅ **Built & live** — first trial (Hariss International) loaded |
| **Blog posts appearing instantly** when published, instead of up to 30 minutes later | ✅ **Fixed & live** — had never worked in production |
| **Moving the website onto infrastructure we own** (AWS) | 🔨 **Built, not switched on** — site still served by Vercel; waiting on AWS to verify the account |
| **Automatic releases** — a change goes live without anyone running commands | ✅ **Built & proven** — production needs a human approval |
| **Being told when the website breaks** — before a customer notices | ✅ **Built & tested on both environments** — a real alert was fired and the email confirmed arriving |
| **Knowing what we spend, before the bill** | ✅ **Built** — warnings at 60/85/100% of budget, plus unusual-spending detection |
| Uptime checks / automated backups | ⏳ Still to do — the incoming engineer's first assignments |

---

## ✅ Internal operations platform (June 2026)

Built from the Head of Finance's brief — a full internal suite on top of the marketing site. All shipped, tested (108 backend tests), and deployed.

### Staff / HR portal — `vitorra.org/staff`
Every employee gets a login (new `employee` role). They can:
- Change their own password; see their **contract & HR documents** (stored privately).
- See their **supervisor**; supervisors see **their team**.
- **Apply for leave** — the system counts working days (excludes weekends + Uganda public holidays), stops two teammates in the same department booking the same dates, respects company-event blackouts, and tracks the annual balance. Sick leave needs a medical document. **Two people must approve — Operations and Finance** — and they must be two different people, neither of them the applicant; either can decline outright. Everyone's emailed as it moves.
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

## ✅ The site could not talk to the API — fixed (5 August 2026)

Staff could not sign in to the admin panel, and every form on the public site
had stopped working — enquiries, contact, the customer portal and the staff
portal all failed silently.

**What happened.** Nothing in our code changed. The hosting company switched on a
security layer (Imunify360) in front of `api.vitorra.org`. Browsers send a small
permission check before any real request; that layer rejected the check outright,
so the browser gave up before the request ever reached us. The public marketing
pages kept working, which is why it looked like only the admin panel was broken —
those pages are rendered on our side, not by the visitor's browser.

**The fix.** The site now serves the API from its own address, so the browser
never makes a cross-site request and the permission check never happens. Live and
verified: sign-in reaches the system again, and product data loads through the new
route. Nothing to configure — it deployed with the site.

> Worth still asking Namecheap to switch that layer off for `api.vitorra.org`.
> Everything now reaches the API from a handful of the site's own addresses,
> which is exactly the traffic pattern that layer reacts to. The fix stands on
> its own, but the underlying block is theirs to remove.
> ⚠ One thing to test before the first big campaign: attachments now travel
> through the site, which caps how large an upload can be. Send yourself a
> campaign with the SEAL deck attached first.

---

## ✅ Leave approval now needs two people (5 August 2026)

Raised after a staff member saw **Approve/Decline on their own leave request**.

**It was worse than it looked.** Anyone with an admin or operations login saw
every pending request in their queue — including one they had just filed
themselves — and the system accepted the decision. Leave could be self-approved
with no second pair of eyes. Since most of the team holds an operations login,
this affected a lot of people.

**Now:**
- **Nobody approves their own leave**, whatever their role. Their request no
  longer appears in their own queue, and the HR screen shows "your request —
  others decide" instead of the buttons.
- **Two signatures are required — Operations and Finance** — and they must come
  from **two different people**. One approval leaves the request pending and
  emails whoever still owes the second; either can decline outright, which ends
  it there and then.
- Finance means the holder of **"Accounting — approve"** (the Senior Finance
  Officer). Checked against the permission actually granted, not implied by being
  an admin — otherwise one admin could have signed both halves alone and the
  two-person rule would have been decoration.
- **Supervisors no longer approve** their reports' leave; it goes to Operations
  and Finance regardless of who someone reports to.
- Staff and admin screens now show progress — "Operations approved · awaiting
  Finance" — rather than a bare "pending".

> ⚠ **Before this can work in practice:** tick **"Accounting — approve"** for the
> Senior Finance Officer in `/admin/staff`. Until someone holds it, no leave can
> reach approved. Tick it for a second person too, or leave stalls whenever that
> one person is away.
>
> To undo a leave request approved in error, the applicant opens `/staff/leave`
> and presses **Cancel**, then applies again. The original stays in the record as
> cancelled rather than disappearing.

---

## ✅ Staff offboarding (7 August 2026)

Nagawa Shakirah left the company. She is off the **team section**, the homepage
team strip, and the prospect-owner list, and out of the staff-onboarding script so
her account cannot be recreated by accident.

**A new `staff:offboard` command** closes a departing person's account properly:
it ends every signed-in session, makes the old password useless, switches off
two-factor and all system permissions, marks them as left, and flags anyone who
reported to them for a new supervisor.

**It closes the account rather than deleting the person.** Deleting the record
would take their **leave history, performance reports and HR documents** with it,
and strip their name out of the activity log — employment records the company may
need to produce for a labour dispute, a tax query or an audit. Access goes; the
record stays.

> ⚠ **A gap this uncovered:** marking someone as "left" in `/admin/staff` never
> actually stopped them signing in — it was only a label. Anyone marked as left in
> the past has had a working login until now. Fixed for everyone, not just this
> case.
>
> Their **Microsoft 365 mailbox** (at GoDaddy) and any shared-inbox access are
> separate systems and must be closed there too.

> All three items above are covered by automated checks — **276 passing**, up from
> 262 in July. New this round: self-approval refused for every role, two different
> people required, one person cannot sign twice, either approver can decline,
> access revoked on offboarding, employment records kept, and a departed account
> refused at sign-in.

---

## ✅ Already in place (earlier in the rebuild)

- Premium redesign + design system; all public pages; bilingual EN/SW.
- Admin: dashboard, enquiries, **prospects CRM** (163 leads), customers + pipeline, blog CMS, media, products, settings, users & roles, orders, **newsletter broadcast**, tasks, reply templates.
- Customer portal (register/login, orders + tracking, enquiries, documents, profile).
- Backend APIs: products, blog, enquiry/contact (team-notification emails), guest checkout (server-side price recompute), exchange rate, settings.
- SEO essentials (robots, sitemap, OG card); blog XSS closed; media uploads behind admin auth.
- Live deployment: frontend on Vercel, backend on Namecheap cPanel (MySQL, PHP 8.3), DNS/email on GoDaddy (M365 untouched).

---

## ✅ FET Trial Manager (August 2026) — `/admin/fet-trials`

Marketing were running the Hariss International trial by hand-copying the
client's spreadsheet into our branded template. It broke down, and they raised
it as a tooling problem. This replaces that process for Hariss and every trial
after it.

**Marketing upload whatever file the client already produces**, in the client's
own layout. There is no template to fill in first — that requirement is what
caused the trouble, because our log asked Hariss for odometer readings and tank
levels their systems simply do not record. The system reads their file, asks
about anything ambiguous rather than guessing, does the arithmetic, and produces
a client-ready report.

### The one thing that matters most
**Comparisons are made within a single destination.** On the first trial this
truck's fuel use varied **41% between routes** but only **4.2% between two runs
of the same route** — roughly three times the size of the 13.9% saving FET is
certified to deliver. Comparing a Mpondwe run against an Apac run therefore
measures the road, not the product. That is exactly what made the Hariss trial
first appear to be a 20% failure.

### It refuses to state a result it cannot defend
No saving figure appears anywhere — dashboard, PDF or client link — unless the
evidence carries it. Below that line it says what is missing and which routes
are ready to measure against. A number that collapses under a client's
questioning costs more than an honest "still running".

### What it does
- **Reads the client's file**: picks the right sheet itself, maps the columns,
  and queries anything ambiguous (a load column headed "tonnes" holding
  kilogrammes, say) instead of assuming.
- **14 data-quality checks**, each raised in plain words with a suggested action
  — a trip dated before the device was fitted, a truck that came back loaded, a
  journey with no distance. A trip with an unsettled question is held out of the
  maths but stays on screen with the reason attached.
- **Leaving a trip out always needs a reason**, which appears on the report. A
  report that quietly dropped an inconvenient journey would not survive reading.
- **Re-importing an updated export is safe** — trips are matched on destination
  and date, so decisions already made are kept.
- **Charts** that show the argument, and a **branded PDF plus an Excel trip log
  shaped to how that client measures** — a fleet working from tank readings is
  never handed odometer columns it cannot fill.
- **A read-only link for the client** (`/trial/{token}`, no login) showing the
  same strict standard, with contact records, internal notes and driver names
  withheld.
- **Winning a trial** creates the customer's FET savings record and carries the
  measured baseline into it, so they are measured against their own history
  rather than a class average.

### Three lenses, after an independent review
S-Line Motors assessed the same Hariss workbook on 11 August and reached our
figures exactly. They also read the loaded-return trip differently, and were
right to:
- **Cargo moved per litre.** Fuel-per-kilometre punishes a truck that carried
  freight home instead of running back empty. On the same journeys the truck
  moved **15.9% more cargo per litre** while looking 20.6% worse on fuel.
- **How much of it is the load.** That trip hauled 48.7 tonnes on average
  against 34.2 before. The answer ranges from 19.8% worse to 14.1% better
  depending on an unknown, flipping at about 66.7% — and that it flips inside a
  plausible range *is* the finding.
- **Against the client's own planning figure** (Hariss budget 2.20 km/L): the
  baseline sat 5.2% above it, the trial period 12.7% below.

None of these move the verdict, which stays anchored to fuel per kilometre.

### Where the Hariss trial stands
Eight usable trips before the device, and **no result yet — correctly**.
Kamwenge was never driven before installation, Masindi has only one earlier trip
where two are needed, and Kitgum never completed. Two things would settle it:
**three trips to Mpondwe** (the only route with a solid "before" figure), or
**asking Hariss for this truck's history back to January**, which would rebuild
the baseline retrospectively at no cost.

> Technical detail (engineering): `fet_trials` / `fet_trial_trips` /
> `fet_trial_flags` / import runs + saved column mappings;
> `FetTrialAnalysisService` (route-stratified expected fuel, distance-weighted
> throughout, confidence gate), `FetTrialValidator`, `FetTrialImportService`
> (phpoffice/phpspreadsheet), `FetTrialReportService`,
> `FetTrialConversionService`. New `fet_trials` admin module, on by default for
> Marketing, Sales, Leadership and Operations. 81 feature tests, several running
> against the real client workbook and five asserting agreement with S-Line's
> published figures. Console fallback: `php artisan fet:trial`.

### Hariss's final report is now the trial (18 August 2026)

Hariss produced their own **final report** for UA 758AM — five destinations
(Masindi, Kamwenge, Kitgum, Yumbe, Paidha), each with one "Before FET" and one
"FET Trail trip" run, in their full IVMS layout. On the marketing lead's
direction the trial was **recreated from that file**, so our records and the
client's are now the same ten trips — nothing extra, nothing missing. Our
figures reproduce the client's own km/L to the decimal on all ten.

Reading their file needed three importer fixes, each now covered by tests:
- Their dates are plain Excel numbers with no date formatting — every trip
  used to import undated; now they read correctly.
- Their labels all end in an invisible non-breaking space — cleaned, so
  "Masindi " no longer differs from "Masindi" on a client-facing page.
- Their "Before FET" label contains "FET", which the importer used to read as
  a trial marking — the entire baseline imported as trial trips. A negated
  marker is now recognised for what it is.

**New: the trip log downloads as CSV** (button next to the PDF and Excel), from
the same table builder as the spreadsheet so the two can never disagree —
client-shaped columns, checked figures, excluded trips named with their reason.

**The findings were settled with the client's answers (18 August):**
- **Kamwenge trial trip** — the tracker export's 1 April date was wrong; the
  trip ran **1–4 August**. Date corrected, trip counts.
- **Masindi and Yumbe trial trips** — both ran as **loaded round trips**
  (Kinyara sugar back-haul) where their "before" runs returned empty. Not
  like-for-like, so both are **left out**, with the reason recorded and shown
  on the report.
- The client's **paired method accepted** for this trial ("Earlier trips a
  route needs" set to 1 — their final report deliberately pairs one before-run
  with one after-run per destination).

**Corrected workbook + marketing deck (18 August, later).** The team sat with
the data and produced a corrected export (`Workbook1.xlsx`): the Kamwenge dates
are now right in the file itself, and every figure carries its full decimals.
Re-imported cleanly — all ten trips matched in place, the exclusions and
settlements survived, and the one remaining weighbridge warning was accepted
(client's own figure, 0.5% over rating, on a before-trip). The trial board is
clear. A ten-slide presentation for marketing was built from the settled
numbers (honest headline, route-by-route, the cargo-per-litre lens, the Yumbe
load-sensitivity table, plan-vs-actual, and the three asks) — published as a
private artifact for the team to present from or print.

**Where the trial stands after settlement — no saving demonstrated.** Across
the three comparable pairs (2,398 km) the truck used **0.2% more fuel than its
baseline** — 2 litres over. Route by route: Paidha 17.2% better, Kitgum 6.4%
worse, Kamwenge 17.7% worse. The honest reading: the two clean July/August
pairs alone would show ~7.6% saved, but the corrected Kamwenge pair pulls the
average back to flat — and its trial run covered 701 km against the baseline's
805 km to the same destination, which is worth querying with Hariss before
anything is presented. The strongest remaining moves are unchanged: the
truck's trip history back to January (rebuilds a real multi-trip baseline at
no cost to them), or more paired runs. The system states exactly this — it
will not put a favourable number on evidence that does not carry one.

**Later that week (18 August, evening):**
- **A left-out trip is now named as left out, not as a trip that never ran.**
  The route summary reported Masindi and Yumbe as "no trip since fitting",
  which read as a lost record on roads the client can see were driven. Routes
  whose trips ran but were held out of the calculation now say exactly that —
  on the dashboard, the report, the spreadsheet, the CSV and the client link,
  with the held figures still shown. The deck's set-aside slide also carries
  the counterfactual out loud: counted as ordinary trips those two loaded
  round trips would read 24.8% and 4.6% worse and drag the headline from flat
  to 4% worse, so leaving them out is rigour, not favourable treatment. The
  same explanation is saved as a note on the trial record itself.
- **Internal review link** — the CEO wanted to review the actual result
  screen, and holds no staff login. The trial's Setup tab can now issue a
  second token serving the **full staff view** at `/trial/review/{token}` —
  verdict, routes, charts and lenses, the findings and the decisions taken on
  them with their notes, the trial note, and the whole trip log — read-only,
  badged "Internal review — not for clients". A deliberately **separate token
  from the client link** (neither can widen the other; each created and
  revoked on its own, audit-logged; the payload carries neither live token).
  ⚠ Until revoked, anyone holding the URL sees the internal view — treat the
  link like a confidential document and turn it off after the review.

367 backend tests passing.

---

## 🔨 Moving onto our own infrastructure (August 2026) — built, not yet switched on

The website currently runs on Vercel, a service that hosts it for us and makes the
decisions about how. We are moving it onto **Amazon Web Services under our own
account**, so the company owns the platform its public face runs on.

**Nothing has switched yet.** Every visitor to vitorra.org is still served by Vercel,
exactly as before. The AWS copy is built, running and healthy — but no customer traffic
reaches it, and none will until we deliberately switch over.

### Why

- **We own it.** No other company can change its pricing, its terms, or how our site is
  served without us choosing to accept it.
- **We can see what we spend**, to the penny, per environment, with alerts before a bill
  surprises anyone.
- **Somewhere to grow into.** Future systems can run on the same platform rather than
  needing another supplier.
- **Something the new engineer can own** — watching it, securing it, and reporting on
  its cost is real work for the incoming junior developer.

### What it costs

About **$78 a month**, against roughly $20 for Vercel. This is **more expensive, not
less**, and deliberately so: what we are buying is control and a platform we can
operate, not a cheaper bill. For a fortnight after the switch we pay both, because
Vercel stays live as a working undo button.

### What is built and running

Two completely separate AWS accounts — one for the live site, one for testing — so a
mistake while learning cannot reach customers. Both have the full stack: private
network, container registry, load balancer with its own HTTPS certificate, and the
website itself running in a container and reporting healthy.

Releases are automatic: a change pushed to the main branch is built, tested, and
deployed to the test site on its own. **The live site additionally requires a human to
approve it** before anything reaches customers.

### ⏳ What is blocking the switch

**Amazon must verify the account** before it will allow the content-delivery layer
(the part that puts the site on servers close to visitors, in Nairobi and Lagos rather
than Ireland, and shields it from attack). A support case is open and unanswered. This
is an anti-abuse hold Amazon places on all new accounts — nothing is wrong with our
setup.

Once Amazon replies: roughly **a week to switch over** — a couple of days walking the
whole site on the test copy first, then the switch itself on a quiet Sunday morning.
Vercel then stays live for **two more weeks** as a rollback before being retired.

### Watching it — built and proven (31 August)

Until now, if the website went down at night we would have found out when a
customer told us. That is now closed, on both the live and test copies:

- **One screen showing health** — is it up, is it erroring, is it slow, is it
  struggling. Nothing else, because a dashboard with forty things on it is one
  nobody looks at.
- **Six alarms that email the team**, covering the site being down, an unusual
  share of requests failing, pages becoming slow, and the server working too
  hard.
- **The alert path was deliberately tested**, not assumed. A real alarm was
  triggered on each environment and the email confirmed arriving. An alarm
  nobody has ever seen fire is a belief, not a warning system.
- **Spending alerts** at 60%, 85% and 100% of the monthly budget, plus detection
  of a sudden change in the *rate* of spend — which catches a mistake days
  before it would cross a monthly limit.

A useful figure fell out of it. The live copy, sitting idle, uses **under 1% of
its processing power and 6% of its memory**. It is heavily over-provisioned for
what it does today — but that is not the answer to the real question, because
the site now also passes every sign-in and form through to the API, and none of
that traffic exists until we switch over. What the numbers do give us is an
honest before-and-after.

This is also deliberate preparation for the new engineer: he arrives to a
working system to understand and argue with, rather than a blank account and an
instruction to build monitoring.

### One thing that surfaced along the way

Preparing the move turned up a live bug: **blog posts had never appeared instantly**.
The setting that lets the admin panel tell the website "this post is published" was
never filled in on the server, and the code was written to fail silently when it is
missing — so nothing errored, nothing logged, and every post the team published sat
invisible for up to half an hour. Now fixed and verified on the live site.

### The switch itself, when it comes

The address changes from `vitorra.org` to **`www.vitorra.org`** — the bare address will
redirect. This is forced by how the delivery layer works, and search rankings carry
across a redirect. ⚠ Company email is untouched throughout: every change is on new
subdomains, and the Microsoft 365 records are never edited.

> Engineering detail lives in `planning/12-aws-migration-plan.md` (architecture, the
> gotchas that cost us time, the cutover runbook, rollback) and
> `planning/13-junior-dev-onboarding.md` (what the new engineer owns, and when).
> Infrastructure is defined in code under `infra/`.

---

## ⏳ Remaining / pending

**Revenue-blocking**
1. ~~**Live payment gateway**~~ ✅ **Built (Flutterwave)** — now an **activation** task, not a build: set `PAYMENT_DRIVER=flutterwave` + keys, generate a webhook secret hash in the Flutterwave dashboard and set `FLUTTERWAVE_SECRET_HASH`, set `NEXT_PUBLIC_ONLINE_PAYMENTS=true`. Verify with `/admin/payments` or `php artisan flutterwave:status`. Sandbox-test, then go live.
2. **Confirm coffee retail prices** → enter in `/admin/products`, then flip the coffee shop on (one flag) — Flutterwave checkout already wired.

**The AWS move — waiting on Amazon, then on us**
A. **Amazon must verify both accounts** before the delivery layer can be created.
   Support case open, unanswered. Nothing else can proceed until it is.
B. Once verified: create that layer in both accounts (~1 hour, already written),
   then **walk the whole test site** for two or three days — every product page,
   admin sign-in with 2FA, the staff and customer portals, a CV upload, a blog
   publish, both languages. Watch how hard the server is working: the site now
   also passes every form and sign-in through to the API, which it did not when
   the size was chosen.
C. **The switch itself** — about an hour on a Sunday morning. Change two records
   at GoDaddy, point the backend at the new address, and verify payments,
   enquiries and blog publishing straight after. ⚠ Never touch the Microsoft 365
   email records.
D. **Two weeks later**, retire Vercel. Until then it stays live and warm as a
   ten-minute undo.
E. **Before the switch:** turn the firewall from watching to blocking (it is
   deliberately in report-only mode until we have seen a few days of real
   traffic), and remove the temporary rule that lets one office address reach
   the test site directly.
F. **Write the incident runbook** — what to check, in what order, when the site
   is down. Worth doing while the problems we hit are fresh: a container looping
   while perfectly healthy, every request timing out while the service was fine,
   a certificate refused because of a record in someone else's domain. A generic
   runbook would list none of those.

**Deploy first (built, not yet on the server)**
3. **Run the standard backend deploy** — the two-signature leave approval
   carries a database change, and `staff:offboard` plus the departed-staff
   login block ship with it. See the runbook at the bottom. The frontend half
   is already live (it deploys itself).

**Operations setup (not code)**
4. **Fix the 7 flagged SEAL rows** (above) in `/admin/prospects`, and confirm the
   unnamed sports-association row — 10 minutes of marketing's time before the first
   SEAL campaign goes out.
5. **Before the first real campaign:** confirm `support@vitorra.org` is an accepted
   sender in Resend (it's on the already-verified `vitorra.org` domain, so this
   should just work — worth one test send to a team address first). Optionally set
   `MAIL_CAMPAIGN_ADDRESS` to send campaigns from a different shared mailbox.

   > To test on yourself: `php artisan prospects:add-tester john@vitorra.org --name="Vitorra Holdings (John)"`
   > puts your address on the list under the **Internal test** industry — kept out of
   > the real verticals, so it never inflates a count or gets swept into a live send.
   > Filter to it in `/admin/prospects`, tick it, and send a campaign to yourself.
6. **Switch on the shared inbox** — add the `reply.vitorra.org` MX record, verify it in
   Resend, set `RESEND_INBOUND_WEBHOOK_SECRET` + `MAIL_INBOUND_CAPTURE_ENABLED=true`.
   Track it with `php artisan inbound-email:status`. ⚠ New subdomain only — never touch
   the Microsoft 365 records on `vitorra.org`.
7. Set **executive-report recipients** in `/admin/settings`.
7b. **FET trials — Hariss.** The trial was recreated from Hariss's own final
   report and the findings settled with the client's answers (18 Aug — see the
   Trial Manager section): Kamwenge's date corrected to 1–4 August, the two
   loaded round trips (Masindi, Yumbe) left out as not like-for-like, and the
   client's paired method accepted. Result as settled: **flat — 0.2% more fuel
   than baseline** over the three comparable pairs. Before presenting anything:
   query the Kamwenge trial run's 701 km (baseline ran 805 km to the same
   destination), and keep pressing for **UA 758AM's trip history back to
   January** or more paired runs — those are what could still move the result
   in either direction.
   Ops accounts with a **custom permission set** also need "FET trials" ticked in
   `/admin/staff`; department defaults already cover Marketing, Sales, Leadership
   and Operations.
8. ⚠ **Now blocking leave approvals** — grant **"Accounting — approve"** to the
   **Senior Finance Officer** in `/admin/staff` (and to a second person, so leave
   does not stall when they are away). Until someone holds it, no leave request
   can reach approved. Same screen: grant the **People / Executive / Suppliers /
   Accounting** modules to existing ops accounts (admins already have everything).
9. Set `ANTHROPIC_API_KEY` on prod to enable **CV + receipt auto-read** (both work manually without it).
10. Optionally link **Suppliers** in the public site footer (Careers is now in the main nav).
11. Change the seeded `changeme123` admin/ops passwords (now self-service in `/admin/profile`, or `php artisan staff:set-role` / `staff:invite`).
12. **Optional — switch login to HttpOnly cookies** (extra XSS hardening): set `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN=.vitorra.org`, `SESSION_SECURE_COOKIE=true` (backend) + `NEXT_PUBLIC_AUTH_MODE=cookie` (Vercel). Reversible by unsetting; default stays token-based.
13. **Point the reception TV at `vitorra.org/display`** — open it full-screen (kiosk mode) in the front-desk browser; it self-refreshes and needs no further setup.

**Growth — next upgrades** (from `planning/10-platform-upgrades-brief.md`)
14. **WhatsApp + SMS notifications** (order/payment/delivery updates) — needs Solomon's approval + a one-time business setup; small per-message cost.
15. **Anti-spam on forms** (Cloudflare Turnstile) — free, ~10-min account setup, then wire in.
16. **Wire up Sentry** (DSNs already configured) — catch errors before customers do.
17. **Expand French site-wide** — translate the remaining sections into `fr.json` + add "fr" to the main switcher.
18. **One-click unsubscribe for prospect campaigns** — cold outreach currently asks recipients to reply with "unsubscribe" (which the shared inbox catches once item 5 is live). A proper one-click link, like the newsletter already has, would improve deliverability once campaign volume grows.
19. Later (need a small server): on-site search, self-hosted newsletter, live chat, logistics maps.

**Reliability**
20. ~~CI/CD~~ ✅ **Built** — a change pushed to the main branch now builds, tests
    and releases itself; the live site additionally waits for a human approval.
    ~~Monitoring~~ ✅ **Built & tested** — health dashboards, six alarms and
    budget warnings on both environments, with the alert emails proven to
    arrive rather than assumed.
    Still outstanding: **confirm Sentry is genuinely receiving errors** (the
    setting exists but nothing has ever been seen to arrive — treat it as
    unproven), **uptime checks** from outside AWS, and **automated database
    backups**. All three are the incoming engineer's first assignments — weeks
    2–4 of `planning/13-junior-dev-onboarding.md`.

**Content / lower priority**
21. Native-speaker review of the Swahili (and new French) copy; blog posts; client testimonials; coffee photos; hero videos.

---

## 🚀 Standard backend deploy (Namecheap)

The frontend releases itself on push to `master` — currently to Vercel (live) and,
in parallel, to AWS (built, not yet serving). Nothing to run by hand either way.
The backend is still released manually:

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
### Deployed 11–12 August 2026 — FET Trial Manager

Already on the server. Recorded here because the next person doing a fresh
deploy or a rebuild needs to know it carries a **new composer dependency**:

```bash
# REQUIRED — phpoffice/phpspreadsheet, for reading and writing client files.
/opt/alt/php83/usr/bin/php /usr/local/bin/composer install --no-dev --optimize-autoloader
/opt/alt/php83/usr/bin/php artisan migrate --force   # 5 migrations (fet_trials + friends)
/opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan route:cache        # ~25 new routes
```

Verify with:

```bash
/opt/alt/php83/usr/bin/php artisan route:list --path=fet-trials | wc -l   # ~26
/opt/alt/php83/usr/bin/php artisan fet:trial                              # lists trials
```

> ⚠ Skipping the composer step leaves PhpSpreadsheet missing, and every file
> upload and Excel export fatals. Everything else keeps working, which makes it
> easy to miss.
>
> `php artisan fet:trial` is also the fallback if the admin screens are ever
> unavailable — it shows a trial's trips, findings and result, and can settle
> findings or leave a trip out, with the same audit trail as the UI.

### Also riding the next deploy (18 August 2026, evening) — internal review link

Carries a **database change** (`review_token` on `fet_trials`) and three new
routes, so after the pull:

```bash
/opt/alt/php83/usr/bin/php artisan migrate --force
/opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan route:cache
```

Then create the CEO's link from the trial's Setup tab ("Internal review
link"), and revoke it there once the review is done.

### Also riding the next deploy (18 August 2026) — final-report importer + CSV

The Hariss final-report import fixes and the CSV download need only the
standard steps — no migration, no new composer dependency, but `route:cache`
matters (one new route). After deploying, **upload
`Hariss International Final Report.xlsx` into the Hariss trial** in
`/admin/fet-trials` (answer both load-unit questions "kg") — that recreates the
trial from the client's own final report on the server, replacing the trips
from the older export.

### Outstanding on the next deploy (7 August 2026)

The **two-signature leave approval carries a database change** (`leave_approvals`),
so `migrate --force` is required. `staff:offboard` and the departed-staff login
block ship in the same pull and need no migration. Everything below is idempotent —
safe to run even if it has already been done:

```bash
# Only if not already run since 30 July — adds libphonenumber:
/opt/alt/php83/usr/bin/php /usr/local/bin/composer install --no-dev --optimize-autoloader
/opt/alt/php83/usr/bin/php artisan holidays:sync                     # backfill Uganda holidays
/opt/alt/php83/usr/bin/php artisan prospects:import --product=SEAL   # load the 124 SEAL leads
```

Then close the departed staff account (prompts for confirmation):

```bash
/opt/alt/php83/usr/bin/php artisan staff:offboard shakirah@vitorra.org
```

> ⚠ After deploying, tick **"Accounting — approve"** in `/admin/staff` for the
> Senior Finance Officer — until someone holds it, no leave request can be
> approved (see item 8).
