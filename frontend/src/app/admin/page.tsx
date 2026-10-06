"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { apiAdmin, auth, canAccess, type AdminUser } from "@/lib/auth";
import { APP_AREAS, visibleApps } from "@/lib/admin-apps";

/* ─── Console home: the app launcher ──────────────────────────────────────────
   Two things, in order: what needs someone today (counts pulled from the
   existing endpoints, each shown only to people who can act on it), then
   every app the user may open, grouped by what it is for. The old KPI
   dashboard lives on as Insights → Overview.                               */

type Attention = { key: string; app: string; count: number; label: string; href: string };

type Stats = {
  messages_unread?: number;
  enquiries?: { by_status?: Record<string, number> };
  orders?: { pending?: number };
  prospects?: { needs_fixing?: number };
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

  useEffect(() => {
    if (!user) return;
    const can = (module?: string) => canAccess(user, { module });
    (async () => {
      const [stats, alerts, leave, suppliers, drafts] = await Promise.all([
        apiAdmin<{ data: Stats }>("/admin/stats").then((r) => r.data).catch(() => ({} as Stats)),
        apiAdmin<{ data: Alerts }>("/admin/alerts").then((r) => r.data).catch(() => ({} as Alerts)),
        can("people") ? list(apiAdmin("/admin/leave?status=pending")) : Promise.resolve(0),
        can("suppliers") ? list(apiAdmin("/admin/suppliers?status=pending")) : Promise.resolve(0),
        can("accounting") ? list(apiAdmin("/admin/accounting/transactions?status=draft")) : Promise.resolve(0),
      ]);
      const all: (Attention & { module?: string })[] = [
        { key: "enq", app: "sales", module: "enquiries", count: stats.enquiries?.by_status?.new ?? 0, label: "new enquiries waiting for a first reply", href: "/admin/enquiries" },
        { key: "quiet", app: "sales", module: "customers", count: alerts.stale_contacts?.count ?? 0, label: "customers with no contact in two weeks or more", href: "/admin/pipeline" },
        { key: "fix", app: "sales", module: "prospects", count: stats.prospects?.needs_fixing ?? 0, label: "prospects with missing or broken contact details", href: "/admin/prospects" },
        { key: "orders", app: "orders", module: "orders", count: stats.orders?.pending ?? 0, label: "orders waiting on payment or confirmation", href: "/admin/orders" },
        { key: "drafts", app: "accounting", module: "accounting", count: drafts, label: "book entries waiting for approval", href: "/admin/accounting" },
        { key: "tasks", app: "operations", module: "tasks", count: alerts.overdue_tasks?.count ?? 0, label: "tasks past their due date", href: "/admin/tasks" },
        { key: "suppliers", app: "operations", module: "suppliers", count: suppliers, label: "supplier applications to review", href: "/admin/suppliers" },
        { key: "leave", app: "people", module: "people", count: leave, label: "leave requests waiting for a signature", href: "/admin/leave" },
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
    <div className="max-w-[1180px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] text-ink-muted">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="c-title text-[30px] mt-1">{greeting(now)}, {first}.</h1>
        </div>
        <p className="text-[12.5px] text-ink-muted">
          Press <kbd className="c-kbd">⌘K</kbd> to jump to any screen, customer or prospect.
        </p>
      </div>

      {/* ══ Needs attention ═════════════════════════════════════════════════ */}
      <section aria-labelledby="attention" className="c-panel mb-10">
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
                  <span className="w-12 text-right font-serif text-[20px] leading-none text-ink [font-variant-numeric:lining-nums_tabular-nums]">{a.count.toLocaleString("en-GB")}</span>
                  <span className="text-[13.5px] text-ink-soft">{a.label}</span>
                  <span className="ml-auto text-[11px] uppercase tracking-[0.12em] text-ink-muted hidden sm:inline">{apps.find((x) => x.id === a.app)?.name}</span>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-colors" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ══ Apps ════════════════════════════════════════════════════════════ */}
      <div className="space-y-8">
        {APP_AREAS.map((area) => {
          const inArea = apps.filter((a) => a.area === area);
          if (inArea.length === 0) return null;
          return (
            <section key={area} aria-label={area}>
              <h2 className="c-panel-title mb-3">{area}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inArea.map((app) => {
                  const n = badge(app.id);
                  return (
                    <Link key={app.id} href={app.items[0].href} className="group c-panel flex items-start gap-4 p-4 hover:border-line-strong transition-colors">
                      <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-frame bg-ink text-gold">
                        <app.icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-serif text-[18px] leading-tight text-ink">{app.name}</span>
                          {n > 0 && <span className="c-chip" data-tone="gold" data-plain>{n.toLocaleString("en-GB")}</span>}
                        </span>
                        <span className="block text-[12.5px] text-ink-muted mt-1 leading-snug">{app.blurb}</span>
                        <span className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
                          {app.items.map((i) => (
                            <span key={i.href} className="text-[12px] text-ink-soft">{i.label}</span>
                          ))}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
