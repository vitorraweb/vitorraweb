"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Mail, ShoppingCart, Loader2, ArrowRight, Target, Inbox, Clock, Globe } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { Sparkline, LiveDot, formatRelativeTime } from "@/components/admin/admin-ui";

type Money = { UGX: number; USD: number };

type ActivityItem = {
  type: "enquiry" | "order" | "message";
  title: string;
  meta: string;
  created_at: string;
  href: string;
};

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
    total: number; pending: number;
    by_status: Record<string, number>;
    this_month: number; last_month: number;
    pending_value: Money; revenue: Money;
  };
  prospects: {
    total: number; reached: number; converted: number; needs_fixing: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
  };
  trends?: {
    labels: string[];
    enquiries: number[];
    orders: number[];
  };
  recent_activity?: ActivityItem[];
};

type Analytics = {
  connected: boolean;
  error?: boolean;
  visitors_today?: number;
  pageviews_today?: number;
  visitors_7d?: number;
  pageviews_7d?: number;
  bounce_rate_7d?: number;
  top_pages?: { page: string; visitors: number }[];
  top_sources?: { source: string; visitors: number }[];
};

const POLL_MS = 45_000;
const ANALYTICS_POLL_MS = 5 * 60_000;

const ACTIVITY_ICON: Record<ActivityItem["type"], typeof Mail> = {
  enquiry: MessageSquare,
  order: ShoppingCart,
  message: Mail,
};

const PRODUCTS: [string, string][] = [
  ["FET", "Fuel Eco Tech"],
  ["SEAL", "SEAL Wound Spray"],
  ["COFFEE", "Coffee (wholesale/export)"],
  ["LOGISTICS", "Logistics"],
  ["GENERAL", "General"],
];

const PIPELINE: [string, string][] = [
  ["new", "New"],
  ["in_progress", "In progress"],
  ["quoted", "Quoted"],
  ["converted", "Converted"],
  ["closed", "Closed"],
];

const fmtUGX = (n: number) => `UGX ${n.toLocaleString("en-US")}`;
const fmtUSD = (n: number) => `$${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Show both currencies, or a dash when there's nothing yet. */
function money(m: Money): string {
  const parts: string[] = [];
  if (m.UGX) parts.push(fmtUGX(m.UGX));
  if (m.USD) parts.push(fmtUSD(m.USD));
  return parts.length ? parts.join("  ·  ") : "—";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: Stats }>("/admin/stats");
      setStats(res.data);
      setLastUpdated(Date.now());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: Analytics }>("/admin/analytics");
      setAnalytics(res.data);
    } catch {
      setAnalytics({ connected: false, error: true });
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    loadAnalytics();
    const id = setInterval(loadAnalytics, ANALYTICS_POLL_MS);
    return () => clearInterval(id);
  }, [loadAnalytics]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#1E1E1E" }}>
          Dashboard
        </h1>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#999" }}>
            <LiveDot />
            Live · updated {now ? formatRelativeTime(new Date(lastUpdated).toISOString(), now) : "just now"}
          </div>
        )}
      </div>
      <p className="text-sm mb-8" style={{ color: "#777777" }}>Enquiry funnel, conversion, and orders at a glance. Refreshes automatically.</p>

      {error && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)" }}>
          <p className="text-sm" style={{ color: "#C0392B" }}>Couldn&apos;t load stats: {error}. Is the backend running?</p>
        </div>
      )}

      {!stats && !error && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777777" }}>
          <Loader2 className="w-4 h-4 animate-spin" />Loading…
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* ── Headline KPIs ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Kpi
              icon={MessageSquare}
              value={stats.enquiries.total}
              label="Total enquiries"
              sub={deltaLabel(stats.enquiries.this_month, stats.enquiries.last_month)}
              href="/admin/enquiries"
              trend={stats.trends?.enquiries}
              trendColor="#C5B27A"
            />
            <Kpi
              icon={Target}
              value={`${stats.enquiries.conversion_rate}%`}
              label="Conversion rate"
              sub={`${stats.enquiries.converted} converted to order`}
            />
            <Kpi
              icon={Inbox}
              value={stats.enquiries.open}
              label="Open enquiries"
              sub="New + in progress"
              href="/admin/enquiries"
            />
            <Kpi
              icon={Clock}
              value={stats.enquiries.avg_response_hours != null ? `${stats.enquiries.avg_response_hours}h` : "—"}
              label="Avg first response"
              sub={stats.enquiries.avg_response_hours != null ? "Submission → first reply" : "No replies yet"}
            />
          </div>

          {/* ── Enquiries by product + pipeline ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Enquiries by product">
              {(() => {
                const max = Math.max(1, ...PRODUCTS.map(([k]) => stats.enquiries.by_product[k] ?? 0));
                return (
                  <div className="space-y-3.5">
                    {PRODUCTS.map(([key, label]) => {
                      const n = stats.enquiries.by_product[key] ?? 0;
                      return (
                        <div key={key}>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-xs font-medium" style={{ color: "#555" }}>{label}</span>
                            <span className="text-xs font-bold" style={{ color: "#1E1E1E" }}>{n}</span>
                          </div>
                          <div style={{ height: "8px", borderRadius: "999px", background: "#F2F2F2", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(n / max) * 100}%`, borderRadius: "999px", background: "linear-gradient(90deg, #C5B27A, #D4C49A)", transition: "width .4s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Card>

            <Card title="Enquiry pipeline">
              <div className="grid grid-cols-5 gap-2">
                {PIPELINE.map(([key, label]) => (
                  <div key={key} className="text-center rounded-xl py-4" style={{ background: "#F8F7F5" }}>
                    <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, lineHeight: 1, color: "#1E1E1E" }}>
                      {stats.enquiries.by_status[key] ?? 0}
                    </p>
                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#999" }}>{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs" style={{ color: "#999" }}>
                Quote-based products (FET, SEAL, Logistics) and coffee wholesale move through this pipeline.
              </p>
            </Card>
          </div>

          {/* ── Orders & revenue ─────────────────────────────────────────── */}
          <Card title="Orders & revenue" href="/admin/orders">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Metric label="Orders this month" value={String(stats.orders.this_month)} sub={`${stats.orders.total} all-time`} trend={stats.trends?.orders} trendColor="#7A6020" />
              <Metric label="Awaiting fulfilment" value={String(stats.orders.pending)} sub={money(stats.orders.pending_value)} />
              <Metric label="Revenue (paid)" value={money(stats.orders.revenue)} sub="UGX & USD shown separately" />
            </div>
            <p className="mt-5 text-xs leading-relaxed" style={{ color: "#999" }}>
              Coffee retail checkout is currently switched off pending confirmed prices, so order volume is light by design.
              Quote-based sales (FET, SEAL, Logistics) are tracked through enquiries above.
            </p>
          </Card>

          {/* ── FET prospect outreach ────────────────────────────────────── */}
          <Card title="FET prospect outreach" href="/admin/prospects">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <Metric label="Total prospects" value={String(stats.prospects.total)} sub="Across all industries" />
              <Metric label="Reached" value={String(stats.prospects.reached)} sub="Contacted / responded" />
              <Metric label="Converted" value={String(stats.prospects.converted)} sub="Became enquiries" />
              <Metric label="Need fixing" value={String(stats.prospects.needs_fixing)} sub="Bad / missing contact" />
            </div>
            {(() => {
              const top = Object.entries(stats.prospects.by_category).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
              const max = Math.max(1, ...top.map(([, n]) => n));
              const LABEL: Record<string, string> = { CARGO: "Cargo", DISTRIBUTOR: "Distributors", CONSTRUCTION: "Construction", MANUFACTURING: "Manufacturing", PUBLIC_TRANSPORT: "Public transport", SCHOOL: "Schools", FARMER: "Farmers", SPARE_PARTS: "Spare parts", CAR_BOND: "Car bonds", FUNERAL: "Funeral" };
              return (
                <div className="mt-6 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Top industries</p>
                  {top.map(([k, n]) => (
                    <div key={k}>
                      <div className="flex items-baseline justify-between mb-1"><span className="text-xs" style={{ color: "#555" }}>{LABEL[k] ?? k}</span><span className="text-xs font-bold" style={{ color: "#1E1E1E" }}>{n}</span></div>
                      <div style={{ height: "6px", borderRadius: "999px", background: "#F2F2F2", overflow: "hidden" }}><div style={{ height: "100%", width: `${(n / max) * 100}%`, background: "linear-gradient(90deg,#C5B27A,#D4C49A)" }} /></div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>

          {/* ── Website traffic ──────────────────────────────────────────── */}
          <Card title="Website traffic">
            {!analytics || !analytics.connected ? (
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                  <Globe className="w-4 h-4" />
                </span>
                <p className="text-sm" style={{ color: "#999" }}>
                  Not connected yet. Set <code>PLAUSIBLE_API_KEY</code> (and <code>PLAUSIBLE_SITE_ID</code> if the site isn&apos;t <code>vitorra.org</code>) on the server to show live visitor stats here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  <Metric label="Visitors today" value={String(analytics.visitors_today ?? 0)} sub={`${analytics.pageviews_today ?? 0} pageviews`} />
                  <Metric label="Visitors (7d)" value={String(analytics.visitors_7d ?? 0)} sub={`${analytics.pageviews_7d ?? 0} pageviews`} />
                  <Metric label="Bounce rate (7d)" value={`${analytics.bounce_rate_7d ?? 0}%`} sub="Single-page visits" />
                  <Metric
                    label="Pages / visit (7d)"
                    value={(analytics.visitors_7d ? (analytics.pageviews_7d ?? 0) / analytics.visitors_7d : 0).toFixed(1)}
                    sub="Engagement depth"
                  />
                </div>

                {(() => {
                  const pages = analytics.top_pages ?? [];
                  const sources = analytics.top_sources ?? [];
                  const maxPages = Math.max(1, ...pages.map((p) => p.visitors));
                  const maxSources = Math.max(1, ...sources.map((s) => s.visitors));
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#999" }}>Top pages (7d)</p>
                        {pages.length === 0 ? (
                          <p className="text-xs" style={{ color: "#999" }}>No data yet.</p>
                        ) : (
                          <div className="space-y-2.5">
                            {pages.map((p) => (
                              <div key={p.page}>
                                <div className="flex items-baseline justify-between mb-1 gap-2">
                                  <span className="text-xs truncate" style={{ color: "#555" }}>{p.page}</span>
                                  <span className="text-xs font-bold shrink-0" style={{ color: "#1E1E1E" }}>{p.visitors}</span>
                                </div>
                                <div style={{ height: "6px", borderRadius: "999px", background: "#F2F2F2", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${(p.visitors / maxPages) * 100}%`, background: "linear-gradient(90deg,#C5B27A,#D4C49A)" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#999" }}>Top referrers (7d)</p>
                        {sources.length === 0 ? (
                          <p className="text-xs" style={{ color: "#999" }}>No data yet.</p>
                        ) : (
                          <div className="space-y-2.5">
                            {sources.map((s) => (
                              <div key={s.source}>
                                <div className="flex items-baseline justify-between mb-1 gap-2">
                                  <span className="text-xs truncate" style={{ color: "#555" }}>{s.source}</span>
                                  <span className="text-xs font-bold shrink-0" style={{ color: "#1E1E1E" }}>{s.visitors}</span>
                                </div>
                                <div style={{ height: "6px", borderRadius: "999px", background: "#F2F2F2", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${(s.visitors / maxSources) * 100}%`, background: "linear-gradient(90deg,#C5B27A,#D4C49A)" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <p className="text-xs flex items-center gap-1.5" style={{ color: "#999" }}>
                  <Globe className="w-3 h-3" /> Visitor data via Plausible Analytics, updated every 5 minutes.
                </p>
              </div>
            )}
          </Card>

          {/* ── Recent activity ──────────────────────────────────────────── */}
          <Card title="Recent activity">
            {!stats.recent_activity || stats.recent_activity.length === 0 ? (
              <p className="text-sm" style={{ color: "#999" }}>Nothing yet — new enquiries, orders, and messages will appear here.</p>
            ) : (
              <div className="space-y-1">
                {stats.recent_activity.map((a, i) => {
                  const Icon = ACTIVITY_ICON[a.type];
                  return (
                    <Link
                      key={`${a.type}-${i}-${a.created_at}`}
                      href={a.href}
                      className="flex items-center gap-3 -mx-2 px-2 py-2.5 rounded-xl transition-colors hover:bg-black/[0.02]"
                    >
                      <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1E1E1E" }}>{a.title}</p>
                        <p className="text-xs" style={{ color: "#999" }}>{a.meta}</p>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "#BBBBBB" }}>
                        {now ? formatRelativeTime(a.created_at, now) : "—"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── Quick links ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <QuickLink href="/admin/enquiries" icon={MessageSquare} label="Enquiries" sub={`${stats.enquiries.open} open`} />
            <QuickLink href="/admin/messages" icon={Mail} label="Messages" sub={`${stats.messages_unread} unread`} />
            <QuickLink href="/admin/orders" icon={ShoppingCart} label="Orders" sub={`${stats.orders.pending} pending`} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Bits ──────────────────────────────────────────────────────────────── */

function deltaLabel(thisMonth: number, lastMonth: number): string {
  const d = thisMonth - lastMonth;
  const arrow = d > 0 ? "▲" : d < 0 ? "▼" : "•";
  return `${thisMonth} this month  ${arrow} ${d >= 0 ? "+" : ""}${d} vs last`;
}

function Kpi({ icon: Icon, value, label, sub, href, trend, trendColor }: { icon: typeof Target; value: string | number; label: string; sub: string; href?: string; trend?: number[]; trendColor?: string }) {
  const inner = (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
          <Icon className="w-5 h-5" />
        </span>
        {href && <ArrowRight className="w-4 h-4 arrow-nudge" style={{ color: "#CCCCCC" }} />}
      </div>
      <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "40px", fontWeight: 700, lineHeight: 1, color: "#1E1E1E" }}>{value}</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: "#1E1E1E" }}>{label}</p>
      <p className="text-xs" style={{ color: "#999999" }}>{sub}</p>
      {trend && <Sparkline data={trend} color={trendColor} />}
    </>
  );
  const cls = "block bg-white rounded-[24px] p-6 border border-black/[0.05]";
  return href ? <Link href={href} className={`group ${cls} hover-lift`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

function Card({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-black/[0.05]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#777" }}>{title}</h2>
        {href && <Link href={href} className="text-xs font-semibold inline-flex items-center gap-1 hover:underline" style={{ color: "#7A6020" }}>View<ArrowRight className="w-3 h-3" /></Link>}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, sub, trend, trendColor }: { label: string; value: string; sub: string; trend?: number[]; trendColor?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#F8F7F5" }}>
      <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "26px", fontWeight: 700, lineHeight: 1.1, color: "#1E1E1E" }}>{value}</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: "#1E1E1E" }}>{label}</p>
      <p className="text-xs" style={{ color: "#999" }}>{sub}</p>
      {trend && <Sparkline data={trend} color={trendColor} />}
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, sub }: { href: string; icon: typeof Mail; label: string; sub: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 bg-white rounded-[20px] p-4 border border-black/[0.05] hover-lift">
      <span className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{label}</p>
        <p className="text-xs" style={{ color: "#999" }}>{sub}</p>
      </div>
      <ArrowRight className="w-4 h-4 arrow-nudge" style={{ color: "#CCCCCC" }} />
    </Link>
  );
}
