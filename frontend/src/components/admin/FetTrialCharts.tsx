"use client";

import { useState } from "react";
import { type Trial, type Trip, type RouteRow, fmtNumber, fmtDate, UNMATCHED_REASON } from "@/lib/fet-trials";

/**
 * Charts for a trial. All hand-drawn SVG — the admin panel carries no chart
 * library, and these need to say specific things a generic chart would not.
 *
 * Two rules run through every chart here:
 *
 *   COMPARE WITHIN A ROUTE. The headline chart is a dot plot grouped by
 *   destination rather than a time series, because plotting mixed routes
 *   against time is precisely the mistake that made the first trial look like
 *   a 20% failure. Fuel use varies ~41% between destinations and ~4% between
 *   runs of the same one.
 *
 *   NEVER PRE-JUDGE. "Before" and "after" are gold and blue, not red and
 *   green: the colours identify a period, they do not score it. Only the
 *   change figure carries good/bad colour, and only where it is comparable.
 *
 * Palette checked for contrast and colour-blind separation before use.
 */

const BEFORE = "#AD8C36";
const AFTER = "#0F6E9C";
const INK = "#1E1E1E";
const MUTED = "#9A968E";
const GRID = "#ECEAE4";
const SURFACE = "#FFFFFF";
const GOOD = "#16A34A";
const BAD = "#9E3B33";

type Tip = { x: number; y: number; lines: string[] } | null;

/* ── shared bits ─────────────────────────────────────────────────────────── */

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg px-2.5 py-1.5 shadow-lg"
      style={{
        left: `${tip.x}%`, top: `${tip.y}%`, transform: "translate(-50%, -115%)",
        background: "#1E1E1E", color: "#fff", fontSize: "11px", lineHeight: 1.45, whiteSpace: "nowrap",
      }}
    >
      {tip.lines.map((l, i) => (
        <div key={i} style={{ fontWeight: i === 0 ? 600 : 400, opacity: i === 0 ? 1 : 0.8 }}>{l}</div>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { colour: string; label: string; shape?: "dot" | "bar" }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2 text-xs" style={{ color: "#666" }}>
          {i.shape === "bar" ? (
            <svg width="18" height="10" aria-hidden="true"><rect x="0" y="2" width="18" height="6" rx="3" fill={i.colour} /></svg>
          ) : (
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill={i.colour} stroke={SURFACE} strokeWidth="2" /></svg>
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

function ChartFrame({
  title, subtitle, caption, children,
}: {
  title: string; subtitle?: string; caption?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
      <p className="text-sm font-semibold" style={{ color: INK }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5 mb-3 leading-relaxed" style={{ color: "#999" }}>{subtitle}</p>}
      <div className="relative">{children}</div>
      {caption && <p className="text-xs mt-3 pt-3 border-t leading-relaxed" style={{ borderColor: GRID, color: "#888" }}>{caption}</p>}
    </div>
  );
}

/**
 * A "nice" axis range that always contains the data, with a step chosen from
 * the 1 / 2 / 5 series so it suits the actual spread. This matters more than it
 * sounds: trial loads sit between 28.6 and 30.2 tonnes, and a fixed step of 5
 * would round that to 25–35 and collapse every point into one indistinguishable
 * blob — hiding the very comparison the chart exists to make.
 */
function axisRange(values: number[], pad = 0.08): { min: number; max: number; ticks: number[]; dp: number } {
  if (values.length === 0) return { min: 0, max: 10, ticks: [0, 5, 10], dp: 0 };

  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, Math.abs(hi) * 0.05, 0.5);
  const padding = span * pad;

  const raw = (span + padding * 2) / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalised = raw / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;

  const min = Math.max(0, Math.floor((lo - padding) / step) * step);
  const max = Math.ceil((hi + padding) / step) * step;
  const dp = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;

  const ticks: number[] = [];
  for (let v = min; v <= max + step / 1000; v += step) ticks.push(Number(v.toFixed(6)));

  return { min, max: ticks[ticks.length - 1], ticks, dp };
}

/* ── 1. the headline: every trip, grouped by destination ─────────────────── */

/**
 * A dot plot, not a time series. Each dot is one journey; rows are
 * destinations. Reading down the rows shows how much the road alone moves fuel
 * use; reading across a single row shows what actually changed on that road.
 */
export function RouteDotPlot({ trial }: { trial: Trial }) {
  const [tip, setTip] = useState<Tip>(null);

  const measurable = trial.trips.filter((t) => t.status === "valid" && t.l_per_100 !== null);
  const routes = trial.analysis.routes;
  if (routes.length === 0 || measurable.length === 0) return null;

  const values = measurable.map((t) => t.l_per_100 as number);
  const { min, max, ticks } = axisRange(values);

  const LEFT = 116;
  // The right gutter is reserved for each row's change figure — plotting to the
  // edge would clip it.
  const RIGHT = 630;
  const ROW = 36;
  const TOP = 26;
  const height = TOP + routes.length * ROW + 44;
  const x = (v: number) => LEFT + ((v - min) / (max - min)) * (RIGHT - LEFT);

  const tripsOn = (key: string, phase: "baseline" | "trial") =>
    measurable.filter((t) => t.route_key === key && t.phase === phase);

  return (
    <ChartFrame
      title="Every trip, grouped by destination"
      subtitle="One dot per journey. Rows are destinations, so like is only ever compared with like."
      caption="The spread down the rows is the road, not the device — which is why the result is worked out inside each destination and only then added together. Where a row has dots of both colours, the gap between them is the real change."
    >
      <Legend items={[{ colour: BEFORE, label: "Before the device" }, { colour: AFTER, label: "After the device" }]} />
      <Tooltip tip={tip} />
      <svg viewBox={`0 0 720 ${height}`} className="w-full h-auto block" role="img"
        aria-label={`Fuel use per journey grouped by destination, from ${min} to ${max} litres per 100 km.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={TOP - 8} x2={x(t)} y2={TOP + routes.length * ROW - 8} stroke={GRID} strokeWidth="1" />
            <text x={x(t)} y={TOP + routes.length * ROW + 10} textAnchor="middle" fontSize="10" fill={MUTED}>{t.toFixed(0)}</text>
          </g>
        ))}
        <text x={LEFT} y={TOP + routes.length * ROW + 28} fontSize="10" fill={MUTED} letterSpacing="0.08em">LITRES PER 100 KM</text>

        {routes.map((r, i) => {
          const cy = TOP + i * ROW + 6;
          const before = tripsOn(r.route_key, "baseline");
          const after = tripsOn(r.route_key, "trial");
          const bMean = r.baseline?.l_per_100 ?? null;
          const aMean = r.trial?.l_per_100 ?? null;

          return (
            <g key={r.route_key} opacity={r.matched || after.length === 0 ? 1 : 0.55}>
              <text x={LEFT - 10} y={cy + 4} textAnchor="end" fontSize="12"
                fill={r.matched ? INK : "#8A8A8A"} fontWeight={r.matched ? 600 : 400}>
                {r.route_label}
              </text>

              {/* The change, drawn as the distance between the two averages. */}
              {bMean !== null && aMean !== null && (
                <line x1={x(bMean)} y1={cy} x2={x(aMean)} y2={cy} stroke={r.matched ? INK : MUTED}
                  strokeWidth="1.5" strokeDasharray={r.matched ? undefined : "3 3"} opacity={0.35} />
              )}

              {before.map((t) => (
                <circle key={`b${t.id}`} cx={x(t.l_per_100 as number)} cy={cy} r="5.5" fill={BEFORE}
                  stroke={SURFACE} strokeWidth="2" style={{ cursor: "pointer" }}
                  onMouseEnter={() => setTip({
                    x: (x(t.l_per_100 as number) / 720) * 100, y: (cy / height) * 100,
                    lines: [`${r.route_label} · before`, `${t.l_per_100} L/100km · ${fmtDate(t.trip_date)}`, `${fmtNumber(t.distance_km)} km on ${fmtNumber(t.fuel_used_l, 1)} L`],
                  })}
                  onMouseLeave={() => setTip(null)} />
              ))}
              {after.map((t) => (
                <circle key={`a${t.id}`} cx={x(t.l_per_100 as number)} cy={cy} r="5.5" fill={AFTER}
                  stroke={SURFACE} strokeWidth="2" style={{ cursor: "pointer" }}
                  onMouseEnter={() => setTip({
                    x: (x(t.l_per_100 as number) / 720) * 100, y: (cy / height) * 100,
                    lines: [`${r.route_label} · after`, `${t.l_per_100} L/100km · ${fmtDate(t.trip_date)}`, `${fmtNumber(t.distance_km)} km on ${fmtNumber(t.fuel_used_l, 1)} L`],
                  })}
                  onMouseLeave={() => setTip(null)} />
              ))}

              {/* Only a comparable row earns a change figure. */}
              {r.matched && r.change_pct !== null ? (
                <text x={RIGHT + 8} y={cy + 4} fontSize="11" fontWeight="700"
                  fill={r.change_pct > 0 ? GOOD : BAD}>
                  {r.change_pct > 0 ? "−" : "+"}{Math.abs(r.change_pct)}%
                </text>
              ) : (
                after.length > 0 && (
                  <text x={RIGHT + 8} y={cy + 4} fontSize="9" fill={MUTED}>not comparable</text>
                )
              )}
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

/* ── 2. what it would have burned, against what it did ───────────────────── */

export function ExpectedVsActual({ trial }: { trial: Trial }) {
  const h = trial.analysis.headline;
  if (!h) return null;

  const max = Math.max(h.expected_litres, h.actual_litres) * 1.15;
  const LEFT = 150;
  const RIGHT = 660;
  const w = (v: number) => ((v / max) * (RIGHT - LEFT));
  const saved = h.litres_saved;
  const better = saved > 0;

  return (
    <ChartFrame
      title="Fuel it would have used, against fuel it did use"
      subtitle={`Across ${fmtNumber(h.distance_km)} km on ${h.matched_routes} comparable route${h.matched_routes === 1 ? "" : "s"}.`}
      caption={`The expected figure is not one blended average — each route's own earlier rate is applied to the distance actually driven on that route, then added up.`}
    >
      <svg viewBox="0 0 720 150" className="w-full h-auto block" role="img"
        aria-label={`Expected ${h.expected_litres} litres against ${h.actual_litres} litres actually used.`}>
        <text x={LEFT - 12} y={38} textAnchor="end" fontSize="12" fill={INK}>Expected</text>
        <rect x={LEFT} y={22} width={w(h.expected_litres)} height="22" rx="4" fill={BEFORE} />
        <text x={LEFT + w(h.expected_litres) + 10} y={38} fontSize="12" fontWeight="700" fill={INK}>
          {fmtNumber(h.expected_litres)} L
        </text>

        <text x={LEFT - 12} y={82} textAnchor="end" fontSize="12" fill={INK}>Actually used</text>
        <rect x={LEFT} y={66} width={w(h.actual_litres)} height="22" rx="4" fill={AFTER} />
        <text x={LEFT + w(h.actual_litres) + 10} y={82} fontSize="12" fontWeight="700" fill={INK}>
          {fmtNumber(h.actual_litres)} L
        </text>

        {/* The difference, bracketed between the two bar ends. */}
        <line x1={LEFT + w(Math.min(h.expected_litres, h.actual_litres))} y1={104}
          x2={LEFT + w(Math.max(h.expected_litres, h.actual_litres))} y2={104}
          stroke={better ? GOOD : BAD} strokeWidth="2" />
        <text x={LEFT + w((h.expected_litres + h.actual_litres) / 2)} y={126} textAnchor="middle"
          fontSize="12" fontWeight="700" fill={better ? GOOD : BAD}>
          {better ? "saved " : "extra "}{fmtNumber(Math.abs(saved), 1)} L ({Math.abs(h.saving_pct)}%)
        </text>
      </svg>
    </ChartFrame>
  );
}

/* ── 3. was it the device, or a lighter load? ────────────────────────────── */

/**
 * The obvious objection a client will raise — "your trips were just lighter" —
 * answered before they raise it. If the blue dots sit at the same loads as the
 * gold ones, weight is not what changed.
 */
export function LoadScatter({ trial }: { trial: Trial }) {
  const [tip, setTip] = useState<Tip>(null);

  const pts = trial.trips.filter(
    (t) => t.status === "valid" && t.l_per_100 !== null && t.load_out_kg !== null && t.load_out_kg > 0
  );
  if (pts.length < 3) return null;

  const loads = pts.map((t) => (t.load_out_kg as number) / 1000);
  const fuels = pts.map((t) => t.l_per_100 as number);
  const lx = axisRange(loads, 0.12);
  const ly = axisRange(fuels, 0.12);

  const L = 56, R = 700, T = 28, B = 112;
  const x = (v: number) => L + ((v - lx.min) / (lx.max - lx.min)) * (R - L);
  const y = (v: number) => B - ((v - ly.min) / (ly.max - ly.min)) * (B - T);

  return (
    <ChartFrame
      title="Was it the device, or a lighter load?"
      subtitle="Each journey plotted by how much it carried against how much fuel it used."
      caption="If the two colours sit over the same range of loads, weight is not what changed between them — which is the first thing a client will ask."
    >
      <Legend items={[{ colour: BEFORE, label: "Before the device" }, { colour: AFTER, label: "After the device" }]} />
      <Tooltip tip={tip} />
      <svg viewBox="0 0 720 156" className="w-full h-auto block" role="img"
        aria-label="Load carried against fuel use, for each journey, before and after the device was fitted.">
        {ly.ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={L} y1={y(t)} x2={R} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill={MUTED}>{t.toFixed(ly.dp)}</text>
          </g>
        ))}
        {lx.ticks.map((t) => (
          <text key={`x${t}`} x={x(t)} y={B + 14} textAnchor="middle" fontSize="9" fill={MUTED}>{t.toFixed(lx.dp)}t</text>
        ))}
        <text x={L} y={B + 32} fontSize="9" fill={MUTED} letterSpacing="0.08em">LOAD CARRIED (TONNES)</text>
        <text x={8} y={T - 12} fontSize="9" fill={MUTED} letterSpacing="0.08em">LITRES PER 100 KM</text>

        {pts.map((t) => (
          <circle
            key={t.id}
            cx={x((t.load_out_kg as number) / 1000)}
            cy={y(t.l_per_100 as number)}
            r="5"
            fill={t.phase === "trial" ? AFTER : BEFORE}
            stroke={SURFACE}
            strokeWidth="2"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setTip({
              x: (x((t.load_out_kg as number) / 1000) / 720) * 100,
              y: (y(t.l_per_100 as number) / 156) * 100,
              lines: [
                `${t.route_label ?? "Trip"} · ${t.phase === "trial" ? "after" : "before"}`,
                `${((t.load_out_kg as number) / 1000).toFixed(1)} t · ${t.l_per_100} L/100km`,
                fmtDate(t.trip_date),
              ],
            })}
            onMouseLeave={() => setTip(null)}
          />
        ))}
      </svg>
    </ChartFrame>
  );
}

/* ── 4. the trial as it ran ──────────────────────────────────────────────── */

/**
 * Trips on a date line with the installation marked. Its real job is catching
 * what a table hides: a trip sitting on the wrong side of the installation, or
 * a gap where the client stopped sending data.
 */
export function TripTimeline({ trial }: { trial: Trial }) {
  const [tip, setTip] = useState<Tip>(null);

  const dated = trial.trips.filter((t) => t.trip_date);
  if (dated.length < 2) return null;

  const times = dated.map((t) => new Date(t.trip_date as string).getTime());
  const install = trial.installed_on ? new Date(trial.installed_on).getTime() : null;
  const lo = Math.min(...times, install ?? Infinity);
  const hi = Math.max(...times, install ?? -Infinity);
  const span = Math.max(hi - lo, 86400000);

  const L = 24, R = 696, Y = 56;
  const x = (t: number) => L + ((t - lo) / span) * (R - L);

  const colourFor = (t: Trip) =>
    t.status === "excluded" ? "#C9C5BC" : t.status === "review" ? BAD : t.phase === "trial" ? AFTER : BEFORE;

  return (
    <ChartFrame
      title="The trial as it ran"
      subtitle="Each journey on a date line, with the day the device went on."
      caption="Worth a glance for two things a table hides: a trip sitting on the wrong side of the installation date, and a stretch where the client simply stopped sending data."
    >
      <Tooltip tip={tip} />
      <svg viewBox="0 0 720 100" className="w-full h-auto block" role="img"
        aria-label="Trips plotted by date, with the installation date marked.">
        <line x1={L} y1={Y} x2={R} y2={Y} stroke={GRID} strokeWidth="2" />

        {install !== null && install >= lo && install <= hi && (
          <g>
            <line x1={x(install)} y1={Y - 30} x2={x(install)} y2={Y + 14} stroke={INK} strokeWidth="1.5" strokeDasharray="3 3" />
            <text x={x(install)} y={Y - 36} textAnchor="middle" fontSize="10" fontWeight="600" fill={INK}>device fitted</text>
          </g>
        )}

        {dated.map((t) => {
          const cx = x(new Date(t.trip_date as string).getTime());
          return (
            <circle key={t.id} cx={cx} cy={Y} r="6" fill={colourFor(t)} stroke={SURFACE} strokeWidth="2"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setTip({
                x: (cx / 720) * 100, y: (Y / 100) * 100,
                lines: [
                  `${t.route_label ?? "Trip"} · ${fmtDate(t.trip_date)}`,
                  t.l_per_100 !== null ? `${t.l_per_100} L/100km` : "no fuel figure",
                  t.status === "review" ? "needs review" : t.status === "excluded" ? "left out" : t.phase === "trial" ? "after the device" : "before the device",
                ],
              })}
              onMouseLeave={() => setTip(null)} />
          );
        })}

        <text x={L} y={Y + 30} fontSize="10" fill={MUTED}>{fmtDate(new Date(lo).toISOString())}</text>
        <text x={R} y={Y + 30} textAnchor="end" fontSize="10" fill={MUTED}>{fmtDate(new Date(hi).toISOString())}</text>
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1">
        {[
          { colour: BEFORE, label: "Before" }, { colour: AFTER, label: "After" },
          { colour: BAD, label: "Needs review" }, { colour: "#C9C5BC", label: "Left out" },
        ].map((i) => (
          <span key={i.label} className="inline-flex items-center gap-2 text-xs" style={{ color: "#666" }}>
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill={i.colour} stroke={SURFACE} strokeWidth="2" /></svg>
            {i.label}
          </span>
        ))}
      </div>
    </ChartFrame>
  );
}

/** Routes shown with the reason they cannot be compared — the table's companion. */
export function unmatchedNote(row: RouteRow): string {
  return UNMATCHED_REASON[row.unmatched_reason ?? ""] ?? "Not comparable";
}
