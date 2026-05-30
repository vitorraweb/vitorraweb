# Vitorra Holdings Limited — Project Brief

## Who We Are

**Company:** Vitorra Holdings Limited  
**Website:** vitorra.org  
**Business:** Multi-sector holdings company operating across agriculture (FET biostimulant, SEAL product line, coffee export), logistics (e-ticketing platform), and B2B/B2C commerce.  
**Primary Market:** Uganda (UGX) + International (USD via PayPal)

---

## Key People

| Role | Name | Contact |
|------|------|---------|
| Director / Boss | Solomon | Decision-maker. Non-technical entrepreneur. Speak in business outcomes, never technical jargon. |
| Engineer / You | John | john@vitorra.org / leojohnseyi@gmail.com |
| Teams in Loop | Ops, Marketing | CC on all major project communications |

> Solomon does not want to hear technical words. Always frame everything as a business problem and business solution — impact on revenue, customers, brand, and risk.

---

## Current State (May 2026)

### Overall Readiness: 35% Done / 65% Remaining

The platform has a working foundation — orders process, payments go through, and the admin panel functions. But the website is not production-ready at the level Vitorra demands as a premium holdings company.

| Area | Done | Remaining | Status |
|------|------|-----------|--------|
| Brand Identity & Visual Design | 20% | 80% | Full redesign needed |
| Customer Communication & Content | 20% | 80% | Not serving customers |
| Technology Foundation (SEO & Growth) | 40% | 60% | Limiting growth |
| Security & Customer Trust | 55% | 45% | Active risks present |
| Business Operations (Orders, Admin) | 70% | 30% | Functional, needs polish |
| Reliability & Uptime Systems | 30% | 70% | No monitoring in place |

---

## Rebuild Progress Log

### Week 0 — Discovery Planning (2026-05-20 to 2026-05-21)

**Decision:** Full rebuild using Next.js (frontend) + Laravel (backend). The current React/Firebase codebase is being set aside. No code from the existing site will be carried over into the rebuild.

**What was done:**
- Full audit of existing codebase completed (products, routes, admin panel, user roles, Firestore collections, order flow)
- Rebuild strategy documented and agreed
- Marketing Discovery framework designed — 55 structured questions across 7 categories
- Three planning documents created in `planning/`

### Week 1 — Discovery Complete & Phase 1 Ready (2026-05-30)

**Marketing Discovery Session:** Completed via Trello board (public board reviewed and extracted in full). All 55 discovery questions answered by Marketing team and Director.

**What was done:**
- Full Trello board extracted — all card descriptions and comments reviewed
- Remaining gaps filled directly by John (Director sign-off session)
- Complete BRD written: `planning/04-brd-complete.md`
- Phase 1 System Design written: `planning/05-phase1-system-design.md`

**Phase 0 status: COMPLETE.** BRD signed off by Marketing + Director (Solomon).

### Week 1 — Build Started (2026-05-30)

**BRD signed off — Phase 1 & Phase 2 build underway.** John acts as co-developer;
Claude is Business System Engineer / Development Lead and makes implementation decisions.

**Branch strategy:**
- `master` — the old React/Firebase site (preserved, untouched, live on GitHub)
- `rebuild` — all new work. The legacy codebase has been **removed from `rebuild`**
  and from the local machine (recover any old file via `git checkout master -- <path>`).

**Repo is now a clean monorepo:**
- `frontend/` — Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui (base-ui)
- `backend/` — Laravel 13 + PHP 8.3 (scaffolded; PostgreSQL planned, not yet wired)
- `planning/` — BRD, system design, design system, animation plan
- `assets/` — raw brand/product/team source files

**Design system — DECIDED & IMPLEMENTED:**
- Adopted **Mastercard's design language** (chosen over Tesla/Ferrari/Wise/Revolut for
  multi-product fit + warm editorial premium feel) adapted to Vitorra's identity.
- Kept Vitorra: **Playfair Display** headings, **Inter** body, **Vitorra Gold `#C5B27A`**.
- Mastercard gestures in use: ivory canvas `#F2F2F2`, floating pill nav, ghost watermarks,
  stadium cards (40px / 28px radius), circular team portraits + satellite CTAs, dark warm footer.
- Full spec: `planning/06-design-system.md`. Colour rule: gold is for FILLS, not body text
  on light bg (use `#1E1E1E`/`#454545`/`#7A6020` for text).

**Homepage — BUILT (`frontend/src/app/page.tsx`):**
- Hero is a **video carousel** (`components/sections/HeroCarousel.tsx`): slide 1 = brand text
  ("Innovative products. Dependable solutions."), slide 2 = FET video full-bleed with overlay.
  Data-driven via `available` flag — drop `{id}.mp4` + `{id}-poster.jpg` and flip the flag to add slides.
- Sections: hero carousel → gold trust bar → products (4 stadium cards) → why Vitorra
  (headline-left/copy-right) → team (circular portraits) → certifications (dark) → final CTA.
- Header (floating pill nav + Products dropdown), Footer (4-col dark).

**Animations — Wave 1 SHIPPED (`planning/07-animation-interaction-plan.md`):**
- `components/ui/reveal.tsx` — scroll-reveal (fade+rise, staggered, respects reduced-motion)
- Hero staggered text entrance, Ken Burns zoom on video, card hover-lift, button press, arrow nudge.

**Assets received & wired:** logo (`logo.png`), 5 team photos, SEAL product image, FET video + poster.

**Build status:** `npm run build` clean (zero errors). Dev server runs on `localhost:3000`.

---

**PENDING (next up):**

_Frontend pages not yet built:_
1. **Enquiry / quote form (`/enquire`)** — highest priority; every CTA points here
2. Product pages: FET, SEAL, Coffee, Logistics
3. Coffee shop + cart + checkout (Flutterwave UGX + PayPal USD + live FX rate)
4. About, Contact, Blog (list + post), Certifications/Trust page
5. Legal pages: Privacy, T&C, Returns & Warranty, Cookie Policy + cookie banner
6. Customer portal (order tracking, invoices, enquiry status, profile)
7. Admin panel (CEO dashboard, Ops dashboard, orders, enquiries, products, blog CMS)
8. 404 already done; need branded error states elsewhere

_Backend (Laravel) — scaffolded only, not yet built:_
9. Database schema + migrations (products, orders, enquiries, quotes, invoices, blog, users)
10. API endpoints per `planning/05` API contract; auth (Sanctum); role-based access
11. Integrations: Flutterwave, PayPal, exchange-rate API, DHL, WhatsApp Business, Mailgun/Postmark

_Assets still needed from team:_
12. FET + Coffee product photos; SEAL/Coffee/Logistics videos (for hero slides 2–4)
13. Certifications/lab results (to be presented by management)
14. Approved testimonials + case studies (with written permission)

_Ops / pre-launch:_
15. Sentry, uptime monitoring, automated DB backups, CI/CD pipeline
16. Tone-of-voice guide (Marketing); push `rebuild` branch to GitHub for remote backup

_Housekeeping:_
17. Animation Waves 2–3 (hero progress bar, count-up stats, swipe gestures, sticky mobile CTA)

---

## Current Tech Stack (To Be Replaced)

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend:** Firebase (Firestore, Auth, Cloud Functions, Storage)
- **Payments:** Flutterwave (UGX) + PayPal (USD) + Bank Transfer
- **Hosting:** Firebase Hosting (CDN)
- **PDF Generation:** jsPDF
- **Animations:** Framer Motion
- **Routing:** React Router DOM

### Why the Current Stack Is Being Replaced

The current React SPA (Single Page Application) architecture makes it very difficult for Google and other search engines to index the website. This directly limits organic customer discovery. Firebase, while functional, limits full control over security tooling, server-side logic, and advanced integrations that Vitorra will need as it grows.

---

## Target Tech Stack (Rebuild)

- **Frontend:** Next.js (React-based, SEO-optimised, server-side rendering)
- **Backend:** Laravel (PHP) — full control over security, APIs, integrations, and business logic
- **Database:** MySQL or PostgreSQL (via Laravel) — structured, scalable, fully queryable
- **Payments:** Retain Flutterwave + PayPal integrations, rebuild on Laravel
- **Hosting:** TBD — options include Vercel (frontend) + a managed PHP host or VPS (backend)
- **Media:** Cloudinary or S3-compatible storage for images and documents
- **Email:** Transactional email via Mailgun or Postmark
- **Monitoring:** Sentry (errors) + UptimeRobot or BetterStack (uptime alerts)

---

## Known Issues (From Audit)

### Critical — Fix Before Any Marketing Push
1. **Security gap in blog content rendering** — malicious content could run in visitors' browsers if exploited. Fix: sanitise all HTML output.
2. **File storage open to all logged-in users** — any registered user can upload files to the company's media storage. Fix: restrict to admin roles only.

### High Priority
3. **No error or uptime monitoring** — the team only finds out about problems when customers complain.
4. **No automated data backups** — a data loss event would be unrecoverable.
5. **No CI/CD pipeline** — all deployments are manual and error-prone.

### Medium Priority
6. **Hardcoded currency exchange rate** — PayPal payments use a fixed UGX/USD rate that is months out of date, risking overcharging or undercharging international customers.
7. **Coffee product listed as "Coming Soon"** in the shop — creates an unfinished impression. Either complete or remove.
8. **No 404 / error pages** — broken URLs show a blank page, not a branded experience.

### Lower Priority
9. No automated test coverage (zero tests in the codebase)
10. No sitemap or robots.txt for search engines
11. No social sharing metadata (WhatsApp/LinkedIn previews don't display correctly)
12. No abandoned cart recovery emails
13. No newsletter unsubscribe flow (GDPR risk)
14. Blog admin editor uses a deprecated browser API — will eventually stop working

---

## What Marketing Has Said

The marketing team has flagged that the current website:
- Does not clearly communicate what Vitorra does or offers
- Does not help customers understand the products
- Does not match the brand identity of a premium holdings company
- Feels generic — could belong to any startup

**This confirms a full UI/UX redesign is required**, not just a visual refresh. The redesign must be grounded in customer research and structured around how visitors actually make decisions.

---

## The Rebuild Plan

### Phase 0 — Marketing Discovery (COMPLETE — Week 0–1)
> **Status: Complete. BRD written and ready for sign-off.**
- [x] Rebuild strategy agreed (Next.js + Laravel)
- [x] Existing codebase audited and documented
- [x] Discovery framework designed (55 questions, 7 categories)
- [x] Planning documents created (`planning/` folder)
- [x] Marketing Discovery Workshop completed (Trello board)
- [x] Business Requirements Document (BRD) completed — `planning/04-brd-complete.md`
- [x] Phase 1 System Design completed — `planning/05-phase1-system-design.md`
- [x] BRD signed off by Marketing Lead + Director (Solomon)

**Phase 1 & 2 build underway — see "Week 1 — Build Started" log above.**

---

### Phase 1 — Information Architecture & System Design (Week 1–2)
> Pending BRD sign-off.
- Map every page, user journey, and admin screen from BRD outputs
- Full system design: Next.js frontend + Laravel backend architecture
- Low-fidelity wireframes reviewed and approved by Marketing
- Database schema design
- API contract design (frontend ↔ backend)

### Phase 2 — Build: Core System (Week 3–10)
> Pending Phase 1 completion.
- Frontend (Next.js): public site, product pages, shop, checkout, blog, contact, careers
- Backend (Laravel): API, authentication, product management, order processing
- Payment integrations: Flutterwave (UGX) + PayPal (USD) with live exchange rate
- Admin panel: orders, products, customers, content, reports
- Customer portal: order tracking, invoices, account management

### Phase 3 — Operations & Go-Live (Week 8–16, parallel with Phase 2)
> Pending Phase 2 start.
- Sentry error monitoring
- Uptime alerts (BetterStack or UptimeRobot)
- Automated daily database backups
- CI/CD pipeline
- Data migration from Firebase → new database
- End-to-end payment testing

**Target: Full production launch by Week 14–16**

---

## What "Production Ready" Looks Like for Vitorra

A finished product means:
- Visitors immediately understand who Vitorra is, what it does, and why it matters
- The design commands the authority of a premium African holdings company
- Google can find and rank every page — driving organic enquiries without ad spend
- Customers can browse, enquire, and order without confusion
- The team is alerted to any issue before a customer notices it
- Business data is backed up and recoverable
- The platform can scale with business growth without an engineering rewrite

---

## Communication Rules

- Always write reports and updates in **business language** — outcomes, risks, revenue impact
- Never use technical jargon with Solomon or in stakeholder communications
- Email reports go to Solomon (To) with Ops and Marketing (CC)
- John sends from john@vitorra.org (Outlook) — Gmail MCP only reaches leojohnseyi@gmail.com
- When framing progress, lead with what it means for the customer and the business, not what was coded

---

## Repository Notes

- **Repo:** `vitorraweb` (current codebase — the 35% that exists)
- **Branch:** `master`
- **Firebase Project:** vitorra (linked via `.firebaserc`)
- **Environment:** Variables in `.env` (not committed). Template in `.env.example`
- **Deploy command:** `npm run build && firebase deploy`
- All Firestore security rules are version-controlled in `firestore.rules` and `storage.rules`
