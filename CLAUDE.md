# Vitorra Holdings Limited — Project Brief

## Who We Are

**Company:** Vitorra Holdings Limited  
**Website:** vitorra.org  
**Business:** Multi-sector holdings company operating across fuel technology (FET), healthcare (SEAL Wound Spray), premium coffee (Ugandan export), and logistics (freight & supply chain).  
**Primary Market:** Uganda (UGX) + International (USD via PayPal)

---

## Key People

| Role | Name | Contact |
|------|------|---------|
| Director / Boss | Solomon Okello | Decision-maker. Non-technical entrepreneur. Speak in business outcomes, never technical jargon. |
| Engineer / You | John Oluwaseyi | john@vitorra.org / leojohnseyi@gmail.com |
| Head of Operations | Victor Lojum | — |
| Senior Finance Officer | Joseph Rwabu | — |
| Senior Marketing Officer | Thurayya Nakayima | — |
| Finance Officer | Daniel Tuke | — |
| Marketing Officers | Sarah Nuwamanya, Nagawa Shakirah | — |
| IT Officer | John Oluwaseyi | — |
| Brand Designer | Olivia Sandra | — |

> Solomon does not want to hear technical words. Always frame everything as a business problem and business solution — impact on revenue, customers, brand, and risk.

---

## Current State (June 2026)

### Overall Readiness: ~65% Done / 35% Remaining

Major frontend build sprint completed. The public-facing website is now near production-ready from a design and UI perspective. Backend is scaffolded but not yet fully wired.

| Area | Done | Remaining | Status |
|------|------|-----------|--------|
| Brand Identity & Visual Design | **85%** | 15% | Premium redesign shipped |
| Public Pages (Frontend) | **80%** | 20% | Homepage, About, 4 product pages, Enquire, Blog done |
| Technology Foundation (SEO & Growth) | 50% | 50% | ISR on blog/homepage; sitemap pending |
| Security & Customer Trust | 55% | 45% | Active risks remain (see Known Issues) |
| Business Operations (Orders, Admin) | 70% | 30% | Admin panel functional, needs polish |
| Backend API & Integrations | 25% | 75% | Scaffolded; payments/email not wired |
| Reliability & Uptime Systems | 30% | 70% | No monitoring in place |

---

## Rebuild Progress Log

### Week 0 — Discovery Planning (2026-05-20 to 2026-05-21)

- Full audit of existing codebase completed
- Rebuild strategy documented and agreed (Next.js + Laravel)
- Marketing Discovery framework designed — 55 structured questions across 7 categories
- Planning documents created in `planning/`

### Week 1 — Discovery Complete & BRD Signed Off (2026-05-30)

- Full Trello board extracted — all 55 discovery questions answered by Marketing + Director
- Complete BRD written: `planning/04-brd-complete.md`
- Phase 1 System Design written: `planning/05-phase1-system-design.md`
- **Phase 0 status: COMPLETE.**

### Week 1 — Build Started (2026-05-30)

- Frontend scaffolded: Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- Backend scaffolded: Laravel 13 + PHP 8.3 (SQLite for dev; PostgreSQL planned for prod)
- Design system adopted: Mastercard architecture × Vitorra Gold identity
- Initial homepage built, Hero carousel, trust bar, product cards

### Week 2–3 — Major UI Sprint (2026-06-03 to present)

**This is the most significant build sprint to date.** Full premium redesign across all public pages.

---

## Design System — CURRENT (Updated June 2026)

### Typography (Upgraded from Playfair + Inter)

| Role | Font | Notes |
|------|------|-------|
| Headings H1–H6 | **Cormorant Garamond** | Luxury serif — used by LVMH, premium agencies. High-contrast thin/thick strokes at display sizes. Weights 300–700, normal + italic. CSS var: `--font-playfair` |
| Body + UI | **DM Sans** | Geometric humanist — Notion's font, Google product pages. More distinctive than Inter. Variable font. CSS var: `--font-inter` |

> Both fonts reuse the existing CSS variable names (`--font-playfair`, `--font-inter`) so all components inherit automatically — no component-level changes needed.

### Colour Palette

| Token | Hex | Use |
|-------|-----|-----|
| Vitorra Gold | `#C5B27A` | CTA fills, accents, decorative elements |
| Gold Light | `#D4C49A` | Hover states |
| Gold Dark / Text | `#7A6020` | Readable gold on light surfaces |
| Ivory Canvas | `#F2F2F2` | Default page background |
| Lifted Ivory | `#FAFAF8` | Nested cards, raised sections |
| Charcoal | `#1E1E1E` | Headings, footer, dark hero |
| Body Text | `#454545` | Default body paragraphs |

### Design Language

- **Stripe-inspired** section flow: dramatic dark/light alternation, aurora gradient meshes, clean white product sections
- **Mastercard gestures**: floating pill nav, ghost watermarks, circular team portraits, orbital arcs, stadium cards (40px radius)
- **Premium effects implemented** (see globals.css):
  - `hero-aurora-right` — drifting gold glow on right side of all dark heroes
  - `hero-grain` — film-grain texture overlay on dark sections
  - `float-element` — levitating animation for FET product image
  - `glow-card` — gold border glow on product card hover
  - `stat-card` / `stat-orb` — glassmorphism stat cards with radial gold orb
  - `cta-aurora-1/2/3` — three drifting aurora blobs in Final CTA
  - `auth-cert` — hover gold-left-border on certification list items
  - `authority-grid-bg` — subtle gold grid pattern for authority sections
  - `line-draw` keyframe — gold underline draws left-to-right on stat completion
  - Corner bracket SVGs — luxury editorial framing in FinalCTA
  - Inverted semicircle arc vectors in FinalCTA (mirrors Why Vitorra rising arcs)
  - Digit scramble animation in StatsBand (numbers cycle through random digits then lock)

### Section Flow Principle (All Pages)

Dark → Gold strip → White → Dark → White → Ivory → Dark → Ivory → White. Never two heavy dark sections consecutively.

---

## Pages Built (Frontend — `rebuild` branch)

### Fully Built & Designed

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Homepage | `/` | ✅ Complete | 11-section premium layout |
| About | `/about` | ✅ Complete | 8-section, all 9 team members with photos |
| Fuel Eco Tech | `/products/fuel-eco-tech` | ✅ Complete | VW T5 test report data section |
| SEAL Wound Spray | `/products/seal-wound-spray` | ✅ Complete | Aligned with design system |
| Vitorra Coffee | `/products/coffee` | ✅ Complete | Aligned with design system |
| Logistics | `/products/logistics` | ✅ Complete | Aligned with design system |
| Enquiry / Quote | `/enquire` | ✅ Complete | Dark hero, sector-adaptive, 3-step form |
| Blog (list) | `/blog` | ✅ Complete | ISR, placeholder state when backend offline |
| Blog (post) | `/blog/[slug]` | ✅ Complete | Dynamic, fetches from API |
| Legal pages | `/legal/*` | ✅ Complete | Privacy, T&C, Returns, Cookie Policy |
| Cookie Banner | (component) | ✅ Complete | GDPR-compliant |
| Certifications | `/trust/certifications` | ✅ Complete | URSB registration + cert cards |
| 404 | `/_not-found` | ✅ Complete | Branded |
| Admin panel | `/admin/*` | ✅ Functional | Dashboard, enquiries, messages, orders |
| Admin login | `/admin/login` | ✅ Complete | Sanctum auth |
| Contact | `/contact` | ✅ Built | Needs design alignment |

### Pending Build

| Page | Route | Priority |
|------|-------|---------|
| Coffee Shop | `/shop` | High — every Coffee CTA points here |
| Customer Portal | `/portal/*` | Medium |
| Careers | `/careers` | Low |

---

## Homepage Sections (Current — 11 sections)

1. **Hero** — Cinematic sector-switching (5 sectors, auto-advance, video for FET). Aurora + grain.
2. **Trust Marquee** — Gold strip, seamless credentials ticker, pauses on hover.
3. **Authority** — Compact split panel. Left: "Independently certified. Internationally proven." + large "6" number. Right: 6 certification list items with hover gold-left-border effect.
4. **FET Spotlight** — Dark, gold aurora. Floating product image with 2 badge chips. 3 proof points + quick-fact pills.
5. **Product Suite** — 3 cards (SEAL, Coffee, Logistics) on white with `glow-card` hover.
6. **Testimonials / Proven Results** — VW T5 test report data (13.9% reduction, CTI GmbH signed November 2025). Before/after CSS bars, key findings, 3 metric chips.
7. **Stats Band** — 4 glassmorphism cards on warm ivory. Digit-scramble animation fires on scroll-in. Gold completion line draws after lock.
8. **Sectors Strip** — Centered, Stripe mixed-weight headline. 6 sector icon pills.
9. **Why Vitorra** — Dark glass panels, semi-circle arc vectors.
10. **Team Teaser** — 9 overlapping portrait avatars, tooltip on hover.
11. **Blog Preview** — 3 recent posts (server component). Falls back to editorial placeholders when backend offline.
12. **Certifications** — URSB incorporation credential card.
13. **Final CTA** — White, corner bracket SVGs, inverted arc vectors, 3 aurora clouds, magnetic button.

---

## Key Product Data — FET (Priority Revenue Product)

**VW T5 Test Report (CTI GmbH — November 2025):**
- Vehicle: VW T5, Landesbaubehörde Stadthagen, Hannover, Germany
- Period: January–October 2025
- **Before FET:** 11.52 l/100km over 13,468 km
- **With FET:** 9.92 l/100km (first full month)
- **Reduction: 13.9%** — well above normal operational variation (±3–5%)
- Signed by: Holger Walprecht, CTI GmbH, Lippstadt, 10.11.2025
- Financial: €900–€1,300 annual savings, 3–5 month payback
- Report file: `FUEL ECO TECH PRESENTATION.pdf` + `FET-Test-Report-VW-T5.pdf` in project root

**FET Certifications (all independently issued):**
ISO 9001:2015, ISO 14001:2015, ISO 27001, Zurich Product Liability, AVL Technologies (lab validated), qm-solutions GmbH (German certified)

---

## Team — All Members (Photos in `frontend/public/team/`)

| Name | Role | Tier |
|------|------|------|
| Solomon Okello | Chief Executive Officer | CEO |
| Victor Lojum | Head of Operations | Leadership |
| Joseph Rwabu | Senior Finance Officer | Leadership |
| Thurayya Nakayima | Senior Marketing Officer | Leadership |
| John Oluwaseyi | IT Officer | Officers |
| Sarah Nuwamanya | Marketing Officer | Officers |
| Olivia Sandra | Brand Designer | Officers |
| Daniel Tuke | Finance Officer | Officers |
| Nagawa Shakirah | Marketing Officer | Officers |

All 9 members now have real photos. No placeholder slots remain.

---

## Backend Status (Laravel — `backend/`)

- **Auth:** Sanctum installed, `personal_access_tokens` migration created and run ✅
- **Database:** SQLite for development (file at `backend/database/database.sqlite`)
- **Migrations run:** users, personal_access_tokens
- **Admin accounts seeded:** `admin@vitorra.org` (Admin), `ops@vitorra.org` (Ops)
- **API:** Scaffolded but most endpoints not yet implemented
- **Pending:** Products, orders, enquiries, blog, Flutterwave, PayPal, Mailgun, DHL

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Old React/Firebase site — preserved, untouched |
| `rebuild` | All new work — the active development branch |

Recover any old file: `git checkout master -- <path>`

---

## Key Files & Components

| File | Purpose |
|------|---------|
| `frontend/src/app/globals.css` | All design system utilities, keyframes, premium effects |
| `frontend/src/app/layout.tsx` | Font loading (Cormorant Garamond + DM Sans) |
| `frontend/src/app/page.tsx` | Homepage — 11-section layout |
| `frontend/src/components/sections/StatsBand.tsx` | Digit-scramble stat cards |
| `frontend/src/components/sections/Testimonials.tsx` | VW T5 test data section |
| `frontend/src/components/sections/BlogPreview.tsx` | Server component, ISR blog preview |
| `frontend/src/components/sections/FinalCTA.tsx` | White CTA with corner brackets + arc vectors |
| `frontend/src/components/sections/Team.tsx` | Full team constellation (hierarchical) |
| `frontend/src/components/sections/TeamTeaser.tsx` | Homepage 9-avatar stack |
| `frontend/src/components/sections/Hero.tsx` | Sector-switching cinematic hero |
| `frontend/src/lib/constants.ts` | CONTACT_EMAIL, CONTACT_PHONE, API_BASE_URL, PRODUCTS |
| `planning/04-brd-complete.md` | Business Requirements Document (signed off) |
| `planning/05-phase1-system-design.md` | System design + API contract |
| `planning/06-design-system.md` | Design system spec |

---

## PENDING — What Remains

### High Priority (Revenue-blocking)

1. **Coffee Shop** (`/shop`) — every Coffee CTA points here; not built
2. **Backend API endpoints** — products, orders, enquiries, blog CRUD
3. **Payment integrations** — Flutterwave (UGX) + PayPal (USD) + live exchange rate API
4. **WhatsApp Business** — enquiry notifications to Marketing team
5. **Transactional email** — Mailgun or Postmark (order confirmations, enquiry acknowledgements)

### Medium Priority

6. **Contact page** — built but needs design alignment with homepage
7. **Customer portal** — order tracking, invoices, enquiry status
8. **Blog content** — team needs to write and publish posts
9. **Testimonials** — written client consent needed before publishing real quotes
10. **Coffee photos** — product photography pending
11. **SEAL/Coffee/Logistics videos** — for hero slides 2–4

### Operations / Pre-Launch

12. **Sentry** error monitoring
13. **UptimeRobot / BetterStack** uptime alerts
14. **Automated daily DB backups**
15. **CI/CD pipeline** (GitHub Actions)
16. **Sitemap + robots.txt** — SEO critical
17. **Social sharing metadata** (Open Graph) — WhatsApp/LinkedIn preview cards
18. **Push `rebuild` branch to GitHub** for remote backup

### Lower Priority

19. Animation Waves 2–3 (swipe gestures, sticky mobile CTA)
20. Tone-of-voice guide (Marketing)
21. Newsletter unsubscribe flow (GDPR)
22. Careers page

---

## Known Issues (Active — From Original Audit)

### Critical
1. **Security gap in blog content rendering** — sanitise all HTML output before backend goes live
2. **File storage open to all logged-in users** — restrict uploads to admin roles only

### High Priority
3. No error or uptime monitoring
4. No automated data backups
5. No CI/CD pipeline

### Medium
6. Exchange rate currently hardcoded — live rate API not yet wired
7. No sitemap or robots.txt

---

## Communication Rules

- Always write reports and updates in **business language** — outcomes, risks, revenue impact
- Never use technical jargon with Solomon or in stakeholder communications
- Email reports go to Solomon (To) with Ops and Marketing (CC)
- John sends from john@vitorra.org (Outlook) — Gmail MCP only reaches leojohnseyi@gmail.com
- When framing progress, lead with what it means for the customer and the business, not what was coded

---

## What "Production Ready" Looks Like for Vitorra

- Visitors immediately understand who Vitorra is, what it does, and why it matters
- The design commands the authority of a premium African holdings company
- Google can find and rank every page — driving organic enquiries without ad spend
- Customers can browse, enquire, and order without confusion
- The team is alerted to any issue before a customer notices it
- Business data is backed up and recoverable
- The platform can scale with business growth without an engineering rewrite
