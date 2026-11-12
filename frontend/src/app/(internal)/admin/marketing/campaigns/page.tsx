"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, StatusBadge, formatDate } from "@/components/admin/admin-ui";
import { KpiTile } from "@/components/admin/reporting";
import { DEFAULT_SETTINGS } from "@/components/admin/marketing/EmailDesigner";
import { pct, type CampaignSummary, type SavedDesign, type Starter } from "@/components/admin/marketing/shared";

/* ─── Marketing → Campaigns ───────────────────────────────────────────────────
   Every designed campaign with its score. New campaigns start from a saved
   template, a ready-made layout or a blank page.                          */

const GRADE_TONE: Record<string, string> = { Excellent: "ok", Good: "blue", Fair: "gold", Poor: "alert" };

export default function CampaignsPage() {
  const router = useRouter();
  const [list, setList] = useState<CampaignSummary[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setList((await apiAdmin<{ data: CampaignSummary[] }>("/admin/marketing/campaigns")).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const sent = (list ?? []).filter((c) => c.stats && c.stats.delivered > 0);
  const avg = (k: "open_rate" | "click_rate" | "score") => {
    const v = sent.map((c) => c.stats?.[k]).filter((x): x is number => x != null);
    return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Campaigns"
        subtitle="Design an email, test it to support, send it to your markets, and see who opened and clicked."
        actions={<button className="c-btn c-btn-primary" onClick={() => setPicking(true)}><Plus className="w-4 h-4" />New campaign</button>}
      />
      {error && <p className="text-[14px] text-alert-ink mb-4">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Campaigns sent" value={String(sent.length)} sub={`${(list ?? []).filter((c) => c.status === "draft").length} drafts`} />
        <KpiTile label="Average open rate" value={pct(avg("open_rate"))} sub="Typical B2B: 20–30%" />
        <KpiTile label="Average click rate" value={pct(avg("click_rate"))} sub="Typical B2B: 2–5%" />
        <KpiTile label="Average score" value={avg("score") == null ? "—" : `${Math.round(avg("score")!)} / 100`} sub="Delivery, opens, clicks, unsubscribes" />
      </div>

      {list === null ? (
        <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
      ) : list.length === 0 ? (
        <div className="c-panel px-4 py-10 text-center">
          <p className="text-[15px] text-ink">No campaigns yet.</p>
          <button className="c-btn c-btn-primary mt-3" onClick={() => setPicking(true)}><Plus className="w-4 h-4" />Create the first one</button>
        </div>
      ) : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table min-w-[900px]">
            <thead><tr><th>Campaign</th><th>Markets</th><th>Status</th><th className="text-right">Sent</th><th className="text-right">Opened</th><th className="text-right">Clicked</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="c-row" onClick={() => router.push(`/admin/marketing/campaigns/${c.id}`)}>
                  <td className="max-w-[20rem]">
                    <span className="block font-medium text-ink truncate">{c.name || c.subject}</span>
                    {c.name && <span className="block text-[13px] text-ink-muted truncate">{c.subject}</span>}
                  </td>
                  <td className="max-w-[12rem] truncate text-ink-muted">{c.markets.join(", ") || "—"}</td>
                  <td><StatusBadge status={c.status === "draft" && c.test_current ? "approved" : c.status} label={c.status === "draft" ? (c.test_current ? "Tested — ready" : "Draft") : undefined} /></td>
                  <td className="text-right">{c.stats?.delivered ?? (c.status === "draft" ? "—" : 0)}</td>
                  <td className="text-right">{pct(c.stats?.open_rate)}</td>
                  <td className="text-right">{pct(c.stats?.click_rate)}</td>
                  <td>{c.stats?.grade ? <span className="c-chip" data-tone={GRADE_TONE[c.stats.grade]}>{c.stats.grade} · {c.stats.score}</span> : <span className="text-ink-muted">—</span>}</td>
                  <td className="text-ink-muted whitespace-nowrap">{formatDate(c.started_at ?? c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {picking && <StartPicker onClose={() => setPicking(false)} onCreated={(id) => router.push(`/admin/marketing/campaigns/${id}`)} />}
    </div>
  );
}

/** Choose what the new campaign starts from. */
function StartPicker({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [saved, setSaved] = useState<SavedDesign[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiAdmin<{ data: SavedDesign[]; starters: Starter[] }>("/admin/marketing/designs").then((r) => { setStarters(r.starters); setSaved(r.data); }).catch(() => {});
  }, []);

  const start = async (key: string, name: string, design: unknown, product?: string | null) => {
    setBusy(key); setErr("");
    try {
      const r = await apiAdmin<{ data: { id: number } }>("/admin/marketing/campaigns", {
        method: "POST", body: JSON.stringify({ name, subject: name, design, product: product ?? null }),
      });
      onCreated(r.data.id);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not create"); setBusy(null); }
  };

  const option = (k: string, title: string, sub: string, design: unknown, product?: string | null) => (
    <button key={k} type="button" disabled={busy !== null} onClick={() => start(k, title, design, product)} className="c-panel text-left p-3 hover:border-line-strong transition-colors">
      <span className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">{busy === k && <Loader2 className="w-4 h-4 animate-spin" />}{title}</span>
      <span className="block text-[13px] text-ink-muted mt-0.5">{sub}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-paper rounded-md w-full max-w-[720px] max-h-[86vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="c-panel-head"><span className="c-panel-title">Start a campaign from…</span><button className="c-btn c-btn-ghost" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button></div>
        <div className="p-4 space-y-4">
          {err && <p className="text-[13px] text-alert-ink">{err}</p>}
          {saved.length > 0 && (<div>
            <p className="text-[13px] font-semibold text-ink mb-2">Your saved templates</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {saved.map((d) => option(`d${d.id}`, d.name, d.product ?? "Any product", d.design, d.product))}
            </div>
          </div>)}
          <div>
            <p className="text-[13px] font-semibold text-ink mb-2">Ready-made layouts</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starters.map((s) => option(s.key, s.name, s.description, s.design))}
              {option("blank", "Blank", "An empty page with the Vitorra footer.", { settings: DEFAULT_SETTINGS, blocks: [] })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
