"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ChevronDown, FileText, CreditCard, Check, Trash2, Plus } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { StatusBadge, PageHeader, formatDate, Empty, type Paginated } from "@/components/admin/admin-ui";

type OrderItem = {
  product_name: string; product_slug: string; quantity: number;
  options: { grind?: string; weight?: string } | null; line_total: number;
};
type OrderDocument = {
  id: number; type: string; title: string; url: string; generated_at: string;
};
type Order = {
  id: number; reference: string; currency: string; total: number; status: string;
  payment_status: string; payment_method: string | null; tracking_number: string | null; created_at: string;
  customer_name: string; customer_email: string; customer_phone: string | null;
  preferred_installation_date: string | null; installation_location: string | null;
  items: OrderItem[];
  documents?: OrderDocument[];
  user: { name: string; email: string } | null;
  shipping_address: { city?: string; country?: string } | null;
};

const STATUSES = ["pending", "processing", "shipped", "delivered", "complete", "cancelled"];
const PAYMENT_STATUSES = ["pending", "partial", "paid"];
const DOC_LABELS: Record<string, string> = {
  reservation_confirmation: "Reservation confirmation",
  payment_receipt: "Payment receipt",
  installation_certificate: "Installation certificate",
};

// Mirrors the customer-facing OrderTimeline labels (account/OrderTimeline.tsx)
// so staff see the same language the customer sees for FET orders.
const FET_STATUS_LABELS: Record<string, string> = {
  pending: "Reserved",
  processing: "Confirmed",
  shipped: "Installation scheduled",
  delivered: "Installed",
  complete: "Complete",
  cancelled: "Cancelled",
};

function isFetOrder(o: Order): boolean {
  return o.items?.some((it) => it.product_slug?.startsWith("fet-")) ?? false;
}

function statusLabel(status: string, fet: boolean): string {
  return fet ? FET_STATUS_LABELS[status] ?? status : status;
}

function money(total: number, currency: string) {
  return currency === "USD" ? `$${(total / 100).toFixed(2)}` : `UGX ${total.toLocaleString()}`;
}

function itemSummary(items: OrderItem[]) {
  const count = items?.reduce((n, it) => n + it.quantity, 0) ?? 0;
  return `${count} item${count === 1 ? "" : "s"}`;
}

export default function OrdersPage() {
  const [list, setList]       = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");
  const [open, setOpen]       = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?status=${filter}` : "";
      const res = await apiAdmin<Paginated<Order>>(`/admin/orders${q}`);
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string) => {
    setList((l) => l.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await apiAdmin<{ data: Order }>(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setList((l) => l.map((o) => (o.id === id ? res.data : o)));
    } catch { load(); }
  };

  const updatePaymentStatus = async (id: number, payment_status: string) => {
    setList((l) => l.map((o) => (o.id === id ? { ...o, payment_status } : o)));
    try {
      const res = await apiAdmin<{ data: Order }>(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ payment_status }) });
      setList((l) => l.map((o) => (o.id === id ? res.data : o)));
    } catch { load(); }
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle="Coffee Shop orders and fulfilment." />

      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip active={filter === ""} onClick={() => setFilter("")}>All</FilterChip>
        {STATUSES.map((s) => <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{s}</FilterChip>)}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No orders yet — they'll appear here once the Coffee Shop is live." />
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.id} className="bg-white rounded-[20px] border border-black/[0.05] overflow-hidden">
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className="w-full flex items-center gap-4 p-5 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{o.reference}</span>
                    <span className="text-xs" style={{ color: "#999" }}>{itemSummary(o.items)}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "#999999" }}>{o.customer_name ?? o.user?.name ?? "Guest"} · {money(o.total, o.currency)} · {formatDate(o.created_at)}</p>
                </div>
                <StatusBadge status={o.status} label={isFetOrder(o) ? statusLabel(o.status, true) : undefined} />
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === o.id ? "rotate-180" : ""}`} style={{ color: "#BBBBBB" }} />
              </button>

              {open === o.id && (
                <div className="px-5 pb-5 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  {/* Line items */}
                  <ul className="mb-5 space-y-1.5">
                    {o.items?.map((it, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 text-xs">
                        <span style={{ color: "#444" }}>
                          <span className="font-semibold">{it.quantity}×</span> {it.product_name}
                          {(it.options?.weight || it.options?.grind) && (
                            <span style={{ color: "#999" }}>
                              {" "}— {[it.options?.weight, it.options?.grind].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums shrink-0" style={{ color: "#777" }}>{money(it.line_total, o.currency)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 text-xs">
                    <Detail label="Customer" value={o.customer_email ?? o.user?.email ?? "—"} />
                    <Detail label="Payment method" value={o.payment_method === "cash" ? "Cash before installation" : o.payment_method ?? "—"} />
                    <Detail label="Destination" value={[o.shipping_address?.city, o.shipping_address?.country].filter(Boolean).join(", ") || "—"} />
                    <Detail label="Tracking" value={o.tracking_number ?? "—"} />
                    <Detail label="Installation date" value={o.preferred_installation_date ? formatDate(o.preferred_installation_date) : "Not yet set"} />
                    <Detail label="Installation location" value={o.installation_location ?? "Not yet set"} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-semibold" style={{ color: "#777" }}>Status:</span>
                    {STATUSES.map((s) => (
                      <button key={s} onClick={() => updateStatus(o.id, s)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize transition-colors" style={{ background: o.status === s ? "#C5B27A" : "#F2F2F2", color: o.status === s ? "#1E1E1E" : "#888" }}>
                        {statusLabel(s, isFetOrder(o))}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-semibold" style={{ color: "#777" }}>Payment:</span>
                    {PAYMENT_STATUSES.map((s) => (
                      <button key={s} onClick={() => updatePaymentStatus(o.id, s)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize transition-colors" style={{ background: o.payment_status === s ? "#C5B27A" : "#F2F2F2", color: o.payment_status === s ? "#1E1E1E" : "#888" }}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <Installments orderId={o.id} total={o.total} currency={o.currency} onPaymentStatus={(ps) => setList((l) => l.map((x) => x.id === o.id ? { ...x, payment_status: ps } : x))} />

                  {o.documents && o.documents.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: "#777" }}>Documents:</span>
                      {o.documents.map((d) => (
                        <a
                          key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                          style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
                        >
                          <FileText className="w-3 h-3" />
                          {DOC_LABELS[d.type] ?? d.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#AAA" }}>{label}</p>
      <p className="font-medium" style={{ color: "#444" }}>{value}</p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold px-3.5 py-2 rounded-full capitalize transition-colors" style={{ background: active ? "#1E1E1E" : "#FFFFFF", color: active ? "#FFFFFF" : "#777777", border: "1px solid rgba(0,0,0,0.06)" }}>
      {children}
    </button>
  );
}

type Pay = { id: number; label: string | null; amount: number; due_date: string | null; paid: boolean; paid_at: string | null; method: string | null; reference: string | null };
type Plan = { currency: string; total: number; paid: number; balance: number; plan: { id: number; note: string | null; payments: Pay[] } | null };
type Draft = { label: string; amount: number; due_date: string };

function Installments({ orderId, total, currency, onPaymentStatus }: { orderId: number; total: number; currency: string; onPaymentStatus: (ps: string) => void }) {
  const [data, setData]     = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [parts, setParts]   = useState(3);
  const [rows, setRows]     = useState<Draft[] | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiAdmin<{ data: Plan }>(`/admin/orders/${orderId}/installments`); setData(r.data); }
    catch { /* */ } finally { setLoading(false); }
  }, [orderId]);
  useEffect(() => { load(); }, [load]);

  const pushStatus = (paid: number) => onPaymentStatus(paid <= 0 ? "pending" : paid >= total ? "paid" : "partial");

  const generate = () => {
    const n = Math.max(1, Math.min(24, parts));
    const base = Math.floor(total / n);
    const arr: Draft[] = [];
    let alloc = 0;
    for (let i = 0; i < n; i++) {
      const amount = i === n - 1 ? total - alloc : base;
      alloc += amount;
      const d = new Date(); d.setMonth(d.getMonth() + i + 1);
      arr.push({ label: `Instalment ${i + 1}`, amount, due_date: d.toISOString().slice(0, 10) });
    }
    setRows(arr);
  };

  const setRow = (i: number, patch: Partial<Draft>) => setRows((rs) => (rs ? rs.map((r, j) => (j === i ? { ...r, ...patch } : r)) : rs));

  const save = async () => {
    if (!rows?.length) return;
    setSaving(true);
    try {
      const r = await apiAdmin<{ data: Plan }>(`/admin/orders/${orderId}/installments`, { method: "POST", body: JSON.stringify({ installments: rows }) });
      setData(r.data); setRows(null); pushStatus(r.data.paid);
    } catch { /* */ } finally { setSaving(false); }
  };

  const mark = async (id: number, action: "pay" | "unpay") => {
    try { const r = await apiAdmin<{ data: Plan }>(`/admin/installments/${id}/${action}`, { method: "POST", body: "{}" }); setData(r.data); pushStatus(r.data.paid); }
    catch { /* */ }
  };

  const del = async () => {
    if (!confirm("Delete this payment plan?")) return;
    try { await apiAdmin(`/admin/orders/${orderId}/installments`, { method: "DELETE" }); load(); } catch { /* */ }
  };

  if (loading) return null;
  const draftTotal = rows?.reduce((n, r) => n + (Number(r.amount) || 0), 0) ?? 0;

  return (
    <div className="mb-4 rounded-[16px] p-4" style={{ background: "#FAFAF8", border: "1px solid rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4" style={{ color: "#C5B27A" }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#777" }}>Payment plan (pay in parts)</span>
      </div>

      {data?.plan ? (
        <>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 text-xs">
            <span style={{ color: "#777" }}>Total: <strong style={{ color: "#1E1E1E" }}>{money(data.total, currency)}</strong></span>
            <span style={{ color: "#16A34A" }}>Paid: <strong>{money(data.paid, currency)}</strong></span>
            <span style={{ color: "#C0392B" }}>Balance: <strong>{money(data.balance, currency)}</strong></span>
          </div>
          <div className="space-y-1.5 mb-3">
            {data.plan.payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 text-xs">
                <span className="flex-1 min-w-0" style={{ color: "#444" }}>
                  <span className="font-semibold">{p.label}</span> · {money(p.amount, currency)}
                  {p.due_date && <span style={{ color: "#999" }}> · due {formatDate(p.due_date)}</span>}
                </span>
                {p.paid ? (
                  <>
                    <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#16A34A" }}><Check className="w-3.5 h-3.5" />Paid</span>
                    <button onClick={() => mark(p.id, "unpay")} className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>Undo</button>
                  </>
                ) : (
                  <button onClick={() => mark(p.id, "pay")} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}>Record payment</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={del} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-3 h-3" />Delete plan</button>
        </>
      ) : rows ? (
        <>
          <p className="text-[11px] mb-2" style={{ color: "#999" }}>Adjust amounts/dates if needed, then save. Scheduled: {money(draftTotal, currency)} of {money(total, currency)}.</p>
          <div className="space-y-1.5 mb-3">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <input value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} className="rounded-lg px-2 py-1 border w-28" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                <input type="number" value={r.amount} onChange={(e) => setRow(i, { amount: Number(e.target.value) })} className="rounded-lg px-2 py-1 border w-28 tabular-nums" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                <input type="date" value={r.due_date} onChange={(e) => setRow(i, { due_date: e.target.value })} className="rounded-lg px-2 py-1 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50" style={{ background: "#1E1E1E", color: "#fff" }}>{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Save plan</button>
            <button onClick={() => setRows(null)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>Cancel</button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: "#999" }}>Split {money(total, currency)} into</span>
          <input type="number" min={1} max={24} value={parts} onChange={(e) => setParts(Number(e.target.value))} className="rounded-lg px-2 py-1 border w-16 text-xs" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
          <span className="text-xs" style={{ color: "#999" }}>parts (monthly)</span>
          <button onClick={generate} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}><Plus className="w-3.5 h-3.5" />Set up plan</button>
        </div>
      )}
    </div>
  );
}
