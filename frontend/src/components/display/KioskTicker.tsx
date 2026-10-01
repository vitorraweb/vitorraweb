"use client";

import { useKioskHeadlines } from "@/lib/kiosk";

/* ─── The ticker ───────────────────────────────────────────────────────────
   One band, not two. The screen used to carry a gold certifications marquee
   stacked on a dark news ticker — two things scrolling in the same place at
   once, which is the look of an airport departures board rather than a brand.
   The certifications now have a proper home in the rail, where they can be
   read; this carries the news alone.
   ─────────────────────────────────────────────────────────────────────────── */
export function KioskTicker() {
  const headlines = useKioskHeadlines();

  return (
    <div
      className="relative z-20 shrink-0 flex items-stretch overflow-hidden"
      style={{
        background: "rgba(8,8,8,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderTop: "1px solid rgba(197,178,122,0.26)",
      }}
    >
      {/* Fixed tag — never scrolls, so the band always identifies itself */}
      <div className="flex items-center gap-3 pl-10 lg:pl-14 pr-7 shrink-0 z-10">
        <span className="status-dot w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#C5B27A" }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: "#C5B27A" }}>
          VITORRA NEWS
        </span>
        <span className="h-5 w-px ml-1" style={{ background: "rgba(197,178,122,0.3)" }} />
      </div>

      <div className="marquee-mask relative overflow-hidden flex-1 py-4">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1}>
              {headlines.map((h, i) => (
                <div key={`${copy}-${i}`} className="flex items-center pr-12 shrink-0">
                  <span style={{ fontSize: 15, color: "rgba(255,255,255,0.82)" }}>{h.title}</span>
                  <span
                    aria-hidden="true"
                    className="ml-12 w-[3px] h-[3px] rotate-45 shrink-0"
                    style={{ background: "#C5B27A", opacity: 0.75 }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
