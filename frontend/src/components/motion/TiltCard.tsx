"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/* A panel that tilts a few degrees toward the pointer, with a soft light
   following it across the surface — enough to feel like an object rather
   than a box. Mouse only; still under reduced motion. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [5, -5]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 180, damping: 20 });
  const glow = useTransform([px, py], ([x, y]) => `radial-gradient(420px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(197,178,122,0.16), transparent 60%)`);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current!.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const leave = () => { px.set(0.5); py.set(0.5); };

  return (
    <div className="[perspective:1200px] h-full">
      <motion.div ref={ref} onPointerMove={move} onPointerLeave={leave} style={{ rotateX: rx, rotateY: ry }} className={cn("relative h-full [transform-style:preserve-3d]", className)}>
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glow }} />
        {children}
      </motion.div>
    </div>
  );
}
