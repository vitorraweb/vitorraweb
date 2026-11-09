"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, GanttChart } from "lucide-react";

/* ─── Team leave calendar ──────────────────────────────────────────────────────
   Every person has their own colour (the API's `colour`, the same number on
   every screen and on the leave tracker), so who is away reads at a glance.
   Two views:
     - Month: a wall-calendar grid, each day listing who is off as a coloured
       name chip;
     - Timeline: one row per person, one column per day.
   Weekends and public holidays are shaded, company events marked. HR
   (People → Leave calendar) sees every request with its type, pending ones
   striped; staff see only approved leave in their own department, with no
   type, because sick leave stays private.                                  */

type LeaveRow = { id: number; user_id: number; colour?: number; name: string | null; department: string | null; start_date: string; end_date: string; working_days: number; type?: string; status?: string };
type Data = { month: string; leave: LeaveRow[]; holidays: { name: string; date: string }[]; events: { title: string; start_date: string; end_date: string; blocks_leave: boolean }[] };

const TYPE_LABEL: Record<string, string> = { annual: "Annual", sick: "Sick", unpaid: "Unpaid", compassionate: "Compassionate", maternity: "Maternity" };
const TYPE_SHORT: Record<string, string> = { annual: "A", sick: "S", unpaid: "U", compassionate: "C", maternity: "M" };

/** The console colour for a person (twelve tokens, `--o-person-0` to `-11`). */
export const personColour = (n: number | undefined) => `var(--o-person-${(n ?? 0) % 12})`;

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const fill = (colour: string, pending: boolean) => pending ? `repeating-linear-gradient(45deg, ${colour} 0 3px, transparent 3px 6px)` : colour;

type Person = { id: number; name: string; department: string | null; colour: string; leave: LeaveRow[] };

export function LeaveCalendar({ fetcher, endpoint, showTypes = false }: {
  fetcher: <T>(path: string) => Promise<T>;
  endpoint: string;
  showTypes?: boolean;
}) {
  const [month, setMonth] = useState(() => ym(new Date()));
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"month" | "timeline">("month");
  // The last view this browser used (after mount, so the server render matches).
  useEffect(() => {
    try { if (localStorage.getItem("leave-calendar-view") === "timeline") setView("timeline"); } catch { /* private mode */ }
  }, []);
  const [focus, setFocus] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError("");
    try { setData((await fetcher<{ data: Data }>(`${endpoint}?month=${month}`)).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
  }, [fetcher, endpoint, month]);
  useEffect(() => { load(); }, [load]);

  const pickView = (v: "month" | "timeline") => { setView(v); try { localStorage.setItem("leave-calendar-view", v); } catch { /* */ } };

  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const now = new Date();
  const todayIso = iso(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const shift = (n: number) => setMonth(ym(new Date(y, m - 1 + n, 1)));

  const holidayOn = useMemo(() => new Map((data?.holidays ?? []).map((h) => [h.date, h.name])), [data]);
  const eventOn = (d: string) => (data?.events ?? []).find((e) => e.start_date <= d && e.end_date >= d);

  // One entry per person, with their colour and their requests.
  const people = useMemo<Person[]>(() => {
    const map = new Map<number, Person>();
    for (const l of data?.leave ?? []) {
      const p = map.get(l.user_id) ?? { id: l.user_id, name: l.name ?? "—", department: l.department, colour: personColour(l.colour ?? l.user_id), leave: [] };
      p.leave.push(l); map.set(l.user_id, p);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const label = new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const tip = (p: Person, l: LeaveRow) =>
    `${p.name}: ${l.start_date} → ${l.end_date} (${l.working_days} working day${l.working_days === 1 ? "" : "s"})${showTypes && l.type ? ` · ${TYPE_LABEL[l.type] ?? l.type}` : ""}${l.status === "pending" ? " · awaiting signatures" : ""}`;
  const dim = (id: number) => (focus !== null && focus !== id ? 0.18 : 1);

  return (
    <div className="c-panel">
      <div className="c-panel-head flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button className="c-btn c-btn-ghost" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
          <span className="c-panel-title min-w-[9.5rem] text-center">{label}</span>
          <button className="c-btn c-btn-ghost" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
          {month !== ym(new Date()) && <button className="c-btn ml-1" onClick={() => setMonth(ym(new Date()))}>This month</button>}
        </div>
        <div className="flex items-center gap-1" role="tablist" aria-label="Calendar view">
          <button role="tab" aria-selected={view === "month"} className={`c-btn ${view === "month" ? "c-btn-primary" : ""}`} onClick={() => pickView("month")}><CalendarDays className="w-4 h-4" />Month</button>
          <button role="tab" aria-selected={view === "timeline"} className={`c-btn ${view === "timeline" ? "c-btn-primary" : ""}`} onClick={() => pickView("timeline")}><GanttChart className="w-4 h-4" />Timeline</button>
        </div>
      </div>

      {/* Who's who: each person's colour. Click a name to pick them out. */}
      {data && people.length > 0 && (
        <div className="px-4 py-2.5 border-b flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px]" style={{ borderColor: "var(--o-line)", color: "var(--o-muted)" }}>
          {people.map((p) => (
            <button key={p.id} onClick={() => setFocus(focus === p.id ? null : p.id)} aria-pressed={focus === p.id}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 transition-opacity"
              style={{ opacity: dim(p.id), border: `1px solid ${focus === p.id ? p.colour : "var(--o-line)"}`, color: "var(--o-text)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.colour }} />{p.name}
            </button>
          ))}
          {focus !== null && <button className="c-btn c-btn-ghost" onClick={() => setFocus(null)}>Show everyone</button>}
          <span className="ml-auto inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: fill("var(--o-muted)", true), border: "1px solid var(--o-muted)" }} />Awaiting signatures</span>
            {showTypes && <span>A annual · S sick · U unpaid · C compassionate · M maternity</span>}
          </span>
        </div>
      )}

      {error ? <p className="px-4 py-5 text-[13px] text-alert-ink">{error}</p>
        : !data ? <p className="px-4 py-5 flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
        : view === "month" ? (
          <MonthGrid y={y} m={m} days={days} todayIso={todayIso} people={people} holidayOn={holidayOn} eventOn={eventOn} showTypes={showTypes} tip={tip} dim={dim} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed text-[12px]" style={{ minWidth: `${12 + days * 1.9}rem` }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 text-left font-semibold px-3 py-2" style={{ width: "12rem", background: "var(--o-surface)", color: "var(--o-text)" }}>Person</th>
                  {Array.from({ length: days }, (_, i) => {
                    const d = iso(y, m, i + 1); const dow = new Date(y, m - 1, i + 1).getDay();
                    const hol = holidayOn.get(d); const ev = eventOn(d);
                    return (
                      <th key={d} title={hol ?? ev?.title ?? undefined} className="font-medium py-1 text-center" style={{
                        color: d === todayIso ? "var(--o-accent-text)" : "var(--o-muted)",
                        background: hol ? "var(--o-danger-bg)" : ev ? "var(--o-info-bg)" : dow === 0 || dow === 6 ? "var(--o-surface-2)" : undefined,
                      }}>
                        <span className="block text-[10px]">{"SMTWTFS"[dow]}</span>
                        <span className={d === todayIso ? "font-bold" : ""}>{i + 1}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {people.length === 0 && (
                  <tr><td colSpan={days + 1} className="px-3 py-6 text-center text-ink-muted text-[13px]">Nobody is away this month.</td></tr>
                )}
                {people.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: "var(--o-line)", opacity: dim(p.id) }}>
                    <td className="sticky left-0 z-10 px-3 py-1.5" style={{ background: "var(--o-surface)", boxShadow: `inset 4px 0 0 ${p.colour}` }}>
                      <span className="block font-semibold text-[13px] truncate pl-1" style={{ color: "var(--o-text)" }}>{p.name}</span>
                      {p.department && <span className="block text-[11.5px] capitalize pl-1" style={{ color: "var(--o-faint)" }}>{p.department}</span>}
                    </td>
                    {Array.from({ length: days }, (_, i) => {
                      const d = iso(y, m, i + 1); const dow = new Date(y, m - 1, i + 1).getDay();
                      const l = p.leave.find((x) => x.start_date <= d && x.end_date >= d);
                      const off = dow === 0 || dow === 6 || holidayOn.has(d);
                      const pending = l?.status === "pending";
                      return (
                        <td key={d} className="p-0.5" style={{ background: off ? "var(--o-surface-2)" : undefined }}>
                          {l && !off && (
                            <span title={tip(p, l)} className="flex items-center justify-center h-6 rounded-sm text-[10px] font-bold"
                              style={{ background: fill(p.colour, pending), border: pending ? `1px solid ${p.colour}` : undefined, color: pending ? "var(--o-text)" : "#fff" }}>
                              {showTypes && l.type ? TYPE_SHORT[l.type] : ""}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {data && (data.holidays.length > 0 || data.events.length > 0) && (
        <div className="px-4 py-3 border-t flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]" style={{ borderColor: "var(--o-line)", color: "var(--o-muted)" }}>
          {data.holidays.map((h) => <span key={h.date}><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: "var(--o-danger-bg)", border: "1px solid var(--o-danger)" }} />{new Date(h.date).getDate()} — {h.name}</span>)}
          {data.events.map((e) => <span key={e.title + e.start_date}><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: "var(--o-info-bg)", border: "1px solid var(--o-info)" }} />{e.title}{e.blocks_leave ? " (no leave)" : ""}</span>)}
        </div>
      )}
    </div>
  );
}

/* Wall-calendar month, Monday first. Each working day lists who is off. */
function MonthGrid({ y, m, days, todayIso, people, holidayOn, eventOn, showTypes, tip, dim }: {
  y: number; m: number; days: number; todayIso: string; people: Person[];
  holidayOn: Map<string, string>; eventOn: (d: string) => { title: string } | undefined;
  showTypes: boolean; tip: (p: Person, l: LeaveRow) => string; dim: (id: number) => number;
}) {
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Monday = 0
  const cells = Math.ceil((lead + days) / 7) * 7;

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[46rem]" style={{ borderColor: "var(--o-line)" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-1.5 text-[11.5px] font-semibold border-b" style={{ color: "var(--o-muted)", borderColor: "var(--o-line)" }}>{d}</div>
        ))}
        {Array.from({ length: cells }, (_, i) => {
          const n = i - lead + 1;
          if (n < 1 || n > days) return <div key={i} className="border-b border-r min-h-[6.5rem]" style={{ borderColor: "var(--o-line)", background: "var(--o-surface-2)", opacity: 0.5 }} />;
          const d = iso(y, m, n);
          const dow = i % 7;
          const weekend = dow >= 5;
          const hol = holidayOn.get(d);
          const ev = eventOn(d);
          const away = weekend || hol ? [] : people.flatMap((p) => p.leave.filter((l) => l.start_date <= d && l.end_date >= d).map((l) => ({ p, l })));
          return (
            <div key={i} className="border-b border-r min-h-[6.5rem] p-1.5 flex flex-col gap-1" style={{ borderColor: "var(--o-line)", background: hol ? "var(--o-danger-bg)" : weekend ? "var(--o-surface-2)" : undefined }}>
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[12px] ${d === todayIso ? "font-bold rounded-full w-6 h-6 inline-flex items-center justify-center" : ""}`}
                  style={d === todayIso ? { background: "var(--o-inverse)", color: "#fff" } : { color: "var(--o-muted)" }}>{n}</span>
                {away.length > 0 && <span className="text-[10.5px]" style={{ color: "var(--o-faint)" }}>{away.length} away</span>}
              </div>
              {hol && <span className="text-[10.5px] font-semibold leading-tight" style={{ color: "var(--o-danger)" }}>{hol}</span>}
              {ev && !hol && <span className="text-[10.5px] leading-tight truncate" style={{ color: "var(--o-info)" }}>{ev.title}</span>}
              {away.map(({ p, l }) => {
                const pending = l.status === "pending";
                return (
                  <span key={l.id} title={tip(p, l)} className="block truncate rounded-sm px-1.5 py-0.5 text-[11px] font-semibold leading-tight transition-opacity"
                    style={{ opacity: dim(p.id), background: pending ? "var(--o-surface)" : p.colour, border: `1px ${pending ? "dashed" : "solid"} ${p.colour}`, color: pending ? p.colour : "#fff" }}>
                    {p.name.split(" ")[0]}{showTypes && l.type ? ` · ${TYPE_SHORT[l.type]}` : ""}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
