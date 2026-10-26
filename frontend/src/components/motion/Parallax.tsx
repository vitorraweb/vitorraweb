"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/* Moves its child against the scroll by up to `distance` px — give two
   neighbouring photographs opposite signs and they slide past each other. */
export function Parallax({ children, distance = 60, className }: { children: React.ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return <motion.div ref={ref} className={className} style={{ y }}>{children}</motion.div>;
}
