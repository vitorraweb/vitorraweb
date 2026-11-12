"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { Empty, PageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { formatMoney } from "@/lib/documents";
import { STATUS_LABEL, fmtDateTime, type ContractRecord } from "@/lib/contracts";

/* ─── Contracts ───────────────────────────────────────────────────────────────
   Every sales contract, newest first: who it is for, where it stands with the
   client (sent, opened, signed, declined, link expired). A row opens it.     */

export default function ContractsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (applied) p.set("q", applied);
    try { setRows((await apiAdmin<{ data: ContractRecord[] }>(`/admin/contracts?${p}`)).data); }
    catch { setRows([]); }
    finally { setLoading(false); }
  }, [status, applied]);
  useEffect(() => { load(); }, [load]);

  const filtered = !!(status || applied);

  return (
    <div>
      <PageHeader
        title="Contracts"
        subtitle="FET sales contracts, filled in here and signed by the client online through a private 48-hour link."
        actions={<Link href="/admin/contracts/new" className="c-btn c-btn-primary"><Plus className="w-4 h-4" />New contract</Link>}
      />

      <div className="c-toolbar">
        <form onSubmit={(e) => { e.preventDefault(); setLoading(true); setApplied(q.trim()); }} className="flex items-center gap-1 flex-1 min-w-[14rem]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number or client…" className="c-input flex-1" aria-label="Search contracts" />
          <button type="submit" className="c-btn">Search</button>
        </form>
        <select aria-label="Status" value={status} onChange={(e) => { setLoading(true); setStatus(e.target.value); }} className="c-select" data-active={!!status}>
          <option value="">All statuses</option>
          {(["draft", "sent", "viewed", "expired", "signed", "declined", "void"] as const).map((s) => (
            <option key={s} value={s}>{s === "expired" ? "Link expired" : STATUS_LABEL[s]}</option>
          ))}
        </select>
        {filtered && <button onClick={() => { setLoading(true); setStatus(""); setQ(""); setApplied(""); }} className="c-btn c-btn-ghost text-ink-muted"><X className="w-3.5 h-3.5" />Clear</button>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : rows.length === 0 ? (
        <Empty label={filtered ? "No contracts match these filters." : "No contracts yet. Start one with New contract, or from a FET quotation."} />
      ) : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table min-w-[820px]">
            <thead>
              <tr><th>Number</th><th>Client</th><th>Model</th><th className="text-right">Total</th><th>Status</th><th>Sent</th><th>Signed</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="c-row" onClick={() => router.push(`/admin/contracts/${r.id}`)}>
                  <td className="font-medium text-ink whitespace-nowrap">{r.number}</td>
                  <td className="max-w-[16rem] truncate">{r.buyer_name}<span className="block text-[11.5px] text-ink-muted truncate">{r.buyer_email ?? "No email yet"}</span></td>
                  <td className="whitespace-nowrap text-ink-muted">{r.model_number ?? "—"}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{r.total_amount !== null ? formatMoney(r.currency, r.total_amount) : "—"}</td>
                  <td><StatusBadge status={r.is_expired ? "expired" : r.status} label={r.is_expired ? "Link expired" : STATUS_LABEL[r.status]} /></td>
                  <td className="whitespace-nowrap text-ink-muted text-[12px]">{fmtDateTime(r.sent_at)}</td>
                  <td className="whitespace-nowrap text-ink-muted text-[12px]">{fmtDateTime(r.signed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
