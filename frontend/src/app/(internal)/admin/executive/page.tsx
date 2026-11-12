"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { GraphView, KpiTile } from "@/components/admin/reporting";

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
  books: {
    income: Record<string, number>; expense: Record<string, number>; net: Record<string, number>;
    cash: Record<string, number>; payables: Record<string, number>; has_data: boolean;
  };
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

  const booksMoney = (c: string, a: number) => (c === "UGX" ? ugx(a) : `${c === "USD" ? "$" : "€"}${(a / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  const bookCurrencies = s?.books?.has_data
    ? ["UGX", "USD", "EUR"].filter((c) => s.books.income[c] || s.books.expense[c] || s.books.cash[c] || s.books.payables[c])
    : [];

  return (
    <div className="pb-12">
      <PageHeader
        title="Executive report"
        subtitle="The health of the business at a glance: money in, money owed, sales and demand."
        actions={
          <div className="o-seg" role="group" aria-label="Period">
            {PERIODS.map(([v, label]) => (
              <button key={v} type="button" aria-pressed={period === v} onClick={() => setPeriod(v)}>{label}</button>
            ))}
          </div>
        }
      />

      {loading || !s ? (
        <div className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13.5px] text-ink-muted">Showing <strong className="text-ink">{s.period_label}</strong>, compared with the period before.</p>

          {/* Money */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile label="Money received (UGX)" value={ugx(s.revenue.UGX.current)} now={s.revenue.UGX.current} before={s.revenue.UGX.previous} />
            <KpiTile label="Money received (USD)" value={usd(s.revenue.USD.current)} now={s.revenue.USD.current} before={s.revenue.USD.previous} />
            <KpiTile label="Owed to us" value={ugx(s.outstanding.UGX)} sub={s.outstanding.USD > 0 ? `plus ${usd(s.outstanding.USD)} · orders not yet paid` : "Orders placed, not yet paid"} />
            <KpiTile label="First reply" value={s.avg_response_hours !== null ? `${s.avg_response_hours} h` : "—"} sub="Average time to answer an enquiry" />
          </div>

          {/* Sales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile label="New enquiries" value={s.enquiries.current.toLocaleString()} now={s.enquiries.current} before={s.enquiries.previous} />
            <KpiTile label="Became sales" value={s.enquiries_converted.current.toLocaleString()} now={s.enquiries_converted.current} before={s.enquiries_converted.previous} />
            <KpiTile label="New orders" value={s.orders.current.toLocaleString()} now={s.orders.current} before={s.orders.previous} />
            <KpiTile label="Conversion rate" value={`${s.conversion_rate}%`} sub="Of all enquiries ever received" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <GraphView
              title="This period against the one before"
              rows={[
                { label: "Enquiries", values: { now: s.enquiries.current, before: s.enquiries.previous } },
                { label: "Became sales", values: { now: s.enquiries_converted.current, before: s.enquiries_converted.previous } },
                { label: "Orders", values: { now: s.orders.current, before: s.orders.previous } },
              ]}
              series={[{ key: "now", label: s.period_label }, { key: "before", label: "Previous period" }]}
              types={["bar"]}
              format={(v) => v.toLocaleString()}
            />
            <GraphView
              title="What customers are asking about"
              rows={s.top_interest.map((i) => ({ label: PRODUCT_LABEL[i.product] ?? i.product, values: { count: i.count } }))}
              measures={[{ key: "count", label: "Enquiries", format: (v) => v.toLocaleString() }]}
              types={["bar", "pie"]}
              empty="No new enquiries in this period."
            />
          </div>

          {/* From the books — one chart per currency; amounts never cross currencies. */}
          {bookCurrencies.length > 0 && (
            <>
              <h2 className="text-[16px] font-semibold text-ink pt-2">From the books (approved income and spending)</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {bookCurrencies.map((c) => (
                  <GraphView
                    key={c}
                    title={`${c}: income, spending and profit`}
                    rows={[
                      { label: "Income", values: { amount: s.books.income[c] ?? 0 } },
                      { label: "Spent", values: { amount: s.books.expense[c] ?? 0 } },
                      { label: "Profit", values: { amount: s.books.net[c] ?? 0 } },
                      { label: "Cash on hand", values: { amount: s.books.cash[c] ?? 0 } },
                      { label: "We owe", values: { amount: s.books.payables[c] ?? 0 } },
                    ]}
                    measures={[{ key: "amount", label: c, format: (v) => booksMoney(c, v) }]}
                    types={["bar"]}
                    defaultType="bar"
                    note={(s.books.net[c] ?? 0) < 0 ? "Spending was higher than income in this period." : undefined}
                  />
                ))}
              </div>
            </>
          )}

          {/* Outreach */}
          <div className="grid grid-cols-3 gap-3">
            <KpiTile label="Sales leads" value={s.prospects.total.toLocaleString()} sub="Prospects on file" href="/admin/prospects" />
            <KpiTile label="Reached out" value={s.prospects.reached.toLocaleString()} sub="Contacted or responded" />
            <KpiTile label="Converted" value={s.prospects.converted.toLocaleString()} sub="Became enquiries" />
          </div>
        </div>
      )}
    </div>
  );
}
