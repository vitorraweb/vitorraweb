"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/* ─── Certifications ──────────────────────────────────────────────────────────
   Dark trust section adapting the fintech "compliance credential card" pattern
   (Wise / Revolut / Stripe): a premium official-registration card showing the
   real incorporation details — verified seal, mono registration number, detail
   grid, and a live "Active & Compliant" status pill. The card tilts subtly to
   the cursor (desktop only, reduced-motion safe).
   ─────────────────────────────────────────────────────────────────────────── */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}
        className="mb-1.5"
      >
        {label}
      </p>
      <p style={{ fontSize: "13.5px", lineHeight: 1.5, color: "rgba(255,255,255,0.82)" }}>{value}</p>
    </div>
  );
}

export default function Certifications() {
  const cardRef = useRef<HTMLDivElement>(null);
  const cur = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const apply = () => {
      const { x, y } = cur.current;
      el.style.transform = `translate3d(0,0,0) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4.5).toFixed(2)}deg)`;
    };
    const loop = () => {
      const t = target.current;
      const c = cur.current;
      c.x += (t.x - c.x) * 0.12;
      c.y += (t.y - c.y) * 0.12;
      apply();
      if (Math.abs(t.x - c.x) > 0.001 || Math.abs(t.y - c.y) > 0.001) {
        raf.current = requestAnimationFrame(loop);
      } else {
        raf.current = 0;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.current = {
        x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
      };
      start();
    };
    const leave = () => {
      target.current = { x: 0, y: 0 };
      start();
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section className="section-padding relative overflow-hidden" style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}>
      {/* Ghost watermark */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none z-0"
      >
        <span
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: "clamp(80px, 12vw, 160px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "rgba(255,255,255,0.03)",
            paddingLeft: "clamp(24px, 5vw, 80px)",
            whiteSpace: "nowrap",
          }}
        >
          Trust
        </span>
      </div>

      <div className="container-max relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left — copy */}
        <Reveal>
          <span className="eyebrow-light mb-5 inline-flex">Verified &amp; Certified</span>
          <h2 className="mb-4 max-w-md" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#FFFFFF" }}>
            Officially registered.<br />Independently trusted.
          </h2>
          <p className="mb-8 max-w-md" style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
            Vitorra Holdings Limited is a registered Ugandan company, backed by
            verified certifications, lab results, and third-party validations
            across every product line.
          </p>
          <Link href="/trust/certifications" className="btn-ghost-dark inline-flex items-center gap-2">
            View Certifications
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Reveal>

        {/* Right — official registration credential card */}
        <Reveal delay={120}>
          <div style={{ perspective: "1100px" }}>
            <div
              ref={cardRef}
              className="relative rounded-[28px] p-7 md:p-9 overflow-hidden will-change-transform"
              style={{
                background: "linear-gradient(160deg, #262626 0%, #1a1a1a 100%)",
                border: "1px solid rgba(197,178,122,0.28)",
                boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
                transition: "transform 0.3s ease-out",
              }}
            >
              {/* Gold corner glow */}
              <div
                aria-hidden="true"
                className="absolute -top-16 -right-16 w-44 h-44 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(197,178,122,0.18) 0%, transparent 70%)" }}
              />

              {/* Header */}
              <div className="flex items-center gap-3 mb-6 relative">
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
                  style={{ background: "rgba(197,178,122,0.14)", border: "1px solid rgba(197,178,122,0.5)" }}
                >
                  <ShieldCheck className="w-5 h-5" style={{ color: "#C5B27A" }} />
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#C5B27A" }}>
                    Republic of Uganda
                  </p>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Official Registration</p>
                </div>
                <span
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0"
                  style={{ background: "rgba(111,191,142,0.12)", border: "1px solid rgba(111,191,142,0.4)" }}
                >
                  <span className="status-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#6FBF8E" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#8FD3AE" }}>Active &amp; Compliant</span>
                </span>
              </div>

              <div className="h-px w-full mb-6" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* Certificate number */}
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }} className="mb-2">
                Certificate of Incorporation
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono, ui-monospace, monospace)",
                  fontSize: "clamp(22px, 2.6vw, 30px)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "#FFFFFF",
                }}
                className="mb-2"
              >
                80034340923220
              </p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                Incorporated under the Companies Act, 2012
              </p>

              <div className="h-px w-full my-6" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* Detail grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Detail label="Issuing Authority" value="Uganda Registration Services Bureau (URSB)" />
                <Detail label="Jurisdiction" value="Kampala, Uganda · East African Community" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
