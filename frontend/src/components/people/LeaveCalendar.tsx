"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

/* ─── Team leave calendar ──────────────────────────────────────────────────────
   One row per person on leave that month, one column per day. Weekends are
   shaded, public holidays and company events are marked across the top.
   HR (People → Leave calendar) sees every request with its type, pending ones
   striped; staff see only approved leave in their own department, with no
   type — sick leave stays private.                                        */

type LeaveRow = { id: number; user_id: number; name: string | null; department: string | null; start_date: string; end_date: string; working_days: number; type?: string; status?: string };
type Data = { month: string; leave: LeaveRow[]; holidays: { name: string; date: string }[]; events: { title: string; start_date: string; end_date: string; blocks_leave: boolean }[] };

const TYPE_COLOR: Record<string, string> = {
  annual: "var(--o-series-1)", sick: "var(--o-series-4)", unpaid: "var(--o-series-6)", compassionate: "var(--o-series-3)", maternity: "var(--o-series-5)",
};
const TYPE_LABEL: Record<string, string> = { annual: "Annual", sick: "Sick", unpaid: "Unpaid", compassionate: "Compassionate", maternity: "Maternity" };

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function LeaveCalendar({ fetcher, endpoint, showTypes = false }: {
  fetcher: <T>(path: string) => Promise<T>;
  endpoint: string;
  showTypes?: boolean;
}) {
  const [month, setMonth] = useState(() => ym(new Date()));
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setData((await fetcher<{ data: Data }>(`${endpoint}?month=${month}`)).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
  }, [fetcher, endpoint, month]);
  useEffect(() => { load(); }, [load]);

  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const todayIso = iso(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  const shift = (n: number) => setMonth(ym(new Date(y, m - 1 + n, 1)));

  const holidayOn = useMemo(() => new Map((data?.holidays ?? []).map((h) => [h.date, h.name])), [data]);
  const eventOn = (d: string) => (data?.events ?? []).find((e) => e.start_date <= d && e.end_date >= d);

  // One row per person, their requests side by side.
  const people = useMemo(() => {
    const map = new Map<number, { name: string; department: string | null; leave: LeaveRow[] }>();
    for (const l of data?.leave ?? []) {
      const p = map.get(l.user_id) ?? { name: l.name ?? "—", department: l.department, leave: [] };
      p.leave.push(l); map.set(l.user_id, p);
    }
    return [...map.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [data]);

  const label = new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="c-panel">
      <div className="c-panel-head flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button className="c-btn c-btn-ghost" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
          <span className="c-panel-title min-w-[9.5rem] text-center">{label}</span>
          <button className="c-btn c-btn-ghost" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
          {month !== ym(new Date()) && <button className="c-btn ml-1" onClick={() => setMonth(ym(new Date()))}>This month</button>}
        </div>
        {showTypes && (
          <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-ink-muted">
            {Object.entries(TYPE_LABEL).map(([k, v]) => <span key={k} className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: TYPE_COLOR[k] }} />{v}</span>)}
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "repeating-linear-gradient(45deg, var(--o-series-1) 0 3px, transparent 3px 6px)" }} />Awaiting signatures</span>
          </div>
        )}
      </div>

      {error ? <p className="px-4 py-5 text-[13px] text-alert-ink">{error}</p>
        : !data ? <p className="px-4 py-5 flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
        : (
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
                {people.map(([id, p]) => (
                  <tr key={id} className="border-t" style={{ borderColor: "var(--o-line)" }}>
                    <td className="sticky left-0 z-10 px-3 py-1.5" style={{ background: "var(--o-surface)" }}>
                      <span className="block font-semibold text-[13px] truncate" style={{ color: "var(--o-text)" }}>{p.name}</span>
                      {p.department && <span className="block text-[11.5px] capitalize" style={{ color: "var(--o-faint)" }}>{p.department}</span>}
                    </td>
                    {Array.from({ length: days }, (_, i) => {
                      const d = iso(y, m, i + 1); const dow = new Date(y, m - 1, i + 1).getDay();
                      const l = p.leave.find((x) => x.start_date <= d && x.end_date >= d);
                      const off = dow === 0 || dow === 6 || holidayOn.has(d);
                      const color = TYPE_COLOR[l?.type ?? "annual"];
                      return (
                        <td key={d} className="p-0.5" style={{ background: off ? "var(--o-surface-2)" : undefined }}>
                          {l && !off && (
                            <span
                              title={`${p.name}: ${l.start_date} → ${l.end_date}${showTypes && l.type ? ` · ${TYPE_LABEL[l.type] ?? l.type}` : ""}${l.status === "pending" ? " · awaiting signatures" : ""}`}
                              className="block h-6 rounded-sm"
                              style={{ background: l.status === "pending" ? `repeating-linear-gradient(45deg, ${color} 0 3px, transparent 3px 6px)` : color, border: l.status === "pending" ? `1px solid ${color}` : undefined }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.holidays.length > 0 || data.events.length > 0) && (
              <div className="px-4 py-3 border-t flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]" style={{ borderColor: "var(--o-line)", color: "var(--o-muted)" }}>
                {data.holidays.map((h) => <span key={h.date}><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: "var(--o-danger-bg)", border: "1px solid var(--o-danger)" }} />{new Date(h.date).getDate()} — {h.name}</span>)}
                {data.events.map((e) => <span key={e.title + e.start_date}><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: "var(--o-info-bg)", border: "1px solid var(--o-info)" }} />{e.title}{e.blocks_leave ? " (no leave)" : ""}</span>)}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
