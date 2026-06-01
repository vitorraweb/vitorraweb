"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ParallaxImageProps {
  src: string;
  alt: string;
  /** Frame classes — set the aspect ratio / radius here (e.g. "aspect-[4/3] rounded-[40px]"). */
  className?: string;
  /** Eager-load for above-the-fold rows. Default false. */
  priority?: boolean;
  sizes?: string;
  /** Max vertical drift in px across the scroll. Default 36. */
  amount?: number;
  /** Enable cursor tilt/parallax (desktop, fine-pointer only). Default true. */
  interactive?: boolean;
}

/**
 * Image inside a fixed frame with two layers of seamless motion:
 *  1. Scroll parallax — drifts vertically as it passes through the viewport.
 *  2. Cursor parallax — eases toward the pointer with a subtle 3D tilt on hover.
 * The inner layer is scaled up so neither motion ever reveals an edge.
 * Honours prefers-reduced-motion and only enables cursor motion for fine
 * pointers (mouse), never touch.
 */
export function ParallaxImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  amount = 36,
  interactive = true,
}: ParallaxImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Motion state kept in refs so the rAF loop never triggers re-renders.
  const scrollShift = useRef(0);
  const ptrTarget = useRef({ x: 0, y: 0 });
  const ptrCur = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);
  const raf = useRef(0);

  useEffect(() => {
    const frame = frameRef.current;
    const layer = layerRef.current;
    if (!frame || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const SCALE = 1.14;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const useCursor = interactive && fine;

    const apply = () => {
      const { x, y } = ptrCur.current;
      const tx = (x * 10).toFixed(2);
      const ty = (scrollShift.current + y * 10).toFixed(2);
      const rx = (-y * 2.4).toFixed(2);
      const ry = (x * 3).toFixed(2);
      layer.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${SCALE}) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    const computeScroll = () => {
      const rect = frame.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      scrollShift.current = Math.max(-1, Math.min(1, progress)) * amount;
    };

    // Eased loop — lerps the cursor offset toward its target, then parks itself.
    const loop = () => {
      const t = ptrTarget.current;
      const c = ptrCur.current;
      c.x += (t.x - c.x) * 0.12;
      c.y += (t.y - c.y) * 0.12;
      apply();
      const settled = Math.abs(t.x - c.x) < 0.0005 && Math.abs(t.y - c.y) < 0.0005;
      if (hovering.current || !settled) {
        raf.current = requestAnimationFrame(loop);
      } else {
        c.x = t.x;
        c.y = t.y;
        apply();
        raf.current = 0;
      }
    };
    const startLoop = () => {
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      computeScroll();
      if (!raf.current) apply();
    };
    const onMove = (e: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      ptrTarget.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
      startLoop();
    };
    const onEnter = () => {
      hovering.current = true;
      startLoop();
    };
    const onLeave = () => {
      hovering.current = false;
      ptrTarget.current = { x: 0, y: 0 };
      startLoop();
    };

    computeScroll();
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (useCursor) {
      frame.addEventListener("pointermove", onMove);
      frame.addEventListener("pointerenter", onEnter);
      frame.addEventListener("pointerleave", onLeave);
    }
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerenter", onEnter);
      frame.removeEventListener("pointerleave", onLeave);
    };
  }, [amount, interactive]);

  return (
    <div
      ref={frameRef}
      className={cn("relative overflow-hidden", className)}
      style={{ perspective: "900px" }}
    >
      <div
        ref={layerRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "translate3d(0,0,0) scale(1.14)" }}
      >
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    </div>
  );
}
