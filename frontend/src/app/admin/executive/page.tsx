"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, ArrowDownToLine, ShoppingCart, MessageSquare, Target, Clock } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";

type Delta = { current: number; previous: number; delta_pct: number | null };
type Summary = {
  period: string; period_label: string; generated_at: string;
  revenue: { UGX: Delta; USD: Delta };
  orders: Delta;
  outstanding: { UGX: number; USD: number };
  enquiries: Delta;
  enquiries_converted: Delta;
  conversion_rate: number;
  avg_response_hours: number | null;
  top_interest: { product: string; count: number }[];
  prospects: { total: number; reached: number; converted: number };
};

const PERIODS: [string, string][] = [["mtd", "This month"], ["last_month", "Last month"], ["week", "Last 7 days"]];
const ugx = (n: number) => `UGX ${n.toLocaleString()}`;
const usd = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PRODUCT_LABEL: Record<string, string> = { FET: "Fuel Eco Tech", SEAL: "SEAL Wound Spray", COFFEE: "Coffee", LOGISTICS: "Logistics", GENERAL: "General" };

export default function ExecutivePage() {
  const [period, setPeriod] = useState("mtd");
  const [s, setS] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiAdmin<{ data: Summary }>(`/admin/executive/summary?period=${period}`); setS(r.data); }
    catch { setS(null); } finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="pb-12">
      <PageHeader title="Executive summary" subtitle="The health of the business at a glance — money in, money owed, sales, and demand." />

      <div className="flex gap-2 mb-6">
        {PERIODS.map(([v, label]) => (
          <button key={v} onClick={() => setPeriod(v)} className="text-sm font-semibold px-4 py-2 rounded-full" style={period === v ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{label}</button>
        ))}
      </div>

      {loading || !s ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: "#999" }}>Showing <strong style={{ color: "#7A6020" }}>{s.period_label}</strong></p>

          {/* Money received — hero */}
          <div className="rounded-[24px] p-7 mb-4 relative overflow-hidden" style={{ background: "#1E1E1E" }}>
            <div className="hero-aurora-right" aria-hidden="true" />
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(197,178,122,0.9)" }}>Money received (paid)</p>
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <Money label="Uganda (UGX)" value={ugx(s.revenue.UGX.current)} delta={s.revenue.UGX.delta_pct} />
                {(s.revenue.USD.current > 0 || s.revenue.USD.previous > 0) && (
                  <Money label="International (USD)" value={usd(s.revenue.USD.current)} delta={s.revenue.USD.delta_pct} />
                )}
              </div>
            </div>
          </div>

          {/* Money owed + sales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card icon={ArrowDownToLine} label="Money owed to us" hint="Orders placed, not yet paid">
              <p className="text-xl font-bold" style={{ color: "#1E1E1E" }}>{ugx(s.outstanding.UGX)}</p>
              {s.outstanding.USD > 0 && <p className="text-sm" style={{ color: "#777" }}>{usd(s.outstanding.USD)}</p>}
            </Card>
            <Card icon={ShoppingCart} label="New orders">
              <Headline value={s.orders.current} delta={s.orders.delta_pct} />
            </Card>
            <Card icon={MessageSquare} label="New enquiries">
              <Headline value={s.enquiries.current} delta={s.enquiries.delta_pct} />
            </Card>
            <Card icon={Target} label="Became sales" hint="Enquiries converted">
              <Headline value={s.enquiries_converted.current} delta={s.enquiries_converted.delta_pct} />
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Card icon={Target} label="Overall conversion rate" hint="Of all enquiries ever received">
              <p className="text-2xl font-bold" style={{ color: "#1E1E1E" }}>{s.conversion_rate}%</p>
            </Card>
            <Card icon={Clock} label="Average time to first reply">
              <p className="text-2xl font-bold" style={{ color: "#1E1E1E" }}>{s.avg_response_hours !== null ? `${s.avg_response_hours} hrs` : "—"}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* What customers want */}
            <div className="bg-white rounded-[20px] border border-black/[0.06] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] mb-4" style={{ color: "#bbb" }}>What customers are asking about</h3>
              {s.top_interest.length === 0 ? <p className="text-sm" style={{ color: "#999" }}>No new enquiries in this period.</p> : (
                <div className="space-y-2.5">
                  {s.top_interest.map((i) => {
                    const max = Math.max(...s.top_interest.map((x) => x.count));
                    return (
                      <div key={i.product}>
                        <div className="flex justify-between text-sm mb-1"><span style={{ color: "#454545" }}>{PRODUCT_LABEL[i.product] ?? i.product}</span><span className="font-semibold" style={{ color: "#1E1E1E" }}>{i.count}</span></div>
                        <div className="h-2 rounded-full" style={{ background: "#F2F2F2" }}><div className="h-2 rounded-full" style={{ width: `${(i.count / max) * 100}%`, background: "#C5B27A" }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sales pipeline */}
            <div className="bg-white rounded-[20px] border border-black/[0.06] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] mb-4" style={{ color: "#bbb" }}>Sales pipeline (leads)</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Pipe label="Total leads" value={s.prospects.total} />
                <Pipe label="Reached out" value={s.prospects.reached} />
                <Pipe label="Converted" value={s.prospects.converted} highlight />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Money({ label, value, delta }: { label: string; value: string; delta: number | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "30px", fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{value}</p>
      <DeltaBadge delta={delta} dark />
    </div>
  );
}

function Headline({ value, delta }: { value: number; delta: number | null }) {
  return (
    <div>
      <p className="text-2xl font-bold" style={{ color: "#1E1E1E" }}>{value.toLocaleString()}</p>
      <DeltaBadge delta={delta} />
    </div>
  );
}

function DeltaBadge({ delta, dark }: { delta: number | null; dark?: boolean }) {
  if (delta === null) return <span className="text-[11px]" style={{ color: dark ? "rgba(255,255,255,0.45)" : "#bbb" }}>vs previous: n/a</span>;
  if (delta === 0) return <span className="text-[11px]" style={{ color: dark ? "rgba(255,255,255,0.45)" : "#999" }}>no change</span>;
  const up = delta > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? "#16A34A" : "#C0392B";
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5" style={{ color }}>
      <Icon className="w-3.5 h-3.5" />{up ? "+" : ""}{delta}% vs previous
    </span>
  );
}

function Card({ icon: Icon, label, hint, children }: { icon: typeof ShoppingCart; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
      <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4" style={{ color: "#C5B27A" }} /><span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#bbb" }}>{label}</span></div>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: "#bbb" }}>{hint}</p>}
    </div>
  );
}

function Pipe({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: highlight ? "rgba(34,197,94,0.1)" : "#F7F7F5" }}>
      <p className="text-xl font-bold" style={{ color: highlight ? "#16A34A" : "#1E1E1E" }}>{value.toLocaleString()}</p>
      <p className="text-[11px] mt-0.5" style={{ color: "#999" }}>{label}</p>
    </div>
  );
}
