# Vitorra Holdings — Progress Snapshot

**Last updated:** 18 June 2026
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
| Transactional email (Resend) | ✅ Live in production |
| **Account security — self-service password change + auto-expiring sessions** | ✅ **Done** |
| **Security hardening** (2FA, audit log, login throttle, token scoping, encrypted files, cookie-auth option) | ✅ **Done** |
| **Internal operations platform** (Staff/HR, CEO report, Suppliers, Installments) | ✅ **Built & deployed** |
| **Accounting — "Vitorra Books"** (ledger, invoicing, VAT, AI receipts, recurring) | ✅ **Built & deployed** |
| Coffee shop (storefront/cart/checkout) | ⏸ Built, gated until retail prices confirmed |
| Live payment gateway | ⛔ Blocked on business account |
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
1. **Live payment gateway** — needs a business account (provider-agnostic skeleton ready; installments are admin-recorded until then).
2. **Confirm coffee retail prices** → enter in `/admin/products`, then flip the coffee shop on (one flag).

**Operations setup (not code)**
3. Set **executive-report recipients** in `/admin/settings`.
4. Grant the new **People / Executive / Suppliers / Accounting** modules to existing ops accounts in `/admin/staff` — and **"Accounting — approve"** to the **Senior Finance Officer** (admins already have everything).
5. Set `ANTHROPIC_API_KEY` on prod to enable **CV + receipt auto-read** (both work manually without it).
6. Optionally link **Careers** and **Suppliers** in the public site footer.
7. Change the seeded `changeme123` admin/ops passwords (now self-service in `/admin/profile`, or `php artisan staff:set-role` / `staff:invite`).
8. **Optional — switch login to HttpOnly cookies** (extra XSS hardening): set `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN=.vitorra.org`, `SESSION_SECURE_COOKIE=true` (backend) + `NEXT_PUBLIC_AUTH_MODE=cookie` (Vercel). Reversible by unsetting; default stays token-based.

**Reliability**
9. Confirm Sentry is live in prod; add uptime alerts, automated DB backups, CI/CD.

**Content / lower priority**
9. Native-speaker review of the Swahili legal pages; blog posts; client testimonials; coffee photos; hero videos.

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
> Scheduled jobs (holiday reminders, executive report, application purge, backups, daily digest) ride the existing `php artisan schedule:run` cron.
