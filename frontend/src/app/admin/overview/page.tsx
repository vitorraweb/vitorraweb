"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Mail, ShoppingCart, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { LiveDot, PageHeader, formatRelativeTime } from "@/components/admin/admin-ui";
import { GraphView, KpiTile } from "@/components/admin/reporting";

/* ─── Insights → Overview ─────────────────────────────────────────────────────
   The company at a glance, as an Odoo-style dashboard: headline numbers with
   their comparison, then reporting views (graph ⇄ pivot) for the enquiry
   funnel, demand, lead sources and outreach. Refreshes itself.           */

type Money = { UGX: number; USD: number };

type ActivityItem = { type: "enquiry" | "order" | "message"; title: string; meta: string; created_at: string; href: string };

type Stats = {
  messages_unread: number;
  enquiries: {
    total: number; open: number; converted: number; conversion_rate: number;
    this_month: number; last_month: number;
    by_product: Record<string, number>;
    by_status: Record<string, number>;
    avg_response_hours: number | null;
  };
  orders: {
    total: number; pending: number; by_status: Record<string, number>;
    this_month: number; last_month: number; pending_value: Money; revenue: Money;
  };
  prospects: {
    total: number; reached: number; converted: number; needs_fixing: number;
    by_status: Record<string, number>; by_category: Record<string, number>;
  };
  lead_sources?: {
    by_source: { source: string; count: number; converted: number }[];
    by_campaign: { campaign: string; count: number }[];
    tracked_from: string | null;
  };
  trends?: { labels: string[]; enquiries: number[]; orders: number[] };
  recent_activity?: ActivityItem[];
};

type Alerts = {
  stale_contacts: { count: number; items: { email: string; name: string }[] };
  overdue_tasks: { count: number; items: { id: number; title: string }[] };
  unactioned_enquiries: { count: number; items: { id: number; name: string }[] };
};

/** The slice of /admin/google-ads/summary shown here. 403 for staff without the module. */
type AdsGlance = {
  connected: boolean;
  currency: string | null;
  totals: { cost: number; clicks: number; leads: number; won: number; cost_per_lead: number | null };
  previous: { cost: number; leads: number };
};

const POLL_MS = 45_000;
const ADS_POLL_MS = 5 * 60_000;

const ACTIVITY_ICON: Record<ActivityItem["type"], typeof Mail> = { enquiry: MessageSquare, order: ShoppingCart, message: Mail };

const PRODUCTS: [string, string][] = [
  ["FET", "Fuel Eco Tech"], ["SEAL", "SEAL Wound Spray"], ["COFFEE", "Coffee"], ["LOGISTICS", "Logistics"], ["GENERAL", "General"],
];
const PIPELINE: [string, string][] = [
  ["new", "New"], ["in_progress", "In progress"], ["quoted", "Quoted"], ["converted", "Converted"], ["closed", "Closed"],
];
const INDUSTRY: Record<string, string> = {
  CARGO: "Cargo", DISTRIBUTOR: "Distributors", CONSTRUCTION: "Construction", MANUFACTURING: "Manufacturing",
  PUBLIC_TRANSPORT: "Public transport", SCHOOL: "Schools", FARMER: "Farmers", SPARE_PARTS: "Spare parts", CAR_BOND: "Car bonds", FUNERAL: "Funeral",
};

/** "TRAVEL_COMPANY" → "Travel company" for categories without a label above. */
const pretty = (k: string) => k.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const num = (n: number) => n.toLocaleString("en-US");
const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString("en-US")}`;
const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money = (m: Money) => [m.UGX ? ugx(m.UGX) : "", m.USD ? usd(m.USD) : ""].filter(Boolean).join(" · ") || "—";
const adsMoney = (n: number | null, cur: string | null) =>
  n == null ? "—" : (cur ?? "UGX") === "UGX" ? ugx(n) : `${cur} ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [ads, setAds] = useState<AdsGlance | null>(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setStats((await apiAdmin<{ data: Stats }>("/admin/stats")).data);
      setLastUpdated(Date.now());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
    apiAdmin<{ data: Alerts }>("/admin/alerts").then((r) => setAlerts(r.data)).catch(() => setAlerts(null));
  }, []);

  const loadAds = useCallback(async () => {
    try { setAds((await apiAdmin<{ data: AdsGlance }>("/admin/google-ads/summary?period=30d")).data); }
    catch { setAds(null); } // no google_ads module, or the API is down: the tiles hide
  }, []);

  useEffect(() => { load(); const id = setInterval(load, POLL_MS); return () => clearInterval(id); }, [load]);
  useEffect(() => { loadAds(); const id = setInterval(loadAds, ADS_POLL_MS); return () => clearInterval(id); }, [loadAds]);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const attention = alerts ? [
    { n: alerts.unactioned_enquiries.count, label: "new enquiries unactioned for 24h+", href: "/admin/enquiries", items: alerts.unactioned_enquiries.items.map((e) => e.name) },
    { n: alerts.stale_contacts.count, label: "contacts going cold", href: "/admin/pipeline", items: alerts.stale_contacts.items.map((c) => c.name || c.email) },
    { n: alerts.overdue_tasks.count, label: "overdue tasks", href: "/admin/tasks", items: alerts.overdue_tasks.items.map((t) => t.title) },
  ].filter((a) => a.n > 0) : [];

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Enquiries, sales and outreach at a glance."
        actions={lastUpdated ? (
          <span className="flex items-center gap-2 text-[13px] text-ink-muted">
            <LiveDot />Live · updated {now ? formatRelativeTime(new Date(lastUpdated).toISOString(), now) : "just now"}
          </span>
        ) : undefined}
      />

      {error && <p className="c-panel px-4 py-3 mb-4 text-[14px] text-alert-ink">Couldn&apos;t load the numbers: {error}</p>}
      {!stats && !error && <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>}

      {stats && (
        <div className="space-y-4">
          {/* ── Headline numbers ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiTile label="Enquiries this month" value={num(stats.enquiries.this_month)} now={stats.enquiries.this_month} before={stats.enquiries.last_month} href="/admin/enquiries" />
            <KpiTile label="Open enquiries" value={num(stats.enquiries.open)} sub="New + in progress" href="/admin/enquiries" />
            <KpiTile label="Conversion rate" value={`${stats.enquiries.conversion_rate}%`} sub={`${stats.enquiries.converted} of ${num(stats.enquiries.total)} became orders`} />
            <KpiTile label="First reply" value={stats.enquiries.avg_response_hours != null ? `${stats.enquiries.avg_response_hours} h` : "—"} sub="Average, submission → reply" />
            <KpiTile label="Orders this month" value={num(stats.orders.this_month)} now={stats.orders.this_month} before={stats.orders.last_month} href="/admin/orders" />
            <KpiTile label="Revenue received" value={money(stats.orders.revenue)} sub="Paid orders, all time" />
          </div>

          {/* ── Needs attention ──────────────────────────────────────────── */}
          {attention.length > 0 && (
            <section className="c-panel">
              <div className="c-panel-head"><h3 className="c-panel-title">Needs attention</h3></div>
              <ul className="divide-y divide-line">
                {attention.map((a) => (
                  <li key={a.label}>
                    <Link href={a.href} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-paper-deep transition-colors">
                      <AlertTriangle className="w-4 h-4 text-alert-ink shrink-0" />
                      <span className="text-[14px] text-ink"><strong className="font-semibold">{a.n}</strong> {a.label}</span>
                      <span className="text-[13px] text-ink-muted truncate hidden md:inline">{a.items.slice(0, 3).filter(Boolean).join(", ")}</span>
                      <ArrowRight className="w-4 h-4 ml-auto text-ink-muted group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Day by day ───────────────────────────────────────────────── */}
          {stats.trends && (
            <GraphView
              title="Enquiries and orders — last 30 days"
              rows={stats.trends.labels.map((label, i) => ({ label, values: { enquiries: stats.trends!.enquiries[i] ?? 0, orders: stats.trends!.orders[i] ?? 0 } }))}
              series={[{ key: "enquiries", label: "Enquiries" }, { key: "orders", label: "Orders" }]}
              types={["line", "bar"]}
              defaultType="line"
              format={num}
            />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <GraphView
              title="Enquiries by product"
              rows={PRODUCTS.map(([k, label]) => ({ label, values: { count: stats.enquiries.by_product[k] ?? 0 } }))}
              measures={[{ key: "count", label: "Enquiries", format: num }]}
            />
            <GraphView
              title="Enquiry pipeline"
              rows={PIPELINE.map(([k, label]) => ({ label, values: { count: stats.enquiries.by_status[k] ?? 0 } }))}
              measures={[{ key: "count", label: "Enquiries", format: num }]}
              types={["bar", "pie"]}
              note="Quote-based products (FET, SEAL, Logistics) and coffee wholesale move through these stages."
            />
          </div>

          {/* ── Where leads come from ────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {stats.lead_sources && (
              <GraphView
                title="Where enquiries come from"
                rows={stats.lead_sources.by_source.map((r) => ({ label: r.source, values: { count: r.count, converted: r.converted } }))}
                measures={[{ key: "count", label: "Enquiries", format: num }, { key: "converted", label: "Won", format: num }]}
                types={["bar", "pie"]}
                note={<>&ldquo;Unknown&rdquo; is every enquiry taken before source tracking began, not &ldquo;direct&rdquo;. &ldquo;Direct&rdquo; also covers links opened from WhatsApp, a PDF or a typed address.</>}
              />
            )}
            {ads ? (
              <section className="c-panel">
                <div className="c-panel-head">
                  <h3 className="c-panel-title">Google Ads — last 30 days</h3>
                  <Link href="/admin/google-ads" className="text-[13.5px] font-medium text-gold-ink hover:underline">Open report</Link>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <KpiTile label="Spent" value={ads.connected ? adsMoney(ads.totals.cost, ads.currency) : "—"} sub={ads.connected ? `${num(ads.totals.clicks)} clicks` : "Google Ads not connected yet"} now={ads.connected ? ads.totals.cost : undefined} before={ads.connected ? ads.previous.cost : undefined} upIsGood={false} />
                  <KpiTile label="Leads from ads" value={num(ads.totals.leads)} now={ads.totals.leads} before={ads.previous.leads} />
                  <KpiTile label="Cost per lead" value={adsMoney(ads.totals.cost_per_lead, ads.currency)} sub="Spend ÷ leads" />
                  <KpiTile label="Won" value={num(ads.totals.won)} sub="Converted to an order" />
                </div>
              </section>
            ) : (
              <GraphView
                title="Top campaigns (tagged links)"
                rows={(stats.lead_sources?.by_campaign ?? []).map((c) => ({ label: c.campaign, values: { count: c.count } }))}
                measures={[{ key: "count", label: "Enquiries", format: num }]}
                empty="No tagged campaign links yet."
              />
            )}
          </div>

          {/* ── Outreach ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile label="Prospects" value={num(stats.prospects.total)} sub="Across all industries" href="/admin/prospects" />
            <KpiTile label="Reached" value={num(stats.prospects.reached)} sub="Contacted or responded" />
            <KpiTile label="Became enquiries" value={num(stats.prospects.converted)} sub="From outreach" />
            <KpiTile label="Need fixing" value={num(stats.prospects.needs_fixing)} sub="Bad or missing contact" href="/admin/prospects" />
          </div>
          <GraphView
            title="Prospects by industry"
            rows={Object.entries(stats.prospects.by_category).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ label: INDUSTRY[k] ?? pretty(k), values: { count: n } }))}
            measures={[{ key: "count", label: "Prospects", format: num }]}
            types={["bar", "pie"]}
          />

          {/* ── Orders & recent activity ─────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <GraphView
              title="Orders by status"
              rows={Object.entries(stats.orders.by_status).map(([k, n]) => ({ label: pretty(k), values: { count: n } }))}
              measures={[{ key: "count", label: "Orders", format: num }]}
              types={["bar", "pie"]}
              note="Coffee retail checkout is off until prices are confirmed, so order volume is light by design."
            />
            <section className="c-panel xl:col-span-2">
              <div className="c-panel-head"><h3 className="c-panel-title">Recent activity</h3></div>
              {!stats.recent_activity?.length ? (
                <p className="px-4 py-6 text-[14px] text-ink-muted">Nothing yet. New enquiries, orders and messages appear here.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {stats.recent_activity.map((a, i) => {
                    const Icon = ACTIVITY_ICON[a.type];
                    return (
                      <li key={`${a.type}-${i}-${a.created_at}`}>
                        <Link href={a.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper-deep transition-colors">
                          <Icon className="w-4 h-4 text-ink-muted shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] text-ink truncate">{a.title}</span>
                            <span className="block text-[13px] text-ink-muted">{a.meta}</span>
                          </span>
                          <span className="text-[13px] text-ink-muted shrink-0">{now ? formatRelativeTime(a.created_at, now) : ""}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
