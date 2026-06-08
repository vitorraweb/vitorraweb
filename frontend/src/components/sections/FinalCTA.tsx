"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/* ─── Magnetic primary button ────────────────────────────────────────────────
   Eases toward the cursor on desktop (pointer:fine) only.
   Falls back to a static button on touch / reduced-motion.
   ─────────────────────────────────────────────────────────────────────────── */
function MagneticButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const zone = useRef<HTMLSpanElement>(null);
  const move = useRef<HTMLSpanElement>(null);
  const cur  = useRef({ x: 0, y: 0 });
  const tgt  = useRef({ x: 0, y: 0 });
  const raf  = useRef(0);

  useEffect(() => {
    const z = zone.current;
    const m = move.current;
    if (!z || !m) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const loop = () => {
      const c = cur.current;
      const t = tgt.current;
      c.x += (t.x - c.x) * 0.18;
      c.y += (t.y - c.y) * 0.18;
      m.style.transform = `translate3d(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px,0)`;
      if (Math.abs(t.x - c.x) > 0.01 || Math.abs(t.y - c.y) > 0.01) {
        raf.current = requestAnimationFrame(loop);
      } else {
        raf.current = 0;
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = z.getBoundingClientRect();
      tgt.current = {
        x: ((e.clientX - (r.left + r.width / 2))  / (r.width  / 2)) * 14,
        y: ((e.clientY - (r.top  + r.height / 2)) / (r.height / 2)) * 14,
      };
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      tgt.current = { x: 0, y: 0 };
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };
    z.addEventListener("pointermove", onMove);
    z.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf.current);
      z.removeEventListener("pointermove", onMove);
      z.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <span ref={zone} className="inline-block p-4 -m-4">
      <span ref={move} className="inline-block will-change-transform">
        <Link href={href} className="btn-primary">
          {children}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </span>
    </span>
  );
}

/* ─── Corner bracket ─────────────────────────────────────────────────────────
   L-shaped SVG lines at each corner — a luxury editorial framing device.
   On a white background the gold reads crisply at higher opacity.
   ─────────────────────────────────────────────────────────────────────────── */
function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const S = 56;
  const G = 2;

  const paths: Record<string, string> = {
    tl: `M${S} ${G} L${G} ${G} L${G} ${S}`,
    tr: `M${G} ${G} L${S} ${G} L${S} ${S}`,
    bl: `M${S} ${S - G} L${G} ${S - G} L${G} ${G}`,
    br: `M${G} ${S - G} L${S - G} ${S - G} L${S - G} ${G}`,
  };

  const pos: Record<string, string> = {
    tl: "top-8 left-8 md:top-12 md:left-12",
    tr: "top-8 right-8 md:top-12 md:right-12",
    bl: "bottom-8 left-8 md:bottom-12 md:left-12",
    br: "bottom-8 right-8 md:bottom-12 md:right-12",
  };

  return (
    <svg
      aria-hidden="true"
      className={`absolute ${pos[position]} pointer-events-none`}
      width={S} height={S} fill="none"
    >
      <path
        d={paths[position]}
        stroke="rgba(197,178,122,0.65)"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface FinalCTAProps {
  eyebrow?:        string;
  titleLead?:      string;
  titleAccent?:    string;
  body?:           string;
  primaryLabel?:   string;
  primaryHref?:    string;
  secondaryLabel?: string;
  secondaryHref?:  string;
  caption?:        string;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function FinalCTA({
  eyebrow,
  titleLead,
  titleAccent,
  body,
  primaryLabel,
  primaryHref    = "/enquire",
  secondaryLabel,
  secondaryHref  = "/contact",
  caption,
}: FinalCTAProps = {}) {
  // Defaults come from translations; explicit props (passed by other pages)
  // override them with their own already-translated copy.
  const t = useTranslations("finalCta");
  const _eyebrow        = eyebrow        ?? t("eyebrow");
  const _titleLead      = titleLead      ?? t("titleLead");
  const _titleAccent    = titleAccent    ?? t("titleAccent");
  const _body           = body           ?? t("body");
  const _primaryLabel   = primaryLabel   ?? t("primaryLabel");
  const _secondaryLabel = secondaryLabel ?? t("secondaryLabel");
  const _caption        = caption        ?? t("caption");

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: "#FFFFFF",
        /* Hairline separator from the section above */
        boxShadow: "inset 0 1px 0 rgba(0,0,0,0.07)",
        paddingTop:    "clamp(80px, 10vw, 140px)",
        paddingBottom: "clamp(80px, 10vw, 140px)",
        paddingLeft:   "clamp(24px, 5vw, 80px)",
        paddingRight:  "clamp(24px, 5vw, 80px)",
      }}
    >
      {/* ── Gold aurora blobs — re-tuned for white background ─────────────────
          On white, blurred gold radial gradients read as warm amber glows —
          like natural studio light warming the canvas. Opacity is raised vs
          the dark version so they stay visible against white.               */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", borderRadius: "50%",
          width: 720, height: 720,
          top: -260, left: -200,
          filter: "blur(90px)",
          opacity: 0.20,
          background: "radial-gradient(circle, rgba(197,178,122,0.7) 0%, transparent 65%)",
          animation: "cta-drift-1 20s ease-in-out infinite alternate",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute", borderRadius: "50%",
          width: 580, height: 580,
          bottom: -210, right: -170,
          filter: "blur(90px)",
          opacity: 0.14,
          background: "radial-gradient(circle, rgba(168,146,85,0.65) 0%, transparent 65%)",
          animation: "cta-drift-2 26s ease-in-out infinite alternate",
          pointerEvents: "none",
        }}
      />
      {/* Centre bloom — very subtle warm heart */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", borderRadius: "50%",
          width: 420, height: 420,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(80px)",
          opacity: 0.07,
          background: "radial-gradient(circle, rgba(197,178,122,0.6) 0%, transparent 68%)",
          animation: "cta-drift-1 34s ease-in-out infinite alternate-reverse",
          pointerEvents: "none",
        }}
      />

      {/* ── Grain — multiply blend works on light surfaces ────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
          opacity: 0.035,
          mixBlendMode: "multiply" as const,
          pointerEvents: "none",
        }}
      />

      {/* ── Inverted arc vectors — hang from the top centre ─────────────────
          Visible on white at higher opacity; gold reads clearly against the
          clean canvas. Mirrors the rising arcs in "Why Vitorra".            */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 pointer-events-none"
        style={{ transform: "translateX(-50%)" }}
      >
        {[200, 360, 540, 740, 960].map((d) => (
          <div
            key={d}
            className="absolute"
            style={{
              width:  d,
              height: d / 2,
              top:    0,
              left:   "50%",
              transform:    "translateX(-50%)",
              borderRadius: `0 0 ${d / 2}px ${d / 2}px`,
              border:    "1px solid rgba(197,178,122,0.13)",
              borderTop: "none",
            }}
          />
        ))}
      </div>

      {/* ── Corner bracket frames ─────────────────────────────────────────── */}
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />

      {/* ── Ghost watermark — dark ink on white ──────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none"
      >
        <span
          style={{
            fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
            fontSize:      "clamp(120px, 20vw, 300px)",
            fontWeight:    700,
            letterSpacing: "-0.04em",
            lineHeight:    1,
            /* On white: dark ink at ultra-low opacity reads as a subtle emboss */
            color:         "rgba(0,0,0,0.03)",
            whiteSpace:    "nowrap",
          }}
        >
          Vitorra
        </span>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="container-max relative z-10 text-center">
        <Reveal>
          {/* Eyebrow — gold dot + charcoal text (standard eyebrow class) */}
          <span className="eyebrow justify-center mb-5 inline-flex">
            {_eyebrow}
          </span>

          {/* Headline — dark Cormorant with gold gradient accent word */}
          <h2
            className="max-w-3xl mx-auto mb-6"
            style={{
              fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize:      "clamp(38px, 5.5vw, 72px)",
              fontWeight:    700,
              letterSpacing: "-0.025em",
              lineHeight:    1.06,
              color:         "#1E1E1E",
            }}
          >
            {_titleLead}{" "}
            <span className="text-gold-gradient">{_titleAccent}</span>
          </h2>

          {/* Body */}
          <p
            className="max-w-md mx-auto mb-11"
            style={{
              fontSize:   "16px",
              lineHeight: 1.78,
              color:      "#666666",
            }}
          >
            {_body}
          </p>

          {/* CTAs — primary gold / secondary charcoal outline */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <MagneticButton href={primaryHref}>{_primaryLabel}</MagneticButton>
            {/* btn-secondary: white bg + charcoal border — correct on light canvas */}
            <Link
              href={secondaryHref}
              className="btn-secondary inline-flex items-center gap-2"
            >
              {_secondaryLabel}
            </Link>
          </div>

          {/* Trust caption */}
          <p
            className="mt-11"
            style={{
              fontSize:      "11px",
              fontWeight:    600,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color:         "rgba(0,0,0,0.35)",
            }}
          >
            {_caption}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
