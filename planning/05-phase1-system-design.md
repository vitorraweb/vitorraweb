# Phase 1 — Information Architecture & System Design
## Vitorra Holdings Limited — Full Platform Rebuild

**Version:** 1.0  
**Prepared by:** John (Engineer)  
**Date:** 2026-05-30  
**Depends on:** BRD `04-brd-complete.md` (Complete)  
**Status:** Ready to execute

---

## 1. Site Architecture — Page Map

### 1.1 Public Site

```
vitorra.org/
│
├── /                           → Homepage
├── /about                      → About Vitorra
├── /products/
│   ├── /fuel-eco-tech          → FET Product Page
│   ├── /seal-wound-spray       → SEAL Product Page
│   ├── /coffee                 → Coffee Landing Page
│   └── /logistics              → Logistics Services Page
│
├── /shop/                      → Coffee E-Commerce
│   ├── /                       → Coffee shop listing
│   ├── /[product-slug]         → Individual coffee product
│   └── /cart                   → Cart & checkout
│
├── /enquire                    → Unified Enquiry / Quote Request Form
├── /contact                    → Contact page
│
├── /trust/
│   └── /certifications         → All certifications & validations
│
├── /blog/
│   ├── /                       → Blog listing (paginated)
│   └── /[post-slug]            → Individual blog post
│
├── /legal/
│   ├── /privacy-policy
│   ├── /terms-and-conditions
│   ├── /returns-and-warranty
│   └── /cookie-policy
│
├── /404                        → Branded error page
│
└── /account/                   → Customer Self-Service Portal
    ├── /login
    ├── /register
    ├── /dashboard              → Orders, enquiries, profile summary
    ├── /orders                 → Order history + tracking
    ├── /orders/[id]            → Single order detail + invoice download
    ├── /enquiries              → Enquiry status tracking (B2B)
    ├── /documents              → Product datasheets, certifications
    └── /profile                → Account details management
```

### 1.2 Admin Panel

```
admin.vitorra.org/  (or vitorra.org/admin/)
│
├── /dashboard/
│   ├── /ceo                    → Solomon's read-only executive view
│   └── /ops                    → Daily operational view
│
├── /orders/
│   ├── /                       → All orders (filterable by product, status)
│   └── /[id]                   → Single order — update status, generate invoice
│
├── /enquiries/
│   ├── /                       → Enquiry inbox (filterable, assignable)
│   └── /[id]                   → Single enquiry — reply, convert to order, send quote
│
├── /products/
│   ├── /                       → Product catalogue listing
│   ├── /new                    → Add product
│   └── /[id]/edit              → Edit product
│
├── /coffee-shop/
│   ├── /stock                  → Coffee inventory management
│   └── /shipping               → DHL shipment management
│
├── /blog/
│   ├── /                       → All posts (draft, published, archived)
│   ├── /new                    → Create post
│   └── /[id]/edit              → Edit post
│
├── /customers/
│   ├── /                       → Customer list
│   └── /[id]                   → Customer detail — orders, enquiries, notes
│
├── /media/                     → Media library (images, PDFs, videos)
│
├── /reports/
│   ├── /revenue                → Revenue by period, by product
│   ├── /orders                 → Order pipeline report
│   ├── /enquiries              → Enquiry volume and conversion
│   └── /shipping               → Delivery performance (Coffee)
│
├── /settings/
│   ├── /general
│   ├── /tax                    → Uganda VAT toggle (off at launch, activatable)
│   ├── /currencies             → UGX / USD exchange rate API settings
│   ├── /shipping               → Shipping rates by zone
│   └── /notifications          → WhatsApp and email notification settings
│
└── /users/                     → User and role management
```

---

## 2. User Journey Maps (Wireframe Briefs)

### 2.1 FET — Enquiry Journey

```
Homepage → FET Product Page → Request a Fuel Savings Assessment (form)
→ Confirmation page + acknowledgement email
→ [Admin] Enquiry inbox notification → Response within 24h
→ [Customer] Consultation arranged
→ [Admin] Quote sent (PDF)
→ [Customer] Approves → Pro-forma invoice → 50% deposit
→ [Admin] Order confirmed → Delivery/installation
→ [Customer] Final payment → Invoice download from portal
```

### 2.2 Coffee — Retail Purchase Journey

```
Homepage → Coffee Page → Shop → Product Detail → Add to Cart
→ Cart → Checkout (address + payment via Flutterwave/PayPal)
→ Order confirmation email (automated)
→ [Admin] Order notification → Packed & dispatched
→ [Customer] Tracking email → Delivery
→ Day 7: Satisfaction email → Invoice in portal
```

### 2.3 Coffee — Wholesale Enquiry Journey

```
Coffee Page → "Request Wholesale Pricing" CTA → Enquiry form
→ Acknowledgement email
→ [Admin] Enquiry inbox → Respond with wholesale pricing
→ Quote → Sample sent → Order placed → Invoice
```

### 2.4 SEAL — Healthcare Procurement Journey

```
Homepage → SEAL Product Page → Download Datasheet (secondary CTA)
→ Request Product Information (primary CTA) → Enquiry form
→ Acknowledgement email
→ [Admin] Medical Sales response within 24h
→ Clinical documentation sent → Procurement process
→ Quote → Pro-forma → Deposit → Delivery → Final invoice
```

### 2.5 Logistics — Service Enquiry Journey

```
Homepage → Logistics Page → "Request a Logistics Quote" CTA
→ Enquiry form (shipment requirements, origin, destination, cargo type)
→ Acknowledgement email
→ [Admin] Ops response within 24h
→ Consultation → Quote → Contract → Service delivery
→ Account management and performance reporting
```

---

## 3. Database Schema (High Level)

### Core Entities

```
users
  id, name, email, password_hash, role, company_name,
  phone, country, created_at

products
  id, name, slug, category (FET/SEAL/COFFEE/LOGISTICS),
  description, price_ugx, price_usd, stock_quantity (coffee only),
  is_published, created_at

orders
  id, user_id (nullable for guest), product_id, quantity,
  unit_price_ugx, unit_price_usd, currency, total,
  status (pending/processing/shipped/delivered/complete),
  payment_method (flutterwave/paypal/eft),
  payment_status (pending/partial/paid),
  shipping_address, tracking_number, notes, created_at

enquiries
  id, user_id (nullable), product_category, name, email,
  company, phone, country, message, requirements,
  status (new/in_progress/quoted/converted/closed),
  assigned_to (admin user id), created_at

quotes
  id, enquiry_id, order_id (nullable), pdf_url,
  amount_ugx, amount_usd, currency, valid_until,
  status (draft/sent/approved/rejected), created_at

invoices
  id, order_id, invoice_number, pdf_url,
  amount, currency, type (proforma/final),
  issued_at, due_at

blog_posts
  id, title, slug, content, excerpt, author_id,
  status (draft/published/archived),
  published_at, seo_title, seo_description, created_at

certifications
  id, product_category, name, issuer, issued_date,
  expiry_date, document_url, is_public, created_at

media
  id, filename, url, type (image/video/pdf),
  uploaded_by, created_at

settings
  key, value (tax_enabled, vat_rate, exchange_rate_api_key, etc.)
```

---

## 4. API Design (Laravel Backend → Next.js Frontend)

### Public API Endpoints

```
GET  /api/products                    → List all products (published)
GET  /api/products/{slug}             → Single product detail
GET  /api/coffee/products             → Coffee shop listing
GET  /api/coffee/products/{slug}      → Coffee product detail
POST /api/orders                      → Create order (coffee checkout)
POST /api/enquiries                   → Submit enquiry / quote request
GET  /api/blog/posts                  → Blog listing (paginated)
GET  /api/blog/posts/{slug}           → Single blog post
GET  /api/certifications              → Public certifications listing
GET  /api/exchange-rate               → Live UGX/USD rate
POST /api/newsletter/subscribe        → Newsletter subscription
POST /api/contact                     → Contact form submission
```

### Customer Portal API Endpoints (Authenticated)

```
GET  /api/account/orders              → Customer's orders
GET  /api/account/orders/{id}         → Single order detail
GET  /api/account/orders/{id}/invoice → Download invoice PDF
GET  /api/account/enquiries           → Customer's enquiries + status
GET  /api/account/documents           → Available product documents
PUT  /api/account/profile             → Update profile
```

### Admin API Endpoints (Admin Auth Required)

```
GET/POST/PUT/DELETE /api/admin/orders
GET/POST/PUT/DELETE /api/admin/enquiries
GET/POST/PUT/DELETE /api/admin/products
GET/POST/PUT/DELETE /api/admin/blog/posts
GET/POST/PUT/DELETE /api/admin/customers
GET/POST/PUT/DELETE /api/admin/media
GET/POST/PUT/DELETE /api/admin/certifications
GET                 /api/admin/reports/revenue
GET                 /api/admin/reports/orders
GET                 /api/admin/reports/enquiries
GET/PUT             /api/admin/settings
```

### Payment & Shipping Webhooks

```
POST /api/webhooks/flutterwave        → Payment confirmation (UGX)
POST /api/webhooks/paypal             → Payment confirmation (USD)
POST /api/webhooks/dhl                → Shipment status updates
```

---

## 5. Page-by-Page Content Brief

### Homepage
- **Hero:** Headline (what Vitorra is + brand statement) + Primary CTA per business
- **Portfolio overview:** 4 products — FET, SEAL, Coffee, Logistics — brief card each
- **Why Vitorra:** 3-4 differentiators (Trust, Innovation, Opportunity)
- **Trust bar:** Certifications, number of clients, countries served, years operating
- **Product deep-dives:** Mini-section per product with CTA
- **Testimonials:** 1-2 approved quotes (pending written permission)
- **Blog preview:** 3 latest posts
- **Final CTA block:** "Ready to start? Request a quote today."

### FET Product Page
Sections: Hero → Problem statement → How FET works → Benefits (with ROI framing) → Technical specs → Certifications → Case studies / testimonials → FAQ (5 product-specific questions) → CTA block (Fuel Savings Assessment + Book Demo)

### SEAL Product Page
Sections: Hero → Clinical problem it solves → How SEAL works → Clinical effectiveness → Certifications + regulatory status → Who uses it → Procurement process → FAQ → CTA block (Request Info + Download Datasheet)

### Coffee Page
Sections: Hero → Origin story (Uganda) → Product range (retail packs) → Shop CTA → Wholesale section → Export section → Certifications → CTA blocks per audience (Buy / Request Wholesale / Request Export Info)

### Logistics Services Page
Sections: Hero → Core services (5 service areas) → Industries served → Why choose Vitorra Logistics → Upsell packages → Trust signals → FAQ → CTA block (Request a Logistics Quote)

### Enquiry Page
Single form with product selector. Fields: Name, Company, Country, Email, Phone, Product/Service of interest, Message / Requirements. On submit: acknowledgement email auto-sent, enquiry appears in admin inbox, WhatsApp notification to Marketing Manager.

---

## 6. Integration Specifications

### 6.1 Flutterwave (UGX payments — Coffee checkout)
- Collect card/mobile money payment in UGX at checkout
- Webhook confirms payment → order status updated → confirmation email triggered
- Admin panel shows payment reference and status

### 6.2 PayPal (USD payments — international Coffee customers)
- PayPal checkout button at checkout for non-UGX customers
- Webhook confirms payment → same flow as Flutterwave
- Exchange rate displayed at checkout using live API rate

### 6.3 Exchange Rate API
- Fetch live UGX/USD rate on page load for price display
- Cache rate for 1 hour to avoid excessive API calls
- Admin setting to override rate manually if needed
- Rate displayed transparently to customer at checkout: "1 USD = [X] UGX (live rate)"

### 6.4 DHL API (International Coffee shipping)
- At checkout: customer enters delivery country/address
- System calls DHL API → returns shipping options (Express, Standard) + cost
- Customer selects option → cost added to order total
- On dispatch: Marketing Manager enters DHL tracking number → customer receives tracking email

### 6.5 WhatsApp Business API
- New enquiry submitted → WhatsApp notification to Marketing Manager with: customer name, product, message, link to enquiry in admin panel
- New Coffee order → WhatsApp notification to Marketing Manager with order details
- Marketing Manager can optionally reply directly to customer from WhatsApp

### 6.6 Email — Mailgun / Postmark
Automated emails to be built:
- Enquiry acknowledgement (customer)
- New enquiry alert (Marketing Manager)
- New order confirmation (customer)
- New order alert (Marketing Manager)
- Order status update — Processing, Shipped (customer)
- Shipping tracking notification (customer)
- Day 7 satisfaction follow-up (customer — Coffee)
- Day 14 feedback request (customer — FET/SEAL/Logistics)
- Quote sent notification (customer)
- Invoice issued notification (customer)
- Password reset
- Newsletter welcome

---

## 7. Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| Authentication | Laravel Sanctum or Passport (API tokens) |
| Password hashing | bcrypt (Laravel default) |
| HTTPS | Enforced on all routes — Vercel + backend host |
| CSRF protection | Laravel CSRF middleware on all POST routes |
| XSS prevention | All HTML output sanitised — never render raw user input |
| SQL injection | Laravel Eloquent ORM (parameterised queries only) |
| File upload security | Admin-only file uploads; validate type and size; store on Cloudinary/S3, not server |
| Role-based access control | Every admin route gated by role — unauthorised access returns 403 |
| API rate limiting | Laravel rate limiting on all public POST endpoints |
| Environment variables | All secrets in .env — never committed to version control |
| Blog content sanitisation | Sanitise all HTML before rendering — fix current XSS vulnerability |
| Audit logging | Log all admin actions (who changed what, when) |

---

## 8. Phase 1 Deliverables & Sign-Off Checklist

Before any code is written, Phase 1 must produce and get sign-off on:

- [ ] Complete site page map (this document — Section 1)
- [ ] Low-fidelity wireframes for all 5 core public pages (Homepage, FET, SEAL, Coffee, Logistics)
- [ ] Admin panel wireframes (Dashboard, Order Management, Enquiry Inbox)
- [ ] Customer portal wireframes
- [ ] Database schema reviewed and approved
- [ ] API contract reviewed (all endpoints listed — Section 4)
- [ ] Integration specifications reviewed (Section 6)
- [ ] Tone of voice guide written by Marketing
- [ ] All legal pages drafted (Privacy Policy, T&C, Returns Policy, Cookie Policy)
- [ ] UAT test plan written (what success looks like for each key flow)

**Sign-off required from:** Marketing Lead + John (Engineer)  
**Solomon sign-off required on:** Homepage wireframe, Product page wireframes, CEO dashboard wireframe

---

## 9. Phase 2 Build Sequence (For Reference)

Once Phase 1 is signed off, Phase 2 builds in this order:

### Sprint 1 (Week 3–4) — Foundation
- Laravel API project setup, database migrations, authentication, user roles
- Next.js project setup, routing, layout components, design system (colours, typography, components)
- Admin panel shell (navigation, authentication)

### Sprint 2 (Week 5–6) — Public Site Core
- Homepage
- About page
- Product pages (FET, SEAL, Logistics)
- Contact + Enquiry form (Laravel enquiry endpoint + email + WhatsApp)

### Sprint 3 (Week 7–8) — Coffee E-Commerce
- Coffee product pages + shop
- Cart and checkout (Flutterwave + PayPal)
- Exchange rate API integration
- DHL shipping rate integration
- Order confirmation flow

### Sprint 4 (Week 9–10) — Admin Panel
- CEO dashboard (reporting)
- Ops dashboard (daily operational)
- Order management
- Enquiry inbox + quote generation
- Product catalogue management

### Sprint 5 (Week 11–12) — Customer Portal + Blog
- Customer self-service portal (orders, invoices, enquiry tracking, profile)
- Blog CMS + public blog listing and post pages
- Media library

### Sprint 6 (Week 13–14) — Legal, Compliance, Operations
- Legal pages (Privacy, T&C, Returns, Cookie Policy, Cookie banner)
- Uganda VAT toggle (dormant, activatable)
- Sentry error monitoring
- BetterStack / UptimeRobot uptime alerts
- Automated daily database backups
- CI/CD pipeline (GitHub Actions)

### Sprint 7 (Week 15–16) — Testing, Data Migration & Launch
- End-to-end payment testing (Flutterwave + PayPal)
- Cross-browser and mobile testing
- Performance audit (page speed, Core Web Vitals)
- SEO audit (sitemap, robots.txt, meta tags, structured data)
- Data migration from Firebase → PostgreSQL (if needed)
- Staging → Production deployment
- DNS cutover
- Post-launch monitoring (48h)

---

## 10. Definition of "Done" (Production Ready)

The platform is ready to launch when:

- [ ] Visitors immediately understand who Vitorra is, what it offers, and what to do next — within 30 seconds of landing
- [ ] Google can index and rank every public page (SSR confirmed, sitemap submitted, robots.txt correct)
- [ ] FET, SEAL, Coffee, and Logistics enquiry flows work end-to-end — form → acknowledgement → admin inbox → response
- [ ] Coffee orders process successfully in UGX (Flutterwave) and USD (PayPal) with live exchange rate
- [ ] DHL shipping rates calculate correctly at Coffee checkout
- [ ] All automated emails send correctly (order confirmation, enquiry acknowledgement, shipping, follow-up)
- [ ] WhatsApp notifications reach Marketing Manager on new enquiry and new order
- [ ] Admin panel: Marketing Manager and Ops can process orders and respond to enquiries without John's help
- [ ] CEO dashboard shows Solomon the data he needs without any technical knowledge required
- [ ] Customer portal: customers can track orders, download invoices, and track enquiry status
- [ ] Legal pages live: Privacy Policy, T&C, Returns Policy, Cookie Policy, Cookie consent banner
- [ ] Uganda VAT field built and toggleable — ready to activate when registration completes
- [ ] Sentry monitoring active — errors alert before customers notice
- [ ] Uptime monitoring active — downtime alerts within 1 minute
- [ ] Automated daily database backups running
- [ ] All blog content live (minimum 4 posts at launch)
- [ ] All certifications and trust signals live (pending management delivery)
- [ ] 404 page branded and functional
- [ ] Mobile-responsive across all pages (tested on Android and iOS)
- [ ] Page speed score: 80+ on Google PageSpeed Insights (mobile and desktop)
- [ ] No critical security vulnerabilities (XSS, SQL injection, open file uploads)

**Target launch: Week 14–16 from Phase 1 sign-off.**
