"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "@/i18n/navigation";

/* ─── Smooth scroll (Lenis) ───────────────────────────────────────────────────
   Gives the wheel and trackpad the weighted, continuous glide of the best
   brand sites, instead of the browser's stepped jumps. It still scrolls the
   real window, so CSS scroll-driven animations, sticky sections and anchor
   links all keep working.

   Public site only (mounted in the [locale] layout, never the portals).
   Off under prefers-reduced-motion, and touch keeps native momentum.
   Anything that scrolls on its own (menus, dialogs) opts out with
   data-lenis-prevent.                                                       */

let instance: Lenis | null = null;

/** The running instance, for components that want to scroll programmatically. */
export function getLenis() {
  return instance;
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: { offset: -80 },
      prevent: (node) => node.closest?.("[data-lenis-prevent], dialog, [role=dialog]") != null,
    });
    instance = lenis;
    return () => {
      lenis.destroy();
      instance = null;
    };
  }, []);

  /* A new page starts at the top, at once — never a long glide up from where
     the last page was left. Hash links are left to Lenis's anchor handling. */
  useEffect(() => {
    if (!window.location.hash) instance?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
