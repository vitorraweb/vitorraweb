"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Cake, PartyPopper, FileClock, Hourglass, PhoneOff, ClipboardX, CalendarCheck } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { GraphView, KpiTile } from "@/components/admin/reporting";

/* ─── People → Overview ───────────────────────────────────────────────────────
   The HR desk at a glance: who is away today and over the next two weeks,
   what is waiting (leave signatures, missing monthly reports, gaps in
   records), and what is coming up (probation ends, contract renewals,
   birthdays, work anniversaries).                                          */

type Person = { id: number; name: string; department: string | null; job_title: string | null };
type Away = { id: number; user_id: number; name: string; department: string | null; start_date: string; end_date: string; working_days: number };
type Overview = {
  headcount: number; by_department: Record<string, number>; department_labels: Record<string, string>;
  on_leave_today: Away[]; away_soon: Away[]; pending_leave: number;
  missing_reports: { period: string; people: Person[] };
  probation_ending: (Person & { date: string })[]; contracts_ending: (Person & { date: string })[];
  birthdays: (Person & { day: number })[]; anniversaries: (Person & { day: number; years: number })[];
  missing_emergency_contact: number;
};

const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const monthName = (p: string) => new Date(`${p}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long" });

export default function PeopleOverview() {
  const [d, setD] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { apiAdmin<{ data: Overview }>("/admin/people/overview").then((r) => setD(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Could not load")); }, []);

  return (
    <div className="pb-12">
      <PageHeader title="Overview" subtitle="Who is away, what is waiting on HR, and what is coming up." />

      {error && <p className="c-panel px-4 py-3 text-[14px] text-alert-ink">{error}</p>}
      {!d && !error && <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>}

      {d && (
        <div className="space-y-4 mt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile label="People on staff" value={String(d.headcount)} sub="Active, not including leavers" href="/admin/people/employees" />
            <KpiTile label="Away today" value={String(d.on_leave_today.length)} sub={`${d.away_soon.length} more in the next 2 weeks`} href="/admin/people/calendar" />
            <KpiTile label="Leave awaiting signatures" value={String(d.pending_leave)} sub="Operations + Finance sign" href="/admin/leave" />
            <KpiTile label={`${monthName(d.missing_reports.period)} reports missing`} value={String(d.missing_reports.people.length)} sub="Monthly reports not submitted" href="/admin/probation" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Panel title="Away now and soon" icon={CalendarCheck} href="/admin/people/calendar" link="Leave calendar">
              {d.on_leave_today.length + d.away_soon.length === 0 ? <Empty text="Everyone is in for the next two weeks." /> : (
                <ul className="divide-y divide-line">
                  {[...d.on_leave_today.map((a) => ({ ...a, now: true })), ...d.away_soon.map((a) => ({ ...a, now: false }))].map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
                      <span className="c-chip" data-tone={a.now ? "gold" : "muted"}>{a.now ? "Away" : "Soon"}</span>
                      <span className="font-semibold text-ink">{a.name}</span>
                      <span className="text-ink-muted capitalize hidden sm:inline">{a.department}</span>
                      <span className="ml-auto text-ink-muted whitespace-nowrap">{day(a.start_date)} → {day(a.end_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Needs HR" icon={ClipboardX}>
              <ul className="divide-y divide-line text-[14px]">
                <Row icon={Hourglass} label="Probation ending in the next 30 days" people={d.probation_ending.map((p) => `${p.name} (${day(p.date)})`)} href="/admin/probation" />
                <Row icon={FileClock} label="Contracts ending in the next 60 days" people={d.contracts_ending.map((p) => `${p.name} (${day(p.date)})`)} href="/admin/people/employees" />
                <Row icon={ClipboardX} label={`No ${monthName(d.missing_reports.period)} report`} people={d.missing_reports.people.map((p) => p.name)} href="/admin/probation" />
                <Row icon={PhoneOff} label="No emergency contact on file" count={d.missing_emergency_contact} href="/admin/people/employees" />
              </ul>
            </Panel>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <GraphView
              title="People by department"
              rows={Object.entries(d.by_department).map(([k, n]) => ({ label: d.department_labels[k] ?? "Not set", values: { n } }))}
              measures={[{ key: "n", label: "People" }]}
              types={["bar", "pie"]}
            />
            <Panel title="This month" icon={PartyPopper}>
              {d.birthdays.length + d.anniversaries.length === 0 ? <Empty text="No birthdays or work anniversaries this month (add birthdays in Employees)." /> : (
                <ul className="divide-y divide-line">
                  {d.birthdays.map((p) => (
                    <li key={`b${p.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[14px]"><Cake className="w-4 h-4 text-gold-ink" /><span className="font-semibold text-ink">{p.name}</span><span className="text-ink-muted">birthday</span><span className="ml-auto text-ink-muted">{p.day}</span></li>
                  ))}
                  {d.anniversaries.map((p) => (
                    <li key={`a${p.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[14px]"><PartyPopper className="w-4 h-4 text-gold-ink" /><span className="font-semibold text-ink">{p.name}</span><span className="text-ink-muted">{p.years} {p.years === 1 ? "year" : "years"} with Vitorra</span><span className="ml-auto text-ink-muted">{p.day}</span></li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, icon: Icon, href, link, children }: { title: string; icon: typeof Cake; href?: string; link?: string; children: React.ReactNode }) {
  return (
    <section className="c-panel">
      <div className="c-panel-head">
        <h3 className="c-panel-title inline-flex items-center gap-2"><Icon className="w-4 h-4 text-ink-muted" />{title}</h3>
        {href && <Link href={href} className="text-[13px] font-medium text-gold-ink hover:underline">{link}</Link>}
      </div>
      {children}
    </section>
  );
}

function Row({ icon: Icon, label, people, count, href }: { icon: typeof Cake; label: string; people?: string[]; count?: number; href: string }) {
  const n = count ?? people?.length ?? 0;
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-paper-deep transition-colors">
        <Icon className="w-4 h-4 shrink-0" style={{ color: n ? "var(--o-warning)" : "var(--o-faint)" }} />
        <span className="w-6 text-right font-semibold tabular-nums text-ink">{n}</span>
        <span className="text-ink-soft">{label}</span>
        {people && people.length > 0 && <span className="text-[13px] text-ink-muted truncate hidden md:inline">{people.slice(0, 3).join(", ")}{people.length > 3 ? "…" : ""}</span>}
        <ArrowRight className="w-4 h-4 ml-auto shrink-0 text-ink-muted group-hover:text-ink" />
      </Link>
    </li>
  );
}

const Empty = ({ text }: { text: string }) => <p className="px-4 py-5 text-[13px] text-ink-muted">{text}</p>;
