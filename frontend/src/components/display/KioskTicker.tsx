"use client";

import { Radio } from "lucide-react";
import { useKioskHeadlines } from "@/lib/kiosk";

/* ─── Certification credentials — gold marquee ────────────────────────────── */
const CERT_LINE = [
  "ISO 9001:2015 CERTIFIED",
  "ISO 14001:2015 CERTIFIED",
  "ISO 27001 CERTIFIED",
  "ZURICH INSURANCE — PRODUCT LIABILITY",
  "AVL TECHNOLOGIES — LAB VALIDATED",
  "QM-SOLUTIONS GMBH — GERMAN CERTIFIED",
  "URSB REGISTERED, UGANDA",
] as const;

function CertMarquee() {
  return (
    <div className="marquee-mask bg-gold-strip relative overflow-hidden py-2.5 shrink-0">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1}>
            {CERT_LINE.map((line, i) => (
              <div key={`${copy}-${i}`} className="flex items-center px-6 shrink-0">
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#1E1E1E" }}>
                  {line}
                </span>
                <span aria-hidden="true" className="ml-6 w-1 h-1 rotate-45 shrink-0" style={{ background: "#1E1E1E", opacity: 0.4 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Vitorra news — dark ticker, live blog headlines ─────────────────────── */
function NewsTicker() {
  const headlines = useKioskHeadlines();

  return (
    <div className="relative flex items-stretch overflow-hidden shrink-0" style={{ background: "#141414" }}>
      {/* Fixed tag — never scrolls */}
      <div className="flex items-center gap-2 px-6 shrink-0 z-10" style={{ background: "#C5B27A" }}>
        <Radio className="w-3.5 h-3.5" style={{ color: "#1E1E1E" }} strokeWidth={2.25} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#1E1E1E" }}>
          VITORRA NEWS
        </span>
      </div>

      <div className="marquee-mask relative overflow-hidden flex-1 py-3">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1}>
              {headlines.map((h, i) => (
                <div key={`${copy}-${i}`} className="flex items-center px-8 shrink-0">
                  <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)" }}>{h.title}</span>
                  <span aria-hidden="true" className="ml-8 w-1 h-1 rotate-45 shrink-0" style={{ background: "#C5B27A", opacity: 0.7 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KioskTicker() {
  return (
    <div className="shrink-0 flex flex-col">
      <CertMarquee />
      <NewsTicker />
    </div>
  );
}
