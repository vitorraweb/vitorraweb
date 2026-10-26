"use client";

import { motion, useScroll, useSpring } from "motion/react";

/* A gold hairline across the top of the window that fills as the page is
   read — a quiet sense of place on long pages. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gold pointer-events-none"
      style={{ scaleX }}
    />
  );
}
