"use client";

import Image from "next/image";
import { useKioskClock, useKioskFx, useKioskWeather, useRotation, weatherEntry } from "@/lib/kiosk";

/* ─── The header ───────────────────────────────────────────────────────────
   Brand on the left, the ambient facts on the right, and a hairline under
   both. The clock lost its ticking seconds: a figure changing once a second
   pulls the eye away from the film all day, and nobody in a lobby needs the
   second. The forecast is three days rather than five — five columns of the
   same Kampala cloud icon read as placeholder data.
   ─────────────────────────────────────────────────────────────────────────── */

const IDENTITY_SLIDES = [
  "Innovative products and dependable solutions across fuel technology, healthcare, premium coffee, and logistics.",
  "A diversified holdings company registered in Uganda, bringing international-standard products to East Africa — and East African products to the world.",
] as const;

function IdentityRotator() {
  const index = useRotation(IDENTITY_SLIDES.length, 11000);
  return (
    <p
      key={index}
      className="hero-enter mt-2 max-w-[54ch] leading-snug"
      style={{ fontSize: 13.5, color: "rgba(255,255,255,0.58)" }}
    >
      {IDENTITY_SLIDES[index]}
    </p>
  );
}

function FxChip({ code, ugx }: { code: string; ugx: number | null }) {
  return (
    <div className="flex items-baseline gap-2 shrink-0">
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(197,178,122,0.9)" }}>{code}</span>
      <span className="font-numeric" style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
        {ugx ? Math.round(ugx).toLocaleString("en-UG") : "—"}
      </span>
    </div>
  );
}

export function KioskTopBar() {
  const { time, date } = useKioskClock();
  const weather = useKioskWeather();
  const fx = useKioskFx();
  const now = weatherEntry(weather.code);
  const NowIcon = now.icon;

  return (
    <header className="relative z-20 shrink-0 px-10 lg:px-14 pt-8 pb-5">
      <div className="flex items-start justify-between gap-10">
        {/* Brand lockup */}
        <div className="flex items-start gap-5 min-w-0">
          <Image
            src="/logo.png"
            alt="Vitorra Holdings"
            width={60}
            height={60}
            className="shrink-0 rounded-full"
            style={{ boxShadow: "0 0 0 1px rgba(197,178,122,0.55), 0 0 28px rgba(197,178,122,0.16)" }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-3.5">
              <span
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: 30,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  lineHeight: 1,
                  color: "#FFFFFF",
                }}
              >
                Vitorra Holdings
              </span>
              <span className="h-4 w-px" style={{ background: "rgba(197,178,122,0.45)" }} />
              <span className="flex items-center gap-1.5">
                <span className="status-dot w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#6FBF8E" }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.62)" }}>
                  RECEPTION
                </span>
              </span>
            </div>
            <IdentityRotator />
          </div>
        </div>

        {/* Time, conditions, rates */}
        <div className="text-right shrink-0">
          <div
            className="font-numeric"
            style={{ fontSize: "clamp(38px, 3.6vw, 56px)", fontWeight: 200, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1 }}
          >
            {time}
          </div>
          <div className="mt-2" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
            {date}
          </div>

          <div className="mt-4 flex items-center justify-end gap-5">
            {/* Today */}
            <div className="flex items-center gap-2.5">
              <NowIcon className="w-5 h-5 shrink-0" style={{ color: "#C5B27A" }} strokeWidth={1.5} />
              <span className="font-numeric" style={{ fontSize: 19, fontWeight: 500, color: "#FFFFFF", lineHeight: 1 }}>
                {weather.tempNow !== null ? `${weather.tempNow}°` : "—"}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Kampala · {now.label}</span>
            </div>

            {/* Next three days */}
            <div className="flex items-center gap-3.5 pl-5" style={{ borderLeft: "1px solid rgba(255,255,255,0.14)" }}>
              {(weather.days.length ? weather.days.slice(1, 4) : Array<undefined>(3).fill(undefined)).map((d, i) => {
                const Icon = weatherEntry(d?.code ?? null).icon;
                return (
                  <div key={i} className="flex items-center gap-1.5 shrink-0">
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.38)" }}>
                      {d ? d.label.toUpperCase() : "—"}
                    </span>
                    <Icon className="w-3.5 h-3.5" style={{ color: "rgba(197,178,122,0.75)" }} strokeWidth={1.75} />
                    <span className="font-numeric" style={{ fontSize: 12, color: "rgba(255,255,255,0.68)" }}>
                      {d ? `${d.hi}°` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Indicative rates */}
            <div className="flex items-center gap-4 pl-5" style={{ borderLeft: "1px solid rgba(255,255,255,0.14)" }}>
              <FxChip code="USD" ugx={fx.ugxPerUsd} />
              <FxChip code="EUR" ugx={fx.ugxPerEur} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 h-px" style={{ background: "linear-gradient(90deg, rgba(197,178,122,0.38) 0%, rgba(197,178,122,0.10) 45%, rgba(255,255,255,0) 100%)" }} />
    </header>
  );
}
