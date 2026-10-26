"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/* ─── Cursor ring ─────────────────────────────────────────────────────────────
   A thin ring that trails the pointer and swells over anything clickable;
   over photographs and films marked data-cursor="View" (or any label) it
   becomes a solid disc carrying that word. The system cursor is kept — this
   only adds — so nothing about pointing or text selection changes.
   Desktop pointers only; off under reduced motion.                          */

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<{ hover: boolean; label: string | null; dark: boolean }>({ hover: false, label: null, dark: false });
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 520, damping: 42, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 520, damping: 42, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !calm.matches);
    update();
    fine.addEventListener("change", update);
    calm.addEventListener("change", update);
    return () => { fine.removeEventListener("change", update); calm.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as Element | null;
      const labelled = el?.closest?.("[data-cursor]") as HTMLElement | null;
      const clickable = el?.closest?.("a, button, [role=button], label, select, summary, input[type=checkbox], input[type=radio]");
      const dark = !!el?.closest?.('[data-tone="ink"], .bg-ink');
      setState((s) => {
        const next = { hover: !!clickable || !!labelled, label: labelled?.dataset.cursor ?? null, dark };
        return s.hover === next.hover && s.label === next.label && s.dark === next.dark ? s : next;
      });
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = state.label ? 84 : state.hover ? 44 : 18;
  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[80] pointer-events-none"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="-translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
        animate={{
          width: size,
          height: size,
          opacity: visible ? 1 : 0,
          backgroundColor: state.label ? "rgba(197,178,122,0.94)" : "rgba(197,178,122,0)",
          borderColor: state.label ? "rgba(197,178,122,0)" : state.dark ? "rgba(243,241,236,0.55)" : "rgba(30,30,30,0.35)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        style={{ borderWidth: 1, borderStyle: "solid" }}
      >
        {state.label && <span className="t-label text-[0.625rem] text-ink">{state.label}</span>}
      </motion.div>
    </motion.div>
  );
}
