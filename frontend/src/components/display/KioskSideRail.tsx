"use client";

import Image from "next/image";
import { MapPin, BadgeCheck } from "lucide-react";
import { useKioskScramble, useRotation } from "@/lib/kiosk";

/* ─── Corner bracket — luxury editorial framing (matches FinalCTA's motif) ── */
function CornerBracket({ position }: { position: "tl" | "br" }) {
  const S = 40;
  const G = 2;
  const d = position === "tl" ? `M${S} ${G} L${G} ${G} L${G} ${S}` : `M${G} ${S - G} L${S - G} ${S - G} L${S - G} ${G}`;
  const pos = position === "tl" ? "top-4 left-4" : "bottom-4 right-4";
  return (
    <svg aria-hidden="true" className={`absolute ${pos} pointer-events-none`} width={S} height={S} fill="none">
      <path d={d} stroke="rgba(197,178,122,0.85)" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

/* ─── Certifications — auto-cycling highlight (no hover on a kiosk) ───────── */
const CERTS = [
  { code: "ISO 9001:2015", label: "Quality management" },
  { code: "ISO 14001:2015", label: "Environmental management" },
  { code: "ISO 27001", label: "Information security" },
  { code: "Zurich Insurance", label: "Product liability" },
  { code: "AVL Technologies", label: "Lab validated" },
  { code: "qm-solutions GmbH", label: "German certified" },
] as const;

function CertificationsCard() {
  const active = useRotation(CERTS.length, 2600);

  return (
    <div className="rounded-[28px] p-5 flex-1 flex flex-col min-h-0" style={{ background: "#FAFAF8", border: "1px solid rgba(197,178,122,0.16)" }}>
      <div className="flex items-center gap-2 mb-3.5 shrink-0">
        <BadgeCheck className="w-4 h-4" style={{ color: "#7A6020" }} strokeWidth={2} />
        <span className="eyebrow">Independently certified</span>
      </div>
      <div className="flex flex-col gap-1 overflow-hidden">
        {CERTS.map((c, i) => {
          const isActive = i === active;
          return (
            <div
              key={c.code}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-500"
              style={{
                borderLeft: isActive ? "2px solid rgba(197,178,122,0.75)" : "2px solid transparent",
                background: isActive ? "rgba(197,178,122,0.09)" : "transparent",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E1E1E" }}>{c.code}</span>
              <span style={{ fontSize: 11, color: "#8A8A8A" }}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Rotating headline stat — digit-scramble on change ───────────────────── */
const STATS = [
  { numeric: "13.9", suffix: "%", label: "Verified fuel reduction", sub: "CTI GmbH, Germany · Nov 2025" },
  { numeric: "6", suffix: "", label: "Independent certifications", sub: "ISO · Zurich · AVL · qm-solutions" },
  { numeric: "36", suffix: "", label: "Month shelf life — SEAL", sub: "Room-temperature stable · MIL-STD-810H tested" },
] as const;

function StatSpotlightCard() {
  const index = useRotation(STATS.length, 6500);
  const stat = STATS[index];
  const output = useKioskScramble(stat.numeric);

  return (
    <div
      className="stat-card relative overflow-hidden px-6 py-5 shrink-0"
      style={{ borderRadius: 28 }}
    >
      <div aria-hidden="true" className="stat-orb" />
      <div className="relative z-10 font-numeric flex items-baseline gap-1">
        <span style={{ fontSize: "clamp(34px, 3vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#1E1E1E" }}>
          {output}
        </span>
        {stat.suffix && <span style={{ fontSize: "clamp(20px, 2vw, 28px)", fontWeight: 800, color: "#C5B27A" }}>{stat.suffix}</span>}
      </div>
      <div className="relative z-10 mt-1.5" style={{ fontSize: 12.5, fontWeight: 700, color: "#1E1E1E" }}>
        {stat.label}
      </div>
      <div className="relative z-10 mt-0.5" style={{ fontSize: 11, color: "#999999" }}>
        {stat.sub}
      </div>
    </div>
  );
}

/* ─── Side rail — HQ photo, certifications, rotating stat ─────────────────── */
export function KioskSideRail() {
  return (
    <div className="h-full flex flex-col gap-4 w-full lg:w-[360px] shrink-0">
      {/* HQ photo */}
      <div className="relative rounded-[28px] overflow-hidden shrink-0" style={{ height: "34%" }}>
        <Image
          src="/hero/about-hq.jpg"
          alt="Vitorra Holdings HQ — Padre Pio House, Kampala"
          fill
          sizes="360px"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.25) 100%)" }}
        />
        <CornerBracket position="tl" />
        <CornerBracket position="br" />
        <div className="absolute left-4 bottom-3.5 right-4 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#C5B27A" }} strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF" }}>Padre Pio House, Kampala — HQ</span>
        </div>
      </div>

      <CertificationsCard />
      <StatSpotlightCard />
    </div>
  );
}
