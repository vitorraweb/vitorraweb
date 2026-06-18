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
| **Internal operations platform** (Staff/HR, CEO report, Suppliers, Installments) | ✅ **Built & deployed** |
| Coffee shop (storefront/cart/checkout) | ⏸ Built, gated until retail prices confirmed |
| Live payment gateway | ⛔ Blocked on business account |
| Monitoring / backups / CI/CD | ⏳ Sentry DSNs configured; uptime/backups/CI still to verify |

---

## ✅ Internal operations platform (June 2026)

Built from the Head of Finance's brief — a full internal suite on top of the marketing site. All shipped, tested (95 backend tests), and deployed.

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
4. Grant the new **People / Executive / Suppliers** modules to existing ops accounts in `/admin/staff` (admins already have them).
5. Set `ANTHROPIC_API_KEY` on prod to enable **CV auto-fill** (careers works manually without it).
6. Optionally link **Careers** and **Suppliers** in the public site footer.
7. Change the seeded `changeme123` admin/ops passwords (now self-service in `/admin/profile`, or `php artisan staff:set-role` / `staff:invite`).

**Reliability**
8. Confirm Sentry is live in prod; add uptime alerts, automated DB backups, CI/CD.

**Content / lower priority**
9. Native-speaker review of the Swahili legal pages; blog posts; client testimonials; coffee photos; hero videos.

---

## 🚀 Standard backend deploy (Namecheap)

Frontend auto-deploys via Vercel on push to `master`. Backend:

```bash
cd /home/okelvaxj/vitorraweb && git pull origin master
cd backend
/opt/alt/php83/usr/bin/php artisan migrate --force
/opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan route:cache
```

> The server's default `php` is 8.2 but the app needs 8.3 — always run artisan with `/opt/alt/php83/usr/bin/php`.
> Scheduled jobs (holiday reminders, executive report, application purge, backups, daily digest) ride the existing `php artisan schedule:run` cron.
