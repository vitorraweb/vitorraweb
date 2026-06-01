"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/* ─── Why Vitorra ─────────────────────────────────────────────────────────────
   Sticky-narrative section (Apple / Stripe). The headline + live counter pin on
   the left while the differentiators scroll past on the right; whichever point
   reaches the centre of the viewport becomes "active" and lights up. Honours
   reduced-motion (Reveal renders instantly; the active state still works).
   ─────────────────────────────────────────────────────────────────────────── */

const differentiators = [
  {
    number: "01",
    title: "Strategic, not just aesthetic",
    body: "Every decision ties to business outcomes — customer trust, lead conversion, and long-term brand equity.",
  },
  {
    number: "02",
    title: "Premium global standards",
    body: "International-quality execution with deep East African market knowledge — competitive locally, credible globally.",
  },
  {
    number: "03",
    title: "Clarity by design",
    body: "Visitors understand who Vitorra is, what we offer, and what to do next — within 30 seconds of landing.",
  },
];

export default function WhyVitorra() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = itemRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      // Active band ≈ the middle 20% of the viewport.
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
      <div className="container-max grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20">
        {/* ── Left: sticky narrative ───────────────────────────────────────── */}
        <div className="lg:sticky lg:top-28 self-start">
          <Reveal>
            <span className="eyebrow block mb-4">Why Vitorra</span>
            <h2
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(28px, 3.2vw, 44px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.12,
                color: "#1E1E1E",
              }}
            >
              Built on trust.<br />Driven by innovation.
            </h2>

            <p className="mt-6 mb-8" style={{ fontSize: "16px", lineHeight: 1.7, color: "#555555", maxWidth: "380px" }}>
              International-quality execution with deep East African market
              knowledge — competitive locally, credible globally.
            </p>

            {/* Live counter — updates as you scroll the list */}
            <div className="flex items-baseline gap-2 mb-7" aria-hidden="true">
              <span
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(40px, 4.5vw, 60px)",
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: "#C5B27A",
                  transition: "color 0.4s ease",
                }}
              >
                {differentiators[active].number}
              </span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#B7B7B7" }}>
                / 0{differentiators.length}
              </span>
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-60 transition-opacity group"
              style={{ color: "#1E1E1E" }}
            >
              Learn about Vitorra
              <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
            </Link>
          </Reveal>
        </div>

        {/* ── Right: scrolling differentiators ─────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:gap-6">
          {differentiators.map((d, i) => {
            const isActive = i === active;
            return (
              <Reveal key={d.number} delay={i * 90}>
                <div
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="relative bg-white rounded-[24px] p-7 md:p-9 overflow-hidden"
                  style={{
                    border: `1px solid ${isActive ? "rgba(197,178,122,0.55)" : "rgba(0,0,0,0.05)"}`,
                    boxShadow: isActive ? "rgba(0,0,0,0.08) 0px 24px 48px 0px" : "none",
                    transform: isActive ? "translateY(-2px)" : "translateY(0)",
                    transition: "border-color 0.45s ease, box-shadow 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  {/* Gold accent bar — grows in when active */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
                    style={{
                      backgroundColor: "#C5B27A",
                      transformOrigin: "center",
                      transform: isActive ? "scaleY(1)" : "scaleY(0)",
                      transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />

                  <div className="flex items-start gap-5">
                    <span
                      style={{
                        fontFamily: "var(--font-playfair, Georgia, serif)",
                        fontSize: "clamp(32px, 3.5vw, 44px)",
                        fontWeight: 700,
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        color: isActive ? "#C5B27A" : "#E0D6BC",
                        transition: "color 0.45s ease",
                      }}
                    >
                      {d.number}
                    </span>
                    <div>
                      <h3
                        className="mb-2"
                        style={{
                          fontFamily: "var(--font-playfair, Georgia, serif)",
                          fontSize: "clamp(19px, 2vw, 24px)",
                          fontWeight: 600,
                          letterSpacing: "-0.015em",
                          color: "#1E1E1E",
                        }}
                      >
                        {d.title}
                      </h3>
                      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#555555" }}>{d.body}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
