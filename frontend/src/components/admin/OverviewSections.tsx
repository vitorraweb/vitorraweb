"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Monitor } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { GraphView, KpiTile } from "@/components/admin/reporting";

/* ─── Overview: today, the website and operations ─────────────────────────────
   Three blocks for Insights → Overview. Each loads on its own and hides itself
   when the person does not hold that module (the server leaves the block out,
   or answers 403), so nobody sees a number they could not open.            */

const num = (n: number) => n.toLocaleString("en-US");
const minorMoney = (cur: string, minor: number) => (cur === "UGX" ? `UGX ${num(Math.round(minor))}` : `${cur === "USD" ? "$" : "€"}${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const byCurrency = (m: Record<string, number> | undefined) => Object.entries(m ?? {}).filter(([, v]) => v > 0).map(([c, v]) => minorMoney(c, v)).join(" · ") || "—";
const ago = (iso: string | null) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kampala" });

/* ── Data ─────────────────────────────────────────────────────────────── */

export type Operations = {
  today?: { enquiries: number; enquiries_yesterday: number; orders: number | null };
  screen?: {
    online: boolean; last_seen: string | null; scene: string; on_air_hours: boolean;
    adverts_running: number; adverts_on_air_now: number; plays_today: number; delivery: number | null; downtime_minutes_today: number;
  };
  stock?: { label: string; on_hand: number }[];
  finance?: {
    awaiting_approval: number; awaiting_by_currency: Record<string, number>;
    receipts_this_month: number; received_this_month: Record<string, number>; invoices_overdue: number;
  };
  installations?: { this_month: number; last_month: number; total: number };
  tasks?: { open: number; overdue: number; due_today: number };
  people?: { leave_pending: number };
  meetings_today: { id: number; title: string; starts_at: string }[];
};

type Pair = { now: number; before: number };
type Web = {
  configured: boolean; error?: string;
  visitors?: Pair; sessions?: Pair; pageviews?: Pair; leads?: Pair;
  by_time?: { label: string; visitors: number; pageviews: number }[]; hourly?: boolean;
  pages?: { path: string; views: number; people: number }[];
  channels?: { label: string; sessions: number }[];
};
type Clicks = { configured: boolean; error?: string; clicks?: Pair; phone?: Pair; whatsapp?: Pair; email?: Pair; top?: { label: string; href: string; clicks: number }[] };

export function useOperations(pollMs = 60_000): Operations | null {
  const [ops, setOps] = useState<Operations | null>(null);
  const load = useCallback(() => {
    apiAdmin<{ data: Operations }>("/admin/overview/operations").then((r) => setOps(r.data)).catch(() => setOps(null));
  }, []);
  useEffect(() => { load(); const id = setInterval(load, pollMs); return () => clearInterval(id); }, [load, pollMs]);
  return ops;
}

/** Items for the "Needs attention" list that come from operations. */
export function operationsAttention(ops: Operations | null): { n: number; label: string; href: string; items: string[] }[] {
  if (!ops) return [];
  const out: { n: number; label: string; href: string; items: string[] }[] = [];
  if (ops.screen && !ops.screen.online && ops.screen.on_air_hours) out.push({ n: 1, label: `street screen offline (last seen ${ago(ops.screen.last_seen)})`, href: "/admin/screen-ads", items: [] });
  if (ops.finance?.awaiting_approval) out.push({ n: ops.finance.awaiting_approval, label: "payments awaiting approval", href: "/admin/accounting?tab=transactions", items: [byCurrency(ops.finance.awaiting_by_currency)] });
  if (ops.finance?.invoices_overdue) out.push({ n: ops.finance.invoices_overdue, label: "invoices overdue", href: "/admin/accounting?tab=invoices", items: [] });
  if (ops.people?.leave_pending) out.push({ n: ops.people.leave_pending, label: "leave requests waiting", href: "/admin/people", items: [] });
  return out;
}

/* ── Today ────────────────────────────────────────────────────────────── */

export function TodayRow({ ops }: { ops: Operations | null }) {
  const [today, setToday] = useState<Web | null>(null);
  useEffect(() => {
    apiAdmin<{ data: Web }>("/admin/web-analytics/summary?period=today").then((r) => setToday(r.data)).catch(() => setToday(null));
  }, []);
  const tiles: React.ReactNode[] = [];
  if (today?.configured && today.visitors) tiles.push(<KpiTile key="v" label="Website visitors today" value={num(today.visitors.now)} now={today.visitors.now} before={today.visitors.before} sub="vs. the same time yesterday" href="/admin/website" />);
  if (ops?.today) tiles.push(<KpiTile key="e" label="New enquiries today" value={num(ops.today.enquiries)} now={ops.today.enquiries} before={ops.today.enquiries_yesterday} sub="vs. yesterday" href="/admin/enquiries" />);
  if (ops?.today && ops.today.orders != null) tiles.push(<KpiTile key="o" label="Orders today" value={num(ops.today.orders)} href="/admin/orders" />);
  if (ops?.screen) tiles.push(<KpiTile key="s" label="Street screen" value={ops.screen.online ? "Online" : "Offline"} sub={ops.screen.online ? `${ops.screen.adverts_on_air_now} advert${ops.screen.adverts_on_air_now === 1 ? "" : "s"} on air now` : `Last seen ${ago(ops.screen.last_seen)}`} href="/admin/screen-ads" />);
  if (ops) tiles.push(<KpiTile key="m" label="Meetings today" value={num(ops.meetings_today.length)} sub={ops.meetings_today[0] ? `Next: ${time(ops.meetings_today[0].starts_at)} ${ops.meetings_today[0].title}` : "None scheduled"} href="/admin/meetings" />);
  if (!tiles.length) return null;
  return (
    <section>
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted mb-2">Today</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">{tiles}</div>
    </section>
  );
}

/* ── Website: visitors and clicks ─────────────────────────────────────── */

const PERIODS: [string, string][] = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"]];

export function WebsiteGlance() {
  const [period, setPeriod] = useState("7d");
  const [web, setWeb] = useState<Web | null | "none">(null);
  const [clicks, setClicks] = useState<Clicks | null>(null);

  useEffect(() => {
    let live = true;
    apiAdmin<{ data: Web }>(`/admin/web-analytics/summary?period=${period}`).then((r) => live && setWeb(r.data)).catch(() => live && setWeb("none"));
    apiAdmin<{ data: Clicks }>(`/admin/web-analytics/clicks?period=${period}`).then((r) => live && setClicks(r.data)).catch(() => live && setClicks(null));
    return () => { live = false; };
  }, [period]);

  if (web === "none") return null; // no access to website numbers
  const head = (
    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Website</h2>
      <span className="flex items-center gap-1">
        {PERIODS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setPeriod(k)} className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
            style={period === k ? { background: "var(--o-inverse)", color: "#fff" } : { color: "var(--o-muted)" }}>{l}</button>
        ))}
        <Link href="/admin/website" className="ml-2 text-[13px] font-medium text-gold-ink hover:underline inline-flex items-center gap-1">Full report<ArrowRight className="w-3.5 h-3.5" /></Link>
      </span>
    </div>
  );
  if (!web) return <section>{head}<p className="c-panel px-4 py-6 text-[14px] text-ink-muted">Loading website numbers…</p></section>;
  if (!web.configured) return <section>{head}<p className="c-panel px-4 py-4 text-[14px] text-ink-muted">Website numbers are not connected yet: the server needs its PostHog settings (see docs/posthog.md).</p></section>;
  if (web.error) return <section>{head}<p className="c-panel px-4 py-4 text-[14px] text-alert-ink">Couldn&apos;t load website numbers: {web.error}</p></section>;

  const taps = clicks?.phone && clicks.whatsapp ? { now: clicks.phone.now + clicks.whatsapp.now, before: clicks.phone.before + clicks.whatsapp.before } : null;
  const since = period === "today" ? "vs. same time yesterday" : `vs. the ${period === "7d" ? "7" : "30"} days before`;

  return (
    <section className="space-y-3">
      {head}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {web.visitors && <KpiTile label="Visitors" value={num(web.visitors.now)} now={web.visitors.now} before={web.visitors.before} sub={since} />}
        {web.sessions && <KpiTile label="Visits" value={num(web.sessions.now)} now={web.sessions.now} before={web.sessions.before} />}
        {web.pageviews && <KpiTile label="Pages viewed" value={num(web.pageviews.now)} now={web.pageviews.now} before={web.pageviews.before} />}
        {clicks?.clicks && <KpiTile label="Clicks" value={num(clicks.clicks.now)} now={clicks.clicks.now} before={clicks.clicks.before} sub="Buttons and links" />}
        {taps && <KpiTile label="Call & WhatsApp taps" value={num(taps.now)} now={taps.now} before={taps.before} sub={`${num(clicks!.phone!.now)} calls · ${num(clicks!.whatsapp!.now)} WhatsApp`} />}
        {web.leads && <KpiTile label="Forms sent" value={num(web.leads.now)} now={web.leads.now} before={web.leads.before} sub="Enquiries, contact, reservations" />}
      </div>
      {web.by_time && (
        <GraphView
          title={web.hourly ? "Visitors by hour, today" : "Visitors by day"}
          rows={web.by_time.map((r) => ({ label: web.hourly ? `${r.label}:00` : new Date(`${r.label}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), values: { visitors: r.visitors, pageviews: r.pageviews } }))}
          series={[{ key: "visitors", label: "Visitors" }, { key: "pageviews", label: "Pages viewed" }]}
          types={["line", "bar"]} defaultType="line" format={num}
        />
      )}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GraphView
          title="Most-clicked buttons and links"
          rows={(clicks?.top ?? []).map((t) => ({ label: t.label || t.href || "(no text)", values: { clicks: t.clicks } }))}
          measures={[{ key: "clicks", label: "Clicks", format: num }]}
          types={["bar"]}
          empty={clicks?.error ? `Couldn't load clicks: ${clicks.error}` : "No clicks recorded in this period."}
        />
        <GraphView
          title="Most-viewed pages"
          rows={(web.pages ?? []).slice(0, 8).map((p) => ({ label: p.path, values: { views: p.views, people: p.people } }))}
          measures={[{ key: "views", label: "Views", format: num }, { key: "people", label: "People", format: num }]}
          types={["bar"]}
        />
        <GraphView
          title="How visitors found us"
          rows={(web.channels ?? []).map((c) => ({ label: c.label, values: { sessions: c.sessions } }))}
          measures={[{ key: "sessions", label: "Visits", format: num }]}
          types={["pie", "bar"]} defaultType="pie"
        />
      </div>
    </section>
  );
}

/* ── Operations ───────────────────────────────────────────────────────── */

export function OperationsGlance({ ops }: { ops: Operations | null }) {
  if (!ops) return null;
  const s = ops.screen;
  const blocks = [s, ops.stock, ops.finance, ops.installations, ops.tasks, ops.people].some(Boolean) || ops.meetings_today.length > 0;
  if (!blocks) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Operations</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {s && (
          <section className="c-panel">
            <div className="c-panel-head">
              <h3 className="c-panel-title flex items-center gap-2"><Monitor className="w-4 h-4" />Street screen</h3>
              <Link href="/admin/screen-ads" className="text-[13.5px] font-medium text-gold-ink hover:underline">Open</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              <KpiTile label="Status" value={s.online ? "Online" : "Offline"} sub={s.online ? `Showing: ${s.scene || "—"}` : `Last seen ${ago(s.last_seen)}`} />
              <KpiTile label="Adverts on air now" value={num(s.adverts_on_air_now)} sub={`${num(s.adverts_running)} running this week`} />
              <KpiTile label="Advert plays today" value={num(s.plays_today)} sub="Completed plays" />
              <KpiTile label="Delivery" value={s.delivery != null ? `${s.delivery}%` : "—"} sub="Plays delivered vs. booked, running campaigns" />
              <KpiTile label="Off air today" value={`${num(s.downtime_minutes_today)} min`} sub="Screen not reporting" upIsGood={false} />
            </div>
          </section>
        )}

        {(ops.finance || ops.stock) && (
          <section className="c-panel">
            <div className="c-panel-head">
              <h3 className="c-panel-title">Finance &amp; stock</h3>
              <Link href="/admin/accounting" className="text-[13.5px] font-medium text-gold-ink hover:underline">Open</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {ops.finance && <>
                <KpiTile label="Received this month" value={byCurrency(ops.finance.received_this_month)} sub={`${num(ops.finance.receipts_this_month)} receipts issued`} href="/admin/accounting?tab=payments" />
                <KpiTile label="Awaiting approval" value={num(ops.finance.awaiting_approval)} sub={byCurrency(ops.finance.awaiting_by_currency)} href="/admin/accounting?tab=transactions" />
                <KpiTile label="Overdue invoices" value={num(ops.finance.invoices_overdue)} href="/admin/accounting?tab=invoices" />
              </>}
              {ops.stock?.map((m) => <KpiTile key={m.label} label={`${m.label} in stock`} value={num(m.on_hand)} sub={m.on_hand <= 2 ? "Running low" : "Devices on hand"} href="/admin/accounting?tab=stock" />)}
            </div>
          </section>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ops.installations && <KpiTile label="FET installs this month" value={num(ops.installations.this_month)} now={ops.installations.this_month} before={ops.installations.last_month} sub={`${num(ops.installations.total)} in total`} href="/admin/fet" />}
        {ops.tasks && <KpiTile label="Open tasks" value={num(ops.tasks.open)} sub={`${num(ops.tasks.overdue)} overdue · ${num(ops.tasks.due_today)} due today`} href="/admin/tasks" />}
        {ops.people && <KpiTile label="Leave waiting" value={num(ops.people.leave_pending)} sub="Requests to decide" href="/admin/people" />}
      </div>

      {ops.meetings_today.length > 0 && (
        <section className="c-panel">
          <div className="c-panel-head"><h3 className="c-panel-title flex items-center gap-2"><CalendarClock className="w-4 h-4" />Meetings today</h3><Link href="/admin/meetings" className="text-[13.5px] font-medium text-gold-ink hover:underline">All meetings</Link></div>
          <ul className="divide-y divide-line">
            {ops.meetings_today.map((m) => <li key={m.id} className="px-4 py-2.5 text-[14px] flex gap-3"><span className="tabular-nums text-ink-muted w-12">{time(m.starts_at)}</span><span className="text-ink">{m.title}</span></li>)}
          </ul>
        </section>
      )}
    </section>
  );
}
