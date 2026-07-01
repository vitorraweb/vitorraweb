"use client";

import Image from "next/image";
import {
  useKioskClock,
  useKioskFx,
  useKioskWeather,
  useRotation,
  weatherEntry,
} from "@/lib/kiosk";

/* ─── Vision / mission rotator ────────────────────────────────────────────── */
const IDENTITY_SLIDES = [
  {
    eyebrow: "Our mission",
    body: "Innovative products and dependable solutions across fuel technology, healthcare, premium coffee, and logistics — for Uganda, East Africa, and international markets.",
  },
  {
    eyebrow: "Who we are",
    body: "A diversified holdings company registered in Uganda (URSB), bringing international-standard products to East Africa, and East African products to the world.",
  },
] as const;

function IdentityRotator() {
  const index = useRotation(IDENTITY_SLIDES.length, 9000);
  const slide = IDENTITY_SLIDES[index];

  return (
    <div key={index} className="hero-enter max-w-xl">
      <span className="eyebrow-light">{slide.eyebrow}</span>
      <p
        className="mt-1 leading-snug"
        style={{ fontSize: 14, color: "rgba(255,255,255,0.68)" }}
      >
        {slide.body}
      </p>
    </div>
  );
}

/* ─── FX chip ──────────────────────────────────────────────────────────────── */
function FxChip({ code, ugx }: { code: string; ugx: number | null }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#C5B27A" }}>{code}</span>
      <span className="font-numeric" style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
        {ugx ? `UGX ${Math.round(ugx).toLocaleString("en-UG")}` : "—"}
      </span>
    </div>
  );
}

/* ─── Top bar — identity, live clock, weather + FX strip ─────────────────── */
export function KioskTopBar() {
  const { time, date } = useKioskClock();
  const weather = useKioskWeather();
  const fx = useKioskFx();
  const now = weatherEntry(weather.code);
  const NowIcon = now.icon;

  return (
    <header className="relative z-20 shrink-0 px-8 lg:px-12 pt-7 pb-5">
      <div className="flex items-start justify-between gap-8">
        {/* Left: brand identity + rotating mission/who-we-are line */}
        <div className="flex items-center gap-4 min-w-0">
          <Image
            src="/logo.png"
            alt="Vitorra Holdings"
            width={52}
            height={52}
            className="shrink-0 rounded-full"
            style={{ boxShadow: "0 0 0 2px rgba(197,178,122,0.4)" }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                }}
              >
                Vitorra Holdings
              </span>
              <span aria-hidden="true" className="w-1 h-1 rounded-full" style={{ background: "#C5B27A" }} />
              <span className="status-dot w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#6FBF8E" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(111,191,142,0.9)" }}>
                RECEPTION
              </span>
            </div>
            <IdentityRotator />
          </div>
        </div>

        {/* Right: live clock + date */}
        <div className="text-right shrink-0">
          <div
            className="font-numeric"
            style={{ fontSize: "clamp(30px, 3vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1 }}
          >
            {time}
          </div>
          <div className="mt-1.5" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            {date}
          </div>
        </div>
      </div>

      {/* Weather + FX strip */}
      <div className="mt-6 flex items-center gap-5 overflow-x-auto no-scrollbar">
        {/* Current conditions — Kampala, HQ */}
        <div className="flex items-center gap-2.5 pr-5 shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.12)" }}>
          <NowIcon className="w-6 h-6" style={{ color: "#C5B27A" }} strokeWidth={1.75} />
          <div>
            <div className="font-numeric" style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>
              {weather.tempNow !== null ? `${weather.tempNow}°C` : "—"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              Kampala · {now.label}
            </div>
          </div>
        </div>

        {/* 5-day forecast pills */}
        <div className="flex items-center gap-4 shrink-0">
          {(weather.days.length ? weather.days : Array<undefined>(5).fill(undefined)).map((d, i) => {
            const dayEntry = weatherEntry(d?.code ?? null);
            const Icon = dayEntry.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 46 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "rgba(255,255,255,0.45)" }}>
                  {d ? d.label.toUpperCase() : "—"}
                </span>
                <Icon className="w-4 h-4" style={{ color: "rgba(197,178,122,0.85)" }} strokeWidth={1.75} />
                <span className="font-numeric" style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                  {d ? `${d.hi}°/${d.lo}°` : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Indicative FX, anchored right */}
        <div className="ml-auto flex items-center gap-2.5 shrink-0">
          <FxChip code="USD→UGX" ugx={fx.ugxPerUsd} />
          <FxChip code="EUR→UGX" ugx={fx.ugxPerEur} />
        </div>
      </div>
    </header>
  );
}
