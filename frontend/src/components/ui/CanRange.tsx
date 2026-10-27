/* The three SEAL formats as aerosol-can line drawings, side by side and
   scaled by their net weight (1.5 / 2.5 / 2.8 oz), so each range card shows
   where its format sits: its own can drawn solid, the other two faint.
   A drawing until the designed packshots arrive — no colours or labels are
   implied beyond the weight printed under each can. */

const CANS = [
  { oz: 1.5, label: "1.5 oz" },
  { oz: 2.5, label: "2.5 oz" },
  { oz: 2.8, label: "2.8 oz" },
];

export function CanRange({ active, className }: { active: number; className?: string }) {
  const max = 2.8;
  const H = 74; // tallest can body + cap, in viewBox units
  return (
    <svg viewBox="0 0 150 100" aria-hidden="true" className={className}>
      {CANS.map((c, i) => {
        const h = Math.round((c.oz / max) * H);
        const w = 26;
        const x = 12 + i * 46;
        const base = 84;
        const top = base - h;
        const on = i === active;
        return (
          <g key={c.label} className={on ? "text-ink" : "text-ink/25"} stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinejoin="round">
            {/* cap */}
            <path d={`M${x + 6} ${top}h${w - 12}v7h${-(w - 12)}z`} fill={on ? "var(--color-gold)" : "none"} stroke={on ? "var(--color-gold-ink)" : "currentColor"} />
            {/* shoulder and body */}
            <path d={`M${x + 3} ${top + 12}q0-5 5-5h${w - 16}q5 0 5 5v${h - 14}q0 2-2 2h${-(w - 10)}q-2 0-2-2z`} fill={on ? "currentColor" : "none"} />
            <text x={x + w / 2 + 1} y={base + 12} textAnchor="middle" fontSize="8.5" stroke="none" fill="currentColor" style={{ fontFamily: "inherit", letterSpacing: "0.04em" }}>{c.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
