"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { apiAdmin, auth, downloadFile, fetchBlob } from "@/lib/auth";
import { Empty } from "@/components/admin/admin-ui";

/* ─── Accounting → Petty cash ─────────────────────────────────────────────────
   Finance fills in a petty cash voucher — who was paid, what for, each item
   with its department and amount, and who prepared, approved and received
   it. The system numbers it (PCV-2026-0001…) and produces the printable
   voucher to sign. A voucher can be corrected, or voided (it stays on file). */

type Item = { description: string; department: string; amount: string };
type Voucher = {
  id: number; number: string; voucher_date: string; paid_to: string; department: string | null; currency: string;
  items: { description: string; department: string | null; amount: number }[]; total: number; total_words: string;
  purpose: string | null; prepared_by: string | null; approved_by: string | null; received_by: string | null; status: "issued" | "void";
};

const DEPARTMENTS = ["Finance", "Operations", "Sales", "Marketing", "Administration", "IT", "Logistics", "Fuel Eco Tech", "Vitorra Coffee", "SEAL"];
const blankItem = (): Item => ({ description: "", department: "", amount: "" });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" });
const money = (cur: string, n: number) => (cur === "UGX" ? `UGX ${n.toLocaleString("en-US")}` : `${cur === "USD" ? "$" : "€"}${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
const toMinor = (cur: string, s: string) => { const n = Number(String(s).replace(/,/g, "")) || 0; return cur === "UGX" ? Math.round(n) : Math.round(n * 100); };
const toMajor = (cur: string, n: number) => String(cur === "UGX" ? n : n / 100);

/** Print a PDF from the console: load it into a hidden frame and open the print dialog. */
async function printPdf(path: string): Promise<void> {
  const url = URL.createObjectURL(await fetchBlob(path));
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.src = url;
  frame.onload = () => { try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } catch { window.open(url, "_blank"); } };
  document.body.appendChild(frame);
  setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 120_000);
}

export function PettyCash() {
  const [list, setList] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Voucher | "new" | null>(null);

  const load = useCallback(async () => {
    try { setList((await apiAdmin<{ data: Voucher[] }>(`/admin/accounting/petty-cash${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)).data); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Could not load vouchers."); }
    finally { setLoading(false); }
  }, [q]);
  useEffect(() => { const t = setTimeout(() => void load(), 250); return () => clearTimeout(t); }, [load]);

  const voidIt = async (v: Voucher) => {
    if (!confirm(`Void ${v.number}? It stays on file, marked VOID.`)) return;
    try { await apiAdmin(`/admin/accounting/petty-cash/${v.id}/void`, { method: "POST" }); await load(); setMsg(`${v.number} voided.`); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Could not void it."); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input className="c-input w-64" placeholder="Search number, paid to or purpose…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="c-btn c-btn-primary ml-auto" onClick={() => { setMsg(""); setEditing("new"); }}><Plus className="w-4 h-4" />New petty cash voucher</button>
      </div>
      {msg && <p className="text-sm mb-3" style={{ color: /voided|Saved|saved/.test(msg) ? "#16A34A" : "#C0392B" }}>{msg}</p>}

      {editing && <VoucherForm voucher={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={(v, text) => { setEditing(null); setMsg(text); void load(); void v; }} />}

      {loading ? <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
        : list.length === 0 ? <Empty label="No petty cash vouchers yet. Create the first with the button above." />
        : (
          <div className="space-y-2">
            {list.map((v) => (
              <div key={v.id} className="bg-white rounded-[14px] border border-black/[0.05] p-4 flex items-center gap-3 flex-wrap" style={v.status === "void" ? { opacity: 0.6 } : undefined}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink" style={v.status === "void" ? { textDecoration: "line-through" } : undefined}>{v.number}</span>
                    {v.status === "void" && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(192,57,43,0.1)", color: "var(--o-danger)" }}>void</span>}
                    <span className="text-[12px] text-ink-muted">{new Date(`${v.voucher_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <p className="text-xs text-ink-muted">{v.paid_to}{v.department ? ` · ${v.department}` : ""} · <b className="text-ink">{money(v.currency, v.total)}</b> · {v.items.length} item{v.items.length === 1 ? "" : "s"}{v.purpose ? ` · ${v.purpose}` : ""}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" className="c-btn" title="Print" onClick={() => void printPdf(`/admin/accounting/petty-cash/${v.id}/pdf`).catch((e) => setMsg(e.message))}><Printer className="w-4 h-4" />Print</button>
                  <button type="button" className="c-btn" title="Download PDF" onClick={() => void downloadFile(`/admin/accounting/petty-cash/${v.id}/pdf`, `${v.number}.pdf`)}><Download className="w-4 h-4" />PDF</button>
                  {v.status !== "void" && <button type="button" className="c-btn c-btn-ghost" aria-label={`Edit ${v.number}`} onClick={() => { setMsg(""); setEditing(v); }}><Pencil className="w-4 h-4" /></button>}
                  {v.status !== "void" && <button type="button" className="c-btn c-btn-ghost" aria-label={`Void ${v.number}`} title="Void" onClick={() => void voidIt(v)}><X className="w-4 h-4" style={{ color: "var(--o-danger)" }} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function VoucherForm({ voucher, onClose, onSaved }: { voucher: Voucher | null; onClose: () => void; onSaved: (v: Voucher, text: string) => void }) {
  const cur0 = voucher?.currency ?? "UGX";
  const [currency, setCurrency] = useState(cur0);
  const [date, setDate] = useState(voucher?.voucher_date ?? today());
  const [paidTo, setPaidTo] = useState(voucher?.paid_to ?? "");
  const [department, setDepartment] = useState(voucher?.department ?? "");
  const [purpose, setPurpose] = useState(voucher?.purpose ?? "");
  const [items, setItems] = useState<Item[]>(voucher ? voucher.items.map((it) => ({ description: it.description, department: it.department ?? "", amount: toMajor(cur0, it.amount) })) : [blankItem(), blankItem()]);
  const [preparedBy, setPreparedBy] = useState(voucher?.prepared_by ?? auth.getUser()?.name ?? "");
  const [approvedBy, setApprovedBy] = useState(voucher?.approved_by ?? "");
  const [receivedBy, setReceivedBy] = useState(voucher?.received_by ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filled = items.filter((it) => it.description.trim() || it.amount.trim());
  const total = filled.reduce((n, it) => n + toMinor(currency, it.amount), 0);
  const setItem = (i: number, patch: Partial<Item>) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const save = async (then: "none" | "print" | "pdf") => {
    setError("");
    if (!paidTo.trim()) { setError("Who was the cash paid to?"); return; }
    if (!filled.length) { setError("Add at least one item."); return; }
    if (filled.some((it) => !it.description.trim() || toMinor(currency, it.amount) <= 0)) { setError("Each item needs a description and an amount."); return; }
    setBusy(true);
    try {
      const body = JSON.stringify({
        voucher_date: date, paid_to: paidTo.trim(), department: department.trim() || null, currency, purpose: purpose.trim() || null,
        items: filled.map((it) => ({ description: it.description.trim(), department: it.department.trim() || null, amount: toMinor(currency, it.amount) })),
        prepared_by: preparedBy.trim() || null, approved_by: approvedBy.trim() || null, received_by: receivedBy.trim() || null,
      });
      const r = voucher
        ? await apiAdmin<{ data: Voucher }>(`/admin/accounting/petty-cash/${voucher.id}`, { method: "PATCH", body })
        : await apiAdmin<{ data: Voucher }>("/admin/accounting/petty-cash", { method: "POST", body });
      const path = `/admin/accounting/petty-cash/${r.data.id}/pdf`;
      if (then === "print") await printPdf(path);
      if (then === "pdf") await downloadFile(path, `${r.data.number}.pdf`);
      onSaved(r.data, `Saved ${r.data.number} (${money(r.data.currency, r.data.total)}).`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the voucher."); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[5vh] pb-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={voucher ? `Edit ${voucher.number}` : "New petty cash voucher"}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-paper border border-line rounded-edge shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <span className="text-[15px] text-ink font-semibold">{voucher ? `Edit ${voucher.number}` : "New petty cash voucher"}</span>
          <button onClick={onClose} className="c-icon-btn" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 text-[13px]">
          <div className="grid sm:grid-cols-4 gap-3">
            <label className="block">Date<input type="date" className="c-input w-full mt-1" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="block sm:col-span-2">Paid to<input className="c-input w-full mt-1" maxLength={120} value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="Name of the person paid" /></label>
            <label className="block">Currency
              <select className="c-input w-full mt-1" value={currency} onChange={(e) => setCurrency(e.target.value)}>{["UGX", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="block">Department<input className="c-input w-full mt-1" list="pcv-departments" maxLength={60} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" /></label>
            <label className="block sm:col-span-3">Purpose <span className="opacity-70">(optional)</span><input className="c-input w-full mt-1" maxLength={500} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Office supplies and transport" /></label>
          </div>
          <datalist id="pcv-departments">{DEPARTMENTS.map((d) => <option key={d} value={d} />)}</datalist>

          <div>
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_10rem_9rem_2rem] gap-2 text-[11px] uppercase tracking-wide text-ink-muted px-1 mb-1">
              <span>S/N</span><span>Description</span><span>Department</span><span className="text-right">Amount ({currency})</span><span />
            </div>
            <div className="space-y-1.5">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[2rem_minmax(0,1fr)_10rem_9rem_2rem] gap-2 items-center">
                  <span className="text-center tabular-nums text-ink-muted">{i + 1}</span>
                  <input className="c-input w-full" maxLength={200} value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="What the cash was for" />
                  <input className="c-input w-full" list="pcv-departments" maxLength={60} value={it.department} onChange={(e) => setItem(i, { department: e.target.value })} placeholder={department || "Department"} />
                  <input className="c-input w-full text-right tabular-nums" inputMode="decimal" value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value })} placeholder="0" />
                  <button type="button" className="c-icon-btn" aria-label={`Remove item ${i + 1}`} disabled={items.length === 1} onClick={() => setItems((list) => list.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <button type="button" className="c-btn" disabled={items.length >= 20} onClick={() => setItems((list) => [...list, blankItem()])}><Plus className="w-4 h-4" />Add item</button>
              <span className="text-[14px]">Total <b className="tabular-nums">{money(currency, total)}</b></span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block">Prepared by<input className="c-input w-full mt-1" maxLength={120} value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} /></label>
            <label className="block">Approved by<input className="c-input w-full mt-1" maxLength={120} value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} placeholder="Name (signs on paper)" /></label>
            <label className="block">Received by<input className="c-input w-full mt-1" maxLength={120} value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder={paidTo || "Name of the person receiving"} /></label>
          </div>
          <p className="text-[12px] text-ink-muted">The voucher is numbered when you save it. Signatures and dates are written on the printed copy.</p>
          {error && <p className="text-[13px]" style={{ color: "#C0392B" }}>{error}</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-3 border-t border-line">
          <button type="button" onClick={onClose} className="c-btn">Cancel</button>
          <button type="button" disabled={busy} onClick={() => void save("none")} className="c-btn">{busy && <Loader2 className="w-4 h-4 animate-spin" />}Save</button>
          <button type="button" disabled={busy} onClick={() => void save("pdf")} className="c-btn"><Download className="w-4 h-4" />Save &amp; download PDF</button>
          <button type="button" disabled={busy} onClick={() => void save("print")} className="c-btn c-btn-primary"><Printer className="w-4 h-4" />Save &amp; print</button>
        </div>
      </div>
    </div>
  );
}
