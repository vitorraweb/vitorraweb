"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Send, X } from "lucide-react";
import { apiAdmin, downloadCsv, downloadFile } from "@/lib/auth";
import { Empty } from "@/components/admin/admin-ui";
import { SendDocumentDialog } from "@/components/admin/SendDocument";

/* ─── Payment receipts ────────────────────────────────────────────────────────
   Every payment against an invoice — part or full — gets a receipt on the
   invoice's own branded template once a senior approves it (online payments
   get theirs straight away). Here Finance records payments with how they were
   paid, sees each invoice's receipts, emails or downloads them, and exports
   the whole register to CSV.                                                 */

export type ReceiptRow = {
  id: number; number: string; invoice_id: number; invoice_number: string | null; customer_name: string | null; customer_email: string | null;
  currency: string; amount: number; paid_before: number; balance_after: number; fully_settled: boolean;
  payment_method: string | null; method_label: string | null; payment_reference: string | null; paid_on: string; status: "issued" | "void"; emailed_at: string | null;
};

const BASE = "/admin/accounting/payment-receipts";

export const METHODS: [string, string][] = [
  ["bank_transfer", "Bank transfer"], ["mobile_money", "Mobile Money"], ["cash", "Cash"], ["cheque", "Cheque"], ["card", "Card"],
];

const money = (c: string, a: number) => (c === "UGX" ? `UGX ${a.toLocaleString()}` : `${c === "USD" ? "$" : "€"}${(a / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
/** Amounts are whole shillings for UGX, cents for USD/EUR. */
const toMinor = (c: string, major: number) => (c === "UGX" ? Math.round(major) : Math.round(major * 100));
const toMajor = (c: string, minor: number) => (c === "UGX" ? minor : minor / 100);
const day = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/* ── Recording a payment ─────────────────────────────────────────────── */

type PayInvoice = { id: number; number: string; currency: string; balance: number; customer_name: string };
type PayAccount = { id: number; name: string; currency: string; is_active?: boolean };

export function RecordPaymentDialog({ invoice, accounts, onClose, onDone }: {
  invoice: PayInvoice; accounts: PayAccount[]; onClose: () => void; onDone: (msg: string) => void;
}) {
  const usable = accounts.filter((a) => a.currency === invoice.currency && a.is_active !== false);
  const [account, setAccount] = useState(usable[0]?.id ?? 0);
  const [amount, setAmount] = useState(String(toMajor(invoice.currency, invoice.balance)));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const minor = toMinor(invoice.currency, Number(amount) || 0);
  const part = minor > 0 && minor < invoice.balance;

  const submit = async () => {
    if (!account) { setError(`No ${invoice.currency} account to receive into — add one under Accounts.`); return; }
    if (minor <= 0) { setError("Enter the amount received."); return; }
    if (minor > invoice.balance) { setError(`That is more than the ${money(invoice.currency, invoice.balance)} still owed.`); return; }
    setBusy(true); setError("");
    try {
      await apiAdmin(`/admin/accounting/invoices/${invoice.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ finance_account_id: account, amount: minor, occurred_on: date, payment_method: method, payment_reference: reference.trim() || null }),
      });
      onDone(`Payment of ${money(invoice.currency, minor)} recorded — once a senior officer approves it, the invoice is settled and receipt is issued.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed."); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh] pb-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Record payment on ${invoice.number}`}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-paper border border-line rounded-edge shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <span className="text-[14px] text-ink font-medium">Record payment · {invoice.number}</span>
          <button onClick={onClose} className="c-icon-btn" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[12.5px] text-ink-muted">{invoice.customer_name} owes <b className="text-ink">{money(invoice.currency, invoice.balance)}</b>. Enter what was actually received — a part payment is fine.</p>
          <label className="block text-[12px] text-ink-muted">Amount received ({invoice.currency})
            <input type="number" min={0} step={invoice.currency === "UGX" ? 1 : 0.01} className="c-input w-full mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          {minor > 0 && minor <= invoice.balance && (
            <p className="text-[12px]" style={{ color: part ? "#9c6416" : "#16A34A" }}>
              {part ? `Part payment — ${money(invoice.currency, invoice.balance - minor)} will remain.` : "Pays the invoice in full."}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-ink-muted">Date received
              <input type="date" className="c-input w-full mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="block text-[12px] text-ink-muted">Paid by
              <select className="c-input w-full mt-1" value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-[12px] text-ink-muted">Payment reference <span className="opacity-70">(bank ref., Mobile Money ID, cheque no.)</span>
            <input className="c-input w-full mt-1" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} />
          </label>
          <label className="block text-[12px] text-ink-muted">Received into
            <select className="c-input w-full mt-1" value={account} onChange={(e) => setAccount(Number(e.target.value))}>
              {usable.length === 0 && <option value={0}>No {invoice.currency} account</option>}
              {usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          {error && <p className="text-[12.5px]" style={{ color: "#C0392B" }}>{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-line">
          <button onClick={onClose} className="c-btn">Cancel</button>
          <button onClick={submit} disabled={busy} className="c-btn c-btn-primary">{busy && <Loader2 className="w-4 h-4 animate-spin" />}Record payment</button>
        </div>
      </div>
    </div>
  );
}

/* ── One receipt row, with its PDF and Send… ─────────────────────────── */

function ReceiptLine({ r, showInvoice, onSend }: { r: ReceiptRow; showInvoice?: boolean; onSend: (r: ReceiptRow) => void }) {
  const void_ = r.status === "void";
  return (
    <div className="bg-white rounded-[12px] border border-black/[0.05] px-3.5 py-2.5 flex items-center gap-3 flex-wrap" style={void_ ? { opacity: 0.6 } : undefined}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-ink" style={void_ ? { textDecoration: "line-through" } : undefined}>{r.number}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={
            void_ ? { background: "rgba(192,57,43,0.1)", color: "var(--o-danger)" }
              : r.fully_settled ? { background: "rgba(22,163,74,0.12)", color: "#16A34A" } : { background: "rgba(156,100,22,0.12)", color: "#9c6416" }
          }>{void_ ? "void" : r.fully_settled ? "paid in full" : "part payment"}</span>
          {r.emailed_at && <span className="text-[11px] text-ink-muted">emailed {day(r.emailed_at)}</span>}
        </div>
        <p className="text-[12px] text-ink-muted">
          {showInvoice && <>{r.customer_name} · {r.invoice_number} · </>}
          <b className="text-ink">{money(r.currency, r.amount)}</b> on {day(r.paid_on)}
          {r.method_label ? ` · ${r.method_label}` : ""}{r.payment_reference ? ` (${r.payment_reference})` : ""}
          {!r.fully_settled && !void_ ? ` · ${money(r.currency, r.balance_after)} left` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => downloadFile(`${BASE}/${r.id}/pdf`, `${r.number}.pdf`)} className="p-1.5 rounded-lg" style={{ background: "var(--o-surface-2)", color: "var(--o-text-2)" }} title="Download receipt PDF"><Download className="w-4 h-4" /></button>
        {!void_ && <button onClick={() => onSend(r)} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.12)", color: "var(--o-info)" }}><Send className="w-3.5 h-3.5" />Email…</button>}
      </div>
    </div>
  );
}

function SendReceipt({ r, onClose, onSent }: { r: ReceiptRow; onClose: () => void; onSent: (summary: string) => void }) {
  return (
    <SendDocumentDialog
      endpoint={`${BASE}/${r.id}/send`}
      docLabel="Receipt"
      docNumber={r.number}
      customer={{ name: r.customer_name ?? "", email: r.customer_email ?? "" }}
      finalText="I have checked the receipt PDF. The customer receives it now as proof of payment."
      onClose={onClose}
      onSent={(_, summary) => onSent(summary)}
    />
  );
}

/** The receipts issued against one invoice (shown under it in the Invoices list). */
export function InvoiceReceipts({ invoiceId }: { invoiceId: number }) {
  const [rows, setRows] = useState<ReceiptRow[] | null>(null);
  const [sending, setSending] = useState<ReceiptRow | null>(null);
  const [msg, setMsg] = useState("");
  const load = useCallback(() => {
    apiAdmin<{ data: ReceiptRow[] }>(`/admin/accounting/invoices/${invoiceId}/receipts`).then((r) => setRows(r.data)).catch(() => setRows([]));
  }, [invoiceId]);
  useEffect(() => { load(); }, [load]);

  if (!rows) return <p className="text-[12px] text-ink-muted flex items-center gap-2 px-1 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading receipts…</p>;
  return (
    <div className="space-y-1.5 pt-1">
      {rows.length === 0
        ? <p className="text-[12px] text-ink-muted px-1">No receipts yet — one is issued for each payment once it is approved.</p>
        : rows.map((r) => <ReceiptLine key={r.id} r={r} onSend={setSending} />)}
      {msg && <p className="text-[12px] px-1" style={{ color: "#16A34A" }}>{msg}</p>}
      {sending && <SendReceipt r={sending} onClose={() => setSending(null)} onSent={(s) => { setSending(null); setMsg(s); load(); }} />}
    </div>
  );
}

/* ── The receipt register (its own tab) ──────────────────────────────── */

export function PaymentReceiptsRegister() {
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState<ReceiptRow | null>(null);
  const [msg, setMsg] = useState("");

  const query = new URLSearchParams(Object.entries({ from, to, q: q.trim(), status }).filter(([, v]) => v)).toString();

  const load = useCallback(() => {
    setLoading(true);
    apiAdmin<{ data: ReceiptRow[] }>(`${BASE}${query ? `?${query}` : ""}`)
      .then((r) => setRows(r.data)).catch(() => setRows([])).finally(() => setLoading(false));
  }, [query]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  // Totals per currency for what is on screen (void receipts excluded).
  const totals = rows.filter((r) => r.status === "issued").reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.currency]: (acc[r.currency] ?? 0) + r.amount }), {});

  return (
    <div>
      <div className="flex items-end gap-2 mb-4 flex-wrap">
        <input className="c-input w-56" placeholder="Search receipt, invoice or customer…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="text-[11.5px] text-ink-muted">From<input type="date" className="c-input ml-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-[11.5px] text-ink-muted">To<input type="date" className="c-input ml-1" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <select className="c-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All receipts</option><option value="issued">Valid only</option><option value="void">Void only</option>
        </select>
        <button onClick={() => downloadCsv(`${BASE}/export${query ? `?${query}` : ""}`, `vitorra-receipts-${new Date().toISOString().slice(0, 10)}.csv`)} className="c-btn ml-auto"><FileSpreadsheet className="w-4 h-4" />Export CSV</button>
      </div>

      {Object.keys(totals).length > 0 && (
        <p className="text-[12.5px] text-ink-muted mb-3">
          {rows.filter((r) => r.status === "issued").length} receipts · received {Object.entries(totals).map(([c, a]) => money(c, a)).join(" + ")}
        </p>
      )}
      {msg && <p className="text-sm mb-3" style={{ color: "#16A34A" }}>{msg}</p>}

      {loading ? <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
        : rows.length === 0 ? <Empty label="No receipts in this view. Receipts are issued automatically when an invoice payment is approved." />
        : <div className="space-y-2">{rows.map((r) => <ReceiptLine key={r.id} r={r} showInvoice onSend={setSending} />)}</div>}

      {sending && <SendReceipt r={sending} onClose={() => setSending(null)} onSent={(s) => { setSending(null); setMsg(s); load(); }} />}
    </div>
  );
}

