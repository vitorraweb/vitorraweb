# Vitorra Holdings — Progress Snapshot

**Last updated:** 28 October 2026
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
| **Reception lobby display** (`/display`) | ✅ **Built & redesigned** (Oct) — all four business lines now run their own film; point the front-desk TV's browser at it |
| **Site could not reach the API** (blocked sign-in + all forms) | ✅ **Fixed & live** — API now served through the site itself |
| **Leave approval — two people required** (Operations + Finance), nobody signs their own | ✅ **Live** — Joseph Rwabu holds the Finance signature |
| **Staff offboarding** (`staff:offboard`) + departed accounts can no longer sign in | ✅ **Live** |
| **FET Trial Manager** — run a client fuel trial end to end, from their own spreadsheet to a client-ready report | ✅ **Built & live** — first trial (Hariss International) loaded |
| **Blog posts appearing instantly** when published, instead of up to 30 minutes later | ✅ **Fixed & live** — had never worked in production |
| **Moving the website onto infrastructure we own** (AWS) | 🔨 **Built, not switched on** — site still served by Vercel. Amazon's account hold cleared; the delivery layer and firewall are now live on **both** environments. Remaining work is ours, not theirs |
| **Automatic releases** — a change goes live without anyone running commands | ✅ **Built & proven** — production needs a human approval |
| **Being told when the website breaks** — before a customer notices | ✅ **Built & tested on both environments** — a real alert was fired and the email confirmed arriving |
| **Knowing what we spend, before the bill** | ✅ **Built** — warnings at 60/85/100% of budget, plus unusual-spending detection |
| **Knowing which channel produced every enquiry** (Google Ads, Facebook, referral, direct) | ✅ **Live** — ad links still need campaign tags |
| **Google Ads in the console** — spend, campaigns, search terms and cost per lead beside our enquiries; won deals reported back to Google; consent-aware tag with conversions on every lead form, call and WhatsApp tap | ✅ **Live** (28 October) — spend numbers wait on the Google Cloud OAuth client, conversion labels from Marketing, then Connect in `/admin/google-ads` |
| **Enquiries chased and escalated when nobody replies** | ✅ **Live** — set the escalation list (`ENQUIRY_SLA_ESCALATE_TO`) |
| **Quotations + branded Coffee / FET invoices** (Finance's templates) | ✅ **Live** |
| **Customer sign-in landing in a previous account** | ✅ **Fixed & live** — everyone signed in again once |
| **FET prices — new catalogue list in UGX** (site, calculator, reservations, datasheet PDF) | ✅ **Live** |
| **Coffee customer list** — Excel import, go4WorldBusiness category, safe re-uploads | ✅ **Live** — 54 coffee rows loaded |
| **Campaigns to a whole list, quotations from a customer, dated follow-ups** | ✅ **Live** |
| **Branded campaign email** — letterhead, sender's signature, support copied, test send + preview | ✅ **Live** — Sarah still needs to save her signature |
| **Bold redesign** — statement homepage, Olivia's banners and photos, real SEAL cans, East Africa route map, Mount Elgon map, fuel bars, contact/blog/careers in the same style | ✅ **Live** (27 October) |
| **Found by Google, Bing and AI assistants** (structured data, short answers, `llms.txt`, Bing notified on publish) | ✅ **Live** — server update + Search Console / Bing Webmaster setup still to do |
| **Blog drafts written with Claude, approved by Marketing by email** | ✅ **Live** — three drafts waiting for Send for review |
| **Console redesigned like Odoo** — dark top bar, app tiles, breadcrumb control panels, list views, larger system fonts, light/dark mode, graph ⇄ pivot reporting on Overview, CEO report, Google Ads and Accounting | ✅ **Built** (28 October) |
| **Staff test records removed from enquiries / orders / messages** (`leads:purge-test`) | ⏳ Run on the server: list first, then `--force` |
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

> ⚠ **Superseded in October 2026** — the screen was rebuilt and every business
> line now has its own film. See "The reception screen, rebuilt" below. The
> description here is kept as the record of what was first built.

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

## ✅ Knowing where leads come from, and chasing the ones we ignore (1 September 2026)

Two gaps the 27 August operations review exposed. Both are now closed, tested
and ready for the next backend deploy. Full analysis of that meeting:
`planning/14-aug27-qa-tech-actions.md`.

### We can now say which channel produced every enquiry

The CEO spent much of that meeting asking how much we spend on Google Ads and
what it produced. **Nothing in the system could answer it** — no enquiry had
ever recorded where it came from, so every lead from every channel looked
identical.

- Every enquiry and contact message now records **how that visitor reached us** —
  the campaign tag, the ad click, or the site that linked to us — captured on
  arrival and stored on the record.
- A **"Where enquiries come from"** panel on the admin dashboard ranks the
  channels, and shows **how many each one actually won** beside its volume. That
  second number is the point: a channel can deliver plenty of enquiries and no
  customers, which is exactly what the Google Ads spend appears to have been
  doing — the betting and loan enquiries the team kept receiving.
- Each enquiry in `/admin/enquiries` shows its channel on the row.
- Untagged Google Ads clicks are recognised too, so paid traffic is not
  quietly miscounted as people finding us on their own.
- **Honest by default.** Enquiries taken before this existed report as
  "unknown", never folded into "direct" — and "direct" is described on screen
  as what it really is (no tag and no referring site, which includes links
  opened from WhatsApp or a PDF), not as people seeking us out.
- Attribution never blocks a submission: if a browser strips it, the enquiry
  still arrives exactly as before.

> ⚠ It only measures from the day it is deployed — it cannot recover the origin
> of past enquiries. And it can only report on tagged links: for the Google Ads
> figures to mean anything, the ad URLs need campaign tags, which is a job for
> whoever runs the ads.

### An enquiry can no longer sit unanswered without anyone being told

A real enquiry — a buyer naming his vehicle, 9 July — went unanswered until the
CEO found it himself in the meeting. The system had recorded the delay all
along, but only ever used it to average response times after the fact.

- Now, an enquiry with no reply after **4 hours** emails the team that owns it,
  and after **24 hours** escalates to a named list. Both thresholds and the
  escalation recipients are configurable.
- **One email per team listing every overdue enquiry**, not one nag per
  enquiry — and each stage sends **once**, so an hourly check never becomes
  hourly email.
- It only sends **on weekdays during working hours**, so an enquiry arriving on
  Friday evening is chased on Monday morning rather than at 2am.
- Actioning the enquiry is what stops the emails; replying to the alert does
  nothing. That is deliberate.
- Escalation recipients are set with `ENQUIRY_SLA_ESCALATE_TO` (comma-separated).
  **Left empty, escalations reach the team inbox only** — set it before this is
  relied on.

> Covered by 22 new automated checks. **389 backend tests passing**, up from 367.
> (The 17 FET-trial tests that fail on a fresh laptop were a missing local
> dependency, not a code fault — `composer install` fixes it, and the suite is
> green again.)

---

## ✅ Loose ends from the operations review (September 2026)

Three items landed after the 1 September entry above and were never written up.

- **The delivery layer and firewall went live on production** (1 Sep). Staging
  already had both; production had neither, so when Amazon's account hold
  cleared there was nothing on production to apply it to. Production now mirrors
  staging. The firewall is deliberately **watching, not blocking**, until we have
  seen a few days of real traffic — a managed rule that blocks the enquiry form
  is worse than no firewall at all. The Namecheap backend is allow-listed first,
  because it is what tells the site a blog post has been published, and
  rate-limiting that is precisely how blog publishing silently stops working.
- **The enquiry-chaser preview was telling the truth about the wrong thing**
  (2 Sep). A dry run counted the same enquiry as both chased *and* escalated, so
  it promised twice the email a real run sends. A real run cannot do this because
  escalating marks the record; a dry run writes nothing and so had no such
  barrier. Found on the production dry run, against the two enquiries actually
  sitting unanswered there.
- **A colleague left and returned** (3 and 5 Sep). Thurayya Nakayima resigned and
  asked for her data cleared; she was removed from the public site and the
  internal lists, and her press quotes re-attributed to the company rather than
  deleted — they were the company's own launch messaging. She rejoined two days
  later and everything was restored. ⚠ The code revert could not restore her
  **production user account**, which had been deleted: it was recreated with a
  new id and the records pointing at the old one — one enquiry and five customer
  replies — were relinked by hand.

---

## ✅ The reception screen, rebuilt (1 October 2026)

The lobby screen worked, but it was laid out as a dashboard: the brand film sat
in a box as one card among several, so the weather carried the same visual
weight as an independently verified laboratory result and a visitor had no idea
where to look. It now reads as a brand stage.

### What a visitor sees
- **The film fills the screen.** Whichever business line is up plays edge to
  edge, and everything else floats over it. The old layout dimmed the footage
  almost to black; it is now lit so you can actually see it.
- **Every business line has its own footage.** FET, SEAL and Coffee play the
  films we hold; Logistics plays licensed stock of a container terminal, which
  finally makes the picture agree with the words "port to door". Previously
  Coffee and Logistics both played the Fuel Eco Tech film — an engine bay behind
  a coffee caption, which read as a mistake.
- **Readable from across the room.** The headline is set much larger, with a
  numbered index (01/04) and a progress bar showing where the loop has got to.
  Certifications now show **one at a time, large**, instead of a cramped list.
- **Less noise.** The ticking seconds are gone — a digit changing every second
  pulls the eye off the film all day. The forecast is three days rather than
  five, because five identical cloud icons read as placeholder data. The gold
  certifications marquee is gone, as it scrolled the same six certifications the
  screen now shows properly.

### Three faults fixed that nobody had reported
- The certifications card was **silently hiding three of its six** — the box was
  too short and the rest were clipped off.
- A cold start showed a **black rectangle for about ten seconds** while the film
  loaded. Every film now shows a still frame immediately.
- A film layer with nothing to draw could **reveal the business line underneath
  it** — the caption saying one thing while the footage showed another. Found
  while testing; each film now paints its own still behind itself.

### Worth knowing
- The SEAL film supplied was in a format that plays on some browsers and shows a
  **black rectangle on others** — on an unattended TV, nobody would think to
  look. Converted, and the spec now says which format to supply.
- **SEAL's film is clinical** — an anatomical render of an open wound, now
  full-screen in a waiting area. It was briefly swapped for a photograph of a
  paramedic holding the product; the Director's decision was to keep the film,
  and the film is what is live.
- The coffee film was shot on a white background for a product page and had to
  be darkened to sit with the others. Future footage for this screen should be
  **shot dark** — noted in the spec.
- Where every file came from and the licence it carries is now recorded in
  `frontend/public/videos/README.md`. Two stock candidates were rejected for
  carrying another company's branding.

> ⚠ **Nobody has watched this on the actual TV yet.** It was verified in a
> browser. The cross-fades, the type at viewing distance and how the SEAL film
> reads at full lobby scale are worth two minutes in front of the real screen.

---

---

## ✅ Coffee is now sold on the website — the export side (6 October 2026)

Vitorra is a **Gold Plus verified supplier on go4WorldBusiness** (member since
September 2026) with a live listing for **Arabica (Roasted) Coffee Beans**. That
listing carried real trade terms — a price, a minimum order, grades, an HS code,
a loading port — while vitorra.org carried none of them. A buyer who found us on
the portal and then came to our own site found less information, not more.

That is now closed. `/products/coffee` has a full **export & wholesale
specification**, in both English and Swahili.

### What a buyer now sees on our own site
- **The price, openly:** $5,600 – $5,800 per metric tonne, EXW — the same band
  already published on the portal.
- **The bulk caveat sits next to the price, not in the small print.** The listing
  says plainly that the band does not apply to bulk; so does our page. A buyer
  who discovers that only at quote stage is a buyer we have misled.
- **The terms that decide whether they enquire:** HS 0901.21, minimum order
  1 metric tonne, EXW, Mombasa, 7-day lead time, customised packaging, the
  Vitorra Coffee trademark.
- **The five grades** we can supply (AA, A, AB, B, PB Peaberry), with A marked as
  the grade our price is quoted on.
- **Documentation offered on enquiry** — certificate of origin, grading report,
  phytosanitary, food safety — framed as *what we will confirm in writing for
  your market*, never as certifications we already hold.
- **Two ways in:** request a bulk quote, or request a sample (sample and its
  shipping carried by the buyer, exactly as the listing states).

The enquiry form now asks export buyers for **grade, delivery terms and whether
they want a sample**, so a serious enquiry arrives quotable instead of costing
the team a round-trip email.

### A contradiction this caught
The enquiry form told buyers **"export starts at 60 kg (one bag)"**. Our trade
listing says the minimum is **one metric tonne** — sixteen times that. A buyer
briefed at 60 kg and quoted at a tonne is a lost buyer. Corrected in English and
Swahili.

### ⚠ Four things deliberately left OFF the website
Each is on the trade listing, and each needs the Director to confirm it before it
goes on our own site:

| On the listing | Why it is not on vitorra.org |
|---|---|
| **"Production capacity: 500,000 tons"** | Uganda's **entire national annual output** is roughly 400,000 tonnes. As written we claim to out-produce the country. A serious importer checks this. |
| **Export destinations** | The company profile says France, Germany, Italy, Denmark, Poland, Portugal. The product page says Germany, Netherlands, Croatia. They overlap only on Germany. We say "European buyers", which both support, until one is confirmed. |
| **"Annual sales USD 1m–5m"** | Commercially sensitive, and a buyer does not need it to enquire. |
| **"Organically harvested"** | No organic certification is claimed anywhere. In the EU this is a regulated word. |

### ⏳ What Operations still needs to settle
Not code — but these decide whether export orders can actually be fulfilled:
1. **UCDA registration.** Exporting coffee from Uganda requires registration with
   the Uganda Coffee Development Authority. Nothing in our records confirms we
   hold it. This is a licence question, not a website question.
2. **EUDR.** The EU Deforestation Regulation covers coffee. Selling into France,
   Germany or Italy requires due-diligence statements and plot geolocation. The
   listing's "Standard: NA" is the opposite of what an EU buyer needs to see.
3. **EXW vs Mombasa.** The listing quotes **EXW** (buyer collects in Kampala) but
   also names **Mombasa** as the loading port. Under EXW a loading port is
   meaningless — the two together read as inexperience to a real importer. Most
   coffee trades FOB Mombasa or CIF destination. Worth deciding which we mean.
4. **Roasted vs green.** We list *roasted* beans (HS 0901.21) in 1-tonne lots.
   European buyers overwhelmingly import **green** coffee (HS 0901.11) and roast
   locally, because roasted coffee stales in weeks and a tonne of it is a short
   shelf life to ship. If we can supply green, it likely opens more doors than
   the current listing does.
5. **The two export-destination lists** above need reconciling on the portal too,
   not just on our site.

> **Retail is still gated and this does not change that.** The trade listing
> carries no retail price, so the coffee shop stays off until the team confirms
> the bag prices. Item 2 under "Revenue-blocking" is unchanged.

> Technical detail (engineering): `lib/coffee-export.ts` (trade terms, grades,
> price band — with the omitted claims documented in-file),
> `components/sections/CoffeeExportSpec.tsx` (ivory section between Proof and
> Ways to Buy, keeping the dark/light alternation), coffee page copy + FAQ
> reordered export-first, `lib/enquiry-schema.ts` export branch (grade,
> incoterms, sample), `messages/{en,sw}.json`. Typecheck and production build
> clean; both locales verified rendering. ⚠ Swahili copy is mine, not a native
> speaker's — it joins the pending review in item 21.


---

## ✅ Acting on the external platform review (6 October 2026)

An outside review of the site raised nine areas. Every concrete claim was checked
against the code before anything was changed. Several were confirmed, one turned
out worse than reported, and several "I can't tell whether this exists" items
already exist (server-side payment verification, account scoping, monitoring,
lead-source tracking, enquiry chasing, the CRM).

### The website was turning away customers the device fits
The review spotted two tiers whose engine ranges disagreed with our own PDF
datasheet. Checked against the **manufacturer's** application overviews (the two
`2026-02-05_Engine overview_*.pdf` files), **all four tiers under-stated what the
device covers**:

| Device | Site said | Manufacturer says | Who was told "no fit" |
|---|---|---|---|
| FI | 1.4–2.0L | **1.0–2.0L** | Small cars (Polo, Fiesta class) |
| FII | 1.5–3.0L cars & SUVs | 1.5–3.0L **plus Sprinter-class vans to 5t** | Van fleets |
| FIII | 3.0–6.7L light trucks | **3.0–9.0L**, light **and medium trucks to 18t**, plus 4.0–6.5L performance cars | Medium-truck fleets |
| FIV | 12–13L | **10–16L** | Hauliers running 10–12L or 15–16L engines |

Fixed at the root: the manufacturer table now lives in one file
(`frontend/src/data/fet-applications.json`), the website derives every range from
it, and the PDF generator **refuses to build** if its tables disagree with it. The
two can no longer drift apart silently.

### Three payback figures, now explained instead of contradicting each other
The homepage said 3–5 months, a blog placeholder said "around 14 months", and the
calculator's own default produced about two years. The 3–5 month figure is real —
it is the VW T5's — but it was never labelled. It now says whose figure it is and
on what basis. The "14-month" line was editorial filler with no source behind it,
shown whenever the blog could not load; it has been replaced with a statement
that is true.

### The calculator is now a decision tool
Before: a customer got a precise-looking answer without ever saying how much fuel
their vehicle uses (it was hidden and fixed per tier), in euros, at a German pump
price, with a savings floor of 8% — so it could never show a purchase that does
not pay.

Now:
- **Your real fuel use** — in L/100km or km/L — **or simply what you spend on
  fuel a month**, which most fleet managers know better than their consumption.
- **UGX first**, with USD and EUR; the device price is converted at the day's rate.
- **Savings down to 0%**, with one-tap "if it saves nothing" and "low case"
  scenarios. At 0% it says plainly: no saving, no payback.
- **Petrol and diesel** use their own emission figures.
- **Every input still on a default is tagged "Assumed"**, and the full working is
  printed under the result, so nothing is a black box.
- **Share link** — the estimate opens again with exactly the same inputs, and the
  link travels inside the enquiry, so sales sees the customer's own numbers.

**What it now shows honestly:** at a Kampala pump price and a 10% saving, a
typical **car pays back in about 32 months; light and heavy trucks in about 10–11
months**. FET's economics are a fleet and truck story — the old calculator's EUR
figures were obscuring that, and it is worth knowing for where marketing spends.

> ⚠ The calculator's starting pump price is **UGX 5,000/L** — labelled as an
> assumption on screen and always editable, but confirm it against the current
> pump price before a campaign (`DEFAULT_FUEL_PRICE_UGX` in `lib/fet-pricing.ts`).

### "Cookie settings" now exists
Our cookie policy tells visitors to click "Cookie settings" in the footer to
change their choice. There was no such control — once someone chose, they could
never change it. It now sits in the footer's Legal column, reopens the banner,
and shows the choice currently on record.

### Still open from the review — needs the business, not code
- **Evidence centre** (the review's top point): the structure can be built, but it
  needs, per claim, the certificate or report, who issued it, its number, scope
  and expiry, and whether we may publish it. ISO 9001 / 27001 are company
  management certifications — they should sit apart from the CTI product test
  and the Zurich insurance, not in the same block.
- **Measured pilot offer**: cost, duration, eligibility, and what happens if the
  saving comes in low. The FET Trial Manager already does the measuring.
- **Before-you-pay summary** on reservations: deposit or full payment, what
  happens if the device does not fit, and cancellation and refund terms.
- **Logistics**: the real tracking service and realistic border commitments.

> Technical detail (engineering): `data/fet-applications.json` +
> `engineSpanLabel`/derived spans in `lib/fet-pricing.ts`; drift guard
> `assert_spans_match_source()` in `scripts/generate_fet_pdfs.py`;
> `estimateSavings()` (usage/spend modes, fuel-specific CO₂, payback in months —
> the old `computeSavings()` is kept for the customer-portal widget);
> `FetCalculator.tsx` rebuilt (assumption tracking, scenario chips, working
> panel, share link via `?fetcalc=1…#fet-calculator`); `FALLBACK_RATES` exported
> from `lib/currency.ts`; `components/ui/cookie-settings-button.tsx` + consent
> helpers in `lib/cookies.ts`. EN + SW. Typecheck and production build clean.
> ⚠ Swahili is mine, not a native speaker's.


---

## 🔨 Redesign — "Quiet Authority" (October 2026) — homepage + four product pages built, not yet deployed

The site looked like a premium *template* rather than a company: every section
ran the same formula (gold eyebrow, headline split black-then-gold, fade-in,
rounded card) over glows, film grain and glass. Measured, not felt: 1,076
hand-styled blocks and 50 different hex colours for a seven-colour palette.
Rebuilt on a real design system, after studying Aesop, LVMH, Maersk and Temasek.

**The system** — one paper canvas, ink type, gold only as a line or an accent,
2–4px corners, one type scale, one motion curve; shared building blocks
(`components/system/`). The admin, staff and customer portals are untouched.

**Built so far:** homepage, header, footer, Fuel Eco Tech, SEAL, Coffee,
Logistics. Each product page follows its own buying journey rather than one
template — FET: evidence → how it works → which device fits (the
manufacturer's table) → price → calculator → measured trial; SEAL: a
procurement journey with its regulatory status stated plainly; Coffee: export
terms first; Logistics: the five details needed to quote in one round.

**Fixed along the way**
- Content was invisible until JavaScript ran — on a slow phone whole sections
  sat blank. Now visible from the first byte, on every page.
- Phones showed three floating things at once; now one contact bar.
- The cookie notice covered the main button on desktop and a fifth of a phone.
- The homepage coffee card said "Shop Coffee" while the shop is closed.
- Brand films no longer autoplay — a visitor on mobile data only downloads the
  3–15 MB film if they press play.

**Claims removed or corrected** (the honesty pass the external review asked for)
- FET: "trusted by fleet operators across East Africa"; "your warranty is not
  affected" → written, vehicle-specific guidance before fitting.
- Logistics: "no delays at the border", "real-time tracking", "delivered on
  schedule, every time" → what we do, and what depends on others.
- Coffee: "every bag traces back to the farm by QR code" (bags not on sale).
- Certificates are listed by what they cover, without implying who holds them.
- SEAL: US FDA facts only; no Uganda NDA approval implied.
- Generated imagery removed: the gold VITORRA-liveried truck, branded export
  cartons, a generated "farmer", the generated warehouse and control room.

**⏳ Needs the business before go-live**
1. **Who holds the ISO certificates** — Vitorra or the FET manufacturer?
2. **Brand sign-off (Olivia):** buttons are now black, not gold.
3. **WhatsApp no longer pulses** — a labelled button instead; reverses July's call.
4. **Real photography** for Logistics and Coffee — there is none yet.

### Second pass (6 October 2026): motion, type, photography

After the first deploy the pages felt too dry. This pass adds what luxury
houses layer on top of restraint, without bringing the template effects back.

- **Type:** Fraunces (headlines; the free relative of Canela / Noe Display,
  with an optical-size axis) and Hanken Grotesk (body), replacing Cormorant
  Garamond and DM Sans. ⚠ A change to the brand typography; Olivia to sign off.
- **Motion, all CSS-first and switched off under reduced motion:** full-screen
  openings where the photo settles from a slow zoom and the headline rises in
  line by line; images that unveil as they scroll in; slow parallax on
  full-width photo bands; the 13.9% figure counts up; each page fades in on
  navigation; the header sits transparent over the opening photo, turns solid
  on scroll, and steps aside while reading down.
- **Photography:** 15 licensed Unsplash photographs, all graded to read as one
  set, recorded with source and photographer in
  `frontend/public/images/stock/README.md`. Never captioned as Vitorra's own.
  Four candidates rejected for another organisation's branding (Boston EMS,
  a kit maker's logo, a supermarket truck, a branded monitor); the Kampala
  skyline is cropped to remove a building-sized Johnnie Walker billboard.
  Vitorra's real photographs (head office, reception, FET field fitting, the
  SEAL manufacturer photo) are kept wherever they exist.
- **Copy:** every em dash removed from the site text in both languages (68 per
  language), each sentence repunctuated by hand rather than replaced blindly.

### Third pass (6 October 2026): every other public page

Enquire, Contact, About, Certifications, Blog (list + article), the four legal
pages, Careers (EN/SW/FR), Suppliers, the shop's "coming soon", the 404 page
and Unsubscribe are now on the same system. Every form keeps its logic
(validation, bot check, AI CV read, attribution); only the presentation changed.

- **Certifications is now an evidence centre** (external review, point 1): one
  record per credential with who issued it, what it covers, what it does NOT
  establish, and how to get the document. Data in `frontend/src/lib/evidence.ts`.
  ⚠ Operations: fill in certificate numbers, expiry dates, the legal holder
  (still unknown for the ISO certificates) and mark which documents may be
  published. Blank fields stay hidden; never guess.
- **Enquiry prefill:** "Request a sample" on the coffee page now arrives with
  export and "send a sample" already answered.
- **About:** claims removed with no evidence on record ("clients in Kenya,
  Tanzania, Rwanda", "Uganda + 5 regions", "food-safety certification",
  "every time"). Team shown as editorial portraits, CEO first.
- **Real 404:** unknown addresses used to show the framework's bare black
  screen; they now show the site's own page with the four businesses.
- **Cleanup:** 10 unused old components (≈2,100 lines) and 11 dead translation
  sections removed, plus 251 retired lines from the old product copy. The
  removed claims ("no delays at the border", "trusted by fleet operators",
  "farm-to-cup") no longer ship in the page source at all.
- **Still in the old style:** the customer portal (`/account`), the order,
  invoice and payment pages, and the gated shop catalogue/cart/checkout.

### Fourth pass (6 October 2026): sign-in, sign-up and the customer portal

- **Sign-in / sign-up:** one shell with the real head-office reception photo and
  a calm paper form; browser autocomplete hints added so password managers and
  phone keyboards fill the fields. "In real time" removed from the account perks.
- **Portal:** paper header with the customer's name, underlined tabs that scroll
  sideways on phones, a dashboard of figures plus shortcuts (new enquiry, fuel
  estimate, contact). Orders, order detail and timeline, enquiries, messages,
  documents, fuel savings and profile all moved onto the design system.
- **One status style:** the five bright pill colours (blue, purple, green, red,
  gold) are replaced by a quiet chip with a coloured dot and four tones; a muted
  green token (`ok-ink`) added for paid / confirmed.
- The two-factor and active-sessions panels are shared with the staff and admin
  profiles, so they pick up the same look there.

**Still to redesign:** the order / invoice / payment pages reached from links we send customers, and the gated shop catalogue, cart and checkout.
Suppliers, legal, Shop. Until then those pages carry the old styling.

## Campaign emails: Vitorra letterhead, support copied, test before sending (14 October 2026)

The last campaign arrived looking messy. **Why:** the email depended on
formatting rules that Outlook and Gmail strip out. The whole message sat in
one paragraph, and Outlook dropped its line breaks, so it read as one block of
text.

### A branded email, however it was written
- The gold Vitorra logo at the top, with the product line under it (Vitorra
  Coffee, Fuel Eco Tech or SEAL Wound Spray) and a thin gold rule.
- **The message itself:**
  - typed text becomes proper paragraphs;
  - lines starting with "-" become bullet points, and "1." starts a numbered
    list;
  - web and email addresses become links;
  - `**bold**` works.
- **Added automatically:** "Dear {company}," at the top and "Kind regards, The
  Vitorra team" at the end. Neither is added twice if the writer typed their
  own.
- Attachments are named in the email, so the reader knows what to open.
- A **Request a quote** button (straight to that product's enquiry form) and
  "or simply reply".
- A dark footer with the address, phone, support email, website and the
  unsubscribe line.
- **Readable everywhere:** built the way Outlook needs (tables, inline styling)
  and sent with a plain-text version as well.

### Support is copied on every campaign email
Every email goes out **from** support@vitorra.org, **replies to** support, and
now also **CCs** support. The support mailbox keeps a copy of exactly what
each customer received, and a customer pressing "Reply all" includes support
too. ⚠ The support mailbox gets one copy per recipient: a 200-customer send
puts 200 copies there. An Outlook rule filing them into a folder keeps the
inbox clear. `MAIL_CAMPAIGN_CC` changes or (empty) turns off the copy.

### Test before the full send
- The composer has **Send test**, with Thurayya, Sarah and the person sending
  ticked. The test is the real email:
  - same layout and attachments, with a real company name dropped in;
  - subject marked **[TEST]**;
  - not copied to support, and nothing recorded against any customer.
- **Preview** shows the finished email on screen without sending anything.
- **Sending a version nobody has tested needs a second click** ("Not tested
  yet. Send anyway?"). Changing the message after a test asks for a new test.
- Tests can only go to the marketing list or the sender, never to customers.
  Change the list with `CAMPAIGN_TEST_RECIPIENTS`.

> Technical detail (engineering): `App\Support\EmailBody` (escaped
> text → inline-styled paragraphs / lists / links); `emails.prospect-outreach`
> rebuilt table-based + `prospect-outreach-text`; `ProspectOutreach` gains
> `product`, `isTest`, CC from `mail.campaign_cc`, `previewHtml()`; new
> `GET /admin/prospect-campaigns/test-recipients`, `POST …/preview`,
> `POST …/test` (attachments in memory, never stored). Tests:
> `CampaignEmailTest` (8). **431 backend tests passing.**

### Signed by whoever sends it (added later the same day)
- A campaign sent from Thurayya's or Sarah's account ends with **their own email
  signature**, the one saved in their profile (`/admin/profile`), under "Kind
  regards,". The customer can see who is writing and following up. With no
  signature saved, it signs off as "The Vitorra team".
- The email is still **from** support@vitorra.org, with support **copied** and
  replies going to support.
- Test sends and the preview use the tester's own signature, so a test shows
  exactly what customers will get.
- ⚠ Thurayya and Sarah should paste their Outlook signature into their profile
  before the first campaign.

### Dropdowns in the selection bar are readable again
The Status / Assign to / Follow up menus in the dark bar at the bottom showed
white words on a white menu. Every console dropdown's menu is now dark text on
a light background.

### Deployed (14–15 October 2026)
On the server with the two entries below (commit `3302f83`). Production check
on 15 October: Thurayya has a signature saved in her profile; **Sarah has
not**, so her campaigns sign off as "The Vitorra team" until she does.

---

## Coffee customers: campaigns, quotations, follow-ups and safe re-uploads (14 October 2026)

Marketing can now work the coffee list end to end from `/admin/prospects`: email
it, quote a customer, and be reminded to chase. They can also keep re-uploading
the same growing workbook.

### Email the whole list in one go
- Tick the box at the top of the table, then **"Select all N on this list"**.
  The campaign goes to everyone the filters match (e.g. Coffee →
  go4WorldBusiness buyers), across every page, not just the 25 rows on
  screen. Until now a 200-row list needed eight separate sends.
- Ticked by default when sending: **"Remind us to follow up with everyone in a
  week"**. Everyone sent to appears under *Follow-ups due* seven days later.

### Quote a customer from their row
- Open a coffee (or FET) customer and press **Create quotation**. The quotation
  form opens with their name, email, phone and location already filled in.
- **Emailing the quotation marks that customer "Quoted"** and sets a follow-up
  three days out ("Chase quotation VHL-CF-Q-…"). An existing customer keeps the
  "Converted" status but still gets the reminder. An earlier follow-up someone
  set by hand is never pushed back.
- Only shown to people with the Quotations permission, and only for Coffee and
  FET (SEAL has no quotation template yet).

### Follow-ups with a date, not just a note
- Each customer has a **Next follow-up** date beside the note. A **Follow-ups
  due** filter shows everyone due today or overdue, and the list shows
  "Follow up today / overdue / 21 Oct" under each status.
- The launcher's **Needs attention** panel now counts "customers and prospects
  due a follow-up" and links straight to them.
- **Bulk "Follow up…"** for the ticked rows or the whole list: tomorrow, in 3
  days, a week, 2 weeks, a month, or clear. Status and owner changes also apply
  to the whole list now.

### Re-uploading the updated workbook adds only the new customers
- Upload the same workbook as often as it grows. **Only rows not already on the
  list are added.** A row counts as already there if any of these match:
  - the name, ignoring capitals, punctuation and "Ltd / Limited / Co";
  - the email;
  - the phone number, whether written 0772… or +256772….
- This holds even if the row was filed under a different buyer type before.
- **Nothing the team edited is overwritten.** If an existing row had no email or
  phone and the sheet now has one, the blank is filled in.
- A row that matched an existing customer on email or phone under a *different*
  name is listed after the upload, so someone can confirm it is the same business
  (two businesses can share one inbox).
- A row repeated inside the same file is added once.

> Technical detail (engineering): migration `2026_10_14_000001` (`follow_up_on`
> on `prospects`); `Prospect::scopeFiltered()` shared by the list, the new
> `PATCH /admin/prospects/bulk` and campaigns (`all_matching` + filters);
> `quoted` status; `App\Support\ProspectMatchIndex` (name / email / last-9-digit
> phone); `QuotationController::scheduleFollowUp()`; `stats.prospects.follow_ups_due`;
> `DocumentEditor` `initialCustomer` + `/admin/quotations/new?name=&email=&phone=&address=`.
> Tests: `CoffeeOutreachTest` (9). **423 backend tests passing.**

### Deployed (14 October 2026)
Pulled and migrated on the server (`2026_10_14_000001` ran). By 15 October
marketing had loaded **54 coffee rows**.

---

## Customer sign-in fix, coffee customer import, new FET prices (14 October 2026)

### Signing in with a new email opened the previous account — fixed
A customer who signed in (or registered) with a new email could land in the
**previous** account used on that browser, seeing someone else's orders and
details.

- **The cause:** the server is set up to accept sign-in cookies from the website,
  but the website signs people in with a separate pass of its own. When both
  arrived, the server believed the old cookie over the new sign-in. "Sign out" in
  the customer portal also only forgot the account in the browser and never ended
  it on the server, so the old sign-in stayed alive.
- **The fix:** a new sign-in now always decides who you are. The website no longer
  sends old cookies, sign-ins from the website now get their own pass, and
  "Sign out" ends the session on the server too. The same fix covers the staff and
  admin portals, which had the same weakness.
- ⚠ Everyone signed in (customers, staff and admins) will be signed out **once**
  after the deploy and needs to sign in again.
- The new sign-in pass is limited to the portal it was issued for. Until now the
  old cookie skipped that limit, so admin, staff and customer sign-ins were less
  separated than intended.

### Coffee customers can be imported
Marketing can now load the coffee customer list into the system themselves, in
`/admin/prospects` → **Import list**.

- **Coffee is its own list**, beside FET and SEAL, with its own buyer types:
  **go4WorldBusiness buyers** (listed first, as most coffee buyers come through
  our listing there), cafés & restaurants, hotels, supermarkets & shops,
  offices, distributors, export buyers and individuals.
- **Upload the Excel file as it is** (.xlsx) or a CSV. No more "Save As CSV".
  Title rows above the header and a numbered "No." column are handled, and the
  name column is found from its heading.
- Tick **"These are existing customers"** and the rows are filed as converted
  rather than as cold leads.
- **Uploading the same file twice is safe:** rows already on the list are
  skipped.
- **One buyer type per upload:** a mixed list needs splitting by type first.
- Once imported, the coffee list works like the others: filter, assign an owner,
  export, and email it through the campaign tool with attachments. A template
  saved while on the coffee list is filed under "Coffee".

### New FET price list (from the printed product catalogue)
| Model | Old (EUR) | New (UGX, installed) |
|---|---|---|
| FET-PRO-FI | €365.40 | **1,891,000** |
| FET-PRO-FII | €630.71 | **3,245,000** |
| FET-PRO-FIII | €1,028.69 | **5,276,000** |
| FET-PRO-FIV | €1,957.30 | **10,015,000** |

- **Updated in all three places:** the website's pricing section, the
  reservation flow and the savings calculator; what a reservation actually
  charges; and the downloadable **product datasheet PDF**.
- The calculator's default currency was already UGX, so a visitor now sees the
  catalogue price exactly, with no conversion. The USD and EUR equivalents are
  shown beside it.
- **Mismatches are now blocked:** the PDF generator refuses to build if its
  prices differ from the website.
- ⚠ **Not copied from the catalogue page:**
  - **Engine sizes.** The catalogue prints the old, narrower ranges (1.4–2.0,
    2.1–3.0, 3.1–6.7, 12–13). The site keeps the manufacturer's ranges, because
    the narrower ones told buyers with 10–12L or 15–16L engines that nothing
    fits.
  - **"5-year manufacturer's warranty"** (the site and datasheet say 1 year).
    This is a commitment to customers and needs the Director's confirmation
    before it changes.
  - **"Up to 15% savings".** The site keeps the independently tested 13.9%.

> Technical detail (engineering): `PreferBearerToken` middleware (Bearer token
> skips Sanctum's session guard); `AuthController::wantsSessionAuth()` (session
> only when the client sends `X-XSRF-TOKEN`); `authFetch` uses
> `credentials: "omit"` in token mode; `logoutCustomer()`. `Prospect::PRODUCTS`
> gains `COFFEE` + verticals; `ProspectController::import` reads xlsx/xls via
> PhpSpreadsheet, `existing_customers` → `converted`. `FET_TIERS.priceUgx`,
> `formatUgx`; `FetPriceListSeeder`; `assert_prices_match_site()` in
> `scripts/generate_fet_pdfs.py`. Tests: `StaleSessionTest`,
> `CoffeeCustomerImportTest`, `FetPriceListTest`. **413 backend tests passing.**

### Deployed (14 October 2026)
On the server, and `FetPriceListSeeder` has run: reservations charge
UGX 1,891,000 / 3,245,000 / 5,276,000 / 10,015,000.

⚠ **Lesson from this deploy:** the first attempt failed with "FetPriceListSeeder
does not exist" because the server had not pulled. It was still four commits
behind. **The server does not pull by itself.** Every backend release starts
with `git pull`. Corrected in the server note at the bottom.

⏳ **Still open from the catalogue page:** the **5-year manufacturer's warranty**
it advertises (the site and datasheet say 1 year) needs the Director's
confirmation before the site changes.

---

## FET stock overview, week by week (26 October 2026) — built, not yet deployed

Finance asked for a weekly view of FET stock per model. It is a new **Stock** tab
in Accounting → Books (`/admin/accounting?tab=stock`, also "FET stock overview"
in ⌘K).

- **What Finance records:** each movement, with its date, model (FI–FIV) and
  quantity: **Received** (a delivery), **Sold / installed**, **Returned**, or a
  **stock-count correction** (+/−, a reason is required). Delivery note or
  invoice number goes in the reference.
- **What they see:**
  - devices on hand per model, valued at the catalogue price;
  - a **week-by-week table** (Monday to Sunday) showing each model's closing
    stock, with devices in and out underneath. Pick a model for opening,
    received, sold, returned, corrected and closing;
  - every movement behind it;
  - a CSV export for the accountant.
- **Stock is never typed in, only worked out**, so a late entry or a removal
  updates every week after it.
- **It refuses to go below zero.** Selling a device the book never received
  means a delivery is missing, and it says so instead of showing −1.
- **Who can do what:** anyone with Accounting records. Only the senior officer
  (`accounting_approve`) can remove an entry, and each removal goes in the
  activity log.
- **First step for Finance:** record the devices on the shelf today as
  *Received*, then keep it up as stock moves.
- **Picked up by** (added the same day, Finance's request): every movement
  carries the name of the person who physically collected the devices —
  **required when devices go out**, optional otherwise. Shown in the
  movements list beside who recorded the entry.
- **Weekly "devices out" PDF:** a **PDF** button on each week's row prints
  that week's sheet — every device that left stock (date, model, quantity,
  who picked it up, reference, note), the week's opening/received/out/
  closing stock per model, and lines for *Prepared by*, *Checked by* and
  *Date*. Migration `2026_10_26_000002` (`picked_by`); route
  `GET /admin/accounting/stock/week-pdf?week=`.

> Technical detail (engineering): migration `2026_10_26_000001`
> (`fet_stock_movements`, signed `quantity`); `FetStockMovement::MODELS` maps
> each model to its product slug for pricing; `FetStockController`
> (`GET/POST /admin/accounting/stock`, `GET …/stock/export`,
> `DELETE …/stock/{movement}` under `accounting_approve`);
> `components/admin/FetStock.tsx`. Tests: `FetStockTest` (9). **443 backend
> tests passing.** Deploy needs `migrate --force` + `route:cache`.

---

## Sending a quotation or invoice: choose who gets it (26 October 2026) — built, not yet deployed

Finance raised it: a quotation or invoice went to the customer the moment anyone
pressed the button, and unfinished drafts went out more than once. It looked
unprofessional.

- **"Send…" now opens a window.** Nothing is emailed until the sender ticks who
  gets it:
  - **The customer**: unticked by default, so it is always a deliberate choice;
  - **another contact at the client**, searched from the system;
  - **anyone on the Vitorra team**, with a short note.
- **"This is final" tick.** A send that includes the customer needs it ticked
  before the button works.
- **Send to colleagues for review.** They get the PDF marked **"For review — the
  customer has NOT received it"**, the note, and a link to open the document.
  Nothing changes: the document stays a draft and no follow-up is booked. A
  colleague copied on a real send gets it marked "Copy". Replies go to the
  sender.
- **No typed addresses.** Each client recipient must be the document's own
  customer or someone already in the system (prospect list, enquiry, contact
  message or customer account). A mistyped email is refused, not delivered to a
  stranger. Staff who have left are not on the team list.
- **Find customer on the form.** The quotation and invoice form has a **"Find
  customer in the system"** box that fills in the name, email, phone and
  location instead of retyping them.
- **Every send is in the activity log**: who sent which document to whom.
- Same window on the Books → Invoices list, which also used to send in one
  click.

> Technical detail (engineering): `App\Support\DocumentRecipients` (team vs
> client split, known-client check, client search across prospects / customer
> users / enquiries); `App\Mail\DocumentForReview` + `emails.document-review`;
> `send()` on `QuotationController` / `InvoiceController` now requires `to[]`
> (+ optional `note`); `GET /admin/accounting/documents/recipients?q=`;
> `components/admin/SendDocument.tsx` (`SendDocumentDialog`, `ClientFinder`).
> Tests: `DocumentSendTest` (8). **463 backend tests passing.** No migration;
> deploy needs `config:cache` + `route:cache`.

---

## The cinematic redesign (26 October 2026) — live

The October "Quiet Authority" pages kept their wording, colours and type, and
gained depth, motion and interaction. The site read as clean but static: flat
bands, a generic four-card grid, nothing that answered the visitor.

**Across the public site** (admin, staff and customer portals untouched)
- Smooth, weighted scrolling (Lenis) and soft transitions between pages. A
  homepage business photo is handed into that business's page hero as you
  click through (React view transitions).
- A cursor ring that becomes a gold **"View"** disc over photographs; a gold
  reading-progress line; buttons that lean toward the pointer; a frosted
  header; a full-width "Vitorra" signature in the footer.
- Heroes: the photograph moves with the mouse and sinks as you scroll; the
  headline rises from behind a mask, line by line.

**Showpiece moments**
- **A real-time 3D Fuel Eco Tech device** (three.js), modelled from the
  product's shape. On the homepage it turns beside the measured result
  (11.52 → 9.92 L/100 km → 13.9%, counted up, then the honest caveat) and
  opens to show the swirl chamber. On the FET page it sits beside "How it
  works" and opens on the swirl-chamber step. The open view is **labelled as
  an illustration**, not a photograph of a production unit.
- **Homepage businesses:** four tall panels; the one under the pointer opens
  to full colour with its description, the others fold to their name.
- **SEAL:** the four application steps travel sideways as you scroll, on dark;
  the three formats tilt toward the pointer.
- **Coffee:** grown → processed → roasted travels sideways with photographs.
- **Logistics:** "Each link in the chain" — the four services on one gold
  line that draws itself, each link lighting as it is reached. (No route map:
  our copy names no ports or countries, and a map would invent claims.)
- **About:** the mission statement fills in word by word as you read it.

**Built to stay fast and inclusive**
- 3D loads only as it is about to appear; phones on data-saver, very
  low-memory devices and browsers without WebGL get the product photograph.
- Everything that moves is switched off for visitors who ask their device for
  reduced motion; sideways sections become ordinary lists on phones.
- Content is in the page from the first byte, as before.

**⏳ Open**
- ~~The FET packshot reads "Fuel *Eca* Tech"~~ ✅ replaced with the real
  product photograph (26 October).
- Olivia / Solomon sign-off on the new motion and the 3D device.
- Libraries added: `lenis`, `motion` (formerly Framer Motion), `three`,
  `@react-three/fiber`, `@react-three/drei`. Radix was not added — the site
  already uses Base UI, from the same team.

> Technical detail (engineering): `components/motion/*` (SmoothScroll, Cursor,
> ScrollProgress, Magnetic, HeroMotion, Parallax, WordReveal, HorizontalSteps,
> TiltCard, ServiceChain), `components/three/FetDevice{,Canvas}.tsx` (lathed
> geometry, Lightformer studio lighting — no HDR download — dynamic import,
> IntersectionObserver mount), `sections/EvidenceStory.tsx`,
> `sections/DeviceSteps.tsx`, `system/BusinessPanels.tsx`; `next.config.ts`
> `experimental.viewTransition`; view-transition + mask-reveal CSS in
> `globals.css` ("CINEMATIC LAYER"). `types/react-canary.d.ts` for
> `<ViewTransition>`. Build, typecheck and lint clean.

---


## The bold redesign (27 October 2026) — live

Inspired by a review of troimedia.com: bigger type, round calls to action,
warm cream and sage chapters, and Olivia's designed images throughout. Built
on `redesign/bold`, previewed, then merged to `master`.

**Homepage**
- **Statement opening:** "Four businesses. / One standard." set like a poster
  across the page, with one round "Tell us what you need" button and the
  Kampala skyline below. Text is solid (an earlier version started half-faded).
- **Credentials strip** under the opening: CTI GmbH, AVL Technologies,
  qm-solutions GmbH, ISO 9001 / 14001 / 27001, Zurich Insurance, set as type
  (using their logos needs their permission).
- **Proof slides:** Olivia's four designed facts travel sideways as you scroll
  (a plain list on phones).
- **The company:** the gold reception sign, on sage, with "About Vitorra".
- **Quick answers** before the contact close (see the next section).
- **Footer** rebuilt on dark: an animated "Let's talk" link, the newsletter,
  logo once, three link columns, no repeated contact details. A gold
  back-to-top ring shows how far down the page you are.

**Business pages**
- **New opening photos** for FET (device on the fuel line) and SEAL (can in a
  gloved hand). Homepage, coffee and logistics kept their earlier photos, the
  team's choice. On phones the photo shows in full with the headline below,
  so the product is never hidden behind text.
- **FET:** two fuel bars drawn to scale (11.52 vs 9.92 L/100 km, 13.9% less),
  pricing tiers with a vehicle icon each, Olivia's wide and key-visual banners,
  a new film cover.
- **SEAL:** the range cards show the **real OTC, PRO and Pet cans** (cut-outs
  of the official photos, real labels), at one display height because their
  true relative sizes are not known.
- **Coffee:** a real map of Uganda with Mount Elgon marked, retouched process
  photos, and the coffee film (plays only when pressed).
- **Logistics:** a real East Africa map with the Northern Corridor (Mombasa)
  and Central Corridor (Dar es Salaam) drawing themselves as you scroll,
  marked "schematic routes, not to scale"; the logistics film added.
- **Contact, Blog and Careers** now open the same way as the homepage. Careers
  uses the main site header and footer and keeps its EN/SW/FR switch.

**Honesty notes**
- Several of Olivia's round-2 images are generated or retouched (the FET
  installation is an illustration, the coffee warehouse and container truck
  are not ours). Provenance per file: `frontend/public/photos/README.md`.
  The real field photographs stay the FET evidence.
- Maps use Natural Earth (public domain) borders; routes are town to town.

> Technical detail (engineering): `sections/StatementHero.tsx`,
> `sections/PageHero.tsx`, `system/CircleLink.tsx`, `sections/ProofCarousel.tsx`,
> `sections/CredentialStrip.tsx`, `sections/FuelBars.tsx`, `maps/RouteMap.tsx`,
> `maps/OriginMap.tsx` with `maps/geo.ts` generated by `scripts/build_maps.py`,
> `ui/VehicleIcon.tsx`, `system/Film.tsx`, `layout/Footer.tsx`,
> `motion/BackToTop.tsx`; tokens cream `#F5F0E6` and sage `#EDEFE3` (contrast
> checked); banners `public/banners/*.webp`, photos `public/photos/`.
> Olivia's full package (`Vitorra-Website-Package/`, 45 MB) is kept out of git.

---

## Found by Google, Bing and AI assistants (27 October 2026) — live

Goal: show up in Google and Bing results, and be the source AI assistants
(ChatGPT, Copilot, Perplexity, Google AI Overviews) quote when someone asks
about fuel savings, wound spray, Ugandan coffee or East African freight.

- **Structured facts on every page** (schema.org): who Vitorra is (legal name,
  URSB number, address, contacts), each product (FET with its four UGX
  prices, SEAL, coffee) and the logistics service, questions and answers,
  breadcrumbs. Blog posts carry article data, and their "Questions" section
  becomes Q&A data. Open job roles carry job-posting data for Google's job
  listings.
- **Quick answers** on the homepage and the four business pages (EN/SW): the
  questions people search, each answered in one or two sentences. Google only
  uses Q&A data that visitors can also see, so these are on the page.
- **`vitorra.org/llms.txt`:** a plain summary for AI assistants, built from the
  site's own data so prices cannot drift.
- **Bing told immediately (IndexNow):** every blog publish notifies Bing, whose
  index feeds ChatGPT search and Copilot. All 43 pages were submitted on
  27 October (accepted). Re-run `python3 scripts/indexnow_submit.py` after a
  release that changes many pages.
- **robots.txt** names the search and AI crawlers and lets them in; private
  areas (admin, staff, accounts, invoices, orders, payments) stay closed.
- **Each page names its English and Swahili versions** so they rank as a pair.
- **`/sw/careers`**, an old copy, now redirects to `/careers`.
- **Blog routine** (`/blog-post`): articles now open with the answer, use
  question headings, and end with a short Questions section.

**⏳ To finish**
1. ~~**Server update**~~ ✅ done 28 October with the Google Ads release.
2. **Google Search Console:** add vitorra.org, verify (TXT record at GoDaddy, or
   set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` on Vercel), submit the sitemap.
3. **Bing Webmaster Tools:** import from Search Console (or set
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`).
4. **Google Business Profile and Bing Places** for Padre Pio House.
5. **Company social links** (LinkedIn etc.) to add to the organisation data.

> Technical detail (engineering): `lib/seo.ts` (organization, website,
> products, `faqPage`, `breadcrumbs`, `faqFromHtml`, `localeAlternates`),
> `sections/QuickAnswers.tsx` + `answers` messages, `app/llms.txt/route.ts`,
> `app/robots.ts`, `app/sitemap.ts` (careers + open roles, English only),
> `careers/[slug]/layout.tsx` (JobPosting), key file
> `public/25453b7fae61c6b0aa0b2c5a0db0a22b.txt`; backend
> `App\Services\IndexNow` (on in production only; `services.indexnow`),
> `BlogPost::booted()` hook, `CareersController@show` adds `posted_at`.
> Tests: `IndexNowTest` (2). **485 backend tests passing.**

---

## Google Ads in the console (28 October 2026) — live, Google connection pending

Marketing now pays for Google Ads and Plausible is no longer running, so the
question "what did the ad money produce?" needed Google's numbers beside ours.

**On the website**
- The Google tag (`AW-18227983736`) now respects the cookie banner (Google
  Consent Mode v2). Until a visitor presses "Accept all", Google gets only
  cookieless signals with advertising identifiers removed, and no advertising
  cookie is set. Before this, the tag set Google's cookies for everyone while
  the cookie policy said "we do not use advertising cookies". The banner, the
  cookie policy and the privacy policy (EN + SW) now describe Google Ads.
- **Conversions reported to Google** for an enquiry, a contact message, an FET
  reservation (with its value), a newsletter sign-up, and any tap on a phone or
  WhatsApp link. Each one needs its label from Google Ads; one without a label
  is simply not sent. With consent, the email and phone are passed for Google's
  enhanced conversions (Google hashes them in the browser).
- Staff screens (`/admin`, `/staff`) and the reception screen are never tagged.
- iPhone ad clicks (`gbraid` / `wbraid`) now count as Google Ads, like `gclid`.
- Plausible is removed (script, server code, dashboard card).

**In the console: Insights → Google Ads (`/admin/google-ads`)**
- Spent, clicks, leads from ads, cost per lead, won deals and cost per sale,
  with the previous period for comparison. Periods: 7 / 30 / 90 days, this
  month, last month.
- Spend per day and leads per day.
- **Campaigns table**: each campaign's spend, clicks and click cost beside the
  enquiries and wins it produced. A lead is tied to its campaign by its Google
  click, so this works even when the ad links carry no campaign tags.
- **What people searched**: the search terms that cost money, flagged when
  they have not produced a conversion.
- **Latest leads from ads**, with campaign and keyword.
- Overview's old Plausible card is now a 7-day Google Ads card. The Enquiries
  list shows the campaign under the source.
- Leads from ads are counted **before** Google Ads is connected; only spend,
  campaigns and search terms wait for the connection.

**Won deals go back to Google.** When an enquiry from an ad is converted to an
order, the sale and its value are uploaded to Google Ads, once. Google's
bidding then learns which searches bring buyers, not just form fills. It is off
until an admin picks an import-type conversion action on the screen.

**Who sees it:** the new `google_ads` module is on by default for Marketing,
Finance and Leadership. Ops accounts with a custom permission set need it
ticked in `/admin/staff`. Connecting and disconnecting the ad account is
admin-only, and both are written to the activity log.

**⏳ To switch it on**
1. **Google Cloud (IT, about 20 minutes):**
   - Create a project, enable the **Google Ads API**, and on its overview page
     apply for **Explorer** access. Test access cannot read the real account.
     Developer tokens were retired by Google on 9 September 2026, so none is needed.
   - Create an OAuth client (Web application), with redirect URI
     `https://vitorra.org/api/google-ads/oauth/callback`.
   - Put the client id and secret in `backend/.env` as `GOOGLE_ADS_CLIENT_ID` /
     `GOOGLE_ADS_CLIENT_SECRET`.
2. ~~**Server update**~~ ✅ done 28 October (migration run; `google-ads:status`
   lists what remains).
3. **Connect:** an admin opens `/admin/google-ads`, presses **Connect Google Ads**,
   signs in with Marketing's Google Ads login, and picks the ad account.
4. **Marketing, in Google Ads (Goals → Conversions):**
   - Create one "Website" conversion action each for enquiry, contact,
     reservation, newsletter and call/WhatsApp click.
   - Send the labels so they can be set on Vercel:
     `NEXT_PUBLIC_GOOGLE_ADS_LABEL_ENQUIRY`, `_CONTACT`, `_RESERVE`,
     `_NEWSLETTER`, `_CALL`. Then redeploy.
   - Turn on **enhanced conversions** for those actions.
5. **Optional: won-deal reporting.** Create an **Import → clicks** conversion
   action and choose it on the console screen.
6. Preview deployments carry the tag too. Set `NEXT_PUBLIC_GOOGLE_ADS_ID=` (empty)
   on Vercel's Preview environment to keep test visits out of the ad reports.

> Technical detail (engineering): backend `App\Services\GoogleAds\{GoogleAdsClient,
> GoogleAdsSync}` (plain REST with the Laravel HTTP client, API `v26`; no gRPC SDK,
> which cPanel cannot build), `GoogleAdsController`, models `GoogleAdsAccount`
> (refresh token `encrypted` cast; its own table so `Setting::resolved()` can
> never serve it), `GoogleAdsCampaignDay`, `GoogleAdsSearchTerm`; commands
> `google-ads:sync` (`--days`, `--retry-failed`) + `google-ads:status`; `services.google_ads`.
> The sync replaces its date window (Google restates recent days); click lookup is
> `click_view` by gclid (90-day window, checked once per lead); conversions upload
> one at a time with `orderId = enq-{id}`. An hourly run is ~4 API operations plus
> one per new Ads lead (Explorer allows 2,880/day). Frontend `lib/google-ads.ts`,
> `components/GoogleTag.tsx`, `lib/cookies.ts` (`COOKIE_CONSENT_EVENT`), conversions
> fired from `lib/api.ts`, page `app/admin/google-ads/page.tsx`. Tests: `GoogleAdsTest`
> (15). **500 backend tests passing.**

---

## Google Ads: where the Display ads showed, what Performance Max matched (29 October 2026)

The first real sync (28 October) showed **9,854 ad clicks for a spend of 131
(account currency) over 30 days, and no enquiry traced to an ad**. Vitorra's
campaigns are Display and Performance Max, which never fill the ordinary
search-terms report, so the console could not say what the money bought.

- **Where your Display ads showed** (Insights → Google Ads): spend split by
  kind of place (mobile apps, websites, YouTube) and the top 25 placements
  by spend, each flagged when it costs money without a conversion.
- **What people searched** now falls back to **Performance Max search
  themes** (Google's grouped categories; it shares no exact words or cost
  per theme).
- Both are a rolling 30-day snapshot refreshed on every sync, labelled with
  their own dates. A report Google refuses is skipped and logged, never
  allowed to stop the spend sync.

**For Marketing:** check that auto-tagging is on; look at where the Display
spend lands (apps vs websites); put the five conversion labels on Vercel so
Performance Max optimises for enquiries, not cheap clicks; consider a Search
campaign on buying keywords.

**Server:** pull, `migrate --force` (`2026_10_29_000001`), then
`google-ads:sync --days=30`.

> Technical detail (engineering): `google_ads_insights` (`kind` placement |
> search_theme, window_from/to), `GoogleAdsSync::syncInsights()` —
> `group_placement_view` and `campaign_search_term_insight` (one query per
> Performance Max campaign, filtered by campaign id and date range). Tests:
> `GoogleAdsTest` now 17.

---

## The console, redesigned like Odoo (28 October 2026)

Asked for: the console to look and work like Odoo, easier to read, with
plain professional fonts, real reporting screens, and dark mode.

- **Top bar like Odoo's:** dark, with the app's name and its menu; the
  current screen is highlighted. The apps button (top left) returns home.
- **Home screen is Odoo's app grid:** a coloured tile per app with a red
  badge for what is waiting, under the "Needs attention" list.
- **Every screen opens with a control panel:** a breadcrumb ("Sales /
  Enquiries") and its buttons on the right, on a white band.
- **Readable:** the system font (San Francisco on Mac, Segoe UI on
  Windows) replaces the serif titles; body text is 14px and every small
  size stepped up one notch; faint grey text darkened to at least 4.5:1.
- **List views:** bold column headers in sentence case, roomier rows,
  status tags as coloured pills.
- **Dark mode:** profile menu → Appearance → Light / Dark / System
  (System follows the computer and switches with it). Remembered per browser.
- **Reporting like Odoo's graph and pivot views** (Overview, CEO report,
  Google Ads, Accounting → Overview): every chart has a measure picker,
  Bar / Line / Pie, and a Graph ⇄ Pivot switch (the pivot is the table of
  the same numbers, with totals). Hover shows the exact figures. Headline
  tiles show the change against the previous period, green or red by
  whether the change is good. Overview now covers the last 30 days.
- The public cookie banner no longer shows inside the console or the staff
  portal (no optional cookies are set there).

> Technical detail (engineering): `--o-*` theme tokens in `globals.css`
> (`.admin-console[data-theme="dark"]`, also defined at `:root` so console
> components reused by the staff portal stay light); token utilities
> (`text-ink`, `bg-paper`…) re-pointed inside the console; ~1,400 inline
> hex colours across 41 console files converted to tokens. `lib/console-theme.ts`,
> theme switch in `UserMenu`, breadcrumb `PageHeader`, `components/admin/reporting.tsx`
> (`GraphView`, `KpiTile`; series colours are the validated dataviz order,
> stepped for dark). `AdminController::stats` trends now 30 days.

## Removing staff test records from the feeds (28 October 2026) — command ready

Enquiries, orders and messages the team made while testing (John's Gmail
addresses, @vitorra.org addresses, staff names) hid the real customers.
`php artisan leads:purge-test` finds them and removes them.

- Matches: the email of any staff login, any @vitorra.org address, any
  address passed with `--email`, or a name containing a staff member's full
  name. A record named with a staff **first name only** ("John") is listed
  but kept unless `--include-first-names` — a customer can be called John.
- Lists by default and deletes nothing. `--force` deletes what it listed,
  after writing every row (with its items and documents) to
  `storage/app/private/purge-backups/`. Logged in the activity log.
- Also removes the generated PDFs, the staff replies logged against those
  records, and the test addresses from the customer directory and pipeline
  when nothing else uses them.

**To run on the server:**
```bash
cd ~/vitorraweb && git pull origin master && cd backend
/opt/alt/php83/usr/bin/php artisan leads:purge-test --email=leojohnseyi@gmail.com --email=johngraphics@gmail.com
# read the list; if right:
/opt/alt/php83/usr/bin/php artisan leads:purge-test --email=leojohnseyi@gmail.com --email=johngraphics@gmail.com --force
```
Tests: `PurgeTestLeadsTest` (3). **503 backend tests passing.**

---

## ⏳ Remaining / pending

**Revenue-blocking**
1. ~~**Live payment gateway**~~ ✅ **Built (Flutterwave)** — now an **activation** task, not a build: set `PAYMENT_DRIVER=flutterwave` + keys, generate a webhook secret hash in the Flutterwave dashboard and set `FLUTTERWAVE_SECRET_HASH`, set `NEXT_PUBLIC_ONLINE_PAYMENTS=true`. Verify with `/admin/payments` or `php artisan flutterwave:status`. Sandbox-test, then go live.
2. **Confirm coffee retail prices** → enter in `/admin/products`, then flip the coffee shop on (one flag) — Flutterwave checkout already wired.

**The AWS move — no longer waiting on Amazon; the rest is ours**
A. ~~**Amazon must verify both accounts**~~ ✅ **Cleared (1 September).** The
   delivery layer (CloudFront) and the firewall are now live on production as
   well as staging — `www.vitorra.org` served from `origin.vitorra.org`, WAF in
   report-only mode. The Namecheap backend address is allow-listed at priority
   0, because it POSTs `/api/revalidate` after every blog publish and
   rate-limiting that is exactly how blog publishing silently stops working.
B. **Next: walk the whole test site** for two or three days — every product page,
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

**Google Ads (from 28 October)**
- **Run `leads:purge-test` on the server** (list, check, then `--force`) so the feeds show only customers.
- Google Cloud OAuth client + Explorer access, server update, then **Connect** in `/admin/google-ads` (see "Google Ads in the console").
- Marketing: the five conversion labels for Vercel, enhanced conversions on, and optionally an Import → clicks action for won deals.

**Website and search (from 27 October)**
- **Google Search Console, Bing Webmaster Tools, Google Business Profile, Bing Places** — need John's or Marketing's logins.
- **Blog:** three drafts (diesel prices, coffee EUDR, FET fuel costs) waiting for Send for review; set the coffee export article's cover to `/banners/blog-coffee-export.jpg`.
- **Testimonials:** two or three real client quotes, each with written consent.
- **A sharper SEAL PRO photo** from the manufacturer (the current one is small).
- **Tidy the project folder:** Olivia's original PNGs in the root are no longer used.

**Marketing — before the first coffee campaign (from 14–15 October)**
3. **Sarah: paste your Outlook signature into My profile** (`/admin/profile`).
   Thurayya's is saved. Without one, a campaign signs off as "The Vitorra team".
3b. **Send one test first.** In the composer, press **Send test** (Thurayya,
   Sarah and the sender are ticked) and check it in Outlook before the full send.
3c. **Support mailbox: add an Outlook rule** that files campaign copies into a
   folder. Support is copied on every campaign email, so a 200-customer send puts
   200 copies in the inbox.
3d. **Director's decision: FET warranty.** The new product catalogue advertises
   a 5-year manufacturer's warranty; the website and datasheet say 1 year. Also
   on that page and deliberately not copied: "up to 15% savings" (the site keeps
   the tested 13.9%) and narrower engine ranges than the manufacturer's.

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
8. ~~Grant "Accounting — approve" to the Senior Finance Officer~~ ✅ **Joseph
   Rwabu holds it** (checked 15 October). Still worth granting it to a **second
   person**, or leave stalls whenever Joseph is away. Same screen: grant the
   **People / Executive / Suppliers / Accounting** modules to existing ops
   accounts (admins already have everything).
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
21. Native-speaker review of the Swahili (and new French) copy; blog posts; client testimonials; coffee photos.
22. **Footage.** The reception screen is covered — all four lines have film. Still
    worth having: our own Logistics footage to replace the licensed stock, and a
    sharper SEAL film (the one we hold is the lowest-resolution asset on the
    screen, and there is no better master to re-encode from). Anything shot for
    that screen should be **dark and cinematic** — see
    `frontend/public/videos/README.md`.

---

## 🚀 Standard backend deploy (Namecheap)

The frontend releases itself on push to `master` — currently to Vercel (live) and,
in parallel, to AWS (built, not yet serving). Nothing to run by hand either way.
The backend is still released manually:

```bash
cd /home/okelvaxj/vitorraweb && git pull origin master
cd backend
# Run composer when dependencies changed (e.g. the 2FA libs / guzzle patch):
/opt/alt/php83/usr/bin/php /opt/alt/php83/usr/bin/composer.phar install --no-dev --optimize-autoloader
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
/opt/alt/php83/usr/bin/php /opt/alt/php83/usr/bin/composer.phar install --no-dev --optimize-autoloader
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

### Also riding the next deploy (1 September 2026) — lead source + enquiry chasing

Carries a **database change** (lead-source columns on `enquiries` and
`contact_messages`, SLA timestamps on `enquiries`) and one new scheduled
command, so after the pull:

```bash
/opt/alt/php83/usr/bin/php artisan migrate --force
/opt/alt/php83/usr/bin/php artisan config:cache
```

Then, before the chaser is relied on, set the escalation list in `backend/.env`:

```
ENQUIRY_SLA_ESCALATE_TO=victor@vitorra.org,solomon@vitorra.org
# Optional — defaults are 4 and 24 hours:
# ENQUIRY_SLA_CHASE_HOURS=4
# ENQUIRY_SLA_ESCALATE_HOURS=24
```

Check what it would do without sending anything:

```bash
/opt/alt/php83/usr/bin/php artisan enquiries:chase --force --dry-run
```

> `enquiries:chase` rides the existing `schedule:run` cron (hourly) and decides
> for itself whether it is inside working hours. The frontend half deploys
> itself.
>
> ⚠ Lead-source reporting starts from the deploy date — it cannot backfill where
> past enquiries came from. For the Google Ads figures to be meaningful, the ad
> destination URLs need campaign tags adding by whoever manages the ads.

### Deployed: the 7 August release ✅ (confirmed on production 15 October 2026)

All done: `leave_approvals` migrated, Uganda holidays synced (16 for 2026) and
the SEAL list loaded (125 rows). No account exists for `shakirah@vitorra.org`
on production, so there was nothing left to offboard. Kept below as the record.

The **two-signature leave approval carries a database change** (`leave_approvals`),
so `migrate --force` is required. `staff:offboard` and the departed-staff login
block ship in the same pull and need no migration. Everything below is idempotent —
safe to run even if it has already been done:

```bash
# Only if not already run since 30 July — adds libphonenumber:
/opt/alt/php83/usr/bin/php /opt/alt/php83/usr/bin/composer.phar install --no-dev --optimize-autoloader
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

### Fifth pass (6 October 2026): the admin panel becomes a console

The back office was reorganised the way Odoo organises a large business tool: a set of apps, each with its own short menu, instead of one 25-link sidebar.

- **App launcher at `/admin`.** Apps grouped by purpose: Sell (Sales, Orders, Fuel Eco Tech), Money (Accounting, Insights), Run the company (Operations, People), Publish (Website), Administer (Settings). Each person sees only the apps their permissions allow. The registry is `frontend/src/lib/admin-apps.ts`.
- **"Needs attention" panel** on the launcher: new enquiries, customers gone quiet, prospects with broken contact details, orders waiting, book entries awaiting approval, overdue tasks, supplier applications, leave awaiting signatures and unread messages. It uses existing endpoints, and each line shows only to people who can act on it.
- **Top bar:** an apps button, the current app and its menu, notifications and the profile menu.
- **⌘K / Ctrl K command palette:** jump to any screen, run common actions, or type two letters to search customers and prospects live.
- **The old dashboard** moved to Insights → Overview (`/admin/overview`).
- **Console styling:**
  - New `c-` primitives in `globals.css`: toolbar, inputs and selects, buttons, dense tables, status chips, section tabs.
  - Older screens are squared off and brought into line through scoped rules, so every app reads the same.
  - `PageHeader` takes an `actions` slot, and `StatusBadge` uses one shared colour map.
- **Sales tools:**
  - **Prospects:**
    - Three rows of filter pills became one toolbar with an owner filter.
    - Cards became a dense table (about 15 rows per screen instead of 5).
    - New bulk actions to set status and assign an owner across selected rows.
  - **Customers:** a dense table, with the full record opening in a side panel beside the list (Esc closes it).
  - **Enquiries:**
    - **Fixed:** the screen only ever showed the newest 25. It now pages.
    - New search by name, email or company. This needs the backend `q` filter (`AdminController::enquiries`, tested in `EnquirySearchTest`), so it works once the API is redeployed.
  - **Accounting and Careers:** section tabs became an underline bar. Accounting accepts `?tab=` deep links.

## Quotations & branded invoices (8 October 2026) — ✅ live

Finance's "Quote & Invoice Manager" design (`Vitorra_Quote_Invoice_Manager_DESIGN.html` + the three PNGs) is built into Accounting.

- **Templates:**
  - The Coffee and FET quotation and invoice designs are rebuilt as real PDF layouts (`resources/views/documents/branded.blade.php`, data from `App\Support\BrandedDocument`). They are not text pasted over a picture, so any number of lines works and pages break cleanly.
  - Only the artwork comes from the designs: logo, product photography, title band, section bars, totals panel.
  - `scripts/generate_document_art.py` cuts the artwork from `scripts/document-art-src/` into `backend/resources/document-art/`. Titles (QUOTATION / INVOICE / COMMERCIAL INVOICE / FINAL INVOICE) are set in Cinzel; body text is Open Sans, embedded (OFL).
  - Each sample from the PNGs renders on one A4 page.
- **Quotations (`/admin/quotations`):**
  - Numbered `VHL-CF-Q-2026-0001` / `VHL-FET-Q-…`; statuses draft → sent → accepted / declined (plus void); expiry is shown, not stored.
  - Email to the customer with the PDF attached.
  - One click turns a quotation into a **commercial** (`VHL-CF-CI-…`) or **final** (`VHL-CF-INV-…`) invoice, copying every field and line.
- **Editor:**
  - The form sits beside a live preview, which is the real PDF re-rendered by the server (`POST /admin/accounting/documents/preview`), so what staff see is what the customer gets.
  - Prices are typed in normal amounts. The old quick form needed cents for EUR/USD; it remains only for "General invoice".
  - Deposit % fills `{deposit}` and `{balance}` in the payment wording.
- **Invoices:**
  - Books → Invoices has new **Coffee invoice** / **FET invoice** buttons.
  - Branded invoices open in the same editor and use the branded PDF for download, email and overdue reminders.
  - General invoices keep the plain layout and `INV-YYYY-####` numbering.
- **Bank details** from Finance's "VHL BANK INFOR" letter (Stanbic Bank, Forest Mall, SWIFT SBICUGKX).
  - Accounts: UGX 9030027300994 · EUR 9030028047761 · USD 9030027301575.
  - They are the defaults in `Setting`, editable in Settings → Quotations & invoices, along with the company TIN 1055502376.
  - Every invoice prints a Payment Instructions block in the account for its currency. Coffee invoices carry it too: overseas buyers need the SWIFT code to pay the advance, although the original coffee design had no bank block.
- **Who can quote:** a new `quotations` module, granted per person, not by department. Finance's list is Thurayya, Sarah, Victor, Joseph and Daniel; admins have it automatically.
  - Grant it with `php artisan staff:grant-module quotations <email>…` (`--revoke` to remove). The command keeps everything else the person has and writes to the activity log.
  - Quotations sits in the **Sales** app. Turning a quotation into an invoice also needs `accounting`; others see "Finance turns this quotation into an invoice".
- **Database:** `quotations`, `quotation_items`; new columns on `invoices` / `invoice_items` (migration `2026_10_08_000001`). Tests: `QuotationTest` (10).

**Deployed 8 October 2026:**
- Migration run on production.
- `quotations` granted to Thurayya, Sarah, Victor, Joseph and Daniel with `staff:grant-module`. Joseph and Daniel also hold `accounting`, so only they (and admins) turn quotations into invoices.
- PDF rendering checked on the live server.
- Staff sign out and back in once for Quotations to appear in their menu.

**Follow-ups (8 October 2026), live:**
- **Incoterms dropdown:** FOB (Free on Board), CIF (Cost, Insurance & Freight) or EXW (Ex Works), plus the named place, or "Other" for free wording. Saved as e.g. "CIF Hamburg (Incoterms® 2020)", so the total row follows ("TOTAL (CIF HAMBURG)").
- **Air Freight & Logistics** quick-add line (Entebbe EBB to destination airport), alongside Ocean Freight and Marine Cargo Insurance.
- New, unsaved documents preview with "DRAFT" as the number.

**Still to do:** Joseph or Daniel send one real quotation to their own inbox before the first customer send.

## Admin sign-in in the console's style (8 October 2026) — ✅ live

- Sign in, forgot password and reset password share `components/admin/ConsoleAuthShell.tsx`. It gives them the console's top bar, flat squared panel, compact fields and ink button, replacing the old dark marketing-style screens.
- Two-step verification has its own step, showing the account being signed in, with a "Use a different account" way back. Sign-in logic, throttling and token scope are unchanged.
- Known, left as is: the public site's cookie banner also shows on the admin sign-in pages.

## Server operations note (October 2026)

- `ssh namecheap` reaches the cPanel box (`business194.web-hosting.com`, port 21098, user `okelvaxj`).
- The default `php` there is 8.2 and the app refuses to run on it. Use `/opt/alt/php83/usr/bin/php artisan …` and `/opt/alt/php83/usr/bin/php /opt/alt/php83/usr/bin/composer.phar …` (also in CLAUDE.md).
- ⚠ **The box does NOT pull new commits by itself** (corrected 14 October 2026). It
  was found four commits behind after a push. Every backend release is
  `git pull origin master`, then `migrate --force` (when there is a migration),
  `config:cache` and `route:cache`. Only the website half releases itself on push.
- To see what is live: `git log --oneline -1` on the box, and
  `artisan migrate:status` for pending migrations.
- **SEO articles:** the four were published on production with `LaunchArticlesSeeder` (6 October 2026).

## Blog: drafts sent for review (27 October 2026)

- The blog was working but had no new post since 6 October. The team chose not to pay for an AI API yet, so posts are written by hand on days the team picks, and Marketing approves them.
- **Send for review** in the blog editor saves the draft and emails the reviewers (Settings → Blog drafts, `blog_review_to`; default and fallback `support@vitorra.org`, Marketing's shared inbox) a signed, 14-day link to a review page with a **Publish now** button. Opening the link only shows the draft; publishing needs the button press (POST), because Outlook Safe Links opens every link in an email. Reply goes to the writer.
- Endpoint: `POST /admin/blog/posts/{post}/request-review` (perm:blog). Review page: `BlogReviewController`, `resources/views/blog-review.blade.php`.
- **Drafts uploaded by Claude (`/blog-post`):** Claude researches and writes the article in a session, draws 1–2 charts (`scripts/blog_chart.py`, brand colours, matplotlib in `scripts/.venv`), and uploads it as a draft with `scripts/push_blog_draft.py` → `POST /api/blog/drafts` (`BlogDraftController`). Images go into the media library and their file names in the content are swapped for URLs; PNG/JPEG/WebP only. The key comes from `php artisan blog:drafts-token` (a system account that can't sign in; ability `blog-drafts` = create/refresh drafts only, no publish, no admin; one live key; `--revoke`). John saves it once at `~/.config/vitorra/blog-drafts-token`. Drafts show a "Claude draft" tag; John reviews and presses Send for review. Tests: `BlogDraftUploadTest` (6).
- **Dormant, switched off:** `blog:draft` (`App\Services\BlogAutopilot`, `config/blog_autopilot.php`) can research the week's news and write drafts with Claude. It is unscheduled and `BLOG_AUTOPILOT_ENABLED` defaults to false. To use it later: set `ANTHROPIC_API_KEY`, `BLOG_AUTOPILOT_ENABLED=true`, and add `Schedule::command('blog:draft')->days([1, 4])->at('06:30')` to `routes/console.php`.
- Deploy: pull, `migrate --force` (`2026_10_27_000001` adds `origin`/`topic`), `config:cache`, `route:cache`.
- Tests: `BlogAutopilotTest` (10).
