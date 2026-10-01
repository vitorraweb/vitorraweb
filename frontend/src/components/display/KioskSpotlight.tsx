"use client";

import { useEffect, useRef } from "react";
import { Fuel, Syringe, Coffee, Truck, type LucideIcon } from "lucide-react";
import { useRotation } from "@/lib/kiosk";

/* ─── Sector spotlight data ────────────────────────────────────────────────
   The kiosk rotates through all four business lines, and plays the brand film
   belonging to whichever line is on screen: the FET film (fet-hero.mp4) and the
   SEAL film (seal-hero.mp4) — the same assets used on the product page heroes.
   Coffee and Logistics have no footage of their own yet, so they borrow the FET
   film; drop in `coffee-hero.mp4` / `logistics-hero.mp4` and point `film` at a
   new entry in FILMS to give them their own.

   Every film is mounted at once and cross-faded, so a sector change never shows
   a black frame while a video buffers. Only the visible one plays — the rest are
   paused, because this runs all day on modest front-desk hardware.
   ─────────────────────────────────────────────────────────────────────────── */
const FILMS = ["/videos/fet-hero.mp4", "/videos/seal-hero.mp4"] as const;

const SECTORS: { icon: LucideIcon; tag: string; film: number; headline: string; accent: string; body: string; stat?: string; statLabel?: string }[] = [
  {
    icon: Fuel,
    tag: "Fuel Eco Tech",
    film: 0,
    headline: "A verified",
    accent: "13.9% fuel reduction",
    body: "Independently tested by CTI GmbH, Germany — VW T5 fleet, November 2025.",
    stat: "13.9%",
    statLabel: "Measured fuel cut",
  },
  {
    icon: Syringe,
    tag: "SEAL Wound Spray",
    film: 1,
    headline: "FDA-cleared,",
    accent: "field-proven hemostatic care",
    body: "Chitosan-based rapid bleeding control — field-deployed with Maryland EMS.",
    stat: "36",
    statLabel: "Month shelf life",
  },
  {
    icon: Coffee,
    tag: "Vitorra Coffee",
    film: 0,
    headline: "Ugandan coffee,",
    accent: "graded and exported at origin",
    body: "Farm-direct sourcing across Uganda's highlands, held to export standard.",
  },
  {
    icon: Truck,
    tag: "Logistics",
    film: 0,
    headline: "Dependable freight,",
    accent: "port to door across East Africa",
    body: "Warehousing, customs clearance, and delivery for B2B partners regionwide.",
  },
];

const ROTATE_MS = 7000;

export function KioskSpotlight() {
  const index = useRotation(SECTORS.length, ROTATE_MS);
  const active = SECTORS[index];
  const Icon = active.icon;
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  /* Play only the film on screen; leave the others paused and ready. */
  useEffect(() => {
    videos.current.forEach((el, i) => {
      if (!el) return;
      if (i === active.film) {
        void el.play().catch(() => {
          /* A browser that blocks autoplay still shows the frame — no action. */
        });
      } else {
        el.pause();
      }
    });
  }, [active.film]);

  return (
    <div className="card-stadium relative h-full overflow-hidden" style={{ backgroundColor: "#111111" }}>
      {/* Brand films — cross-faded, only the active one playing */}
      {FILMS.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            videos.current[i] = el;
          }}
          src={src}
          autoPlay={i === 0}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === active.film ? 1 : 0 }}
        />
      ))}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.35) 100%)" }}
      />
      <div aria-hidden="true" className="hero-aurora-right" />
      <div aria-hidden="true" className="hero-grain" />

      {/* Rotating sector tag — top-left */}
      <div key={`tag-${index}`} className="hero-enter absolute top-7 left-8 flex items-center gap-2.5">
        <span className="status-dot w-2 h-2 rounded-full" style={{ background: "#C5B27A" }} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#C5B27A", textTransform: "uppercase" }}>
          {active.tag}
        </span>
      </div>

      {/* Caption block — bottom-left, cross-fades on rotation */}
      <div key={index} className="hero-enter absolute left-8 md:left-10 bottom-24 right-10 md:right-1/3 z-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(197,178,122,0.16)", border: "1px solid rgba(197,178,122,0.4)" }}
          >
            <Icon className="w-4 h-4" style={{ color: "#C5B27A" }} strokeWidth={1.75} />
          </div>
          {active.stat && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-numeric" style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {active.stat}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{active.statLabel}</span>
            </div>
          )}
        </div>
        <h2
          style={{
            fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "clamp(24px, 2.6vw, 38px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            color: "#FFFFFF",
          }}
        >
          {active.headline} <span className="text-gold-gradient">{active.accent}</span>
        </h2>
        <p className="mt-2.5 max-w-lg" style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
          {active.body}
        </p>
      </div>

      {/* Sector pill strip — bottom, always visible */}
      <div className="absolute left-8 md:left-10 right-8 md:right-10 bottom-7 z-10 flex items-center gap-2.5">
        {SECTORS.map((s, i) => {
          const SIcon = s.icon;
          const isActive = i === index;
          return (
            <div
              key={s.tag}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all duration-500"
              style={{
                background: isActive ? "#C5B27A" : "rgba(255,255,255,0.08)",
                border: isActive ? "1px solid #C5B27A" : "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <SIcon className="w-3.5 h-3.5" style={{ color: isActive ? "#1E1E1E" : "rgba(255,255,255,0.7)" }} strokeWidth={2} />
              <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#1E1E1E" : "rgba(255,255,255,0.7)" }}>
                {s.tag}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
