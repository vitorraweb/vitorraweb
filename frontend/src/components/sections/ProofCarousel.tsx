"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "@/i18n/navigation";
import { Label } from "@/components/system";

/* ─── Proof, travelling sideways ──────────────────────────────────────────────
   One designed proof slide per business (Olivia's 4:3 banners), each a link
   to its page. On a desktop the section pins and the slides travel across as
   the visitor scrolls down — no dragging, no arrows — with a gold line that
   fills as they go (the same chapter as "How it is used" on the SEAL page).
   Phones and reduced motion get the slides as a plain vertical list.      */

export type ProofSlide = { src: string; alt: string; href: string; name: string };

export function ProofCarousel({
  label,
  title,
  slides,
}: {
  label: string;
  title: string;
  slides: ProofSlide[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  // How far the track must travel: its full width minus one screen.
  useEffect(() => {
    const measure = () => setDistance(Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.06, 0.94], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0.06, 0.94], [0, 1]);

  const Head = (
    <div className="max-w-[26rem]">
      <Label onInk className="mb-6">{label}</Label>
      <h2 id="proof-heading" className="t-h1 text-ink-fg">{title}</h2>
    </div>
  );

  const slide = (s: ProofSlide, i: number, sizes: string) => (
    <Link href={s.href} className="group block" aria-label={`${s.name}: ${s.alt}`}>
      <div className="relative overflow-hidden rounded-frame bg-ink-line q-zoom" style={{ aspectRatio: "1448/1086" }}>
        <Image src={s.src} alt={s.alt} fill sizes={sizes} className="object-cover" />
      </div>
      <p className="t-label text-ink-fg-muted mt-4 flex items-center justify-between gap-6">
        <span className="group-hover:text-gold transition-colors">{s.name} →</span>
        <span className="font-numeric">{String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
      </p>
    </Link>
  );

  return (
    <section aria-labelledby="proof-heading" data-tone="ink" className="q-scope bg-ink text-ink-fg">
      {/* Desktop: pinned, travelling sideways with the scroll */}
      <div ref={ref} className="hidden lg:block motion-reduce:!hidden relative" style={{ height: `${100 + slides.length * 60}vh` }}>
        <div className="sticky top-0 h-svh overflow-hidden flex flex-col justify-center">
          <motion.div ref={track} style={{ x }} className="flex items-center gap-10 pl-[max(3rem,calc((100vw-1240px)/2+3rem))] pr-[10vw]">
            <div className="w-[26rem] shrink-0">{Head}</div>
            {slides.map((s, i) => (
              <div key={s.href} className="shrink-0 w-[min(42rem,46vw,calc((100svh-14rem)*1.333))]">{slide(s, i, "46vw")}</div>
            ))}
          </motion.div>
          <div className="q-container w-full mt-12">
            <div className="h-px w-full bg-ink-line">
              <motion.div className="h-px bg-gold origin-left" style={{ scaleX: bar }} />
            </div>
          </div>
        </div>
      </div>

      {/* Phones, tablets and reduced motion: the slides in a column */}
      <div className="lg:hidden motion-reduce:!block q-section">
        <div className="q-container">
          {Head}
          <ul className="mt-10 space-y-10">
            {slides.map((s, i) => (
              <li key={s.href}>{slide(s, i, "100vw")}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
