# Vitorra Holdings Limited — Corporate Website

> **Full-stack corporate website and e-commerce platform for Vitorra Holdings Limited**, a diversified international group operating across pharmaceutical, automotive, logistics, and trade sectors. Built with React, TypeScript, Tailwind CSS, and Firebase.

**Live:** [vitorra.org](https://vitorra.org)  
**Hosting:** Firebase Hosting  
**Backend:** Firebase (Firestore, Auth, Cloud Functions, Storage)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)
- [Pages & Routing](#pages--routing)
- [Admin Panel](#admin-panel)
- [Customer Portal](#customer-portal)
- [CMS (Content Management)](#cms-content-management)
- [Firebase Services](#firebase-services)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Tech Stack

| Layer         | Technology                                                    |
|---------------|---------------------------------------------------------------|
| **Framework** | React 19 + TypeScript                                         |
| **Build**     | Vite 6                                                        |
| **Styling**   | Tailwind CSS v4 + Custom CSS design system                    |
| **Routing**   | React Router DOM v7                                           |
| **Animation** | Motion (Framer Motion)                                        |
| **Icons**     | Lucide React                                                  |
| **Auth**      | Firebase Authentication (Email/Password)                      |
| **Database**  | Cloud Firestore                                               |
| **Storage**   | Firebase Cloud Storage (media library)                        |
| **Functions** | Firebase Cloud Functions (Node.js 20) — email, order hooks    |
| **Hosting**   | Firebase Hosting                                              |
| **PDF Gen**   | jsPDF + jsPDF-AutoTable (invoices, proformas)                 |
| **Rich Text** | React Quill (blog editor)                                     |

---

## Project Structure

```
vitorra-holdings-limited/
├── public/
│   └── images/               # Static images (hero backgrounds, product photos, logos)
├── functions/                 # Firebase Cloud Functions (backend)
│   └── src/
│       └── index.ts           # Email notifications, order webhooks, scheduled tasks
├── src/
│   ├── App.tsx                # Root component — all route definitions
│   ├── main.tsx               # React entry point (BrowserRouter wrapper)
│   ├── index.css              # Global design system (theme, typography, cards, buttons)
│   │
│   ├── components/            # Shared UI components
│   │   ├── Layout.tsx         # Main layout shell (Navbar + Footer + scroll behavior)
│   │   ├── Logo.tsx           # Vitorra wordmark component
│   │   ├── ThemeSwitcher.tsx  # Light/Dark mode toggle
│   │   ├── LanguageSwitcher.tsx # i18n language selector
│   │   ├── ErrorBoundary.tsx  # React error boundary
│   │   ├── layout/            # Layout sub-components (Navbar, Footer, MobileMenu)
│   │   ├── portal/            # Portal-specific components (OrderTrackingTimeline)
│   │   └── ui/                # Reusable UI primitives (FileUpload, etc.)
│   │
│   ├── context/               # React Context providers (global state)
│   │   ├── AuthContext.tsx    # Firebase Auth state, user roles, login/logout
│   │   ├── CMSContext.tsx     # ALL CMS data — products, orders, blogs, jobs, settings
│   │   ├── CartContext.tsx    # Shopping cart state
│   │   ├── LanguageContext.tsx # Multi-language support (EN/DE/FR/etc.)
│   │   └── ThemeContext.tsx   # Light/Dark theme management
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useExchangeRate.ts # EUR → UGX live exchange rate conversion
│   │
│   ├── lib/                   # Core utilities & services
│   │   ├── firebase.ts        # Firebase app initialization & SDK exports
│   │   ├── functions.ts       # Firebase Cloud Functions callable wrappers
│   │   ├── carriers.ts        # Shipping carrier tracking URL builders (DHL, FedEx, etc.)
│   │   ├── generateDocument.ts # PDF generation (proforma invoices, final invoices)
│   │   └── logoData.ts        # Base64-encoded logo for PDF embedding
│   │
│   ├── services/              # External service integrations
│   │   ├── mediaService.ts    # Firebase Storage media library (upload, list, delete)
│   │   └── uploadService.ts   # Generic file upload helper
│   │
│   └── pages/                 # All page-level components
│       ├── Home.tsx            # Homepage — hero, ecosystem bento grid, stats, credentials
│       ├── About.tsx           # Company story, mission/vision, operational pillars
│       ├── Contact.tsx         # Contact form → Firestore, company info
│       ├── News.tsx            # Blog listing (featured + grid)
│       ├── BlogArticle.tsx     # Individual blog post (rich HTML rendering)
│       ├── JoinOurTeam.tsx     # Careers page — dynamic job listings from CMS
│       ├── Shop.tsx            # Product catalog with category filters
│       ├── Cart.tsx            # Shopping cart
│       ├── Checkout.tsx        # Multi-step checkout (shipping → payment → confirmation)
│       ├── Auth.tsx            # Login / Register page
│       ├── Portal.tsx          # Customer portal (orders, documents, settings, support)
│       ├── FETLabTest.tsx      # FET lab test article page with document downloads
│       ├── PrivacyPolicy.tsx   # Legal — Privacy Policy
│       ├── TermsOfService.tsx  # Legal — Terms of Service
│       │
│       ├── products/           # Product vertical pages
│       │   ├── FET.tsx         # Fuel Eco Tech product page (full marketing site)
│       │   ├── Seal.tsx        # SEAL Wound Care product page (3 products, FAQs, science)
│       │   ├── Coffee.tsx      # Vitorra Coffee export page
│       │   ├── Logistics.tsx   # Logistics & e-ticketing platform page
│       │   └── DynamicProductPage.tsx  # Dynamic product detail page (from CMS/shop)
│       │
│       └── admin/              # Admin panel (protected)
│           ├── AdminLogin.tsx  # Admin authentication gate
│           ├── AdminDashboard.tsx # Dashboard shell — sidebar nav + tab routing
│           ├── admin.css       # Admin-specific dark theme styles
│           ├── components/     # Admin modules (see Admin Panel section)
│           └── ui/             # Admin UI primitives (StatusBadge, MediaPicker)
│
├── firebase.json               # Firebase project config (hosting, functions, firestore, storage)
├── firestore.rules             # Firestore security rules
├── storage.rules               # Cloud Storage security rules
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & scripts
└── .env                        # Environment variables (Firebase config — NOT committed)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)
- **Firebase CLI** (optional, for deployment): `npm install -g firebase-tools`

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/vitorraholdingsltd-dev/vitorraweb.git
cd vitorraweb

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env
# Fill in your Firebase project credentials

# 4. Start the dev server
npm run dev
```

The app runs at **http://localhost:3000** by default.

### Available Scripts

| Command           | Description                                  |
|-------------------|----------------------------------------------|
| `npm run dev`     | Start Vite dev server on port 3000           |
| `npm run build`   | Production build to `dist/`                  |
| `npm run preview` | Preview the production build locally         |
| `npm run lint`    | Type-check with TypeScript (`tsc --noEmit`)  |
| `npm run clean`   | Remove the `dist/` output directory          |

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ **Never commit the `.env` file.** It is included in `.gitignore`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│   ThemeProvider                                   │
│     └─ LanguageProvider                          │
│          └─ AuthProvider (Firebase Auth)          │
│               └─ CMSProvider (Firestore live)     │
│                    └─ CartProvider                │
│                         └─ <Routes />            │
│                              ├─ Layout (Nav+Footer)
│                              │    ├─ Public Pages │
│                              │    ├─ Shop / Cart  │
│                              │    ├─ Portal       │
│                              │    └─ Admin Panel  │
└──────────────────────────────┼───────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Firebase Cloud     │
                    │                      │
                    │  ┌─ Firestore DB     │
                    │  ├─ Auth             │
                    │  ├─ Cloud Storage    │
                    │  └─ Cloud Functions  │
                    └──────────────────────┘
```

### Context Providers (Global State)

| Context           | Responsibility                                                                |
|-------------------|-------------------------------------------------------------------------------|
| `ThemeContext`     | Light/dark mode toggle, persisted to `localStorage`                          |
| `LanguageContext`  | Multi-language support — EN, DE, FR, etc.                                    |
| `AuthContext`      | Firebase Auth session, user profile, role-based access (`admin`, `customer`) |
| `CMSContext`       | Central data store — real-time Firestore listeners for all collections       |
| `CartContext`      | Shopping cart state with add/remove/quantity management                       |

---

## Pages & Routing

### Public Pages

| Route                   | Page Component       | Description                                     |
|-------------------------|----------------------|-------------------------------------------------|
| `/`                     | `Home`               | Hero, product ecosystem, stats, registration    |
| `/about`                | `About`              | Company story, mission, vision, pillars         |
| `/contact`              | `Contact`            | Contact form, corporate HQ info                 |
| `/news`                 | `News`               | Blog listing — featured article + grid          |
| `/news/:id`             | `BlogArticle`        | Individual blog post                            |
| `/news/fet-lab-test`    | `FETLabTest`         | FET lab test results article + document downloads |
| `/join-our-team`        | `JoinOurTeam`        | Careers — dynamic job listings from CMS          |
| `/privacy`              | `PrivacyPolicy`      | Privacy Policy page                             |
| `/terms`                | `TermsOfService`     | Terms of Service page                           |

### Product Pages

| Route                   | Page Component       | Description                                     |
|-------------------------|----------------------|-------------------------------------------------|
| `/products/fet`         | `FET`                | Fuel Eco Tech — full product marketing page     |
| `/products/seal`        | `Seal`               | SEAL Wound Care — 3 products, science, FAQs     |
| `/products/coffee`      | `Coffee`             | Ugandan coffee export page                      |
| `/products/logistics`   | `Logistics`          | Logistics & e-ticketing platform                |
| `/products/:slug`       | `DynamicProductPage` | Dynamic product detail (variant selection, cart) |

### E-Commerce

| Route                   | Page Component       | Description                                     |
|-------------------------|----------------------|-------------------------------------------------|
| `/shop`                 | `Shop`               | Product catalog with category filtering         |
| `/shop/:slug`           | `DynamicProductPage` | Product detail from shop context                |
| `/cart`                 | `Cart`               | Shopping cart review                            |
| `/checkout`             | `Checkout`           | Multi-step checkout flow                        |
| `/auth`                 | `Auth`               | Login / Register                                |
| `/portal`               | `Portal`             | Customer dashboard (orders, documents, settings)|

### Admin

| Route                   | Page Component       | Description                                     |
|-------------------------|----------------------|-------------------------------------------------|
| `/admin`                | `AdminLogin`         | Admin authentication gate                       |
| `/admin/dashboard`      | `AdminDashboard`     | Full admin panel with sidebar navigation        |

---

## Admin Panel

The admin panel (`/admin/dashboard`) is a full-featured backoffice for managing all site content and operations. Access is role-gated — only users with `role: 'admin'` in Firestore can access.

### Admin Modules

| Module              | File                        | Features                                                        |
|---------------------|-----------------------------|-----------------------------------------------------------------|
| **Dashboard**       | `DashboardOverview.tsx`     | Revenue charts, order stats, recent activity, quick actions     |
| **Orders**          | `OrdersManager.tsx`         | Order lifecycle management, status updates, invoice generation  |
| **Products**        | `ProductsManager.tsx`       | CRUD for products and variants, pricing, images, stock          |
| **Categories**      | `CategoryCatalog.tsx`       | Product category management                                     |
| **Customers**       | `CustomersManager.tsx`      | Customer directory, order history, account management           |
| **Shipping**        | `ShippingManager.tsx`       | Shipment creation, carrier tracking (DHL, FedEx, UPS, etc.)    |
| **Blog**            | `BlogsManager.tsx`          | Blog post CRUD with rich text editor, images, tags              |
| **Jobs**            | `JobsManager.tsx`           | Career posting management (title, department, requirements)     |
| **Content**         | `ContentEditor.tsx`         | CMS page content editor (hero text, descriptions, images)       |
| **Inbox**           | `InboxManager.tsx`          | Contact form submissions & subscriber management                |
| **Media Library**   | `MediaLibrary.tsx`          | Firebase Storage browser — upload, organize, delete media files |
| **Settings**        | `SettingsManager.tsx`       | Company info, email config, admin user management               |

### Admin UI Components

- `StatusBadge.tsx` — Semantic status indicators with color coding
- `MediaPickerModal.tsx` — Media library integration for selecting images
- `MediaPickerButton.tsx` — Trigger button for the media picker
- `RichTextEditor.tsx` — Quill-based WYSIWYG editor for blog content

---

## Customer Portal

The customer portal (`/portal`) provides authenticated customers with:

- **My Orders** — View order history, status tracking, shipment timelines
- **Documents** — Download invoices, proforma invoices, and shipping documents
- **Account Settings** — Update profile, change password
- **Help & Support** — FAQ and contact support

### Order Tracking

Orders include a visual **shipment tracking timeline** component (`OrderTrackingTimeline.tsx`) that shows real-time status updates with carrier integration for DHL, FedEx, UPS, TNT, and more.

---

## CMS (Content Management)

The `CMSContext` is the central data hub. It uses **real-time Firestore listeners** (`onSnapshot`) to keep all data in sync across the app without page reloads.

### Firestore Collections

| Collection             | Purpose                                          |
|------------------------|--------------------------------------------------|
| `products`             | Product catalog (name, variants, pricing, images)|
| `categories`           | Product categories                               |
| `orders`               | Customer orders (items, status, shipping)         |
| `blogs`                | Blog posts (title, body, images, tags, status)    |
| `jobs`                 | Job listings (title, department, requirements)    |
| `pageContent`          | CMS-managed page text (hero titles, descriptions)|
| `companyInfo`          | Company details (address, phone, email)           |
| `stats`                | Homepage statistics (markets served, etc.)         |
| `coreValues`           | Company values displayed on About page            |
| `subscribers`          | Newsletter email subscribers                      |
| `contactSubmissions`   | Contact form submissions                         |
| `users`                | User profiles and roles                           |
| `settings`             | Site-wide configuration                           |

---

## Firebase Services

### Firestore

- **Real-time listeners** for live data sync across all clients
- **Security rules** in `firestore.rules` — role-based access control
- Admin-only write access for content collections
- Authenticated user access for orders and profile

### Authentication

- Email/password authentication
- Role-based access: `admin` and `customer` roles stored in user document
- Protected routes for admin panel and customer portal

### Cloud Storage

- Media library for product images, blog images, and site assets
- Organized by folders with metadata tracking
- Upload, delete, and browse via the admin Media Library

### Cloud Functions (`functions/src/index.ts`)

- **Email notifications** — Order confirmations, status updates (via Nodemailer)
- **Order webhooks** — Automated workflows on order status changes
- Runtime: Node.js 20

---

## Design System

The design system is defined in `src/index.css` and uses CSS custom properties for full theme support.

### Typography

| Element | Font Family | Mobile Size             | Desktop Size            |
|---------|-------------|-------------------------|-------------------------|
| Body    | Open Sans   | 16px                    | 18px (xl+)              |
| H1      | Montserrat  | clamp(32px, 8vw, 40px)  | clamp(48px, 5vw, 64px)  |
| H2      | Montserrat  | clamp(24px, 5vw, 28px)  | clamp(32px, 4vw, 40px)  |
| H3      | Montserrat  | clamp(20px, 3vw, 22px)  | clamp(22px, 2.5vw, 28px)|
| H4      | Montserrat  | 20px                    | 20px                    |

### Theme Variables

The app supports **light** and **dark** mode. Theme variables are toggled via the `.dark` CSS class on `<html>`:

```css
/* Light Mode */
--bg-primary: #faf9f6;
--text-primary: #1a1a1a;
--vitorra-gold: #A6863B;

/* Dark Mode (.dark) */
--bg-primary: #0A1628;
--text-primary: #F0F2F5;
--vitorra-gold: #D4A843;
```

### Utility Classes

| Class              | Purpose                                          |
|--------------------|--------------------------------------------------|
| `.card-base`       | Standard card — list items, product cards         |
| `.card-elevated`   | Elevated card — modals, popovers                  |
| `.card-interactive`| Hover-ready card with gold border transition      |
| `.btn-primary`     | Gold fill CTA button                              |
| `.btn-secondary`   | Gold border outline button                        |
| `.btn-ghost`       | Subtle border, muted text tertiary button         |
| `.btn-danger`      | Red-tinted destructive action button              |
| `.text-micro`      | 11px uppercase badge/label text                   |
| `.text-label`      | 12px uppercase form label text                    |

---

## Deployment

### Firebase Hosting

```bash
# 1. Build the production bundle
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Cloud Functions

```bash
# Deploy functions separately
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Full Deploy

```bash
# Deploy everything (hosting + functions + firestore rules + storage rules)
firebase deploy
```

---

## Contributing

### Branch Strategy

- `master` — Production branch, deployed to Firebase Hosting
- Feature branches — Create from `master`, PR back when ready

### Code Conventions

1. **TypeScript** — All components and utilities are fully typed
2. **Component files** — One component per file, PascalCase naming
3. **Tailwind** — Use Tailwind utility classes; extend via `index.css` design system
4. **Context pattern** — All global state lives in `src/context/` providers
5. **No inline styles** — Use Tailwind classes or CSS custom properties
6. **Comments** — Preserve existing section markers (`/* ═══ SECTION N ═══ */`)

### Adding a New Page

1. Create the component in `src/pages/`
2. Add the route in `src/App.tsx` inside the `<Layout>` route
3. Add navigation link in `src/components/Layout.tsx` (navbar)

### Adding a New Admin Module

1. Create the module component in `src/pages/admin/components/`
2. Register it in `AdminDashboard.tsx` sidebar navigation and tab renderer
3. Add any new Firestore collections to `CMSContext.tsx`

### Adding a New Product Page

1. Create the page in `src/pages/products/`
2. Add its route in `src/App.tsx` (e.g., `/products/your-product`)
3. Add product data to the CMS via the admin Products Manager

---

## License

This project is proprietary to **Vitorra Holdings Limited**. All rights reserved.
