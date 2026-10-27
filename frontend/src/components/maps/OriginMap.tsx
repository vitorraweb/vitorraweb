import { uganda as g } from "@/components/maps/geo";

/* ─── Where Vitorra coffee grows ──────────────────────────────────────────────
   Uganda (real border, Natural Earth) with Lake Victoria and its neighbours,
   Mount Elgon marked on the Kenyan border and Kampala for reference. The
   mountain's marker pulses gently; the rest is still. Server-rendered SVG. */

export function OriginMap({ title, elgon, className }: { title: string; elgon: string; className?: string }) {
  const P = g.places;
  const [ex, ey] = P.elgon;
  const [kx, ky] = P.kampala;
  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${g.width} ${g.height}`} role="img" aria-labelledby="origin-map-title" className="w-full h-auto">
        <title id="origin-map-title">{title}</title>
        <rect width={g.width} height={g.height} className="fill-[#E6EBEA]" />
        {(["Kenya", "United Republic of Tanzania", "Rwanda", "South Sudan", "Democratic Republic of the Congo"] as const).map((n) => (
          <path key={n} d={g.countries[n]} className="fill-paper stroke-line-strong" strokeWidth={1.4} />
        ))}
        <path d={g.countries.Uganda} className="fill-cream stroke-ink" strokeWidth={2} />
        {Object.entries(g.lakes).map(([n, d]) => (
          <path key={n} d={d} className="fill-[#E6EBEA] stroke-[#C9D3D1]" strokeWidth={1} />
        ))}

        <text x={kx - 60} y={ky + 210} textAnchor="middle" className="fill-[#7C8C89] text-[26px] italic">Lake Victoria</text>
        <text x={ex + 120} y={ey - 120} textAnchor="middle" className="fill-ink-muted text-[24px] tracking-[0.2em]">KENYA</text>
        <text x={kx - 120} y={ky - 330} textAnchor="middle" className="fill-ink-soft text-[30px] tracking-[0.24em]">UGANDA</text>

        <circle cx={kx} cy={ky} r={8} className="fill-ink" />
        <text x={kx - 16} y={ky + 8} textAnchor="end" className="fill-ink text-[24px]">Kampala</text>

        {/* Mount Elgon: a peak mark and a soft pulse around it. */}
        <circle cx={ex} cy={ey} r={46} className="fill-gold/25 q-pulse" />
        <path d={`M${ex - 22},${ey + 16}L${ex},${ey - 22}L${ex + 22},${ey + 16}Z`} className="fill-gold-ink" />
        <text x={ex - 34} y={ey - 34} textAnchor="end" className="fill-ink text-[28px] font-medium">{elgon}</text>
      </svg>
    </figure>
  );
}
