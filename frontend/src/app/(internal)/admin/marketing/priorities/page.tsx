"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Phone, Mail, Info } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, formatRelativeTime } from "@/components/admin/admin-ui";
import { KpiTile } from "@/components/admin/reporting";
import { PRODUCTS, TIERS, pretty, type Market } from "@/components/admin/marketing/shared";

/* ─── Marketing → Lead priorities ─────────────────────────────────────────────
   The decision engine's answer to "who should we spend time on?": every lead
   scored from how it behaved with our campaigns (opened, clicked, replied, or
   ignored), where it is in the pipeline, and how its industry has converted —
   with the reasons in words and a suggested next step. Leads that have
   disappointed are put under Avoid instead of being suggested.         */

type Lead = {
  id: number; name: string; email: string | null; phone: string | null; product: string; category: string; location: string | null;
  outreach_status: string; assigned_to: string | null; follow_up_on: string | null;
  lead_score: number | null; lead_tier: string | null; lead_reasons: string[] | null; lead_action: string | null;
};
type Resp = { data: Lead[]; total: number; current_page: number; last_page: number; counts: Record<string, number>; scored_at: string | null };

export default function PrioritiesPage() {
  const [tier, setTier] = useState("hot");
  const [product, setProduct] = useState("");
  const [market, setMarket] = useState("");
  const [page, setPage] = useState(1);
  const [r, setR] = useState<Resp | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState<number | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ tier, page: String(page), ...(product ? { product } : {}), ...(market ? { market } : {}) });
    setR(await apiAdmin<Resp>(`/admin/marketing/priorities?${qs}`));
    setNow(Date.now());
  }, [tier, product, market, page]);
  useEffect(() => { load().catch(() => {}); }, [load]);
  useEffect(() => { apiAdmin<{ data: Market[] }>("/admin/marketing/markets").then((x) => setMarkets(x.data)).catch(() => {}); }, []);

  const recalc = async () => {
    setBusy(true); setMsg("");
    try { setMsg((await apiAdmin<{ message: string }>("/admin/marketing/priorities/recalculate", { method: "POST" })).message); await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Could not re-score"); }
    finally { setBusy(false); }
  };

  const c = r?.counts ?? {};
  const active = TIERS.find((t) => t.key === tier)!;

  return (
    <div className="pb-12">
      <PageHeader
        title="Lead priorities"
        subtitle="Who to focus on, and who to leave alone, from how each lead has responded to us so far."
        actions={<>
          {r?.scored_at && now && <span className="text-[13px] text-ink-muted">Scored {formatRelativeTime(r.scored_at, now)}</span>}
          <button className="c-btn" onClick={recalc} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}Re-score now</button>
        </>}
      />
      {msg && <p className="text-[14px] text-ok-ink mb-3">{msg}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        {TIERS.map((t) => (
          <button key={t.key} type="button" onClick={() => { setTier(t.key); setPage(1); }} className="text-left">
            <div className="o-kpi h-full" style={tier === t.key ? { borderColor: "var(--o-accent)", boxShadow: "0 0 0 1px var(--o-accent)" } : undefined}>
              <p className="o-kpi-label flex items-center gap-1.5"><span className="c-chip" data-tone={t.tone}>{t.label}</span></p>
              <p className="o-kpi-value">{(c[t.key] ?? 0).toLocaleString("en-US")}</p>
              <p className="o-kpi-sub">{t.hint}</p>
            </div>
          </button>
        ))}
      </div>
      {(c.unscored ?? 0) > 0 && <p className="text-[13px] text-ink-muted mb-3">{c.unscored} leads have not been scored yet. Press Re-score now, or wait for the hourly run.</p>}

      <div className="c-toolbar">
        <span className="text-[14px] text-ink font-medium mr-1">{active.label} leads</span>
        <select className="c-select" value={product} onChange={(e) => { setProduct(e.target.value); setPage(1); }} data-active={!!product}>
          <option value="">All products</option>{PRODUCTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select className="c-select" value={market} onChange={(e) => { setMarket(e.target.value); setPage(1); }} data-active={!!market}>
          <option value="">All markets</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {!r ? <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
        : r.data.length === 0 ? <Empty label={`No ${active.label.toLowerCase()} leads${product || market ? " for these filters" : ""}.`} /> : (
          <div className="c-panel overflow-x-auto">
            <table className="c-table min-w-[980px]">
              <thead><tr><th>Lead</th><th>Score</th><th>Why</th><th>Suggested next step</th><th>Contact</th></tr></thead>
              <tbody>
                {r.data.map((l) => (
                  <tr key={l.id}>
                    <td className="max-w-[16rem]">
                      <span className="block font-medium text-ink truncate">{l.name}</span>
                      <span className="block text-[13px] text-ink-muted truncate">{l.product} · {pretty(l.category)}{l.location ? ` · ${l.location}` : ""}</span>
                    </td>
                    <td className="w-36">
                      {l.lead_score != null && !["customer", "do_not_contact"].includes(l.lead_tier ?? "") ? (
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums font-semibold text-ink w-7">{l.lead_score}</span>
                          <span className="flex-1 h-1.5 rounded-full bg-paper-deep overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${l.lead_score}%`, background: l.lead_score >= 60 ? "var(--o-danger)" : l.lead_score >= 35 ? "var(--o-warning)" : "var(--o-info)" }} /></span>
                        </div>
                      ) : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="text-[13.5px] max-w-[24rem]">
                      <ul className="space-y-0.5">{(l.lead_reasons ?? []).map((x) => <li key={x} className="text-ink-soft">{x}</li>)}</ul>
                    </td>
                    <td className="text-[13.5px] text-ink max-w-[16rem]">{l.lead_action}</td>
                    <td className="whitespace-nowrap">
                      {l.phone && <a href={`tel:${l.phone}`} className="flex items-center gap-1.5 text-[13.5px] text-ink hover:underline"><Phone className="w-3.5 h-3.5 text-ink-muted" />{l.phone}</a>}
                      {l.email && <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 text-[13.5px] text-ink hover:underline"><Mail className="w-3.5 h-3.5 text-ink-muted" />{l.email}</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-line text-[14px] text-ink-muted">
                <span>{r.total} leads</span>
                <span className="flex items-center gap-2">
                  <button className="c-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>Page {r.current_page} of {r.last_page}
                  <button className="c-btn" disabled={page >= r.last_page} onClick={() => setPage(page + 1)}>Next</button>
                </span>
              </div>
            )}
          </div>
        )}

      <section className="c-panel p-4 mt-4">
        <h3 className="c-panel-title flex items-center gap-2 mb-2"><Info className="w-4 h-4" />How the engine decides</h3>
        <ul className="text-[14px] text-ink-soft space-y-1 list-disc pl-5">
          <li><strong>Raises a lead</strong> that clicked or replied to a campaign, has a quotation or is qualified, has a follow-up due, or is in an industry that has bought from us before.</li>
          <li><strong>Lowers a lead</strong> that ignored several campaigns in a row, or went quiet after a quotation.</li>
          <li><strong>Avoid</strong>: said not interested, ignored us repeatedly, or has no working contact details. Campaigns can skip these automatically.</li>
          <li><strong>Do not contact</strong>: unsubscribed. They are never emailed again.</li>
          <li>Scores refresh every hour from the latest opens, clicks, replies and pipeline changes. Change a lead&apos;s status on the <Link href="/admin/prospects" className="text-gold-ink hover:underline">Prospects</Link> screen and the engine follows.</li>
        </ul>
      </section>
    </div>
  );
}
