"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Mail, ShoppingCart, Loader2, ArrowRight, Target, Inbox, Clock } from "lucide-react";
import { apiAdmin } from "@/lib/auth";

type Money = { UGX: number; USD: number };

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

  useEffect(() => {
    apiAdmin<{ data: Stats }>("/admin/stats")
      .then((res) => setStats(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <div>
      <h1 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#1E1E1E" }}>
        Dashboard
      </h1>
      <p className="text-sm mb-8" style={{ color: "#777777" }}>Enquiry funnel, conversion, and orders at a glance.</p>

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
              <Metric label="Orders this month" value={String(stats.orders.this_month)} sub={`${stats.orders.total} all-time`} />
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

function Kpi({ icon: Icon, value, label, sub, href }: { icon: typeof Target; value: string | number; label: string; sub: string; href?: string }) {
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

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#F8F7F5" }}>
      <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "26px", fontWeight: 700, lineHeight: 1.1, color: "#1E1E1E" }}>{value}</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: "#1E1E1E" }}>{label}</p>
      <p className="text-xs" style={{ color: "#999" }}>{sub}</p>
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
