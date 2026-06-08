"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/reveal";

/* ─── Digit-scramble hook ────────────────────────────────────────────────────
   Used by Stripe, Linear, and Rauno Fagerholm-style portfolios.
   When the element enters the viewport, digits cycle through random characters
   then lock left-to-right to the real value — creating a "resolving from chaos"
   moment that's far more satisfying than a plain count-up.

   Only the numeric characters scramble; suffixes (+, ×, h) are always static.
   Respects prefers-reduced-motion: snaps instantly, no scramble.
   ─────────────────────────────────────────────────────────────────────────── */
const GLYPHS = "0123456789";

function useScramble(numeric: string, delayMs = 0) {
  const [output, setOutput] = useState(() => numeric.replace(/./g, "0"));
  const [locked, setLocked] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  const run = useCallback(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setOutput(numeric); setLocked(true); return; }

    const TOTAL_FRAMES = 16;   // total iterations before fully locked
    const FRAME_MS     = 55;   // ms per frame  →  ~880ms total
    let frame = 0;

    const id = setInterval(() => {
      frame++;
      // Lock each digit left-to-right proportionally
      const lockCount = Math.floor((frame / TOTAL_FRAMES) * numeric.length);
      const chars = numeric.split("").map((ch, i) =>
        i < lockCount
          ? ch
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      );
      setOutput(chars.join(""));

      if (frame >= TOTAL_FRAMES) {
        clearInterval(id);
        setOutput(numeric);
        setLocked(true);
      }
    }, FRAME_MS);
  }, [numeric]);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          if (delayMs > 0) {
            setTimeout(run, delayMs);
          } else {
            run();
          }
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [run, delayMs]);

  return { output, locked, nodeRef };
}

/* ─── Data ───────────────────────────────────────────────────────────────── */

/* Numbers + suffixes are structural; labels/sub-labels come from translations. */
const STATS = [
  { numeric: "4",  suffix: "",  labelKey: "stat1Label", subKey: "stat1Sub" },
  { numeric: "6",  suffix: "+", labelKey: "stat2Label", subKey: "stat2Sub" },
  { numeric: "3",  suffix: "×", labelKey: "stat3Label", subKey: "stat3Sub" },
  { numeric: "24", suffix: "h", labelKey: "stat4Label", subKey: "stat4Sub" },
] as const;

type StatView = { numeric: string; suffix: string; label: string; sub: string };

/* ─── Individual stat card ───────────────────────────────────────────────── */

function StatCard({
  stat,
  index,
}: {
  stat: StatView;
  index: number;
}) {
  const { output, locked, nodeRef } = useScramble(
    stat.numeric,
    index * 120   // stagger start by 120ms per card
  );

  return (
    <Reveal delay={index * 70}>
      <div
        ref={nodeRef}
        className="stat-card relative flex flex-col items-center text-center p-8 md:p-10 overflow-hidden h-full"
      >
        {/* Gold orb — radial glow sits behind the number */}
        <div aria-hidden="true" className="stat-orb" />

        {/* Scrambling / locked number */}
        <div
          className="relative z-10"
          style={{
            fontFamily:
              "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "clamp(52px, 6vw, 88px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            /* Subtle monospace-width trick: tabular-nums keeps the layout stable
               while digits scramble so the card doesn't resize each frame.     */
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {/* Scrambling digit(s) */}
          <span
            style={{
              color: locked ? "#1E1E1E" : "#555555",
              transition: "color 0.3s ease",
            }}
          >
            {output}
          </span>
          {/* Static suffix — gold always */}
          {stat.suffix && (
            <span style={{ color: "#C5B27A" }}>{stat.suffix}</span>
          )}
        </div>

        {/* Gold line — draws in left→right when the scramble locks */}
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 2,
            marginTop: 18,
            marginBottom: 16,
            background: "linear-gradient(90deg, #C5B27A 0%, #D4C49A 100%)",
            borderRadius: 999,
            transformOrigin: "left center",
            /* Only animate after locking so the line doesn't appear mid-scramble */
            animation: locked
              ? "line-draw 0.7s cubic-bezier(0.22,1,0.36,1) both"
              : "none",
            opacity: locked ? 1 : 0,
          }}
        />

        {/* Label */}
        <div
          className="relative z-10"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "#1E1E1E",
          }}
        >
          {stat.label}
        </div>

        {/* Sub-label */}
        <div
          className="mt-2 relative z-10"
          style={{
            fontSize: "12px",
            color: "#AAAAAA",
            lineHeight: 1.55,
          }}
        >
          {stat.sub}
        </div>
      </div>
    </Reveal>
  );
}

/* ─── Section ─────────────────────────────────────────────────────────────── */

export default function StatsBand() {
  const t = useTranslations("statsBand");
  return (
    <section
      className="section-padding relative overflow-hidden"
      style={{
        /* Warm radial gradient — white centre fades to ivory at the edges.
           Subtle but far more interesting than flat white.                 */
        background:
          "radial-gradient(ellipse at 50% 40%, #FFFFFF 0%, #F7F4F0 100%)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Large faint gold circle — decorative depth layer */}
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none overflow-hidden"
        style={{
          width: 700,
          height: 700,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          border: "1px solid rgba(197,178,122,0.07)",
        }}
      />

      <div className="container-max relative z-10">
        {/* Header */}
        <Reveal className="text-center mb-12 md:mb-16">
          <span className="eyebrow block mb-3">{t("eyebrow")}</span>
          <h2
            style={{
              fontFamily:
                "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(28px, 3.5vw, 50px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              color: "#1E1E1E",
            }}
          >
            {t("titleLead")}{" "}
            <span style={{ color: "#C5B27A" }}>{t("titleAccent")}</span>
          </h2>
        </Reveal>

        {/* Card grid — 1 col mobile · 2 col tablet · 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {STATS.map((s, i) => (
            <StatCard
              key={s.labelKey}
              stat={{ numeric: s.numeric, suffix: s.suffix, label: t(s.labelKey), sub: t(s.subKey) }}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
