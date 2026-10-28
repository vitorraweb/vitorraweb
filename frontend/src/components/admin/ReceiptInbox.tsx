"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Smartphone, Upload, Sparkles, Archive, Check, X, FileText, ArchiveRestore } from "lucide-react";
import { apiAdmin, fetchBlob, uploadAdmin } from "@/lib/auth";
import { Empty, formatDate } from "@/components/admin/admin-ui";
import { prepareReceipt } from "@/lib/receipt-image";

/* ─── Accounting → Receipts ───────────────────────────────────────────────────
   Every receipt Finance scans or uploads lands here and is kept (encrypted)
   whether or not it is booked yet. "Scan with your phone" shows a QR code:
   point the phone's camera at it and photograph receipts — no sign-in on
   the phone. AI reads vendor, date, amount and VAT within a minute; Finance
   checks them and records the receipt as a draft expense in one step.    */

type Receipt = {
  id: number; original_name: string | null; mime: string; size: number; source: "phone" | "upload"; status: "new" | "recorded" | "archived";
  vendor: string | null; receipt_date: string | null; currency: string | null; amount_minor: number | null; vat_rate: number | null;
  description: string | null; note: string | null; finance_transaction_id: number | null; uploaded_by: string | null; created_at: string; read: boolean;
};
type Account = { id: number; name: string; currency: string; is_active: boolean };
type Category = { id: number; name: string; kind: string; is_active: boolean };

const SECTORS = ["FET", "SEAL", "COFFEE", "LOGISTICS", "GENERAL"];
const major = (minor: number | null, cur: string | null) => (minor == null ? "" : cur && cur !== "UGX" ? (minor / 100).toFixed(2) : String(minor));
const toMinor = (v: string, cur: string) => Math.round((parseFloat(v.replace(/,/g, "")) || 0) * (cur === "UGX" ? 1 : 100));
const money = (minor: number | null, cur: string | null) => minor == null ? "—" : cur && cur !== "UGX" ? `${cur} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `UGX ${minor.toLocaleString()}`;

export function ReceiptInbox() {
  const [status, setStatus] = useState<"new" | "recorded" | "archived">("new");
  const [rows, setRows] = useState<Receipt[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reader, setReader] = useState(false);
  const [open, setOpen] = useState<Receipt | null>(null);
  const [qr, setQr] = useState<{ url: string; qr: string; expires_at: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await apiAdmin<{ data: Receipt[]; counts: Record<string, number>; reader: boolean }>(`/admin/accounting/receipts?status=${status}`);
    setRows(r.data); setCounts(r.counts); setReader(r.reader);
  }, [status]);
  useEffect(() => { load().catch(() => setRows([])); }, [load]);
  // New phone scans appear on their own while the inbox (or the QR) is open.
  useEffect(() => { const t = setInterval(() => load().catch(() => {}), qr ? 4000 : 15000); return () => clearInterval(t); }, [load, qr]);

  const scanLink = async () => {
    setQr((await apiAdmin<{ data: { url: string; qr: string; expires_at: string } }>("/admin/accounting/receipts/scan-link", { method: "POST" })).data);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setMsg("");
    try {
      const form = new FormData();
      for (const f of Array.from(files)) form.append("files[]", await prepareReceipt(f));
      setMsg((await uploadAdmin<{ message: string }>("/admin/accounting/receipts", form)).message);
      setStatus("new"); load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="o-seg" role="group" aria-label="Receipts">
          {(["new", "recorded", "archived"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {{ new: "To record", recorded: "Recorded", archived: "Archived" }[s]} <span className="text-ink-muted">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <label className="c-btn cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Upload receipts
          <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        </label>
        <button className="c-btn c-btn-primary" onClick={scanLink}><Smartphone className="w-4 h-4" />Scan with your phone</button>
      </div>
      {msg && <p className="text-[14px] text-ok-ink">{msg}</p>}
      {!reader && <p className="text-[13px] text-ink-muted">Automatic reading is off (no AI key on the server). Receipts are still kept; type the vendor and amount in when recording.</p>}

      {rows === null ? <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
        : rows.length === 0 ? <Empty label={status === "new" ? "Nothing waiting. Scan or upload receipts to start." : "Nothing here yet."} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {rows.map((r) => (
              <button key={r.id} type="button" onClick={() => setOpen(r)} className="c-panel text-left overflow-hidden hover:border-line-strong transition-colors">
                <Thumb receipt={r} className="h-36" />
                <span className="block p-2.5">
                  <span className="block text-[14px] font-medium text-ink truncate">{r.vendor || (r.read ? "Vendor not found" : "Reading…")}</span>
                  <span className="block text-[13px] text-ink-muted">{money(r.amount_minor, r.currency)}{r.receipt_date ? ` · ${r.receipt_date}` : ""}</span>
                  <span className="block text-[12px] text-ink-muted mt-1">{r.source === "phone" ? "Phone scan" : "Upload"} · {r.uploaded_by ?? "—"}</span>
                </span>
              </button>
            ))}
          </div>
        )}

      {qr && (
        <Modal title="Scan receipts with your phone" onClose={() => setQr(null)}>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.qr} alt="QR code for the phone scanner" width={220} height={220} className="bg-white p-2 rounded-md border border-line" />
            <ol className="text-[14px] text-ink-soft space-y-2 list-decimal pl-5">
              <li>Open the phone&apos;s camera and point it at the code.</li>
              <li>Tap the link, then <strong>Take a photo of a receipt</strong>. Take as many as you like.</li>
              <li>They appear here as they arrive, and are read automatically.</li>
            </ol>
          </div>
          <p className="text-[13px] text-ink-muted mt-4">The link works for 30 minutes (until {new Date(qr.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}) and can only add receipts. It does not open anything else. Or send it to your phone: <span className="font-mono break-all">{qr.url}</span></p>
        </Modal>
      )}

      {open && <ReceiptDetail receipt={open} reader={reader} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function Thumb({ receipt, className = "" }: { receipt: Receipt; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (receipt.mime === "application/pdf") return;
    let url: string | null = null;
    fetchBlob(`/admin/accounting/receipts/${receipt.id}/file`).then((b) => { url = URL.createObjectURL(b); setSrc(url); }).catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [receipt.id, receipt.mime]);
  return (
    <span className={`flex items-center justify-center bg-paper-deep overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {receipt.mime === "application/pdf" ? <FileText className="w-8 h-8 text-ink-muted" /> : src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />}
    </span>
  );
}

function ReceiptDetail({ receipt: r, reader, onClose, onChanged }: { receipt: Receipt; reader: boolean; onClose: () => void; onChanged: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [cur, setCur] = useState(r.currency ?? "UGX");
  const [f, setF] = useState({
    vendor: r.vendor ?? "", date: r.receipt_date ?? new Date().toISOString().slice(0, 10), amount: major(r.amount_minor, r.currency),
    vat: String(r.vat_rate ?? 0), description: r.description ?? "", account: "", category: "", sector: "",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [full, setFull] = useState<string | null>(null);

  useEffect(() => {
    apiAdmin<{ data: Account[] }>("/admin/accounting/accounts").then((x) => setAccounts(x.data.filter((a) => a.is_active))).catch(() => {});
    apiAdmin<{ data: Category[] }>("/admin/accounting/categories").then((x) => setCats(x.data.filter((c) => c.kind === "expense" && c.is_active))).catch(() => {});
  }, []);
  useEffect(() => {
    let url: string | null = null;
    fetchBlob(`/admin/accounting/receipts/${r.id}/file`).then((b) => { url = URL.createObjectURL(b); setFull(url); }).catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [r.id]);

  const usable = accounts.filter((a) => a.currency === cur);

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key); setErr("");
    try { await fn(); onChanged(); } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong"); setBusy(null); }
  };

  const record = () => act("record", async () => {
    await apiAdmin(`/admin/accounting/receipts/${r.id}`, { method: "PATCH", body: JSON.stringify({ vendor: f.vendor || null, receipt_date: f.date, currency: cur, amount_minor: toMinor(f.amount, cur), vat_rate: Number(f.vat) || 0, description: f.description || null }) });
    await apiAdmin(`/admin/accounting/receipts/${r.id}/record`, { method: "POST", body: JSON.stringify({
      finance_account_id: Number(f.account), finance_category_id: Number(f.category), sector: f.sector || null,
      amount: toMinor(f.amount, cur), vat_rate: Number(f.vat) || 0, occurred_on: f.date, description: f.description || f.vendor || null,
    }) });
  });

  return (
    <Modal title={`Receipt #${r.id}`} onClose={onClose} wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-paper-deep rounded-md overflow-hidden min-h-[320px] flex items-center justify-center">
          {r.mime === "application/pdf"
            ? (full ? <iframe title="Receipt" src={full} className="w-full h-[60vh] border-0" /> : <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />)
            : full ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={full} alt="Receipt" className="max-h-[65vh] w-auto" /> : <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />}
        </div>
        <div className="space-y-3">
          <p className="text-[13px] text-ink-muted">{r.source === "phone" ? "Scanned on a phone" : "Uploaded"} by {r.uploaded_by ?? "—"} · {formatDate(r.created_at)}</p>
          {r.status === "recorded" ? (
            <p className="flex items-center gap-2 text-[14px] text-ok-ink"><Check className="w-4 h-4" />Recorded as a draft expense (transaction #{r.finance_transaction_id}). Approve it under Transactions.</p>
          ) : (<>
            {reader && !r.read && <p className="text-[13px] text-ink-muted flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Being read…</p>}
            <div className="grid grid-cols-2 gap-3">
              <F label="Vendor"><input className="c-input w-full" value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></F>
              <F label="Date"><input type="date" className="c-input w-full" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></F>
              <F label="Currency"><select className="c-select w-full" value={cur} onChange={(e) => { setCur(e.target.value); setF({ ...f, account: "" }); }}>{["UGX", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}</select></F>
              <F label="Total paid (incl. VAT)"><input className="c-input w-full text-right" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></F>
              <F label="VAT %"><input className="c-input w-full text-right" inputMode="numeric" value={f.vat} onChange={(e) => setF({ ...f, vat: e.target.value })} /></F>
              <F label="Business line"><select className="c-select w-full" value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })}><option value="">General / none</option>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></F>
            </div>
            <F label="What was bought"><input className="c-input w-full" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label={`Paid from (${cur} accounts)`}><select className="c-select w-full" value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })}><option value="">Choose…</option>{usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></F>
              <F label="Expense category"><select className="c-select w-full" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">Choose…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
            </div>
            {usable.length === 0 && <p className="text-[13px] text-alert-ink">No active {cur} account. Add one under Accounts.</p>}
            {err && <p className="text-[13px] text-alert-ink">{err}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="c-btn c-btn-primary" disabled={busy !== null || !f.account || !f.category || !(toMinor(f.amount, cur) > 0)} onClick={record}>
                {busy === "record" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Record as expense
              </button>
              {reader && <button className="c-btn" disabled={busy !== null} onClick={() => act("read", () => apiAdmin(`/admin/accounting/receipts/${r.id}/read`, { method: "POST" }))}>
                {busy === "read" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Read again
              </button>}
              {r.status === "new"
                ? <button className="c-btn c-btn-ghost" disabled={busy !== null} onClick={() => act("archive", () => apiAdmin(`/admin/accounting/receipts/${r.id}`, { method: "PATCH", body: JSON.stringify({ status: "archived" }) }))}><Archive className="w-4 h-4" />Keep without recording</button>
                : <button className="c-btn c-btn-ghost" disabled={busy !== null} onClick={() => act("restore", () => apiAdmin(`/admin/accounting/receipts/${r.id}`, { method: "PATCH", body: JSON.stringify({ status: "new" }) }))}><ArchiveRestore className="w-4 h-4" />Back to “To record”</button>}
            </div>
            <p className="text-[12px] text-ink-muted">Recording creates a draft expense with this receipt attached; a senior finance officer approves it as usual. Archived receipts are kept, not deleted.</p>
          </>)}
        </div>
      </div>
    </Modal>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[13px] text-ink-muted mb-1">{label}</span>{children}</label>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className={`bg-paper rounded-md w-full ${wide ? "max-w-[1000px]" : "max-w-[620px]"} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="c-panel-head"><span className="c-panel-title">{title}</span><button className="c-btn c-btn-ghost" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button></div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
