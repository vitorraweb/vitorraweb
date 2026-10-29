# PostHog web analytics

What it gives the team:

- **Visitors right now**: shown on the console Overview and on **Insights → Website**.
- **Visitors, visits and pages** viewed per period, compared with the period before.
- **How long visits last and how many leave after one page.**
- **How visitors found us** (Google, ads, direct, social), the **countries** they come from, and whether they're on a **phone or a computer**.
- **Session replays**: a recording of how a visitor moved through the site. Only visitors who accept cookies are recorded, and anything typed into a form is hidden. Replays open in PostHog through the **Watch visits** button.
- **Heatmaps and the live event feed**, also in PostHog.
- Enquiries, contact messages, FET reservations, newsletter sign-ups and phone or WhatsApp taps are recorded as events. These events carry no names, emails or phone numbers.

What is never tracked:

- staff screens: `/admin`, `/staff`, `/scan`, `/teams`, `/display`;
- private client links: contracts, trials, invoices, orders, payment pages, checkout and the customer portal;
- the same pages under `/sw` and `/fr`.

## Consent

| Visitor's choice | What PostHog does |
|---|---|
| Not chosen yet, or **declined** | Counts the visit. Sets no cookie and keeps no storage, so the visitor isn't recognised next time. No replay. |
| **Accepted** | Sets a cookie so returning visitors are recognised, and records the session for replay. |

Changing the choice through *Cookie settings* takes effect immediately. The cookie policy describes this in English and Swahili.

## Setup

### 1. Website (Vercel → Project → Settings → Environment Variables, Production)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog → Settings → Project → **Project API key** (`phc_…`). This key is public by design: it can only send events, not read them. |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` for an EU project, or `https://us.i.posthog.com` for a US project. |
| `NEXT_PUBLIC_POSTHOG_UI_HOST` | `https://eu.posthog.com` or `https://us.posthog.com`, matching the region above. |

Then redeploy. Events travel through `vitorra.org/ingest`, which the site forwards to PostHog, so ad blockers that block third-party trackers still count the visit.

### 2. In PostHog

1. Settings → Project → **Session replay**: switch **on**. Recordings only start for visitors who accepted cookies.
2. Settings → Project → **Authorized URLs**: add `https://vitorra.org` and `https://www.vitorra.org`. Heatmaps and the toolbar use these.
3. Settings → Project → **Heatmaps**: switch on if wanted.
4. Optional: in Settings → Project, add an internal/test filter for staff IP addresses.

### 3. Console numbers (API server, `backend/.env`)

```
POSTHOG_HOST=https://eu.posthog.com          # or https://us.posthog.com
POSTHOG_PROJECT_ID=<Settings → Project → Project ID>
POSTHOG_PERSONAL_API_KEY=<Settings → Personal API keys → scope: this project, Query: Read>
```

Then run `$PHP artisan config:cache`. The personal key stays on the server, and the browser only ever receives the figures.

## Where it lives

- `frontend/src/lib/posthog.ts`: start-up, consent, and the list of pages that are never tracked.
- `frontend/src/components/PostHogAnalytics.tsx`: mounted in the root layout.
- `frontend/next.config.ts`: the `/ingest` proxy.
- `backend/app/Services/Analytics/PostHogWebStats.php`: the console's figures (HogQL queries). The "on the site now" count is cached for 30 seconds and everything else for 5 minutes.
- Console API: `GET /api/admin/web-analytics/summary?period=today|7d|30d` and `GET /api/admin/web-analytics/live`. Both need the `google_ads` module, which Marketing, Finance and Leadership have; admins always have it.
