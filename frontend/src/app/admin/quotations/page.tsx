"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, StatusBadge } from "@/components/admin/admin-ui";
import { BUSINESS_LABEL, formatMoney, type Business } from "@/lib/documents";

/* ─── Quotations ──────────────────────────────────────────────────────────────
   Every quotation on the Coffee and FET templates, newest first. A row opens
   the editor; an accepted quotation becomes an invoice from there.          */

type Row = {
  id: number; number: string; business: Business | null; status: string; is_expired: boolean;
  customer_name: string; currency: string; issue_date: string; valid_until: string | null; total: number;
  invoices: { id: number; number: string; kind: string }[];
};

const fmt = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function QuotationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [business, setBusiness] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (business) p.set("business", business);
    if (applied) p.set("q", applied);
    try { setRows((await apiAdmin<{ data: Row[] }>(`/admin/accounting/quotations?${p}`)).data); }
    catch { setRows([]); }
    finally { setLoading(false); }
  }, [status, business, applied]);
  useEffect(() => { load(); }, [load]);

  const filtered = !!(status || business || applied);

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Quotes on the Vitorra Coffee and Fuel Eco Tech templates. Accepted quotes become invoices in one step."
        actions={<>
          <Link href="/admin/quotations/new?business=coffee" className="c-btn c-btn-primary"><Plus className="w-4 h-4" />Coffee quotation</Link>
          <Link href="/admin/quotations/new?business=fet" className="c-btn c-btn-primary"><Plus className="w-4 h-4" />FET quotation</Link>
        </>}
      />

      <div className="c-toolbar">
        <form onSubmit={(e) => { e.preventDefault(); setLoading(true); setApplied(q.trim()); }} className="flex items-center gap-1 flex-1 min-w-[14rem]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number or customer…" className="c-input flex-1" aria-label="Search quotations" />
          <button type="submit" className="c-btn">Search</button>
        </form>
        <select aria-label="Template" value={business} onChange={(e) => { setLoading(true); setBusiness(e.target.value); }} className="c-select" data-active={!!business}>
          <option value="">All templates</option>
          <option value="coffee">Vitorra Coffee</option>
          <option value="fet">Fuel Eco Tech</option>
        </select>
        <select aria-label="Status" value={status} onChange={(e) => { setLoading(true); setStatus(e.target.value); }} className="c-select" data-active={!!status}>
          <option value="">All statuses</option>
          {["draft", "sent", "expired", "accepted", "declined", "void"].map((s) => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        {filtered && <button onClick={() => { setLoading(true); setStatus(""); setBusiness(""); setQ(""); setApplied(""); }} className="c-btn c-btn-ghost text-ink-muted"><X className="w-3.5 h-3.5" />Clear</button>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : rows.length === 0 ? (
        <Empty label={filtered ? "No quotations match these filters." : "No quotations yet. Start one with the buttons above."} />
      ) : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table min-w-[820px]">
            <thead>
              <tr><th>Number</th><th>Customer</th><th>Template</th><th>Date</th><th>Valid until</th><th className="text-right">Total</th><th>Status</th><th>Invoiced</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="c-row" onClick={() => router.push(`/admin/quotations/${r.id}`)}>
                  <td className="font-medium text-ink whitespace-nowrap">{r.number}</td>
                  <td className="max-w-[16rem] truncate">{r.customer_name}</td>
                  <td className="whitespace-nowrap">{r.business ? BUSINESS_LABEL[r.business] : "General"}</td>
                  <td className="whitespace-nowrap text-ink-muted">{fmt(r.issue_date)}</td>
                  <td className={`whitespace-nowrap ${r.is_expired ? "text-alert-ink" : "text-ink-muted"}`}>{fmt(r.valid_until)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{formatMoney(r.currency, r.total)}</td>
                  <td><StatusBadge status={r.is_expired ? "overdue" : r.status} label={r.is_expired ? "expired" : r.status} /></td>
                  <td className="text-[12px] text-ink-muted">{r.invoices.length ? r.invoices.map((i) => i.number).join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
