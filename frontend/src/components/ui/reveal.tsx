"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: React.ReactNode;
  /** Direction the element travels in from. Default: "up" */
  direction?: Direction;
  /** Delay in ms before the animation starts once in view. Default: 0 */
  delay?: number;
  /** Animation distance in px. Default: 24 */
  distance?: number;
  /** Render as a different element. Default: "div" */
  as?: "div" | "section" | "li" | "span";
  className?: string;
  /** Only animate once (default true). If false, re-animates on re-entry. */
  once?: boolean;
}

/**
 * Scroll-reveal wrapper. Fades + slides children into view when they enter
 * the viewport. Respects prefers-reduced-motion (renders instantly visible).
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  distance = 24,
  as = "div",
  className,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Honour reduced-motion: show immediately, skip the animation.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      // Trigger as soon as the element nears the viewport (rootMargin extends
      // the trigger zone ~18% of the screen below the fold), so content is
      // already fading in by the time the user scrolls to it — no "loading" lag.
      { threshold: 0, rootMargin: "0px 0px 18% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const offset = (() => {
    switch (direction) {
      case "up": return `translate3d(0, ${distance}px, 0)`;
      case "down": return `translate3d(0, -${distance}px, 0)`;
      case "left": return `translate3d(${distance}px, 0, 0)`;
      case "right": return `translate3d(-${distance}px, 0, 0)`;
      default: return "translate3d(0, 0, 0)";
    }
  })();

  // Treat the incoming `delay` as a stagger hint and soften it: scale it down
  // and cap it, so long grids/lists never leave the last item waiting noticeably.
  const stagger = Math.min(delay * 0.55, 180);

  const Component = as as React.ElementType;

  return (
    <Component
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : offset,
        transition: `opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Component>
  );
}
