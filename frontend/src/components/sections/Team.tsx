"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, User } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/* ─── Team constellation (hierarchical) ───────────────────────────────────────
   Mastercard-adapted: CEO featured on top, a leadership tier joined by a gold
   orbital arc that draws on scroll, then the officers. Each photo is grayscale
   until hovered (→ full colour + gold ring + satellite CTA) and carries a
   cursor-magnetic tilt. Placeholder slots (photo pending) render an elegant
   gold-tinted avatar. Honours reduced-motion; cursor effect is desktop-only.
   ─────────────────────────────────────────────────────────────────────────── */

type Member = { name?: string; role: string; file?: string; placeholder?: boolean };
type Size = "ceo" | "lead" | "officer";

const ceo: Member = {
  name: "Solomon Okello",
  role: "Chief Executive Officer",
  file: "Solomon Okello - CEO.jpg",
};

const leadership: Member[] = [
  { name: "Victor Lojum",      role: "Head of Operations",       file: "Victor Lojum - Head of Operations.jpg" },
  { name: "Joseph Rwabu",      role: "Senior Finance Officer",    file: "Joseph Rwabu - Senior Finance Officer.jpeg" },
  { name: "Thurayya Nakayima", role: "Senior Marketing Officer",  file: "Thurayya Nakayima - Senior Marketing Officer.jpg" },
];

const officers: Member[] = [
  { name: "John Oluwaseyi",   role: "IT Officer",               file: "John Oluwaseyi - IT Officer.jpeg" },
  { name: "Sarah Nuwamanya",  role: "Marketing Officer",         file: "Sarah Nuwamanya - Marketing Officer.jpg" },
  { name: "Olivia Sandra",    role: "Brand Designer",            file: "Olivia Sandra - Brand Designer.jpeg" },
  { name: "Daniel Tuke",      role: "Finance Officer",           file: "Daniel Tuke - Finance Officer.jpeg" },
  { name: "Nagawa Shakirah",  role: "Marketing Officer",         file: "Nagawa Shakirah - Marketing Officer.jpeg" },
];

export default function Team() {
  const secRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = secRef.current;
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
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={secRef} className="section-padding relative overflow-hidden" style={{ backgroundColor: "#F2F2F2" }}>
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
            color: "rgba(30,30,30,0.04)",
            paddingLeft: "clamp(24px, 5vw, 80px)",
            whiteSpace: "nowrap",
          }}
        >
          Team
        </span>
      </div>

      <div className="container-max relative z-10">
        <Reveal className="mb-14 lg:mb-16 text-center">
          <span className="eyebrow justify-center mb-3">Our People</span>
          <h2
            className="mx-auto"
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(28px, 3.2vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              color: "#1E1E1E",
              maxWidth: "520px",
            }}
          >
            The team behind Vitorra.
          </h2>
        </Reveal>

        {/* ── Tier 1 — CEO ─────────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <Reveal>
            <TeamPortrait member={ceo} size="ceo" featured />
          </Reveal>
        </div>

        {/* Connector line CEO → leadership */}
        <div className="flex justify-center">
          <span
            className="hidden lg:block w-px my-6"
            style={{
              height: "48px",
              background: "linear-gradient(#C5B27A, rgba(197,178,122,0))",
              transformOrigin: "top",
              transform: inView ? "scaleY(1)" : "scaleY(0)",
              transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s",
            }}
          />
        </div>

        {/* ── Tier 2 — Leadership (gold arc) ───────────────────────────────── */}
        <div className="relative mt-10 lg:mt-0">
          <svg
            className="hidden lg:block absolute inset-0 w-full h-full z-0"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M40,120 C 250,30 400,30 500,110 S 760,190 960,90"
              pathLength={1}
              className="team-arc"
              style={{ strokeDashoffset: inView ? 0 : 1 }}
            />
          </svg>

          <div className="relative z-10 flex flex-wrap justify-center lg:flex-nowrap items-center gap-x-12 gap-y-12 lg:gap-x-24">
            {leadership.map((m, i) => (
              <div key={m.name ?? `lead-${i}`} className={i % 2 === 0 ? "team-down" : "team-up"}>
                <Reveal delay={i * 90}>
                  <TeamPortrait member={m} size="lead" />
                </Reveal>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tier 3 — Officers ────────────────────────────────────────────── */}
        <div className="mt-16 lg:mt-24 flex flex-wrap justify-center items-start gap-x-10 gap-y-12">
          {officers.map((m, i) => (
            <Reveal key={m.name ?? `officer-${i}`} delay={i * 70}>
              <TeamPortrait member={m} size="officer" />
            </Reveal>
          ))}

          {/* Meet-the-team node */}
          <Reveal delay={officers.length * 70}>
            <div className="team-portrait flex flex-col items-center text-center">
              <Link
                href="/about"
                className="flex flex-col items-center justify-center text-center w-28 md:w-32 aspect-square rounded-full border-2 border-dashed hover:opacity-70 transition-opacity mb-4"
                style={{ borderColor: "rgba(197,178,122,0.45)" }}
              >
                <span style={{ color: "#C5B27A", fontSize: "24px", lineHeight: 1 }}>+</span>
                <span className="mt-1.5 px-3" style={{ fontSize: "11px", color: "#888888", fontWeight: 500 }}>
                  Meet the team
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── Single portrait ─────────────────────────────────────────────────────── */

const SIZE_CLASS: Record<Size, string> = {
  ceo: "w-40 md:w-44 lg:w-48",
  lead: "w-32 md:w-36",
  officer: "w-28 md:w-32",
};

function TeamPortrait({ member, size, featured = false }: { member: Member; size: Size; featured?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const cur = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const hover = useRef(false);
  const raf = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || member.placeholder) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const apply = () => {
      const { x, y } = cur.current;
      const lift = hover.current ? 6 : 0;
      el.style.transform = `translate3d(${(x * 7).toFixed(2)}px, ${(y * 7 - lift).toFixed(2)}px, 0) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    };
    const loop = () => {
      const t = target.current;
      const c = cur.current;
      c.x += (t.x - c.x) * 0.15;
      c.y += (t.y - c.y) * 0.15;
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
    const enter = () => {
      hover.current = true;
      start();
    };
    const leave = () => {
      hover.current = false;
      target.current = { x: 0, y: 0 };
      start();
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [member.placeholder]);

  return (
    <div className={cn("team-portrait flex flex-col items-center text-center", featured && "is-featured")} style={{ perspective: "700px" }}>
      <div ref={ref} className={cn("relative aspect-square mb-4 will-change-transform", SIZE_CLASS[size])}>
        {member.placeholder ? (
          <div
            className="t-ring w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(160deg, #EFE9DA 0%, #E2D8BE 100%)" }}
          >
            <User className="w-1/3 h-1/3" style={{ color: "#B9A876" }} strokeWidth={1.5} />
          </div>
        ) : (
          <>
            <div className="t-ring w-full h-full">
              <Image
                src={`/team/${encodeURIComponent(member.file!)}`}
                alt={member.name ?? member.role}
                fill
                className="object-cover t-img"
                sizes={size === "ceo" ? "192px" : "144px"}
              />
            </div>
            <Link
              href="/about"
              className="satellite-cta t-cta"
              style={{ width: "38px", height: "38px" }}
              aria-label={`About ${member.name ?? member.role}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </div>

      <span className="eyebrow mb-1" style={{ fontSize: size === "ceo" ? "10px" : "9px" }}>
        {member.role}
      </span>
      <p
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: size === "ceo" ? "17px" : "14px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: member.placeholder ? "#9A9A9A" : "#1E1E1E",
          fontStyle: member.placeholder ? "italic" : "normal",
        }}
      >
        {member.name ?? "Joining soon"}
      </p>
    </div>
  );
}
