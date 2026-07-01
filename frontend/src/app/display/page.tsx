"use client";

import { KioskTopBar } from "@/components/display/KioskTopBar";
import { KioskSpotlight } from "@/components/display/KioskSpotlight";
import { KioskSideRail } from "@/components/display/KioskSideRail";
import { KioskTicker } from "@/components/display/KioskTicker";

/* ─── /display — reception lobby screen ───────────────────────────────────────
   An unattended, always-on kiosk view for the front desk: live clock, Kampala
   weather, the FET brand film with a rotating sector spotlight, HQ photo,
   certifications, a proven-savings stat, and a live news/credentials ticker.

   Design notes:
   - Full-bleed, fixed viewport — this is a TV screen, not a scrollable page.
   - No header/footer/cookie banner (see CookieBanner + robots.ts + middleware
     for the "/display" exclusions) — nobody is here to dismiss a banner.
   - English-only by design (excluded from the i18n middleware, same as /admin).
   ─────────────────────────────────────────────────────────────────────────── */
export default function DisplayPage() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none" style={{ backgroundColor: "#161616" }}>
      <div aria-hidden="true" className="hero-aurora-right" />
      <div aria-hidden="true" className="hero-grain" />
      <div aria-hidden="true" className="absolute inset-0 authority-grid-bg pointer-events-none" style={{ opacity: 0.5 }} />

      <div className="relative z-10 flex flex-col h-full">
        <KioskTopBar />

        <main className="flex-1 min-h-0 px-8 lg:px-12 pb-5 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0 min-h-0">
            <KioskSpotlight />
          </div>
          <KioskSideRail />
        </main>

        <KioskTicker />
      </div>
    </div>
  );
}
