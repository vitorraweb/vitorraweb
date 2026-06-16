"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, ChevronDown, Mail, Phone, Building2, MapPin, StickyNote,
  MessageSquare, ShoppingCart, FileText, ChevronLeft, ChevronRight,
  Save, Send, Pencil, X, Download, Plus, Tag,
} from "lucide-react";
import { apiAdmin, downloadCsv } from "@/lib/auth";
import { PageHeader, Empty, formatDate } from "@/components/admin/admin-ui";

type Contact = {
  email: string; name: string; company: string | null; phone: string | null; country: string | null;
  enquiries: number; orders: number; messages: number; first_seen: string; last_activity: string; has_note: boolean;
  tags: string[];
};
type Communication = {
  id: number; subject: string | null; body: string; sender: { id: number; name: string } | null; created_at: string;
};
type Detail = {
  email: string;
  enquiries: { id: number; product_category: string | null; message: string; status: string; assigned_to: string | null; created_at: string }[];
  orders: { id: number; reference: string; currency: string; total: number; status: string; payment_status: string; created_at: string }[];
  messages: { id: number; subject: string | null; message: string; status: string; created_at: string }[];
  communications: Communication[];
  note: string | null;
  override_name: string | null;
  override_phone: string | null;
  override_company: string | null;
  override_country: string | null;
  tags: string[];
};
type Template = { id: number; name: string; subject: string; body: string; category: string | null };
type ThreadItem = { key: string; direction: "in" | "out"; label: string; text: string; date: string; sender?: string };

const money = (currency: string, total: number) =>
  currency === "USD"
    ? `$${(total / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `UGX ${total.toLocaleString("en-US")}`;

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
  const [templates, setTemplates] = useState<Template[]>([]);

  // Note
  const [note, setNote]           = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Reply
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody]       = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  // Edit info
  const [editingInfo, setEditingInfo]   = useState(false);
  const [infoForm, setInfoForm]         = useState({ name: "", phone: "", company: "", country: "" });
  const [savingInfo, setSavingInfo]     = useState(false);

  // Tags
  const [tags, setTags]         = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (appliedQ) params.set("q", appliedQ);
      params.set("page", String(page));
      const res = await apiAdmin<{ data: Contact[]; current_page: number; last_page: number; total: number }>(
        `/admin/customers?${params.toString()}`
      );
      setList(res.data);
      setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [appliedQ, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiAdmin<Template[]>("/admin/templates").then((r) => setTemplates(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const search = () => { setLoading(true); setPage(1); setApplied(q.trim()); };
  const goPage = (p: number) => { setLoading(true); setOpen(null); setPage(p); };

  const expand = async (email: string) => {
    if (open === email) { setOpen(null); return; }
    setOpen(email); setDetail(null); setDetailLoading(true);
    setReplySubject(""); setReplyBody(""); setEditingInfo(false); setTagInput("");
    try {
      const res = await apiAdmin<{ data: Detail }>(`/admin/customers/detail?email=${encodeURIComponent(email)}`);
      setDetail(res.data);
      setNote(res.data.note ?? "");
      setTags(res.data.tags ?? []);
      setInfoForm({
        name:    res.data.override_name    ?? "",
        phone:   res.data.override_phone   ?? "",
        company: res.data.override_company ?? "",
        country: res.data.override_country ?? "",
      });
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

  const saveInfo = async (email: string) => {
    setSavingInfo(true);
    try {
      await apiAdmin("/admin/customers/info", {
        method: "PUT",
        body: JSON.stringify({
          email,
          override_name:    infoForm.name.trim()    || null,
          override_phone:   infoForm.phone.trim()   || null,
          override_company: infoForm.company.trim() || null,
          override_country: infoForm.country.trim() || null,
        }),
      });
      setList((l) => l.map((c) => {
        if (c.email.toLowerCase() !== email.toLowerCase()) return c;
        return {
          ...c,
          name:    infoForm.name.trim()    || c.name,
          phone:   infoForm.phone.trim()   || c.phone,
          company: infoForm.company.trim() || c.company,
          country: infoForm.country.trim() || c.country,
        };
      }));
      setEditingInfo(false);
    } catch { /* ignore */ }
    finally { setSavingInfo(false); }
  };

  const saveTags = async (email: string, nextTags: string[]) => {
    setSavingTags(true);
    try {
      await apiAdmin("/admin/customers/tags", { method: "PUT", body: JSON.stringify({ email, tags: nextTags }) });
      setTags(nextTags);
      setList((l) => l.map((c) => c.email.toLowerCase() === email.toLowerCase() ? { ...c, tags: nextTags } : c));
    } catch { /* ignore */ }
    finally { setSavingTags(false); }
  };

  const addTag = (email: string) => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    const next = [...tags, t];
    setTagInput("");
    saveTags(email, next);
  };

  const removeTag = (email: string, tag: string) => {
    saveTags(email, tags.filter((t) => t !== tag));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCsv("/admin/customers/export", `customers-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch { /* ignore */ }
    finally { setExporting(false); }
  };

  const applyTemplate = (t: Template) => {
    setReplySubject(t.subject);
    setReplyBody(t.body);
    setTemplateOpen(false);
  };

  const sendReply = async (email: string, name: string) => {
    if (!replyBody.trim()) return;
    setSendingReply(true);
    try {
      const res = await apiAdmin<{ data: Communication }>("/admin/communications", {
        method: "POST",
        body: JSON.stringify({ email, name, subject: replySubject.trim() || undefined, body: replyBody.trim() }),
      });
      setDetail((d) => (d ? { ...d, communications: [res.data, ...d.communications] } : d));
      setReplySubject(""); setReplyBody("");
    } catch { /* ignore */ }
    finally { setSendingReply(false); }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Customers" subtitle="Everyone who's engaged — aggregated from enquiries, orders, and messages." />
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="Search name, email, company…"
            className="text-sm rounded-full px-4 py-2 border w-64 max-w-full outline-none"
            style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
          <button onClick={search} className="text-sm font-semibold px-3.5 py-2 rounded-full"
            style={{ background: "#F2F2F2", color: "#555" }}>Search</button>
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full disabled:opacity-50"
            style={{ background: "#C5B27A", color: "#1E1E1E" }}>
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Export
          </button>
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
                    {c.orders > 0    && <CountChip icon={ShoppingCart}   n={c.orders} />}
                    {c.messages > 0  && <CountChip icon={FileText}       n={c.messages} />}
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === c.email ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
                </button>

                {open === c.email && (
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>

                    {/* Contact info row + edit */}
                    <div className="flex items-start justify-between gap-2 my-3">
                      {!editingInfo ? (
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs" style={{ color: "#555" }}>
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.email}</a>
                          {c.phone   && <span className="flex items-center gap-1.5"><Phone     className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.phone}</span>}
                          {c.company && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.company}</span>}
                          {c.country && <span className="flex items-center gap-1.5"><MapPin     className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{c.country}</span>}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 text-sm">
                          {(["name", "phone", "company", "country"] as const).map((field) => (
                            <div key={field}>
                              <label className="text-[10px] font-bold uppercase tracking-[0.08em] mb-0.5 block" style={{ color: "#bbb" }}>{field}</label>
                              <input value={infoForm[field]} onChange={(e) => setInfoForm((f) => ({ ...f, [field]: e.target.value }))}
                                placeholder={`Override ${field}…`}
                                className="w-full rounded-xl px-3 py-1.5 border text-sm outline-none"
                                style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                            </div>
                          ))}
                          <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                            <button onClick={() => saveInfo(c.email)} disabled={savingInfo}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full disabled:opacity-50"
                              style={{ background: "#C5B27A", color: "#1E1E1E" }}>
                              {savingInfo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                            </button>
                            <button onClick={() => setEditingInfo(false)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full"
                              style={{ background: "#F2F2F2", color: "#555" }}>
                              <X className="w-3.5 h-3.5" />Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {!editingInfo && (
                        <button onClick={() => setEditingInfo(true)} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                          style={{ background: "#F2F2F2", color: "#777" }}>
                          <Pencil className="w-3 h-3" />Edit info
                        </button>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#999" }}>
                        <Tag className="w-3 h-3 inline mr-1" style={{ color: "#C5B27A" }} />Labels
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(197,178,122,0.15)", color: "#7A6020", border: "1px solid rgba(197,178,122,0.3)" }}>
                            {tag}
                            <button onClick={() => removeTag(c.email, tag)} disabled={savingTags}
                              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1">
                          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(c.email); } }}
                            placeholder="Add label…"
                            className="text-[11px] rounded-full px-2.5 py-1 border outline-none w-28"
                            style={{ borderColor: "rgba(0,0,0,0.1)", background: "#fff" }} />
                          <button onClick={() => addTag(c.email)} disabled={!tagInput.trim() || savingTags}
                            className="p-1 rounded-full disabled:opacity-40"
                            style={{ background: "#C5B27A", color: "#1E1E1E" }}>
                            {savingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {detailLoading ? (
                      <div className="flex items-center gap-2 text-sm py-3" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading history…</div>
                    ) : detail && detail.email.toLowerCase() === c.email.toLowerCase() ? (
                      <div className="space-y-4">
                        {detail.orders.length > 0 && (
                          <HistoryBlock title="Orders">
                            {detail.orders.map((o) => (
                              <Item key={`o${o.id}`} tag={o.reference} status={o.status} date={o.created_at} text={`${money(o.currency, o.total)} · ${o.payment_status}`} />
                            ))}
                          </HistoryBlock>
                        )}

                        {/* Conversation thread */}
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#999" }}>Conversation</p>
                          {(() => {
                            const thread: ThreadItem[] = [
                              ...detail.enquiries.map((e) => ({ key: `e${e.id}`, direction: "in" as const, label: e.product_category ?? "Enquiry", text: e.message, date: e.created_at })),
                              ...detail.messages.map((m)  => ({ key: `m${m.id}`, direction: "in" as const, label: m.subject || "Message",  text: m.message, date: m.created_at })),
                              ...detail.communications.map((cm) => ({ key: `c${cm.id}`, direction: "out" as const, label: cm.subject || "Reply", text: cm.body, date: cm.created_at, sender: cm.sender?.name })),
                            ].sort((a, b) => a.date.localeCompare(b.date));

                            return thread.length > 0 ? (
                              <div className="space-y-1.5 mb-3">
                                {thread.map((t) => <ThreadBubble key={t.key} item={t} />)}
                              </div>
                            ) : (
                              <p className="text-xs mb-3" style={{ color: "#999" }}>No messages yet.</p>
                            );
                          })()}

                          {/* Reply composer */}
                          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#F8F7F5" }}>
                            {/* Template picker */}
                            {templates.length > 0 && (
                              <div className="relative mb-2">
                                <button onClick={() => setTemplateOpen((o) => !o)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", color: "#555" }}>
                                  Use template <ChevronDown className={`w-3 h-3 transition-transform ${templateOpen ? "rotate-180" : ""}`} />
                                </button>
                                {templateOpen && (
                                  <div className="absolute left-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden w-72"
                                    style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)" }}>
                                    {templates.map((t) => (
                                      <button key={t.id} onClick={() => applyTemplate(t)}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-black/[0.03] transition-colors border-b last:border-0"
                                        style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                                        <p className="text-xs font-semibold" style={{ color: "#1E1E1E" }}>{t.name}</p>
                                        <p className="text-[11px] truncate" style={{ color: "#999" }}>{t.subject}</p>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <input value={replySubject} onChange={(e) => setReplySubject(e.target.value)}
                              placeholder="Subject (optional)"
                              className="w-full text-sm rounded-lg px-3 py-1.5 border mb-2 outline-none"
                              style={{ borderColor: "rgba(0,0,0,0.1)", background: "#fff" }} />
                            <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
                              placeholder={`Reply to ${c.name || c.email}…`}
                              className="w-full text-sm rounded-lg px-3 py-2 border min-h-20 outline-none"
                              style={{ borderColor: "rgba(0,0,0,0.1)", background: "#fff" }} />
                            <button onClick={() => sendReply(c.email, c.name)} disabled={sendingReply || !replyBody.trim()}
                              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold px-3.5 py-1.5 rounded-full disabled:opacity-50"
                              style={{ background: "#C5B27A", color: "#1E1E1E" }}>
                              {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Send reply
                            </button>
                          </div>
                        </div>

                        {/* Internal note */}
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#999" }}>Internal note</p>
                          <textarea value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder="Private note about this customer…"
                            className="w-full text-sm rounded-xl px-3 py-2 border min-h-16"
                            style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                          <button onClick={() => saveNote(c.email)} disabled={savingNote}
                            className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold px-3.5 py-1.5 rounded-full"
                            style={{ background: "#C5B27A", color: "#1E1E1E", opacity: savingNote ? 0.7 : 1 }}>
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
              <button disabled={meta.current_page <= 1} onClick={() => goPage(meta.current_page - 1)}
                className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full disabled:opacity-40"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                <ChevronLeft className="w-4 h-4" />Prev
              </button>
              <span className="text-xs" style={{ color: "#777" }}>Page {meta.current_page} of {meta.last_page}</span>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => goPage(meta.current_page + 1)}
                className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full disabled:opacity-40"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                Next<ChevronRight className="w-4 h-4" />
              </button>
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

function ThreadBubble({ item }: { item: ThreadItem }) {
  const isOut = item.direction === "out";
  return (
    <div className="rounded-xl px-3.5 py-2.5" style={{ background: isOut ? "rgba(197,178,122,0.12)" : "#F8F7F5", borderLeft: isOut ? "3px solid #C5B27A" : "3px solid transparent" }}>
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#fff", color: "#888" }}>{item.label}</span>
        <span className="text-[11px]" style={{ color: "#999" }}>
          {isOut ? `Reply${item.sender ? ` · ${item.sender}` : ""}` : "Received"} · {formatDate(item.date)}
        </span>
      </div>
      {item.text && <p className="text-xs whitespace-pre-line" style={{ color: "#555" }}>{item.text}</p>}
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
