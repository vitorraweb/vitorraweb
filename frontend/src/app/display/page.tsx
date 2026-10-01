"use client";

import { KioskTopBar } from "@/components/display/KioskTopBar";
import { KioskSpotlight, KioskHeadline, KioskStageProvider } from "@/components/display/KioskSpotlight";
import { KioskSideRail } from "@/components/display/KioskSideRail";
import { KioskTicker } from "@/components/display/KioskTicker";

/* ─── /display — reception lobby screen ───────────────────────────────────────
   An unattended, always-on screen for the front desk.

   It is built as a stage, not a dashboard: the brand film of whichever
   business line is up runs full-bleed behind everything, and the header,
   headline, rail and ticker float over it. The earlier layout boxed the film
   into one card among several, which gave a visitor no idea where to look —
   weather carried the same visual weight as an independently verified result.

   Design notes:
   - Full-bleed, fixed viewport — this is a TV screen, not a scrollable page.
   - Type is sized to be read from across a lobby, not from a desk.
   - No header/footer/cookie banner (see CookieBanner + robots.ts + middleware
     for the "/display" exclusions) — nobody is here to dismiss a banner.
   - English-only by design (excluded from the i18n middleware, same as /admin).
   ─────────────────────────────────────────────────────────────────────────── */
export default function DisplayPage() {
  return (
    <KioskStageProvider>
      <div className="fixed inset-0 overflow-hidden select-none" style={{ backgroundColor: "#0A0A0A" }}>
        {/* Full-bleed media bed + scrims */}
        <KioskSpotlight />

        {/* Everything else floats over it */}
        <div className="relative z-10 flex flex-col h-full">
          <KioskTopBar />

          <main className="flex-1 min-h-0 px-10 lg:px-14 pb-8 flex items-stretch gap-10">
            {/* Headline column — anchored to the lower third, where the scrim
                is heaviest and the eye lands after the brand lockup. */}
            <div className="flex-1 min-w-0 flex flex-col justify-end pb-2">
              <KioskHeadline />
            </div>
            <KioskSideRail />
          </main>

          <KioskTicker />
        </div>
      </div>
    </KioskStageProvider>
  );
}
