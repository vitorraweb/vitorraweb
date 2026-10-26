"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/* ─── A sequence that travels sideways as you scroll down ─────────────────────
   For processes with a natural order — how SEAL is applied, how coffee goes
   from cherry to export. On a desktop the section pins and the steps slide
   across, each a large numbered panel (with a photograph when there is one).
   Phones and reduced motion get the same steps as a plain vertical list.  */

export type HStep = { title: string; body: string; image?: { src: string; alt: string } };

export function HorizontalSteps({
  label, title, intro, steps, tone = "paper", id, after,
}: {
  label: string;
  title: string;
  intro?: string;
  steps: HStep[];
  tone?: "paper" | "deep" | "ink";
  id: string;
  /** Rendered under the sequence, e.g. a film. */
  after?: React.ReactNode;
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
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0.05, 0.95], [0, 1]);

  const onInk = tone === "ink";
  const bg = tone === "ink" ? "bg-ink text-ink-fg" : tone === "deep" ? "bg-paper-deep text-ink" : "bg-paper text-ink";
  const muted = onInk ? "text-ink-fg-muted" : "text-ink-muted";
  const soft = onInk ? "text-ink-fg/80" : "text-ink-soft";
  const line = onInk ? "border-ink-line" : "border-line";

  const Head = (
    <div className="max-w-[30rem]">
      <p className={cn("t-label mb-6", muted)}>{label}</p>
      <h2 id={id} className="t-h2">{title}</h2>
      {intro && <p className={cn("t-body mt-6", soft)}>{intro}</p>}
    </div>
  );

  return (
    <section aria-labelledby={id} data-tone={tone} className={cn("q-scope", bg)}>
      {/* Desktop: pinned, travelling sideways */}
      <div ref={ref} className="hidden lg:block motion-reduce:!hidden relative" style={{ height: `${100 + steps.length * 55}vh` }}>
        <div className="sticky top-0 h-svh overflow-hidden flex flex-col justify-center">
          <motion.div ref={track} style={{ x }} className="flex items-stretch gap-8 pl-[max(3rem,calc((100vw-1240px)/2+3rem))] pr-[12vw]">
            <div className="w-[30rem] shrink-0 flex items-center">{Head}</div>
            {steps.map((s, i) => (
              <article key={s.title} className={cn("shrink-0 h-[66svh] flex flex-col border-t pt-8", s.image ? "w-[min(38rem,62vw)]" : "w-[min(26rem,44vw)]", line)}>
                <div className="flex items-baseline justify-between gap-6">
                  {/* Without a photograph the numeral carries the panel. */}
                  <span className={cn("font-display leading-[0.85]", s.image ? "text-[clamp(4rem,7vw,7rem)]" : "text-[clamp(8rem,15vw,15rem)] font-light", onInk ? "text-gold" : "text-gold-ink")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={cn("t-label", muted)}>{String(i + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
                </div>
                {s.image && (
                  <div className="relative mt-8 flex-1 min-h-0 overflow-hidden rounded-frame">
                    <Image src={s.image.src} alt={s.image.alt} fill sizes="40vw" className="object-cover q-grade" />
                  </div>
                )}
                <h3 className={cn("t-h3 mt-8", !s.image && "mt-auto")}>{s.title}</h3>
                <p className={cn("t-body mt-3 max-w-[32rem]", soft)}>{s.body}</p>
              </article>
            ))}
          </motion.div>
          <div className="q-container w-full mt-10">
            <div className={cn("h-px w-full", onInk ? "bg-ink-line" : "bg-line")}>
              <motion.div className="h-px bg-gold origin-left" style={{ scaleX: bar }} />
            </div>
          </div>
        </div>
      </div>

      {/* Phones, tablets and reduced motion: a plain list */}
      <div className="lg:hidden motion-reduce:!block q-section">
        <div className="q-container">
          {Head}
          <ol className={cn("mt-10 border-t", line)}>
            {steps.map((s, i) => (
              <li key={s.title} className={cn("border-b py-8", line)}>
                <span className={cn("font-display text-[3rem] leading-none", onInk ? "text-gold" : "text-gold-ink")}>{String(i + 1).padStart(2, "0")}</span>
                {s.image && (
                  <div className="relative mt-6 overflow-hidden rounded-frame" style={{ aspectRatio: "4/3" }}>
                    <Image src={s.image.src} alt={s.image.alt} fill sizes="100vw" className="object-cover q-grade" />
                  </div>
                )}
                <h3 className="t-h3 mt-6">{s.title}</h3>
                <p className={cn("t-body mt-3", soft)}>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {after && <div className="q-container pb-[clamp(4.5rem,2.8rem+7vw,9rem)] lg:pt-4">{after}</div>}
    </section>
  );
}
