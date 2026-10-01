"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { useKioskScramble, useRotation } from "@/lib/kiosk";

/* ─── The rail ─────────────────────────────────────────────────────────────
   One continuous column of dark glass over the film, divided by hairlines —
   rather than a stack of separate cards in three different colours, which
   read as a dashboard sitting on top of the brand instead of part of it.

   Everything here is sized to be read from across a lobby, which is why the
   certifications show one at a time rather than a list of six: a 12px row is
   legible at a desk and invisible at four metres.
   ─────────────────────────────────────────────────────────────────────────── */

const CERTS = [
  { code: "ISO 9001:2015", label: "Quality management" },
  { code: "ISO 14001:2015", label: "Environmental management" },
  { code: "ISO 27001", label: "Information security" },
  { code: "Zurich Insurance", label: "Product liability" },
  { code: "AVL Technologies", label: "Lab validated" },
  { code: "qm-solutions GmbH", label: "German certified" },
] as const;

const STATS = [
  { numeric: "13.9", suffix: "%", label: "Verified fuel reduction", sub: "CTI GmbH, Germany · Nov 2025" },
  { numeric: "6", suffix: "", label: "Independent certifications", sub: "ISO · Zurich · AVL · qm-solutions" },
  { numeric: "36", suffix: "", label: "Month shelf life — SEAL", sub: "Room-temperature stable" },
] as const;

/* ─── Section label — a hairline rule and small caps, used on every module so
   the rail reads as one object with parts, not three unrelated boxes. ────── */
function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(197,178,122,0.95)" }}>
        {children}
      </span>
      <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(197,178,122,0.4), rgba(197,178,122,0))" }} />
    </div>
  );
}

/* ─── Certification spotlight — one at a time, large enough to read ──────── */
function CertificationSpotlight() {
  const active = useRotation(CERTS.length, 3400);
  const cert = CERTS[active];

  return (
    <div className="px-7 py-6 flex-1 flex flex-col justify-center min-h-0">
      <RailLabel>Independently certified</RailLabel>

      <div key={active} className="hero-enter">
        <div
          style={{
            fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 27,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            color: "#FFFFFF",
          }}
        >
          {cert.code}
        </div>
        <div className="mt-1" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.56)" }}>
          {cert.label}
        </div>
      </div>

      {/* Six marks — which one you are on, and that there are six of them */}
      <div className="mt-5 flex items-center gap-1.5">
        {CERTS.map((c, i) => (
          <span
            key={c.code}
            className="h-[3px] rounded-full transition-all duration-500"
            style={{
              width: i === active ? 22 : 10,
              background: i === active ? "#C5B27A" : "rgba(255,255,255,0.22)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Proof figure — the one number the room should leave with ───────────── */
function ProofStat() {
  const index = useRotation(STATS.length, 7600);
  const stat = STATS[index];
  const output = useKioskScramble(stat.numeric);

  return (
    <div className="px-7 py-6 flex-1 flex flex-col justify-center min-h-0">
      <RailLabel>Proven</RailLabel>
      <div key={index} className="hero-enter">
        <div className="font-numeric flex items-baseline gap-1.5">
          <span style={{ fontSize: "clamp(42px, 3.6vw, 62px)", fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1, color: "#FFFFFF" }}>
            {output}
          </span>
          {stat.suffix && (
            <span style={{ fontSize: "clamp(22px, 1.8vw, 30px)", fontWeight: 400, color: "#C5B27A" }}>{stat.suffix}</span>
          )}
        </div>
        <div className="mt-2.5" style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>
          {stat.label}
        </div>
        <div className="mt-0.5" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
          {stat.sub}
        </div>
      </div>
    </div>
  );
}

/* ─── Side rail ───────────────────────────────────────────────────────────── */
export function KioskSideRail() {
  return (
    <aside
      className="h-full w-full lg:w-[372px] shrink-0 flex flex-col overflow-hidden"
      style={{
        borderRadius: 28,
        background: "linear-gradient(180deg, rgba(20,20,20,0.72) 0%, rgba(14,14,14,0.80) 100%)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(197,178,122,0.22)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
      }}
    >
      {/* HQ plate — the building, not a stock photo of an office */}
      <div className="relative shrink-0" style={{ height: "38%", minHeight: 150 }}>
        <Image
          src="/hero/about-hq.jpg"
          alt="Vitorra Holdings HQ — Padre Pio House, Kampala"
          fill
          sizes="372px"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,10,10,0.95) 6%, rgba(10,10,10,0.15) 62%, rgba(10,10,10,0.35) 100%)" }}
        />
        <div className="absolute left-7 bottom-5 right-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#C5B27A" }} strokeWidth={2.25} />
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(197,178,122,0.95)" }}>
              Head office
            </span>
          </div>
          <div className="mt-1" style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>
            Padre Pio House, Kampala
          </div>
        </div>
      </div>

      <div className="h-px shrink-0" style={{ background: "rgba(197,178,122,0.18)" }} />
      <CertificationSpotlight />
      <div className="h-px shrink-0" style={{ background: "rgba(197,178,122,0.18)" }} />
      <ProofStat />
    </aside>
  );
}
