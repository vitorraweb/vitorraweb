"use client";

import { useEffect, useRef, useState } from "react";

/* Counts a figure up when it scrolls into view — once, over ~1.6s.
   The real value is what renders on the server and what shows with
   JavaScript off, with reduced motion, or if the figure is already on screen
   at load. It only starts from zero if it is still below the fold when the
   page loads, so no one ever sees a wrong number sitting still.           */
export function CountUp({ value, decimals = 1, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already seen

    let frame = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1600);
        const eased = 1 - Math.pow(1 - p, 4);
        setShown(value * eased);
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });

    setShown(0);
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);

  return <span ref={ref} className={className}>{shown.toFixed(decimals)}</span>;
}
