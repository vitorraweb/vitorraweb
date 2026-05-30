# Vitorra Holdings Limited — Web Platform

Diversified distribution and management company serving Uganda, East Africa, and
international markets across four product lines: Fuel Eco Tech, SEAL Hemostatic
Wound Spray, Vitorra Coffee, and Logistics Services.

## Architecture

This is the **rebuild** — a clean monorepo replacing the previous React/Firebase site.

| Layer | Stack | Location |
|-------|-------|----------|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui | `frontend/` |
| Backend | Laravel 13 · PHP 8.3 · PostgreSQL | `backend/` |
| Planning | BRD, system design, design system, animation plan | `planning/` |
| Assets | Raw brand/product/team source files | `assets/` |

> The previous React + Firebase codebase is preserved on the **`master`** branch
> (GitHub `origin/master`). All new work happens on **`rebuild`**.

## Getting started

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve  # http://localhost:8000
```

## Design system

Adapted from the Mastercard design language (warm canvas, floating pill nav,
stadium cards, circular portraits, editorial scale) with Vitorra's own identity:
Playfair Display headings, Inter body, and Vitorra Gold `#C5B27A`. Full spec in
`planning/06-design-system.md`.

## Documentation

- `planning/04-brd-complete.md` — Business Requirements Document
- `planning/05-phase1-system-design.md` — Information architecture & system design
- `planning/06-design-system.md` — Design system spec
- `planning/07-animation-interaction-plan.md` — Motion & interaction plan
- `CLAUDE.md` — Project brief & working conventions

## Recovering the legacy codebase

```bash
git checkout master -- <path>     # restore a specific old file
git log master                    # browse the previous site's history
```
