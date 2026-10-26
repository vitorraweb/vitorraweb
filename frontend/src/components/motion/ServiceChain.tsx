"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";

/* ─── "Each link in the chain" ────────────────────────────────────────────────
   The logistics services as links on one gold line. The line draws itself
   across as the section scrolls into view, and each link lights as the line
   reaches it — the point being that the services connect, not that they
   are four separate products.                                              */

export function ServiceChain({ items }: { items: { title: string; body: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.3"] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [reached, setReached] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setReached(Math.floor(v * items.length + 0.15)));

  return (
    <div ref={ref} className="relative">
      <div aria-hidden="true" className="hidden lg:block absolute left-0 right-0 top-[7px] h-px bg-line">
        <motion.div className="h-px bg-gold origin-left" style={{ scaleX }} />
      </div>
      <ol className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
      {items.map((it, i) => {
        const lit = reached > i;
        return (
          <li key={it.title} className="relative lg:pt-12 group">
            <span aria-hidden="true" className="hidden lg:block absolute left-0 top-0 h-[15px] w-[15px] rounded-full border border-line-strong bg-paper transition-all duration-700" style={lit ? { background: "var(--color-gold)", borderColor: "var(--color-gold)", boxShadow: "0 0 0 6px rgba(197,178,122,0.18)" } : undefined} />
            <p className="t-label text-gold-ink font-numeric">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="t-h3 text-ink mt-3 transition-transform duration-500 group-hover:translate-x-1">{it.title}</h3>
            <p className="t-small text-ink-soft mt-3">{it.body}</p>
          </li>
        );
      })}
      </ol>
    </div>
  );
}
