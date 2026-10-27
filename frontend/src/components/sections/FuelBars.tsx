"use client";

import { motion, useReducedMotion } from "motion/react";

/* ─── Before and after, as two bars ───────────────────────────────────────────
   The VW T5 result drawn to scale: litres per 100 km before FET and in the
   first full month with it. The bars grow in when the section scrolls into
   view (the shorter one a beat later, so the eye lands on the gap), with the
   reduction marked between them. The numbers stay as text beside each bar. */

export function FuelBars({
  before,
  after,
  unit,
  labels,
}: {
  before: number;
  after: number;
  unit: string;
  labels: { before: string; after: string; less: string };
}) {
  const reduce = useReducedMotion();
  const max = Math.ceil(before);
  const rows = [
    { k: labels.before, v: before, tone: "bg-ink-fg/35" },
    { k: labels.after, v: after, tone: "bg-gold" },
  ];
  const pct = (((before - after) / before) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {rows.map((r, i) => (
        <div key={r.k}>
          <div className="flex items-baseline justify-between gap-4 t-small">
            <span className="text-ink-fg-muted">{r.k}</span>
            <span className="font-display text-[1.5rem] leading-none text-ink-fg [font-variant-numeric:lining-nums_tabular-nums]">
              {r.v.toFixed(2)} <span className="t-small text-ink-fg-muted">{unit}</span>
            </span>
          </div>
          <div className="mt-3 h-3 w-full bg-ink-line/60 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${r.tone}`}
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${(r.v / max) * 100}%` }}
              style={reduce ? { width: `${(r.v / max) * 100}%` } : undefined}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.4, delay: i * 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
      <p className="t-label text-gold">{labels.less.replace("{pct}", pct)}</p>
    </div>
  );
}
