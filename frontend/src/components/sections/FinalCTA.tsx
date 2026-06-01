"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/* ─── Final CTA ───────────────────────────────────────────────────────────────
   Premium closing card (Linear / Stripe / Apple): dark stadium card with a slow
   drifting gold aurora, faint ghost watermark, a kinetic headline, and a
   MAGNETIC primary button that eases toward the cursor. Reduced-motion safe;
   magnetic effect is desktop-only.
   ─────────────────────────────────────────────────────────────────────────── */

function MagneticButton({ href, children }: { href: string; children: React.ReactNode }) {
  const zone = useRef<HTMLSpanElement>(null);
  const move = useRef<HTMLSpanElement>(null);
  const cur = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const z = zone.current;
    const m = move.current;
    if (!z || !m) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const apply = () => {
      m.style.transform = `translate3d(${cur.current.x.toFixed(2)}px, ${cur.current.y.toFixed(2)}px, 0)`;
    };
    const loop = () => {
      const t = target.current;
      const c = cur.current;
      c.x += (t.x - c.x) * 0.2;
      c.y += (t.y - c.y) * 0.2;
      apply();
      if (Math.abs(t.x - c.x) > 0.01 || Math.abs(t.y - c.y) > 0.01) {
        raf.current = requestAnimationFrame(loop);
      } else {
        raf.current = 0;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      const r = z.getBoundingClientRect();
      const relX = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const relY = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      target.current = { x: relX * 14, y: relY * 14 };
      start();
    };
    const onLeave = () => {
      target.current = { x: 0, y: 0 };
      start();
    };

    z.addEventListener("pointermove", onMove);
    z.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
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

export default function FinalCTA() {
  return (
    <section className="section-padding" style={{ backgroundColor: "#F2F2F2" }}>
      <Reveal className="container-max">
        <div
          className="relative overflow-hidden rounded-[36px] px-8 md:px-16 py-16 md:py-24 text-center"
          style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF" }}
        >
          {/* Drifting gold aurora */}
          <div aria-hidden="true" className="cta-aurora cta-aurora-1" />
          <div aria-hidden="true" className="cta-aurora cta-aurora-2" />

          {/* Ghost watermark */}
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
            <span
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(120px, 18vw, 260px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "rgba(255,255,255,0.03)",
                whiteSpace: "nowrap",
              }}
            >
              Vitorra
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <span className="eyebrow-light justify-center mb-5">Get Started</span>
            <h2
              className="max-w-2xl mx-auto mb-5"
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(30px, 4vw, 54px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
                color: "#FFFFFF",
              }}
            >
              Ready to work with{" "}
              <span className="text-gold-gradient">Vitorra?</span>
            </h2>
            <p className="max-w-md mx-auto mb-10" style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
              Whether you need a fuel savings assessment, a logistics quote, or
              premium Ugandan coffee — our team responds within 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <MagneticButton href="/enquire">Request a Quote</MagneticButton>
              <Link href="/contact" className="btn-ghost-dark inline-flex items-center gap-2">
                Contact Us
              </Link>
            </div>

            {/* Trust caption */}
            <p className="mt-9" style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              Uganda · East Africa · International &nbsp;·&nbsp; Typical reply within 24 hours
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
