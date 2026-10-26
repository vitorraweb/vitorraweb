"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";

/* The hero's photograph layer: it drifts a little against the pointer, and as
   the page scrolls away it sinks, slows and darkens, so the next section
   seems to slide over it. Wraps the server-rendered image; without
   JavaScript the photograph simply sits still. */
export function HeroMedia({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.55]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 50, damping: 20 });
  const sy = useSpring(py, { stiffness: 50, damping: 20 });

  // Listen on the window: the headline sits above this layer and would
  // otherwise swallow the pointer.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px.set((e.clientX / window.innerWidth - 0.5) * -18);
      py.set((e.clientY / window.innerHeight - 0.5) * -12);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py]);

  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div className="absolute -inset-[3%]" style={{ y, scale }}>
        <motion.div className="absolute inset-0" style={{ x: sx, y: sy }}>
          {children}
        </motion.div>
      </motion.div>
      <motion.div aria-hidden="true" className="absolute inset-0 bg-ink pointer-events-none" style={{ opacity: dim }} />
    </div>
  );
}

/* The hero's words lift and fade a touch faster than the photograph scrolls. */
export function HeroCopy({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 60%", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  return <motion.div ref={ref} className={className} style={{ y, opacity }}>{children}</motion.div>;
}
