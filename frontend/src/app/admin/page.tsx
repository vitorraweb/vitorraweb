"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";
import { apiAdmin, auth, canAccess, type AdminUser } from "@/lib/auth";
import { APP_AREAS, visibleApps } from "@/lib/admin-apps";

/* Odoo gives every app its own coloured tile; these are ours. White icons
   on each clear 4.5:1. */
const APP_TINT: Record<string, string> = {
  sales: "#1F64A8", marketing: "#B03A5B", orders: "#B4531F", fet: "#17785C", accounting: "#5B44A6", insights: "#0E7272",
  operations: "#7A6020", people: "#A8406E", me: "#3B6E8F", website: "#2E6E31", settings: "#4D545E",
};

/* ─── Console home: the app launcher ──────────────────────────────────────────
   Two things, in order: the week's website insights for people who can see
   the analytics (everyone else gets the "needs attention" to-do list; its
   counts still show as red badges on the app tiles for all), then
   every app the user may open, grouped by what it is for. The old KPI
   dashboard lives on as Insights → Overview.                               */

type Insight = { tone: "up" | "down" | "warn" | "info"; kind: string; headline: string; short: string; detail: string; href: string };

/** The three most important insights, no two of the same kind (one warning, the trend, the contact rate…). */
const pickThree = (all: Insight[]) => all.filter((i, n) => all.findIndex((j) => j.kind === i.kind) === n).slice(0, 3);

const TONE = {
  warn: { Icon: AlertTriangle, color: "var(--o-danger)" },
  down: { Icon: TrendingDown, color: "var(--o-danger)" },
  up:   { Icon: TrendingUp, color: "var(--o-success)" },
  info: { Icon: Lightbulb, color: "var(--o-info)" },
} as const;

type Attention = { key: string; app: string; count: number; label: string; href: string };

type Stats = {
  messages_unread?: number;
  enquiries?: { by_status?: Record<string, number> };
  orders?: { pending?: number };
  prospects?: { needs_fixing?: number; follow_ups_due?: number };
};
type Alerts = { stale_contacts?: { count: number }; overdue_tasks?: { count: number } };

const list = <T,>(p: Promise<{ data: T[] }>) => p.then((r) => r.data.length).catch(() => 0);

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function ConsoleHome() {
  const [user] = useState<AdminUser | null>(() => auth.getUser());
  const [items, setItems] = useState<Attention[] | null>(null);
  const [now] = useState(() => new Date());
  // Website insights (PostHog) take this panel for people who can see them;
  // null = not available to this person (or not connected) → the to-do list shows.
  const [insights, setInsights] = useState<Insight[] | null | undefined>(undefined);

  useEffect(() => {
    if (!user || !canAccess(user, { module: "google_ads" })) { setInsights(null); return; }
    apiAdmin<{ data: { configured: boolean; items?: Insight[] } }>("/admin/web-analytics/insights")
      .then((r) => setInsights(r.data.configured && r.data.items?.length ? r.data.items : null))
      .catch(() => setInsights(null));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const can = (module?: string) => canAccess(user, { module });
    (async () => {
      const lastMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();
      const [stats, alerts, leave, suppliers, drafts, toSign, myReports, overdue] = await Promise.all([
        apiAdmin<{ data: Stats }>("/admin/stats").then((r) => r.data).catch(() => ({} as Stats)),
        apiAdmin<{ data: Alerts }>("/admin/alerts").then((r) => r.data).catch(() => ({} as Alerts)),
        can("people") ? list(apiAdmin("/admin/leave?status=pending")) : Promise.resolve(0),
        can("suppliers") ? list(apiAdmin("/admin/suppliers?status=pending")) : Promise.resolve(0),
        can("accounting") ? list(apiAdmin("/admin/accounting/transactions?status=draft")) : Promise.resolve(0),
        // My work: leave waiting for this person's signature, and their own monthly report.
        apiAdmin<{ data: { can_decide: boolean }[] }>("/staff/leave/pending").then((r) => r.data.filter((l) => l.can_decide).length).catch(() => 0),
        apiAdmin<{ data: { period: string; status: string }[] }>("/staff/reports").then((r) => r.data).catch(() => null),
        can("customers") || can("prospects") ? apiAdmin<{ data: { overdue: number } }>("/admin/crm/today").then((r) => r.data.overdue).catch(() => 0) : Promise.resolve(0),
      ]);
      const reportDue = user.role !== "admin" && myReports !== null && !myReports.some((r) => r.period === lastMonth && r.status !== "draft") ? 1 : 0;
      const all: (Attention & { module?: string })[] = [
        { key: "overdue", app: "sales", module: undefined, count: overdue, label: "of your customer follow-ups are overdue", href: "/admin/sales/today" },
        { key: "enq", app: "sales", module: "enquiries", count: stats.enquiries?.by_status?.new ?? 0, label: "new enquiries waiting for a first reply", href: "/admin/enquiries" },
        { key: "quiet", app: "sales", module: "customers", count: alerts.stale_contacts?.count ?? 0, label: "customers with no contact in two weeks or more", href: "/admin/pipeline" },
        { key: "followups", app: "sales", module: "prospects", count: stats.prospects?.follow_ups_due ?? 0, label: "customers and prospects due a follow-up", href: "/admin/prospects?due=1" },
        { key: "fix", app: "sales", module: "prospects", count: stats.prospects?.needs_fixing ?? 0, label: "prospects with missing or broken contact details", href: "/admin/prospects" },
        { key: "orders", app: "orders", module: "orders", count: stats.orders?.pending ?? 0, label: "orders waiting on payment or confirmation", href: "/admin/orders" },
        { key: "drafts", app: "accounting", module: "accounting", count: drafts, label: "book entries waiting for approval", href: "/admin/accounting" },
        { key: "tasks", app: "operations", module: "tasks", count: alerts.overdue_tasks?.count ?? 0, label: "tasks past their due date", href: "/admin/tasks" },
        { key: "suppliers", app: "operations", module: "suppliers", count: suppliers, label: "supplier applications to review", href: "/admin/suppliers" },
        { key: "leave", app: "people", module: "people", count: leave, label: "leave requests waiting for a signature", href: "/admin/leave" },
        { key: "sign", app: "me", count: toSign, label: "leave requests waiting for your signature", href: "/admin/me/leave" },
        { key: "report", app: "me", count: reportDue, label: `your ${new Date(`${lastMonth}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long" })} monthly report is not submitted yet`, href: "/admin/me/reports" },
        { key: "msgs", app: "website", module: "messages", count: stats.messages_unread ?? 0, label: "unread website messages", href: "/admin/messages" },
      ];
      setItems(all.filter((a) => a.count > 0 && can(a.module)));
    })();
  }, [user]);

  const apps = useMemo(() => visibleApps(user), [user]);
  const badge = (appId: string) => (items ?? []).filter((i) => i.app === appId).reduce((n, i) => n + i.count, 0);

  if (!user) return null;
  const first = user.name.split(/\s+/)[0];

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] text-ink-muted">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="c-title text-[24px] mt-1">{greeting(now)}, {first}.</h1>
        </div>
        <p className="text-[12.5px] text-ink-muted">
          Press <kbd className="c-kbd">⌘K</kbd> to jump to any screen, customer or prospect.
        </p>
      </div>

      {/* ══ Website insights (or, without them, Needs attention) ═════════════ */}
      {insights === undefined ? (
        <section className="c-panel mb-8">
          <div className="flex items-center gap-2 px-4 py-5 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Reading the website numbers…</div>
        </section>
      ) : insights ? (
        <section aria-label="Website insights, last 7 days" className="c-panel mb-6 flex items-center gap-2 px-3 py-2">
          <span className="shrink-0 text-[12.5px] font-semibold text-ink-muted pr-1 hidden md:inline">This week</span>
          <ul className="flex-1 min-w-0 flex gap-2 overflow-x-auto">
            {pickThree(insights).map((i) => {
              const { Icon, color } = TONE[i.tone] ?? TONE.info;
              return (
                <li key={i.headline} className="min-w-[13rem] flex-1 basis-0">
                  <Link href={i.href} title={`${i.headline}. ${i.detail}`} className="flex items-center gap-2 h-9 px-2.5 rounded-md border border-line hover:bg-paper-deep transition-colors">
                    <Icon className="w-4 h-4 shrink-0" style={{ color }} aria-hidden="true" />
                    <span className="truncate text-[13px] text-ink">{i.short}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/admin/website" className="shrink-0 inline-flex items-center gap-1 text-[13px] font-medium text-gold-ink hover:underline pl-1">All<ArrowRight className="w-3.5 h-3.5" /></Link>
        </section>
      ) : (
      <section aria-labelledby="attention" className="c-panel mb-8">
        <div className="c-panel-head">
          <h2 id="attention" className="c-panel-title">Needs attention</h2>
          {items && items.length > 0 && <span className="text-[12px] text-ink-muted">{items.length} {items.length === 1 ? "item" : "items"}</span>}
        </div>
        {items === null ? (
          <div className="flex items-center gap-2 px-4 py-5 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Checking every app…</div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-5 text-[13px] text-ok-ink"><Check className="w-4 h-4" />Nothing is waiting on you. Everything is up to date.</div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="group flex items-center gap-4 px-4 py-2.5 hover:bg-paper-deep transition-colors">
                  <span className="w-12 text-right text-[18px] font-semibold leading-none text-ink tabular-nums">{a.count.toLocaleString("en-GB")}</span>
                  <span className="text-[13.5px] text-ink-soft">{a.label}</span>
                  <span className="ml-auto text-[13px] text-ink-muted hidden sm:inline">{apps.find((x) => x.id === a.app)?.name}</span>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-colors" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      {/* ══ Apps (Odoo's home menu) ═══════════════════════════════════════ */}
      <section aria-label="Apps">
        <h2 className="c-panel-title mb-4">Apps</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-7">
          {APP_AREAS.flatMap((area) => apps.filter((a) => a.area === area)).map((app) => {
            const n = badge(app.id);
            return (
              <Link key={app.id} href={app.items[0].href} title={app.blurb} className="group flex flex-col items-center text-center gap-2 rounded-md py-2 hover:bg-paper-deep transition-colors">
                <span className="relative">
                  <span
                    className="flex items-center justify-center w-[72px] h-[72px] text-white transition-transform group-hover:-translate-y-0.5"
                    style={{ background: APP_TINT[app.id] ?? "#4D545E", borderRadius: 16, boxShadow: "0 2px 6px rgba(16,24,40,0.18)" }}
                  >
                    <app.icon className="w-8 h-8" aria-hidden="true" />
                  </span>
                  {n > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ background: "var(--o-danger)", color: "#fff", boxShadow: "0 0 0 2px var(--o-canvas)" }}>
                      {n > 99 ? "99+" : n}
                    </span>
                  )}
                </span>
                <span className="text-[14px] font-medium text-ink leading-tight">{app.name}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
