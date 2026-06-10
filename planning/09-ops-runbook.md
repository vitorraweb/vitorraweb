# Ops & Pre-Launch Runbook

**Audience:** John (engineer). Covers the operational hardening shipped on
`feat/i18n-swahili`: error monitoring, uptime alerts, database backups, CI, and
retiring the seeded passwords.

Everything below is **wired in code** already. This runbook lists the one-time
**account + server actions** that only a human with the right logins can do.

---

## 1. Error monitoring — Sentry

Both apps report to Sentry and are **no-ops until a DSN is set**, so nothing
sends until you provision the projects.

### Backend (Laravel)
- Package: `sentry/sentry-laravel`. Wired in `bootstrap/app.php`
  (`Integration::handles`). Config: `config/sentry.php`.
- **Action:** create a Sentry project (platform: *Laravel*), copy the DSN, and on
  the cPanel box set in `.env`:
  ```
  SENTRY_LARAVEL_DSN=https://...ingest.sentry.io/...
  SENTRY_TRACES_SAMPLE_RATE=0.0      # raise to 0.1 for some performance tracing
  SENTRY_ENVIRONMENT=production
  ```
  Then `php artisan config:cache`.
- **Verify:** `php artisan sentry:test` (sends a test event).

### Frontend (Next.js)
- Package: `@sentry/nextjs` (supports Next 16). Wired via
  `src/instrumentation.ts`, `src/instrumentation-client.ts`,
  `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/global-error.tsx`,
  and `withSentryConfig` in `next.config.ts`.
- **Action:** create a second Sentry project (platform: *Next.js*) and set these
  in the **Vercel** project settings:
  ```
  NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
  NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
  ```
- **Optional (readable stack traces):** add `SENTRY_ORG`, `SENTRY_PROJECT`, and a
  `SENTRY_AUTH_TOKEN` (Vercel build env). Without the token the build still
  succeeds — source-map upload is simply skipped.
- **Verify:** after the next deploy, throw a test error on a page and confirm it
  appears in Sentry.

---

## 2. Uptime alerts — UptimeRobot (free tier is enough)

Nothing to deploy — this is external. Laravel already exposes a health endpoint
at **`/up`** (returns 200 when the app + framework boot).

**Action — create 2 monitors** at https://uptimerobot.com:
1. **Website** — `https://vitorra.org` — HTTP(S), 5-min interval.
2. **API health** — `https://api.vitorra.org/up` — HTTP(S), keyword check for a
   200, 5-min interval.

Add an **alert contact** (email the team, and optionally a WhatsApp/SMS or a
Slack webhook). Optional: a 3rd monitor on `https://api.vitorra.org/api/exchange-rate`
to catch API/DB failures specifically.

> BetterStack/Better Uptime is a fine alternative if you want a status page too.

---

## 3. Automated database backups — spatie/laravel-backup

- Package configured in `config/backup.php`. Backs up the **live database +
  uploaded media** (`storage/app/public`) into an **AES-encrypted zip** on the
  server's `local` disk, with gzip on the SQL dump.
- Retention: keep all for 7 days, then daily for 16 days, weekly for 8 weeks,
  monthly for 4 months (spatie default strategy).
- Notifications: the team is emailed **only on failure / unhealthy backup**
  (no daily success spam) — to `BACKUP_NOTIFICATION_EMAIL` (defaults to
  `MAIL_TEAM_ADDRESS`).
- Schedule (in `routes/console.php`): clean 01:00, run 01:30, monitor 02:00.

**Action — one cron line on cPanel** so the Laravel scheduler ticks. In cPanel →
*Cron Jobs*, add (every minute):
```
* * * * * cd /home/okelvaxj/vitorraweb/backend && php artisan schedule:run >> /dev/null 2>&1
```
(If a system cron already runs `schedule:run`, you're done.)

**Recommended env on prod** (`.env`):
```
BACKUP_NOTIFICATION_EMAIL=ops@vitorra.org
BACKUP_ARCHIVE_PASSWORD=<a long random secret>   # encrypts the zip; store it safely
```
> ⚠ Keep `BACKUP_ARCHIVE_PASSWORD` recorded somewhere safe — without it the
> encrypted backups can't be opened. If left blank, archives are unencrypted.

**Verify / use:**
```
php artisan backup:run        # create one now (DB + media)
php artisan backup:list       # see archives + health
php artisan backup:monitor    # check freshness (emails if unhealthy)
```
Archives land under `storage/app/<APP_NAME>/`. To restore: download the zip,
unzip (with the password), and import the `.sql` dump into MySQL.

> **Disaster-recovery note:** backups currently live on the **same server**.
> That protects against bad migrations / accidental deletes, but not server
> loss. To go offsite later, add an S3/Google-Drive disk to `config/backup.php`
> `destination.disks` and set the credentials — no other code change needed.

---

## 4. CI — GitHub Actions

- Workflow: `.github/workflows/ci.yml`. Runs on push to `master` / `rebuild` /
  `feat/**` and on PRs to `master`. **Checks only — no deploy** (frontend
  auto-deploys via Vercel; backend stays a manual SSH release).
- **Backend job:** PHP 8.3 → `composer install` → Pint style check (advisory) →
  `php artisan test` (sqlite in-memory).
- **Frontend job:** Node 22 → `npm install` → `npm run lint` → `npm run build`.
- **Action:** none required — it runs automatically once pushed. Optional:
  in GitHub → Settings → Branches, make these checks **required** before merging
  to `master`.
- The Pint step is **advisory** (`continue-on-error: true`). Once you've run
  `./vendor/bin/pint` over the codebase once, flip it to `false` to enforce style.

---

## 5. Retire the seeded `changeme123` passwords

The seeder no longer hardcodes `changeme123`:
- It reads `ADMIN_PASSWORD` / `OPS_PASSWORD` from the environment.
- If those are blank on first seed, it **generates a strong random password and
  prints it once**.
- Re-seeding **never overwrites** a password already changed in `/admin/users`.

**On prod, the live accounts still have the old password** (they were seeded
earlier). Rotate them now with the new command:
```
php artisan vitorra:set-password admin@vitorra.org --generate
php artisan vitorra:set-password ops@vitorra.org --generate
```
(`--generate` prints a strong password once; or omit it to type one securely, or
`--password=...` to pass one in.) Record them in the team password manager.

---

## Quick checklist

- [ ] Sentry: create Laravel + Next.js projects; set DSNs (cPanel `.env` + Vercel).
- [ ] UptimeRobot: 2 monitors (`vitorra.org`, `api.vitorra.org/up`) + alert contact.
- [ ] cPanel cron: add the per-minute `schedule:run` line.
- [ ] Prod `.env`: set `BACKUP_ARCHIVE_PASSWORD` + `BACKUP_NOTIFICATION_EMAIL`.
- [ ] Run `php artisan backup:run` once and confirm an archive appears.
- [ ] Rotate `admin@` / `ops@` passwords with `vitorra:set-password`.
- [ ] (Optional) Make CI checks required on `master`.
