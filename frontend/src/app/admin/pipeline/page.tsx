"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Mail, StickyNote, MessageSquare, ShoppingCart, FileText, Users, Save, ChevronDown, ChevronUp } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, formatDate, formatRelativeTime, initials } from "@/components/admin/admin-ui";

type Person = { id: number; name: string; department?: string | null };
type Contact = {
  email: string; name: string; company: string | null; phone: string | null; country: string | null;
  enquiries: number; orders: number; messages: number; prospects: number;
  first_seen: string; last_activity: string; has_note: boolean; stale: boolean;
  stage: string; pipeline_stage: string | null; owner: { id: number; name: string } | null;
};
type Detail = {
  email: string;
  prospects: { id: number; name: string; category: string; outreach_status: string; assigned_to: string | null; created_at: string }[];
  enquiries: { id: number; product_category: string | null; message: string; status: string; assigned_to: string | null; created_at: string }[];
  orders: { id: number; reference: string; currency: string; total: number; status: string; payment_status: string; created_at: string }[];
  messages: { id: number; subject: string | null; message: string; status: string; created_at: string }[];
  note: string | null;
  pipeline_stage: string | null;
  owner: { id: number; name: string } | null;
};

const money = (currency: string, total: number) =>
  currency === "USD" ? `$${(total / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `UGX ${total.toLocaleString("en-US")}`;

const selectCls = "text-[11px] font-semibold rounded-full px-2 py-1 border outline-none";
const selectStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#454545" } as const;

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assignees, setAssignees] = useState<Person[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [stageLabels, setStageLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showLost, setShowLost] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: Contact[]; assignees: Person[]; stages: string[]; stage_labels: Record<string, string> }>("/admin/customers?per_page=500");
      setContacts(res.data);
      setAssignees(res.assignees);
      setStages(res.stages);
      setStageLabels(res.stage_labels);
    } catch { setContacts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((c) => `${c.name} ${c.email} ${c.company ?? ""}`.toLowerCase().includes(term));
  }, [contacts, q]);

  const activeStages = stages.filter((s) => s !== "lost");
  const lostContacts = filtered.filter((c) => c.stage === "lost");

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

  const changeStage = async (email: string, newStage: string) => {
    const prev = contacts;
    setContacts((cs) => cs.map((c) => (c.email === email ? { ...c, stage: newStage, pipeline_stage: newStage } : c)));
    try {
      const c = prev.find((x) => x.email === email);
      await apiAdmin("/admin/customers/pipeline", { method: "PUT", body: JSON.stringify({ email, name: c?.name, owner_id: c?.owner?.id ?? null, pipeline_stage: newStage }) });
    } catch { setContacts(prev); }
  };

  const changeOwner = async (email: string, ownerId: number | null) => {
    const prev = contacts;
    const owner = ownerId ? assignees.find((a) => a.id === ownerId) ?? null : null;
    setContacts((cs) => cs.map((c) => (c.email === email ? { ...c, owner: owner ? { id: owner.id, name: owner.name } : null } : c)));
    try {
      const c = prev.find((x) => x.email === email);
      await apiAdmin("/admin/customers/pipeline", { method: "PUT", body: JSON.stringify({ email, owner_id: ownerId, pipeline_stage: c?.pipeline_stage ?? null }) });
    } catch { setContacts(prev); }
  };

  const saveNote = async (email: string) => {
    setSavingNote(true);
    try {
      await apiAdmin("/admin/customers/note", { method: "PUT", body: JSON.stringify({ email, note: note || null }) });
      setContacts((cs) => cs.map((c) => (c.email.toLowerCase() === email.toLowerCase() ? { ...c, has_note: !!note.trim() } : c)));
    } catch { /* ignore */ }
    finally { setSavingNote(false); }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Pipeline" subtitle="Every contact's stage and owner, in one view — from first contact to fulfilment." />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, company…"
          className="text-sm rounded-full px-4 py-2 border w-64 max-w-full outline-none"
          style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : filtered.length === 0 ? (
        <Empty label="No contacts yet." />
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activeStages.map((stage) => {
              const items = filtered.filter((c) => c.stage === stage);
              return (
                <div key={stage} className="shrink-0 w-72 rounded-[18px] p-3" style={{ background: "#F8F7F5" }}>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#999" }}>{stageLabels[stage] ?? stage}</p>
                    <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: "#fff", color: "#777" }}>{items.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((c) => (
                      <ContactCard
                        key={c.email}
                        contact={c}
                        stages={stages}
                        stageLabels={stageLabels}
                        assignees={assignees}
                        open={open === c.email}
                        onToggle={() => expand(c.email)}
                        onStageChange={(s) => changeStage(c.email, s)}
                        onOwnerChange={(id) => changeOwner(c.email, id)}
                        now={now}
                      >
                        {open === c.email && (
                          <DetailPanel
                            loading={detailLoading}
                            detail={detail}
                            email={c.email}
                            note={note}
                            setNote={setNote}
                            savingNote={savingNote}
                            onSaveNote={() => saveNote(c.email)}
                          />
                        )}
                      </ContactCard>
                    ))}
                    {items.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#BBB" }}>—</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2">
            <button
              onClick={() => setShowLost((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full"
              style={{ background: "#F2F2F2", color: "#777" }}
            >
              {showLost ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Lost ({lostContacts.length})
            </button>

            {showLost && (
              <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
                <div className="shrink-0 w-72 rounded-[18px] p-3" style={{ background: "#F8F7F5" }}>
                  <div className="space-y-2.5">
                    {lostContacts.map((c) => (
                      <ContactCard
                        key={c.email}
                        contact={c}
                        stages={stages}
                        stageLabels={stageLabels}
                        assignees={assignees}
                        open={open === c.email}
                        onToggle={() => expand(c.email)}
                        onStageChange={(s) => changeStage(c.email, s)}
                        onOwnerChange={(id) => changeOwner(c.email, id)}
                        now={now}
                      >
                        {open === c.email && (
                          <DetailPanel
                            loading={detailLoading}
                            detail={detail}
                            email={c.email}
                            note={note}
                            setNote={setNote}
                            savingNote={savingNote}
                            onSaveNote={() => saveNote(c.email)}
                          />
                        )}
                      </ContactCard>
                    ))}
                    {lostContacts.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#BBB" }}>—</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ContactCard({
  contact, stages, stageLabels, assignees, open, onToggle, onStageChange, onOwnerChange, now, children,
}: {
  contact: Contact; stages: string[]; stageLabels: Record<string, string>; assignees: Person[];
  open: boolean; onToggle: () => void; onStageChange: (s: string) => void; onOwnerChange: (id: number | null) => void;
  now: number | null; children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.05] overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0"
            style={{ background: contact.owner ? "#C5B27A" : "#F2F2F2", color: contact.owner ? "#1E1E1E" : "#BBB" }}
            title={contact.owner ? `Owner: ${contact.owner.name}` : "Unassigned"}
          >
            {contact.owner ? initials(contact.owner.name) : "—"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: "#1E1E1E" }}>{contact.name || contact.email}</p>
            {contact.company && <p className="text-[11px] truncate" style={{ color: "#999" }}>{contact.company}</p>}
          </div>
          {contact.has_note && <StickyNote className="w-3.5 h-3.5 shrink-0" style={{ color: "#C5B27A" }} />}
        </div>
        <p className="text-[11px] truncate mb-1.5" style={{ color: "#999" }}>{contact.email}</p>
        <div className="flex items-center gap-1.5 mb-1.5">
          {contact.prospects > 0 && <CountChip icon={Users} n={contact.prospects} />}
          {contact.enquiries > 0 && <CountChip icon={MessageSquare} n={contact.enquiries} />}
          {contact.orders > 0 && <CountChip icon={ShoppingCart} n={contact.orders} />}
          {contact.messages > 0 && <CountChip icon={FileText} n={contact.messages} />}
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-[10px]" style={{ color: "#BBB" }}>{now ? `Active ${formatRelativeTime(contact.last_activity, now)}` : ""}</p>
          {contact.stale && (
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#C0392B" }}>● Cold</span>
          )}
        </div>
      </button>

      <div className="px-3 pb-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <select
          value={contact.stage}
          onChange={(e) => onStageChange(e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          {stages.map((s) => <option key={s} value={s}>{stageLabels[s] ?? s}</option>)}
        </select>
        <select
          value={contact.owner?.id ?? ""}
          onChange={(e) => onOwnerChange(e.target.value ? Number(e.target.value) : null)}
          className={`${selectCls} flex-1 min-w-0`}
          style={selectStyle}
        >
          <option value="">— Unassigned —</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {children}
    </div>
  );
}

function DetailPanel({
  loading, detail, email, note, setNote, savingNote, onSaveNote,
}: {
  loading: boolean; detail: Detail | null; email: string;
  note: string; setNote: (v: string) => void; savingNote: boolean; onSaveNote: () => void;
}) {
  if (loading) {
    return <div className="flex items-center gap-2 text-sm px-3 pb-3" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading history…</div>;
  }
  if (!detail || detail.email.toLowerCase() !== email.toLowerCase()) return null;

  return (
    <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }} onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-x-4 gap-y-1 my-2 text-[11px]" style={{ color: "#555" }}>
        <a href={`mailto:${email}`} className="flex items-center gap-1 hover:underline"><Mail className="w-3 h-3" style={{ color: "#C5B27A" }} />{email}</a>
      </div>

      <div className="space-y-3">
        {detail.prospects.length > 0 && (
          <HistoryBlock title="Prospects">
            {detail.prospects.map((p) => (
              <Item key={`p${p.id}`} tag={p.category} status={p.outreach_status} date={p.created_at} text={p.assigned_to ? `Assigned: ${p.assigned_to}` : ""} />
            ))}
          </HistoryBlock>
        )}
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
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note about this contact…" className="w-full text-sm rounded-xl px-3 py-2 border min-h-16" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
          <button onClick={onSaveNote} disabled={savingNote} className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: savingNote ? 0.7 : 1 }}>
            {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save note
          </button>
        </div>
      </div>
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
