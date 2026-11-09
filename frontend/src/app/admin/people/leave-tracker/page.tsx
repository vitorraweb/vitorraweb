"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Download, FileText, ChevronDown, ChevronRight, CalendarRange } from "lucide-react";
import { apiAdmin, downloadCsv, downloadFile } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { personColour } from "@/components/people/LeaveCalendar";

/* ─── People → Leave tracker ──────────────────────────────────────────────────
   Operations' one-screen view of everyone's leave for a year: entitlement,
   days taken by type, days still awaiting signatures, what is left, and who is
   away now or next. Open a row for that person's requests; print a leave form
   with their details already filled in. Each person keeps the same colour as
   on the leave calendar.                                                   */

type Span = { start_date: string; end_date: string; type: string; working_days: number } | null;
type Row = {
  id: number; name: string; job_title: string | null; department: string | null; supervisor: string | null; colour: number;
  entitlement: number; taken: Record<string, number>; total_taken: number; pending_days: number; pending_count: number;
  annual_left: number; current: Span; next: Span;
};
type Data = { year: number; rows: Row[]; departments: Record<string, string>; types: string[] };
type Req = { id: number; type: string; start_date: string; end_date: string; working_days: number; status: string; reason: string | null; awaiting: string[]; approvals: { label: string; by: string | null; decision: string }[] };

const TYPE_LABEL: Record<string, string> = { annual: "Annual", sick: "Sick", unpaid: "Unpaid", compassionate: "Compassionate", maternity: "Maternity" };
const STATUS_TONE: Record<string, string> = { approved: "ok", pending: "gold", declined: "red", cancelled: "muted" };
const short = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function LeaveTrackerPage() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [only, setOnly] = useState<"" | "away" | "pending" | "low">("");
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(""); setData(null);
    try { setData((await apiAdmin<{ data: Data }>(`/admin/people/leave-tracker?year=${year}`)).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
  }, [year]);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => (data?.rows ?? []).filter((r) => {
    if (q && !`${r.name} ${r.job_title ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (dept && r.department !== dept) return false;
    if (only === "away" && !r.current) return false;
    if (only === "pending" && r.pending_count === 0) return false;
    if (only === "low" && r.annual_left > 3) return false;
    return true;
  }), [data, q, dept, only]);

  const totals = useMemo(() => {
    const all = data?.rows ?? [];
    return {
      staff: all.length,
      away: all.filter((r) => r.current).length,
      pending: all.reduce((n, r) => n + r.pending_count, 0),
      taken: all.reduce((n, r) => n + r.total_taken, 0),
    };
  }, [data]);

  return (
    <div className="pb-12">
      <PageHeader
        title="Leave tracker"
        subtitle="Every employee's leave for the year: entitled, taken, awaiting signatures and left. Worked out from the leave requests themselves."
        actions={<>
          <Link href="/admin/people/calendar" className="c-btn"><CalendarRange className="w-4 h-4" />Calendar</Link>
          <button className="c-btn" onClick={blankForm}><FileText className="w-4 h-4" />Blank leave form</button>
          <button className="c-btn c-btn-primary" onClick={() => downloadCsv(`/admin/people/leave-tracker/export?year=${year}`, `leave-tracker-${year}.csv`)}><Download className="w-4 h-4" />Export</button>
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <Tile label="Staff tracked" value={totals.staff} />
        <Tile label="Away today" value={totals.away} onClick={() => setOnly(only === "away" ? "" : "away")} active={only === "away"} />
        <Tile label="Requests awaiting signatures" value={totals.pending} onClick={() => setOnly(only === "pending" ? "" : "pending")} active={only === "pending"} />
        <Tile label={`Days taken in ${year}`} value={totals.taken} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 mb-3">
        <label className="relative flex-1 min-w-[14rem] max-w-sm">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="c-input w-full pl-8" placeholder="Search name or job" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="c-select" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {Object.entries(data?.departments ?? {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="c-select" value={only} onChange={(e) => setOnly(e.target.value as typeof only)} aria-label="Show">
          <option value="">Everyone</option>
          <option value="away">Away today</option>
          <option value="pending">Awaiting signatures</option>
          <option value="low">3 or fewer annual days left</option>
        </select>
        <select className="c-select" value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">
          {[thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error ? <p className="text-[13px] text-alert-ink">{error}</p>
        : !data ? <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
        : (
          <div className="c-panel overflow-x-auto">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th>
                  <th className="text-right">Entitled</th><th className="text-right">Annual taken</th><th className="text-right">Awaiting</th>
                  <th style={{ minWidth: "11rem" }}>Annual left</th>
                  <th className="text-right">Sick</th><th className="text-right">Other</th>
                  <th>Now / next</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={10} className="text-ink-muted">Nobody matches.</td></tr>}
                {rows.map((r) => {
                  const colour = personColour(r.colour);
                  const other = r.total_taken - (r.taken.annual ?? 0) - (r.taken.sick ?? 0);
                  const usedPct = r.entitlement ? Math.min(100, ((r.taken.annual ?? 0) / r.entitlement) * 100) : 0;
                  const pendPct = r.entitlement ? Math.min(100 - usedPct, (Math.max(0, r.entitlement - (r.taken.annual ?? 0) - r.annual_left) / r.entitlement) * 100) : 0;
                  const isOpen = open === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr className="c-row cursor-pointer" data-open={isOpen} onClick={() => setOpen(isOpen ? null : r.id)}>
                        <td style={{ boxShadow: `inset 4px 0 0 ${colour}` }}>
                          <span className="flex items-center gap-1.5 font-semibold text-ink">
                            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />}
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colour }} />{r.name}
                          </span>
                          <span className="block text-[12.5px] text-ink-muted pl-[1.6rem]">{r.job_title ?? "No job title"}{r.supervisor ? ` · reports to ${r.supervisor}` : ""}</span>
                        </td>
                        <td>{r.department ? data.departments[r.department] ?? r.department : "—"}</td>
                        <td className="text-right tabular-nums">{r.entitlement}</td>
                        <td className="text-right tabular-nums">{r.taken.annual ?? 0}</td>
                        <td className="text-right tabular-nums">{r.pending_days ? <span className="c-chip" data-tone="gold">{r.pending_days}</span> : "—"}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "var(--o-surface-2)" }} aria-hidden>
                              <span style={{ width: `${usedPct}%`, background: colour }} />
                              <span style={{ width: `${pendPct}%`, background: `repeating-linear-gradient(45deg, ${colour} 0 3px, transparent 3px 6px)` }} />
                            </div>
                            <span className="tabular-nums font-semibold w-6 text-right" style={{ color: r.annual_left <= 3 ? "var(--o-danger)" : "var(--o-text)" }}>{r.annual_left}</span>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">{r.taken.sick || "—"}</td>
                        <td className="text-right tabular-nums">{other || "—"}</td>
                        <td className="whitespace-nowrap text-[13px]">
                          {r.current ? <span className="c-chip" data-tone="blue">Away until {short(r.current.end_date)}</span>
                            : r.next ? <span className="text-ink-soft">Next: {short(r.next.start_date)} – {short(r.next.end_date)}</span>
                            : <span className="text-ink-muted">In office</span>}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button className="c-btn c-btn-ghost" title="Leave form with this person's details"
                            onClick={() => downloadFile(`/admin/people/employees/${r.id}/leave-form`, `leave-form-${slug(r.name)}.pdf`).catch(() => {})}>
                            <FileText className="w-4 h-4" />Form
                          </button>
                        </td>
                      </tr>
                      {isOpen && <tr><td colSpan={10} style={{ background: "var(--o-surface-2)" }}><History userId={r.id} year={year} /></td></tr>}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      <p className="mt-3 text-[12.5px] text-ink-muted">
        &ldquo;Annual left&rdquo; counts approved days and days still awaiting signatures, so it matches what the person sees when they apply. Weekends and Uganda public holidays are never counted.
      </p>
    </div>
  );

  function blankForm() {
    // Any staff session may print the blank form; the console carries one.
    downloadFile("/staff/leave/form?blank=1", "leave-application-form.pdf").catch(() => {});
  }
}

function Tile({ label, value, onClick, active }: { label: string; value: number; onClick?: () => void; active?: boolean }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className="c-panel px-4 py-3 text-left" style={active ? { outline: "2px solid var(--o-accent)" } : undefined}>
      <span className="block text-[12.5px] text-ink-muted">{label}</span>
      <span className="block text-[22px] font-semibold tabular-nums text-ink">{value}</span>
    </Tag>
  );
}

/* One person's requests that year, with where each one has got to. */
function History({ userId, year }: { userId: number; year: number }) {
  const [list, setList] = useState<Req[] | null>(null);
  useEffect(() => {
    apiAdmin<{ data: Req[] }>(`/admin/leave?user_id=${userId}&year=${year}`).then((r) => setList(r.data)).catch(() => setList([]));
  }, [userId, year]);

  if (list === null) return <p className="flex items-center gap-2 text-[13px] text-ink-muted py-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>;
  if (list.length === 0) return <p className="text-[13px] text-ink-muted py-2">No leave requests in {year}.</p>;

  return (
    <table className="w-full text-[13px]">
      <tbody>
        {list.map((l) => (
          <tr key={l.id} className="border-b last:border-0" style={{ borderColor: "var(--o-line)" }}>
            <td className="py-2 pr-3 whitespace-nowrap font-medium text-ink">{short(l.start_date)} – {short(l.end_date)}</td>
            <td className="py-2 pr-3">{TYPE_LABEL[l.type] ?? l.type}</td>
            <td className="py-2 pr-3 tabular-nums">{l.working_days} day{l.working_days === 1 ? "" : "s"}</td>
            <td className="py-2 pr-3"><span className="c-chip" data-tone={STATUS_TONE[l.status] ?? "muted"}>{l.status}</span></td>
            <td className="py-2 pr-3 text-ink-muted">
              {l.status === "pending" && l.awaiting.length ? `Awaiting ${l.awaiting.join(" + ")}` : l.approvals.map((a) => `${a.label}: ${a.by ?? "—"}`).join(" · ")}
              {l.reason ? <span className="block truncate max-w-[22rem]">{l.reason}</span> : null}
            </td>
            <td className="py-2 text-right">
              <button className="c-btn c-btn-ghost" onClick={() => downloadFile(`/admin/leave/${l.id}/form`, `leave-form-${l.id}.pdf`).catch(() => {})}><FileText className="w-4 h-4" />Form</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
