"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, LineChart, PieChart, Table2, ArrowUp, ArrowDown, Minus } from "lucide-react";

/* ─── Reporting: Odoo's graph & pivot views ───────────────────────────────────
   One component for every chart in the console, so they all behave alike:

     • a toolbar — measure, Bar / Line / Pie, Graph / Pivot
     • one y-axis, hairline grid, thin marks (bars ≤ 24px, 4px rounded tops,
       2px gaps; 2px lines with 8px dots), hover tooltips with a band
     • a legend whenever there are two or more series; identity is never
       colour alone (legend + tooltip + pivot table)
     • the pivot view is the table of the same numbers, with totals

   Colours are the --o-series-* tokens (the validated categorical order,
   re-stepped for dark mode), applied through `style`, which — unlike SVG
   presentation attributes — resolves CSS variables.                     */

export type Measure = { key: string; label: string; format?: (v: number) => string };
export type Series = { key: string; label: string };
export type Row = { label: string; values: Record<string, number> };
export type ChartType = "bar" | "line" | "pie";

const SERIES_VAR = (i: number) => `var(--o-series-${(i % 8) + 1})`;
const fmtDefault = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Round the axis top to a 1/2/2.5/5 step so ticks land on readable numbers. */
function niceMax(max: number, ticks = 4): { top: number; step: number } {
  if (max <= 0) return { top: 1, step: 0.25 };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return { top: step * Math.ceil(max / step), step };
}

function compact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e9) return `${+(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${+(v / 1e3).toFixed(1)}k`;
  return `${+v.toFixed(2)}`;
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ─── KPI tile (Odoo dashboard number) ─────────────────────────────────── */

export function KpiTile({
  label, value, sub, now, before, upIsGood = true, href,
}: {
  label: string; value: string; sub?: string;
  /** Raw numbers for the comparison arrow; omit for no comparison. */
  now?: number; before?: number; upIsGood?: boolean; href?: string;
}) {
  let delta: React.ReactNode = null;
  if (now != null && before != null) {
    if (before === 0 && now === 0) delta = <span className="text-ink-muted inline-flex items-center gap-0.5"><Minus className="w-3.5 h-3.5" />no change</span>;
    else if (before === 0) delta = <span className="text-ink-muted">new this period</span>;
    else {
      const pct = Math.round(((now - before) / Math.abs(before)) * 100);
      const good = pct === 0 ? null : (pct > 0) === upIsGood;
      const Icon = pct > 0 ? ArrowUp : pct < 0 ? ArrowDown : Minus;
      delta = (
        <span className={`inline-flex items-center gap-0.5 font-medium ${good == null ? "text-ink-muted" : good ? "o-up" : "o-down"}`}>
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />{Math.abs(pct)}%<span className="font-normal text-ink-muted ml-1">vs previous</span>
        </span>
      );
    }
  }
  const body = (
    <>
      <p className="o-kpi-label">{label}</p>
      <p className="o-kpi-value">{value}</p>
      <p className="o-kpi-sub truncate">{delta ?? sub ?? " "}</p>
      {delta && sub && <p className="o-kpi-sub truncate">{sub}</p>}
    </>
  );
  return href
    ? <a href={href} className="o-kpi block hover:border-line-strong transition-colors">{body}</a>
    : <div className="o-kpi">{body}</div>;
}

/* ─── Graph view ────────────────────────────────────────────────────────── */

export function GraphView({
  title, rows, series, measures, types = ["bar", "line", "pie"], defaultType = "bar",
  height = 260, empty = "No data for this period.", stacked = false, note, format: formatProp,
}: {
  title: string;
  rows: Row[];
  /** Two or more = grouped (or stacked) series; one = a single measure picked by `measures`. */
  series?: Series[];
  /** Selectable measures for single-series charts (keys into Row.values). */
  measures?: Measure[];
  types?: ChartType[];
  defaultType?: ChartType;
  height?: number;
  empty?: string;
  stacked?: boolean;
  note?: React.ReactNode;
  /** Value formatter for multi-series charts (single-measure charts use the measure's). */
  format?: (v: number) => string;
}) {
  const [type, setType] = useState<ChartType>(defaultType);
  const [view, setView] = useState<"graph" | "pivot">("graph");
  const [measureKey, setMeasureKey] = useState(measures?.[0]?.key ?? "");

  const measure = measures?.find((m) => m.key === measureKey) ?? measures?.[0];
  const activeSeries: Series[] = series && series.length > 0 ? series : measure ? [{ key: measure.key, label: measure.label }] : [];
  const format = (series && series.length > 0 ? formatProp : measure?.format) ?? formatProp ?? fmtDefault;
  const total = rows.reduce((t, r) => t + activeSeries.reduce((s, x) => s + (r.values[x.key] ?? 0), 0), 0);
  const hasData = rows.length > 0 && rows.some((r) => activeSeries.some((x) => (r.values[x.key] ?? 0) !== 0));
  // A pie of several series has no meaning; offer it only for one.
  const allowed = types.filter((t) => t !== "pie" || activeSeries.length === 1);
  const shown = allowed.includes(type) ? type : allowed[0];

  return (
    <section className="c-panel flex flex-col">
      <div className="c-panel-head flex-wrap">
        <h3 className="c-panel-title">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {measures && measures.length > 1 && (!series || series.length === 0) && (
            <select aria-label="Measure" className="c-select h-[2.125rem]" value={measure?.key} onChange={(e) => setMeasureKey(e.target.value)}>
              {measures.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          )}
          {view === "graph" && allowed.length > 1 && (
            <div className="o-seg" role="group" aria-label="Chart type">
              {allowed.map((t) => {
                const Icon = t === "bar" ? BarChart3 : t === "line" ? LineChart : PieChart;
                return (
                  <button key={t} type="button" aria-pressed={shown === t} title={`${t[0].toUpperCase()}${t.slice(1)} chart`} onClick={() => setType(t)}>
                    <Icon className="w-4 h-4" /><span className="sr-only">{t}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="o-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "graph"} onClick={() => setView("graph")} title="Graph"><BarChart3 className="w-4 h-4" />Graph</button>
            <button type="button" aria-pressed={view === "pivot"} onClick={() => setView("pivot")} title="Pivot"><Table2 className="w-4 h-4" />Pivot</button>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        {!hasData ? (
          <p className="flex items-center justify-center text-[14px] text-ink-muted" style={{ height: Math.min(height, 120) }}>{empty}</p>
        ) : view === "pivot" ? (
          <Pivot rows={rows} series={activeSeries} format={format} />
        ) : shown === "pie" ? (
          <Pie rows={rows} s={activeSeries[0]} format={format} total={total} height={height} />
        ) : (
          <Cartesian rows={rows} series={activeSeries} format={format} type={shown} height={height} stacked={stacked} />
        )}
        {activeSeries.length > 1 && view === "graph" && hasData && <Legend series={activeSeries} />}
        {note && <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{note}</p>}
      </div>
    </section>
  );
}

function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[13px] text-ink-soft">
      {series.map((s, i) => (
        <li key={s.key} className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px]" style={{ background: SERIES_VAR(i) }} aria-hidden="true" />{s.label}
        </li>
      ))}
    </ul>
  );
}

function Cartesian({ rows, series, format, type, height, stacked }: {
  rows: Row[]; series: Series[]; format: (v: number) => string; type: "bar" | "line"; height: number; stacked: boolean;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const M = { top: 12, right: 12, bottom: 30, left: 52 };
  const W = Math.max(width, 240);
  const iw = W - M.left - M.right;
  const ih = height - M.top - M.bottom;

  const stackIt = stacked && type === "bar" && series.length > 1;
  const maxV = Math.max(0, ...rows.map((r) => stackIt
    ? series.reduce((t, s) => t + Math.max(0, r.values[s.key] ?? 0), 0)
    : Math.max(...series.map((s) => r.values[s.key] ?? 0))));
  const { top, step } = niceMax(maxV);
  const y = (v: number) => M.top + ih - (v / top) * ih;
  const band = iw / Math.max(1, rows.length);
  const xCenter = (i: number) => M.left + band * i + band / 2;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  // Category labels never collide: size them to the longest label, thin
  // them out when the bands are narrow, then cut each to its slot.
  const CH = 6.8; // ~px per character at 12px
  const longest = Math.min(16, Math.max(...rows.map((r) => r.label.length)));
  const every = Math.max(1, Math.ceil((longest * CH + 10) / band));
  const fit = Math.max(3, Math.floor((band * every - 8) / CH));
  const clip = (t: string) => (t.length > fit ? `${t.slice(0, Math.max(1, fit - 1))}…` : t);

  const groupW = Math.min(band * 0.72, stackIt ? 24 : 24 * series.length + 2 * (series.length - 1));
  const barW = stackIt ? groupW : Math.max(2, (groupW - 2 * (series.length - 1)) / series.length);

  const h = hover != null ? rows[hover] : null;

  return (
    <div ref={ref} className="relative select-none" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={W} height={height} role="img" aria-label="Chart" className="block overflow-visible">
          {/* grid + y axis */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} style={{ stroke: "var(--o-grid)" }} strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" style={{ fill: "var(--o-muted)", fontSize: 12 }}>{compact(t)}</text>
            </g>
          ))}
          <line x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} style={{ stroke: "var(--o-line-strong)" }} strokeWidth={1} />

          {/* hover band */}
          {hover != null && <rect x={M.left + band * hover} y={M.top} width={band} height={ih} style={{ fill: "var(--o-hover)" }} />}

          {type === "bar" && rows.map((r, i) => {
            let acc = 0;
            return series.map((s, si) => {
              const v = Math.max(0, r.values[s.key] ?? 0);
              const x0 = xCenter(i) - groupW / 2 + (stackIt ? 0 : si * (barW + 2));
              const yTop = y(stackIt ? acc + v : v);
              const yBase = y(stackIt ? acc : 0);
              acc += v;
              const hgt = Math.max(0, yBase - yTop - (stackIt && si > 0 ? 2 : 0));
              if (hgt <= 0) return null;
              const rTop = stackIt && si < series.length - 1 ? 0 : Math.min(4, barW / 2, hgt);
              return <path key={s.key} d={roundTop(x0, yTop, barW, hgt, rTop)} style={{ fill: SERIES_VAR(si), opacity: hover == null || hover === i ? 1 : 0.45 }} />;
            });
          })}

          {type === "line" && series.map((s, si) => {
            const pts = rows.map((r, i) => [xCenter(i), y(r.values[s.key] ?? 0)] as const);
            return (
              <g key={s.key}>
                <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" style={{ stroke: SERIES_VAR(si) }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {pts.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r={hover === i ? 5 : 4} style={{ fill: SERIES_VAR(si), stroke: "var(--o-surface)" }} strokeWidth={2} />
                ))}
              </g>
            );
          })}

          {/* x labels */}
          {rows.map((r, i) => i % every === 0 && (
            <text key={i} x={xCenter(i)} y={height - 10} textAnchor="middle" style={{ fill: "var(--o-muted)", fontSize: 12 }}>
              {clip(r.label)}
            </text>
          ))}

          {/* hit targets: the whole band, larger than any mark */}
          {rows.map((r, i) => (
            <rect key={i} x={M.left + band * i} y={M.top} width={band} height={ih} fill="transparent"
              onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${r.label}: ${series.map((s) => `${s.label} ${format(r.values[s.key] ?? 0)}`).join(", ")}`} />
          ))}
        </svg>
      )}
      {h && hover != null && (
        <div className="o-tooltip" style={{ left: Math.min(Math.max(xCenter(hover) - 80, 0), W - 180), top: 0 }}>
          <p className="font-semibold mb-1">{h.label}</p>
          {series.map((s, si) => (
            <p key={s.key} className="flex items-center gap-2 justify-between">
              <span className="inline-flex items-center gap-1.5 text-ink-muted">
                {series.length > 1 && <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: SERIES_VAR(si) }} />}{s.label}
              </span>
              <span className="font-semibold tabular-nums">{format(h.values[s.key] ?? 0)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** A bar with a rounded data end and a square baseline. */
function roundTop(x: number, y: number, w: number, h: number, r: number): string {
  if (r <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function Pie({ rows, s, format, total, height }: { rows: Row[]; s: Series; format: (v: number) => string; total: number; height: number }) {
  const [hover, setHover] = useState<number | null>(null);
  // Six slices at most; the rest fold into "Other" rather than inventing hues.
  const slices = useMemo(() => {
    const sorted = rows.map((r) => ({ label: r.label, v: Math.max(0, r.values[s.key] ?? 0) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
    if (sorted.length <= 6) return sorted;
    const rest = sorted.slice(5).reduce((t, x) => t + x.v, 0);
    return [...sorted.slice(0, 5), { label: "Other", v: rest }];
  }, [rows, s.key]);

  const R = Math.min(height / 2 - 8, 110);
  const cx = R + 8, cy = height / 2;
  // Each slice's start angle is the running total of the ones before it.
  const starts = slices.map((_, i) => -Math.PI / 2 + slices.slice(0, i).reduce((t, x) => t + (x.v / total) * Math.PI * 2, 0));
  const arcs = slices.map((sl, i) => {
    const a0 = starts[i];
    const a1 = a0 + (sl.v / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a: number, r: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    return slices.length === 1
      ? `M${cx - R},${cy}a${R},${R} 0 1,0 ${2 * R},0a${R},${R} 0 1,0 ${-2 * R},0`
      : `M${cx},${cy}L${p(a0, R)}A${R},${R} 0 ${large} 1 ${p(a1, R)}Z`;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={2 * R + 16} height={height} role="img" aria-label={`${s.label} split`}>
        {arcs.map((d, i) => (
          <path key={i} d={d} style={{ fill: SERIES_VAR(i), stroke: "var(--o-surface)", opacity: hover == null || hover === i ? 1 : 0.5 }} strokeWidth={2}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
      <ul className="space-y-1.5 text-[14px] min-w-[12rem] flex-1">
        {slices.map((sl, i) => (
          <li key={sl.label} className={`flex items-center gap-2 rounded px-1.5 py-0.5 ${hover === i ? "bg-paper-deep" : ""}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ background: SERIES_VAR(i) }} />
            <span className="flex-1 truncate text-ink-soft">{sl.label}</span>
            <span className="tabular-nums font-semibold text-ink">{format(sl.v)}</span>
            <span className="tabular-nums text-ink-muted w-12 text-right">{Math.round((sl.v / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pivot({ rows, series, format }: { rows: Row[]; series: Series[]; format: (v: number) => string }) {
  const totals = series.map((s) => rows.reduce((t, r) => t + (r.values[s.key] ?? 0), 0));
  return (
    <div className="overflow-x-auto">
      <table className="c-table">
        <thead>
          <tr><th />{series.map((s) => <th key={s.key} className="text-right">{s.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="font-medium text-ink">{r.label}</td>
              {series.map((s) => <td key={s.key} className="text-right tabular-nums">{format(r.values[s.key] ?? 0)}</td>)}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td>Total</td>{totals.map((t, i) => <td key={series[i].key} className="text-right tabular-nums">{format(t)}</td>)}</tr>
        </tfoot>
      </table>
    </div>
  );
}
