"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

/* ─── FetDevice — the 3D device with an honest fallback ───────────────────────
   three.js (~200 KB) is only fetched when the device is about to scroll into
   view, and only on a device that can draw it: WebGL available, motion not
   reduced, data-saver off. Everyone else sees the product photograph, which
   is also what shows while the scene loads, so there is never an empty box. */

const Scene = dynamic(() => import("./FetDeviceCanvas"), { ssr: false });

function canRender3D() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function FetDevice({
  spin,
  open,
  className,
  fallbackAlt,
}: {
  spin?: MotionValue<number>;
  open?: MotionValue<number>;
  className?: string;
  fallbackAlt: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canRender3D()) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setMount(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Image
        src="/products/fet/packshot.png"
        alt={fallbackAlt}
        fill
        sizes="(min-width: 1024px) 40vw, 80vw"
        className={cn("object-contain transition-opacity duration-700 mix-blend-lighten", ready && "opacity-0")}
      />
      {mount && (
        <div className={cn("absolute inset-0 transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")} aria-hidden="true">
          <Scene spin={spin} open={open} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
