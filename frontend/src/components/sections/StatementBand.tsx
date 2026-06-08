"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { CountUp } from "@/components/ui/count-up";

/* ─── Statement band ──────────────────────────────────────────────────────────
   Full-bleed dark "purpose" moment between Portfolio and Why Vitorra.
   Apple/Stripe-style kinetic treatment:
   - headline lines mask-reveal (slide up from behind a clip) on scroll-in
   - a count-up proof strip gives the statement substance
   - layered parallax + cinematic vignette + gold-rule eyebrow for depth

   Background is data-driven (see `image`); falls back to a premium gradient.
   Honours prefers-reduced-motion (everything renders settled, no motion).
   ─────────────────────────────────────────────────────────────────────────── */

const STATS = [
  { end: 4, suffix: "", labelKey: "stat1Label" },
  { end: 3, suffix: "", labelKey: "stat2Label" },
  { end: 24, suffix: "h", labelKey: "stat3Label" },
] as const;

export default function StatementBand({ image }: { image?: string }) {
  const t = useTranslations("statementBand");
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Mask-reveal for a headline line.
  const line = (delay: number): React.CSSProperties => ({
    display: "block",
    paddingBottom: "0.12em",
    transform: inView ? "translateY(0)" : "translateY(115%)",
    transition: `transform 0.95s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  });
  // Soft fade-rise for everything else.
  const fade = (delay: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  });

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ backgroundColor: "#161616" }}>
      {/* ── Background ─────────────────────────────────────────────────────── */}
      {image ? (
        <>
          <div className="absolute inset-0">
            <ParallaxImage src={image} alt="" className="w-full h-full" interactive={false} amount={60} sizes="100vw" />
          </div>
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.74) 100%)" }}
          />
          {/* Cinematic vignette — darkens the rim, focuses the centre */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.55) 100%)" }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 24% 18%, rgba(197,178,122,0.16) 0%, transparent 55%), linear-gradient(160deg, #181818 0%, #242424 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
            <span className="ghost-text-dark" style={{ paddingLeft: "clamp(24px, 5vw, 80px)", whiteSpace: "nowrap" }}>
              Vitorra
            </span>
          </div>
        </>
      )}

      {/* ── Content — centred ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center" style={{ minHeight: "74vh" }}>
        <div className="container-max w-full px-6 md:px-12 lg:px-20 text-center mx-auto py-24 md:py-28">
          {/* Eyebrow with flanking gold rules */}
          <div className="flex items-center justify-center gap-3 mb-7" style={fade(0)}>
            <span
              className="h-px w-8"
              style={{
                background: "#C5B27A",
                transformOrigin: "right",
                transform: inView ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 0.7s ease 0.15s",
              }}
            />
            <span
              style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C5B27A" }}
            >
              {t("eyebrow")}
            </span>
            <span
              className="h-px w-8"
              style={{
                background: "#C5B27A",
                transformOrigin: "left",
                transform: inView ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 0.7s ease 0.15s",
              }}
            />
          </div>

          {/* Kinetic headline — lines mask-reveal */}
          <h2
            className="mx-auto max-w-3xl"
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(32px, 4.4vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              color: "#FFFFFF",
            }}
          >
            <span className="block overflow-hidden">
              <span style={line(180)}>{t("line1")}</span>
            </span>
            <span className="block overflow-hidden">
              <span className="text-gold-gradient" style={line(300)}>
                {t("line2")}
              </span>
            </span>
          </h2>

          <p
            className="mx-auto max-w-xl mt-7"
            style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.62)", ...fade(520) }}
          >
            {t("body")}
          </p>

          {/* Count-up proof strip */}
          <div className="mt-12 md:mt-14 flex flex-wrap items-center justify-center" style={fade(680)}>
            {STATS.map((s, i) => (
              <div key={s.labelKey} className="flex items-center">
                {i > 0 && (
                  <span
                    className="hidden sm:block mx-8 lg:mx-12"
                    style={{ width: "1px", height: "44px", background: "rgba(255,255,255,0.16)" }}
                  />
                )}
                <div className="px-5 sm:px-0 text-center">
                  <div
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "clamp(34px, 4vw, 52px)",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    <CountUp end={s.end} suffix={s.suffix} start={inView} className="text-gold-gradient" />
                  </div>
                  <div
                    className="mt-2"
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {t(s.labelKey)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
