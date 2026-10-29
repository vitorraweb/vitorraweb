"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import { getLenis } from "@/components/motion/SmoothScroll";

/* Back to the top, with a gold ring that fills as the page is read. Appears
   after the first screen; sits above the WhatsApp button on large screens
   and above the quote bar on phones.
   Under reduced motion it jumps instead of gliding. */
export function BackToTop({ label }: { label: string }) {
  const { scrollYProgress, scrollY } = useScroll();
  const ring = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const [shown, setShown] = useState(false);

  useEffect(() => scrollY.on("change", (v) => setShown(v > 700)), [scrollY]);

  const top = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: reduce });
    else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={top}
      aria-label={label}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={`q-scope fixed z-40 right-3 bottom-[4.75rem] lg:right-6 lg:bottom-20 grid place-items-center h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-ink/85 lg:bg-ink text-ink-fg backdrop-blur-sm shadow-[0_8px_24px_rgba(30,30,30,0.18)] transition-[opacity,translate] duration-500 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
        <motion.circle cx="24" cy="24" r="22" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" style={{ pathLength: ring }} />
      </svg>
      <ArrowUp aria-hidden="true" className="relative h-4 w-4" />
    </button>
  );
}
