"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, X, Plus, Download, Wallet, Landmark, Banknote } from "lucide-react";
import { apiAdmin, uploadAdmin, downloadFile, auth, canAccess } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

const CURRENCIES = ["UGX", "USD", "EUR"];
const money = (c: string, a: number) => (c === "UGX" ? `UGX ${a.toLocaleString()}` : `${c === "USD" ? "$" : "€"}${(a / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
const cls = "w-full text-sm rounded-xl px-3 py-2 border outline-none focus:border-[#C5B27A]";
const st = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

type Tab = "overview" | "transactions" | "accounts" | "bills" | "budgets";

export default function AccountingPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const canApprove = canAccess(auth.getUser(), { module: "accounting_approve" });

  const tabs: [Tab, string][] = [["overview", "Overview"], ["transactions", "Transactions"], ["accounts", "Accounts"], ["bills", "Bills"], ["budgets", "Budgets"]];

  return (
    <div className="pb-12">
      <PageHeader title="Accounting" subtitle={canApprove ? "Money in, money out, and where the business stands." : "Record transactions and bills — a senior officer approves them."} />
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className="text-sm font-semibold px-4 py-2 rounded-full" style={tab === t ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{label}</button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "transactions" && <Transactions canApprove={canApprove} />}
      {tab === "accounts" && <Accounts canApprove={canApprove} />}
      {tab === "bills" && <Bills canApprove={canApprove} />}
      {tab === "budgets" && <Budgets canApprove={canApprove} />}
    </div>
  );
}

/* ── Overview / reports ───────────────────────────────────────────────── */

type Report = {
  period_label: string;
  income: { by_currency: Record<string, number>; by_category: { name: string; currency: string; amount: number }[] };
  expense: { by_currency: Record<string, number>; by_category: { name: string; currency: string; amount: number }[] };
  net: Record<string, number>;
  by_sector: { sector: string; currency: string; income: number; expense: number; net: number }[];
  cash: { accounts: { name: string; type: string; currency: string; balance: number }[]; by_currency: Record<string, number> };
  payables: Record<string, number>;
};

function Overview() {
  const [period, setPeriod] = useState("mtd");
  const [r, setR] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await apiAdmin<{ data: Report }>(`/admin/accounting/reports?period=${period}`); setR(res.data); }
    catch { setR(null); } finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (loading || !r) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  const nonZero = CURRENCIES.filter((c) => r.income.by_currency[c] || r.expense.by_currency[c] || r.cash.by_currency[c] || r.payables[c]);
  const cur = nonZero.length ? nonZero : ["UGX"];

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {[["mtd", "This month"], ["last_month", "Last month"], ["week", "Last 7 days"]].map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)} className="text-xs font-semibold px-3.5 py-2 rounded-full" style={period === v ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{l}</button>
        ))}
      </div>
      <p className="text-xs mb-4" style={{ color: "#999" }}>Showing <strong style={{ color: "#7A6020" }}>{r.period_label}</strong></p>

      {/* P&L per currency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {cur.map((c) => (
          <div key={c} className="bg-white rounded-[18px] border border-black/[0.06] p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#bbb" }}>Profit &amp; loss · {c}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span style={{ color: "#16A34A" }}>Income</span><span className="tabular-nums" style={{ color: "#1E1E1E" }}>{money(c, r.income.by_currency[c] ?? 0)}</span></div>
              <div className="flex justify-between"><span style={{ color: "#C0392B" }}>Expenses</span><span className="tabular-nums" style={{ color: "#1E1E1E" }}>{money(c, r.expense.by_currency[c] ?? 0)}</span></div>
              <div className="flex justify-between pt-1 mt-1 border-t font-semibold" style={{ borderColor: "rgba(0,0,0,0.06)" }}><span style={{ color: "#1E1E1E" }}>Net</span><span className="tabular-nums" style={{ color: (r.net[c] ?? 0) >= 0 ? "#16A34A" : "#C0392B" }}>{money(c, r.net[c] ?? 0)}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash position */}
        <Panel icon={Wallet} title="Cash on hand">
          {r.cash.accounts.length === 0 ? <p className="text-sm" style={{ color: "#999" }}>No accounts yet — add them under Accounts.</p> : (
            <div className="space-y-1.5">
              {r.cash.accounts.map((a, i) => (
                <div key={i} className="flex justify-between text-sm"><span style={{ color: "#454545" }}>{a.name}</span><span className="tabular-nums font-medium" style={{ color: "#1E1E1E" }}>{money(a.currency, a.balance)}</span></div>
              ))}
              <div className="flex justify-between pt-2 mt-1 border-t text-sm font-semibold" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#1E1E1E" }}>Total</span>
                <span className="tabular-nums" style={{ color: "#7A6020" }}>{cur.map((c) => r.cash.by_currency[c] ? money(c, r.cash.by_currency[c]) : null).filter(Boolean).join(" · ") || money("UGX", 0)}</span>
              </div>
            </div>
          )}
        </Panel>

        {/* Payables + per sector */}
        <Panel icon={Banknote} title="Owed to suppliers (unpaid bills)">
          <p className="text-lg font-bold mb-3" style={{ color: "#C0392B" }}>{cur.map((c) => r.payables[c] ? money(c, r.payables[c]) : null).filter(Boolean).join(" · ") || money("UGX", 0)}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#bbb" }}>Profit by business line</p>
          {r.by_sector.length === 0 ? <p className="text-sm" style={{ color: "#999" }}>No sector-tagged activity yet.</p> : (
            <div className="space-y-1 text-sm">
              {r.by_sector.map((s, i) => (
                <div key={i} className="flex justify-between"><span style={{ color: "#454545" }}>{s.sector} · {s.currency}</span><span className="tabular-nums" style={{ color: s.net >= 0 ? "#16A34A" : "#C0392B" }}>{money(s.currency, s.net)}</span></div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── Transactions ─────────────────────────────────────────────────────── */

type Tx = { id: number; type: string; account: string | null; to_account: string | null; category: string | null; sector: string | null; currency: string; amount: number; occurred_on: string; description: string | null; status: string; has_receipt: boolean };
type Acct = { id: number; name: string; type: string; currency: string; opening_balance: number; is_active: boolean; balance: number };
type Cat = { id: number; name: string; kind: string; is_active: boolean };

const TX_STATUS: Record<string, { bg: string; fg: string }> = {
  draft: { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" }, approved: { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" }, void: { bg: "rgba(0,0,0,0.06)", fg: "#999" },
};

function Transactions({ canApprove }: { canApprove: boolean }) {
  const [list, setList] = useState<Tx[]>([]);
  const [accounts, setAccounts] = useState<Acct[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ type: "expense", finance_account_id: "", transfer_to_account_id: "", finance_category_id: "", sector: "", amount: "", occurred_on: new Date().toISOString().slice(0, 10), description: "" });
  const [receipt, setReceipt] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set("status", status);
      const [tx, ac, ca] = await Promise.all([
        apiAdmin<{ data: Tx[]; sectors: string[] }>(`/admin/accounting/transactions?${params}`),
        apiAdmin<{ data: Acct[] }>("/admin/accounting/accounts"),
        apiAdmin<{ data: Cat[] }>("/admin/accounting/categories"),
      ]);
      setList(tx.data); setSectors(tx.sectors); setAccounts(ac.data); setCats(ca.data);
    } catch { setList([]); } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setMsg("");
    if (!form.finance_account_id || !form.amount) { setMsg("Account and amount are required."); return; }
    setAdding(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (receipt) fd.append("receipt", receipt);
      await uploadAdmin("/admin/accounting/transactions", fd);
      setForm({ ...form, amount: "", description: "" }); setReceipt(null);
      load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
    finally { setAdding(false); }
  };

  const act = async (id: number, action: "approve" | "void") => {
    try { await apiAdmin(`/admin/accounting/transactions/${id}/${action}`, { method: "POST" }); load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  const incomeCats = cats.filter((c) => c.kind === "income" && c.is_active);
  const expenseCats = cats.filter((c) => c.kind === "expense" && c.is_active);
  const pickCats = form.type === "income" ? incomeCats : expenseCats;

  return (
    <div>
      {/* Record form */}
      <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
        <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#1E1E1E" }}>Record a transaction</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={cls} style={st}>
            <option value="expense">Money out</option><option value="income">Money in</option><option value="transfer">Transfer</option>
          </select>
          <select value={form.finance_account_id} onChange={(e) => setForm({ ...form, finance_account_id: e.target.value })} className={cls} style={st}>
            <option value="">{form.type === "transfer" ? "From account…" : "Account…"}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
          </select>
          {form.type === "transfer" ? (
            <select value={form.transfer_to_account_id} onChange={(e) => setForm({ ...form, transfer_to_account_id: e.target.value })} className={cls} style={st}>
              <option value="">To account…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          ) : (
            <select value={form.finance_category_id} onChange={(e) => setForm({ ...form, finance_category_id: e.target.value })} className={cls} style={st}>
              <option value="">Category…</option>
              {pickCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount (e.g. UGX 50000 → 50000)" className={cls} style={st} />
          <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={cls} style={st}>
            <option value="">Sector (optional)…</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} className={cls} style={st} />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className={`${cls} sm:col-span-2`} style={st} />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} className="text-xs" />
          <button onClick={submit} disabled={adding} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full ml-auto" style={{ background: "#1E1E1E", color: "#fff", opacity: adding ? 0.6 : 1 }}>{adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Record (draft)</button>
        </div>
        {msg && <p className="text-sm mt-2" style={{ color: "#C0392B" }}>{msg}</p>}
        <p className="text-[11px] mt-2" style={{ color: "#bbb" }}>Amounts are whole shillings for UGX, or cents for USD/EUR. Recorded as draft until a senior officer approves.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[["", "All"], ["draft", "Draft"], ["approved", "Approved"], ["void", "Void"]].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={status === v ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{l}</button>
        ))}
      </div>

      {loading ? <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      : list.length === 0 ? <Empty label="No transactions in this view." /> : (
        <div className="space-y-2">
          {list.map((t) => {
            const sc = TX_STATUS[t.status] ?? TX_STATUS.draft;
            const out = t.type === "expense" || t.type === "transfer";
            return (
              <div key={t.id} className="bg-white rounded-[14px] border border-black/[0.05] p-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{t.type === "transfer" ? `${t.account} → ${t.to_account}` : t.category ?? t.type}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{t.status}</span>
                    {t.sector && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{t.sector}</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: "#999" }}>{t.account}{t.type !== "transfer" ? "" : ""} · {new Date(t.occurred_on).toLocaleDateString("en-GB")}{t.description ? ` · ${t.description}` : ""}</p>
                </div>
                <span className="tabular-nums font-semibold text-sm shrink-0" style={{ color: out ? "#C0392B" : "#16A34A" }}>{out ? "−" : "+"}{money(t.currency, t.amount)}</span>
                {t.has_receipt && <button onClick={() => downloadFile(`/admin/accounting/transactions/${t.id}/receipt`, `receipt-${t.id}`)} className="p-1.5 rounded-lg shrink-0" style={{ background: "#F2F2F2", color: "#777" }}><Download className="w-3.5 h-3.5" /></button>}
                {canApprove && t.status === "draft" && (
                  <span className="flex items-center gap-1 shrink-0">
                    <button onClick={() => act(t.id, "approve")} className="p-1.5 rounded-lg" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }} title="Approve"><Check className="w-4 h-4" /></button>
                    <button onClick={() => act(t.id, "void")} className="p-1.5 rounded-lg" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }} title="Void"><X className="w-4 h-4" /></button>
                  </span>
                )}
                {canApprove && t.status === "approved" && <button onClick={() => act(t.id, "void")} className="text-[11px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ background: "#F2F2F2", color: "#888" }}>Void</button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Accounts ─────────────────────────────────────────────────────────── */

function Accounts({ canApprove }: { canApprove: boolean }) {
  const [list, setList] = useState<Acct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "bank", currency: "UGX", opening_balance: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try { const r = await apiAdmin<{ data: Acct[] }>("/admin/accounting/accounts"); setList(r.data); } catch { /* */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.name.trim()) { setMsg("Name is required."); return; }
    setMsg("");
    try { await apiAdmin("/admin/accounting/accounts", { method: "POST", body: JSON.stringify({ ...form, opening_balance: Number(form.opening_balance) || 0 }) }); setForm({ name: "", type: "bank", currency: "UGX", opening_balance: "" }); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div>
      <div className="space-y-2 mb-5">
        {list.map((a) => (
          <div key={a.id} className="bg-white rounded-[14px] border border-black/[0.05] p-4 flex items-center gap-3">
            <Landmark className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} />
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{a.name}</p><p className="text-xs" style={{ color: "#999" }}>{a.type.replace("_", " ")} · {a.currency}</p></div>
            <span className="tabular-nums font-semibold text-sm" style={{ color: "#1E1E1E" }}>{money(a.currency, a.balance)}</span>
          </div>
        ))}
        {list.length === 0 && <Empty label="No accounts yet." />}
      </div>
      {canApprove ? (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
          <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#1E1E1E" }}>Add account</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Stanbic UGX" className={cls} style={st} />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={cls} style={st}><option value="bank">Bank</option><option value="cash">Cash</option><option value="mobile_money">Mobile money</option></select>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={cls} style={st}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} placeholder="Opening balance" className={cls} style={st} />
          </div>
          {msg && <p className="text-sm mt-2" style={{ color: "#C0392B" }}>{msg}</p>}
          <button onClick={add} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full mt-3" style={{ background: "#1E1E1E", color: "#fff" }}><Plus className="w-4 h-4" />Add</button>
        </div>
      ) : <p className="text-xs" style={{ color: "#bbb" }}>Only a senior finance officer can add or edit accounts.</p>}
    </div>
  );
}

/* ── Bills (payables) ─────────────────────────────────────────────────── */

type Bill = { id: number; vendor: string; category: string | null; sector: string | null; currency: string; amount: number; due_date: string | null; status: string; description: string | null };

function Bills({ canApprove }: { canApprove: boolean }) {
  const [list, setList] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; company_name: string }[]>([]);
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [accounts, setAccounts] = useState<Acct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ supplier_id: "", vendor_name: "", finance_category_id: "", sector: "", currency: "UGX", amount: "", due_date: "", description: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [b, ac] = await Promise.all([
        apiAdmin<{ data: Bill[]; suppliers: { id: number; company_name: string }[]; categories: { id: number; name: string }[] }>("/admin/accounting/bills"),
        apiAdmin<{ data: Acct[] }>("/admin/accounting/accounts"),
      ]);
      setList(b.data); setSuppliers(b.suppliers); setCats(b.categories); setAccounts(ac.data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.amount || (!form.supplier_id && !form.vendor_name.trim())) { setMsg("Pick a supplier or enter a vendor, plus an amount."); return; }
    setMsg("");
    try { await apiAdmin("/admin/accounting/bills", { method: "POST", body: JSON.stringify({ ...form, amount: Number(form.amount) }) }); setForm({ ...form, vendor_name: "", amount: "", due_date: "", description: "" }); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  const pay = async (b: Bill) => {
    const acct = accounts.find((a) => a.currency === b.currency);
    if (!acct) { setMsg(`No ${b.currency} account to pay from — add one under Accounts.`); return; }
    try { await apiAdmin(`/admin/accounting/bills/${b.id}/pay`, { method: "POST", body: JSON.stringify({ finance_account_id: acct.id }) }); setMsg("Payment recorded as a draft transaction — a senior officer approves it to mark the bill paid."); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div>
      <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
        <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#1E1E1E" }}>Add a bill (money we owe)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className={cls} style={st}><option value="">Supplier…</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}</select>
          <input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} placeholder="…or vendor name" className={cls} style={st} />
          <select value={form.finance_category_id} onChange={(e) => setForm({ ...form, finance_category_id: e.target.value })} className={cls} style={st}><option value="">Category…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={cls} style={st}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className={cls} style={st} />
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={cls} style={st} />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className={`${cls} sm:col-span-2`} style={st} />
        </div>
        {msg && <p className="text-sm mt-2" style={{ color: /recorded/.test(msg) ? "#16A34A" : "#C0392B" }}>{msg}</p>}
        <button onClick={add} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full mt-3" style={{ background: "#1E1E1E", color: "#fff" }}><Plus className="w-4 h-4" />Add bill</button>
      </div>

      {list.length === 0 ? <Empty label="No bills recorded." /> : (
        <div className="space-y-2">
          {list.map((b) => (
            <div key={b.id} className="bg-white rounded-[14px] border border-black/[0.05] p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{b.vendor}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={b.status === "paid" ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" } : b.status === "void" ? { background: "rgba(0,0,0,0.06)", color: "#999" } : { background: "rgba(192,57,43,0.1)", color: "#C0392B" }}>{b.status}</span>
                </div>
                <p className="text-xs" style={{ color: "#999" }}>{b.category ?? "—"}{b.due_date ? ` · due ${new Date(b.due_date).toLocaleDateString("en-GB")}` : ""}{b.description ? ` · ${b.description}` : ""}</p>
              </div>
              <span className="tabular-nums font-semibold text-sm shrink-0" style={{ color: "#1E1E1E" }}>{money(b.currency, b.amount)}</span>
              {b.status === "unpaid" && <button onClick={() => pay(b)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: "#C5B27A", color: "#1E1E1E" }}>Pay</button>}
              {canApprove && b.status === "unpaid" && <button onClick={async () => { await apiAdmin(`/admin/accounting/bills/${b.id}/void`, { method: "POST" }); load(); }} className="text-[11px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ background: "#F2F2F2", color: "#888" }}>Void</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Budgets ──────────────────────────────────────────────────────────── */

type BudgetRow = { id: number; category: string | null; category_id: number; currency: string; budget: number; actual: number; remaining: number; over: boolean };

function Budgets({ canApprove }: { canApprove: boolean }) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ finance_category_id: "", currency: "UGX", amount: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiAdmin<{ data: BudgetRow[]; categories: { id: number; name: string }[] }>(`/admin/accounting/budgets?period=${period}`); setRows(r.data); setCats(r.categories); }
    catch { /* */ } finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.finance_category_id || !form.amount) { setMsg("Category and amount are required."); return; }
    setMsg("");
    try { await apiAdmin("/admin/accounting/budgets", { method: "PUT", body: JSON.stringify({ ...form, period, amount: Number(form.amount) }) }); setForm({ ...form, amount: "" }); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs" style={{ color: "#999" }}>Month:</span>
        <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm rounded-xl px-3 py-1.5 border" style={st} />
      </div>
      {loading ? <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : (
        <div className="space-y-2 mb-5">
          {rows.length === 0 && <Empty label="No budgets set for this month." />}
          {rows.map((b) => (
            <div key={b.id} className="bg-white rounded-[14px] border border-black/[0.05] p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{b.category}</span><span className="text-xs" style={{ color: b.over ? "#C0392B" : "#16A34A" }}>{money(b.currency, b.actual)} of {money(b.currency, b.budget)}{b.over ? " · over" : ""}</span></div>
              <div className="h-2 rounded-full" style={{ background: "#F2F2F2" }}><div className="h-2 rounded-full" style={{ width: `${Math.min(100, b.budget ? (b.actual / b.budget) * 100 : 0)}%`, background: b.over ? "#C0392B" : "#C5B27A" }} /></div>
            </div>
          ))}
        </div>
      )}
      {canApprove ? (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
          <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#1E1E1E" }}>Set a budget</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select value={form.finance_category_id} onChange={(e) => setForm({ ...form, finance_category_id: e.target.value })} className={cls} style={st}><option value="">Category…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={cls} style={st}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Monthly cap" className={cls} style={st} />
          </div>
          {msg && <p className="text-sm mt-2" style={{ color: "#C0392B" }}>{msg}</p>}
          <button onClick={save} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full mt-3" style={{ background: "#1E1E1E", color: "#fff" }}><Plus className="w-4 h-4" />Save budget</button>
        </div>
      ) : <p className="text-xs" style={{ color: "#bbb" }}>Only a senior finance officer can set budgets.</p>}
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof Wallet; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-6">
      <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4" style={{ color: "#C5B27A" }} /><h3 className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#bbb" }}>{title}</h3></div>
      {children}
    </div>
  );
}
