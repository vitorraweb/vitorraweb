"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ChevronDown, Mail, Phone, Building2, MapPin, StickyNote, MessageSquare, ShoppingCart, FileText, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, formatDate } from "@/components/admin/admin-ui";

type Contact = {
  email: string; name: string; company: string | null; phone: string | null; country: string | null;
  enquiries: number; orders: number; messages: number; first_seen: string; last_activity: string; has_note: boolean;
};
type Detail = {
  email: string;
  enquiries: { id: number; product_category: string | null; message: string; status: string; assigned_to: string | null; created_at: string }[];
  orders: { id: number; reference: string; currency: string; total: number; status: string; payment_status: string; created_at: string }[];
  messages: { id: number; subject: string | null; message: string; status: string; created_at: string }[];
  note: string | null;
};

const money = (currency: string, total: number) =>
  currency === "USD" ? `$${(total / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `UGX ${total.toLocaleString("en-US")}`;

export default function CustomersPage() {
  const [list, setList]       = useState<Contact[]>([]);
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [appliedQ, setApplied] = useState("");
  const [page, setPage]       = useState(1);
  const [open, setOpen]       = useState<string | null>(null);
  const [detail, setDetail]   = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote]       = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (appliedQ) params.set("q", appliedQ);
      params.set("page", String(page));
      const res = await apiAdmin<{ data: Contact[]; current_page: number; last_page: number; total: number }>(`/admin/customers?${params.toString()}`);
      setList(res.data);
      setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [appliedQ, page]);

  useEffect(() => { load(); }, [load]);

  const search = () => { setLoading(true); setPage(1); setApplied(q.trim()); };
  const goPage = (p: number) => { setLoading(true); setOpen(null); setPage(p); };

  const expand = async (email: string) => {
    if (open === email) { setOpen(null); return; }
    setOpen(email); setDetail(null); setDetailLoading(true);
    try {
      const res = await apiAdmin<{ data: Detail }>(`/admin/customers/detail?email=${encodeURIComponent(email)}`);
      setDetail(res.data);
      setNote(res.data.note ?? "");
    } catch { setDetail(null); }
    finally { setDetailLoading(false); }
  };

  const saveNote = async (email: string) => {
    setSavingNote(true);
    try {
      await apiAdmin("/admin/customers/note", { method: "PUT", body: JSON.stringify({ email, note: note || null }) });
      setList((l) => l.map((c) => (c.email.toLowerCase() === email.toLowerCase() ? { ...c, has_note: !!note.trim() } : c)));
    } catch { /* ignore */ }
    finally { setSavingNote(false); }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Customers" subtitle="Everyone who's engaged — aggregated from enquiries, orders, and messages." />
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }} placeholder="Search name, email, company…" className="text-sm rounded-full px-4 py-2 border w-64 max-w-full outline-none" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
          <button onClick={search} className="text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>Search</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No customers yet." />
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: "#999" }}>{meta.total} contact{meta.total === 1 ? "" : "s"}</p>
          <div className="space-y-2.5">
            {list.map((c) => (
              <div key={c.email} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
                <button onClick={() => expand(c.email)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{c.name || c.email}</span>
                      {c.company && <span className="text-[11px]" style={{ color: "#999" }}>· {c.company}</span>}
                      {c.has_note && <StickyNote className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />}
                    </div>
                    <p className="text-xs truncate" style={{ color: "#999" }}>{c.email} · last active {formatDate(c.last_activity)}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {c.enquiries > 0 && <CountChip icon={MessageSquare} n={c.enquiries} />}
                    {c.orders > 0 && <CountChip icon={ShoppingCart} n={c.orders} />}
                    {c.messages > 0 && <CountChip icon={FileText} n={c.messages} />}
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === c.email ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
                </button>

                {open === c.email && (
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 my-3 text-xs" style={{ color: "#555" }}>
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.email}</a>
                      {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.phone}</span>}
                      {c.company && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.company}</span>}
                      {c.country && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.country}</span>}
                    </div>

                    {detailLoading ? (
                      <div className="flex items-center gap-2 text-sm py-3" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading history…</div>
                    ) : detail && detail.email.toLowerCase() === c.email.toLowerCase() ? (
                      <div className="space-y-4">
                        {detail.enquiries.length > 0 && (
                          <HistoryBlock title="Enquiries">
                            {detail.enquiries.map((e) => (
                              <Item key={`e${e.id}`} tag={e.product_category ?? "General"} status={e.status} date={e.created_at} text={e.message} />
                            ))}
                          </HistoryBlock>
                        )}
                        {detail.orders.length > 0 && (
                          <HistoryBlock title="Orders">
                            {detail.orders.map((o) => (
                              <Item key={`o${o.id}`} tag={o.reference} status={o.status} date={o.created_at} text={`${money(o.currency, o.total)} · ${o.payment_status}`} />
                            ))}
                          </HistoryBlock>
                        )}
                        {detail.messages.length > 0 && (
                          <HistoryBlock title="Messages">
                            {detail.messages.map((m) => (
                              <Item key={`m${m.id}`} tag={m.subject || "Message"} status={m.status} date={m.created_at} text={m.message} />
                            ))}
                          </HistoryBlock>
                        )}

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#999" }}>Internal note</p>
                          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note about this customer…" className="w-full text-sm rounded-xl px-3 py-2 border min-h-16" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                          <button onClick={() => saveNote(c.email)} disabled={savingNote} className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: savingNote ? 0.7 : 1 }}>
                            {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save note
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>

          {meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={meta.current_page <= 1} onClick={() => goPage(meta.current_page - 1)} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full disabled:opacity-40" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}><ChevronLeft className="w-4 h-4" />Prev</button>
              <span className="text-xs" style={{ color: "#777" }}>Page {meta.current_page} of {meta.last_page}</span>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => goPage(meta.current_page + 1)} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full disabled:opacity-40" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>Next<ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CountChip({ icon: Icon, n }: { icon: typeof Mail; n: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#777" }}>
      <Icon className="w-3 h-3" />{n}
    </span>
  );
}

function HistoryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#999" }}>{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Item({ tag, status, date, text }: { tag: string; status: string; date: string; text: string }) {
  return (
    <div className="rounded-xl px-3.5 py-2.5" style={{ background: "#F8F7F5" }}>
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#fff", color: "#888" }}>{tag}</span>
        <span className="text-[11px]" style={{ color: "#999" }}>{status.replace(/_/g, " ")} · {formatDate(date)}</span>
      </div>
      {text && <p className="text-xs line-clamp-2" style={{ color: "#555" }}>{text}</p>}
    </div>
  );
}
