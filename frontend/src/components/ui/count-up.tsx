"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Target value to count to. */
  end: number;
  /** Animation duration in ms. Default 1600. */
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Begin the count when this flips true (e.g. when the section is in view). */
  start?: boolean;
  className?: string;
}

/**
 * Counts from 0 → end with an ease-out when `start` becomes true. Runs once.
 * Honours prefers-reduced-motion (snaps straight to the final value).
 */
export function CountUp({ end, duration = 1600, prefix = "", suffix = "", start = true, className }: CountUpProps) {
  const [val, setVal] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!start || done.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(end);
      done.current = true;
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * end));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        done.current = true;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, end, duration]);

  return (
    <span className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  );
}
