"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/* Pulls its child a few pixels toward the pointer and springs back on leave —
   the "magnetic" button of high-end sites. Desktop pointers only; reduced
   motion leaves it still. */
export function Magnetic({ children, strength = 0.28, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 });

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.span ref={ref} onPointerMove={move} onPointerLeave={reset} style={{ x: sx, y: sy }} className={className ?? "inline-flex"}>
      {children}
    </motion.span>
  );
}
