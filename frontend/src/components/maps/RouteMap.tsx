import { eastAfrica as g } from "@/components/maps/geo";

/* ─── East Africa corridors ───────────────────────────────────────────────────
   Real borders and lakes (Natural Earth), the two sea-port corridors into
   Uganda drawn over them, and the onward roads to Kigali and Juba. Routes are
   generalised (town to town), so the map says "schematic routes". Each route
   draws itself as the map scrolls into view (.q-draw); without scroll-driven
   animation, or under reduced motion, it is simply drawn. Server-rendered
   SVG: no script, and the labels are real text for search and screen readers. */

export type RouteMapLabels = {
  title: string;
  northern: string;
  central: string;
  onward: string;
  schematic: string;
  portMombasa: string;
  portDar: string;
};

const NEIGHBOURS = ["Kenya", "United Republic of Tanzania", "Rwanda", "Burundi", "South Sudan", "Democratic Republic of the Congo", "Ethiopia", "Somalia"] as const;

export function RouteMap({ labels, className }: { labels: RouteMapLabels; className?: string }) {
  const P = g.places;
  const city = (key: keyof typeof P, name: string, dx = 10, dy = 4, anchor: "start" | "end" = "start", major = false) => (
    <g key={key}>
      <circle cx={P[key][0]} cy={P[key][1]} r={major ? 7 : 4.5} className={major ? "fill-ink" : "fill-paper stroke-ink"} strokeWidth={1.5} />
      <text x={P[key][0] + (anchor === "end" ? -dx : dx)} y={P[key][1] + dy} textAnchor={anchor} className={major ? "fill-ink text-[22px] font-medium" : "fill-ink-soft text-[18px]"}>{name}</text>
    </g>
  );

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${g.width} ${g.height}`} role="img" aria-labelledby="route-map-title" className="w-full h-auto">
        <title id="route-map-title">{labels.title}</title>
        <rect width={g.width} height={g.height} className="fill-[#E6EBEA]" />
        {NEIGHBOURS.map((n) => (
          <path key={n} d={g.countries[n]} className="fill-paper stroke-line-strong" strokeWidth={1.2} />
        ))}
        <path d={g.countries.Uganda} className="fill-cream stroke-ink" strokeWidth={1.6} />
        {Object.entries(g.lakes).map(([n, d]) => (
          <path key={n} d={d} className="fill-[#E6EBEA] stroke-[#C9D3D1]" strokeWidth={1} />
        ))}

        {/* Corridors: onward roads first, so the two port corridors sit on top. */}
        <path d={g.routes.west} pathLength={1} className="fill-none stroke-ink-muted" strokeWidth={3} strokeDasharray="0.012 0.012" />
        <path d={g.routes.north} pathLength={1} className="fill-none stroke-ink-muted" strokeWidth={3} strokeDasharray="0.012 0.012" />
        <path d={g.routes.central} pathLength={1} className="q-draw fill-none stroke-ink" strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={g.routes.northern} pathLength={1} className="q-draw fill-none stroke-gold-ink" strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round" />

        {city("nairobi", "Nairobi")}
        {city("kigali", "Kigali", 10, 4, "end")}
        {city("juba", "Juba")}
        {city("malaba", "Malaba", 9, -10)}
        {city("mutukula", "Mutukula", 12, 26, "end")}
        {city("mombasa", labels.portMombasa, 12, 6, "end", true)}
        {city("dar", labels.portDar, 14, 36, "end", true)}
        {city("kampala", "Kampala", 12, -12, "end", true)}
      </svg>

      <figcaption className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 t-small text-ink-soft">
        <span className="inline-flex items-center gap-3"><span aria-hidden="true" className="h-[3px] w-8 bg-gold-ink" />{labels.northern}</span>
        <span className="inline-flex items-center gap-3"><span aria-hidden="true" className="h-[3px] w-8 bg-ink" />{labels.central}</span>
        <span className="inline-flex items-center gap-3"><span aria-hidden="true" className="w-8 border-t-2 border-dashed border-ink-muted" />{labels.onward}</span>
        <span className="text-ink-muted">{labels.schematic}</span>
      </figcaption>
    </figure>
  );
}
