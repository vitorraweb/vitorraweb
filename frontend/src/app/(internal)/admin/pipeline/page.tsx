"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Mail, StickyNote, MessageSquare, ShoppingCart, FileText, Users, ChevronDown, ChevronUp, CalendarClock } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, formatRelativeTime, initials } from "@/components/admin/admin-ui";
import { KpiTile } from "@/components/admin/reporting";
import { CustomerDrawer } from "@/components/crm/CustomerDrawer";
import { money, moneyShort, isoDay } from "@/components/crm/crm";

type Person = { id: number; name: string; department?: string | null };
type Contact = {
  email: string; name: string; company: string | null; phone: string | null; country: string | null;
  enquiries: number; orders: number; messages: number; prospects: number;
  first_seen: string; last_activity: string; has_note: boolean; stale: boolean;
  stage: string; pipeline_stage: string | null; owner: { id: number; name: string } | null;
  deal_value: number | null; deal_currency: string; expected_close: string | null; next_action: string | null; next_action_on: string | null;
};
type Forecast = {
  currencies: Record<string, { open: number; weighted: number; won_this_month: number; closing_this_month: number }>;
  win_rate: number | null; decided_90d: number;
};
const selectCls = "text-[11px] font-semibold rounded-full px-2 py-1 border outline-none";
const selectStyle = { borderColor: "rgba(0,0,0,0.12)", background: "var(--o-surface)", color: "var(--o-text-2)" } as const;

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assignees, setAssignees] = useState<Person[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [stageLabels, setStageLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
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
  const loadForecast = useCallback(() => { apiAdmin<{ data: Forecast }>("/admin/crm/forecast").then((r) => setForecast(r.data)).catch(() => setForecast(null)); }, []);
  useEffect(() => { loadForecast(); }, [loadForecast]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((c) => `${c.name} ${c.email} ${c.company ?? ""}`.toLowerCase().includes(term));
  }, [contacts, q]);

  const activeStages = stages.filter((s) => s !== "lost");
  const lostContacts = filtered.filter((c) => c.stage === "lost");

  const expand = (email: string) => setOpen(open === email ? null : email);
  const openContact = contacts.find((c) => c.email === open) ?? null;

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


  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Every contact's stage and owner, in one view, from first contact to fulfilment."
        actions={<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company…" className="c-input w-64 max-w-full" aria-label="Search the pipeline" />}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--o-muted)" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : filtered.length === 0 ? (
        <Empty label="No contacts yet." />
      ) : (
        <>
          {forecast && (() => {
            const f = forecast.currencies.UGX ?? { open: 0, weighted: 0, won_this_month: 0, closing_this_month: 0 };
            return (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <KpiTile label="Open pipeline" value={moneyShort(f.open)} sub="Deals with a value, not yet won" />
                <KpiTile label="Forecast" value={moneyShort(f.weighted)} sub="Weighted by how far each deal is" />
                <KpiTile label="Closing this month" value={moneyShort(f.closing_this_month)} sub="By expected close date" />
                <KpiTile label="Won this month" value={moneyShort(f.won_this_month)} />
                <KpiTile label="Win rate" value={forecast.win_rate == null ? "—" : `${forecast.win_rate}%`} sub={`Of ${forecast.decided_90d} decided in 90 days`} />
              </div>
            );
          })()}
          <div className="flex gap-4 overflow-x-auto pb-4 board-scroll-x">
            {activeStages.map((stage) => {
              const items = filtered.filter((c) => c.stage === stage);
              const value = items.reduce((n, c) => n + (c.deal_currency === "UGX" ? c.deal_value ?? 0 : 0), 0);
              return (
                <div key={stage} className="shrink-0 w-72 rounded-md p-2.5 flex flex-col" style={{ background: "var(--o-surface-2)", maxHeight: "calc(100vh - 190px)" }}>
                  <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b border-line">
                    <p className="text-[14px] font-semibold text-ink">{stageLabels[stage] ?? stage}</p>
                    <span className="flex items-center gap-1.5">
                      {value > 0 && <span className="text-[12px] font-semibold text-ink-muted tabular-nums">{moneyShort(value)}</span>}
                      <span className="c-chip" data-plain>{items.length}</span>
                    </span>
                  </div>
                  {/* Columns scroll on their own, like Odoo's kanban, so a long
                      "New lead" column never pushes the board off the screen. */}
                  <div className="space-y-2 overflow-y-auto pr-0.5 -mr-0.5 pt-1">
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
                      />
                    ))}
                    {items.length === 0 && <p className="text-[13px] text-center py-6 text-ink-muted">No contacts at this stage</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2">
            <button onClick={() => setShowLost((v) => !v)} className="c-btn">
              {showLost ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Lost ({lostContacts.length})
            </button>

            {showLost && (
              <div className="mt-3 flex gap-4 overflow-x-auto pb-2 board-scroll-x">
                <div className="shrink-0 w-72 rounded-[18px] p-3" style={{ background: "var(--o-surface-2)" }}>
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
                      />
                    ))}
                    {lostContacts.length === 0 && <p className="text-[13px] text-center py-6 text-ink-muted">No lost contacts</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {openContact && (
        <CustomerDrawer
          email={openContact.email} name={openContact.name || openContact.email} phone={openContact.phone} company={openContact.company}
          onClose={() => setOpen(null)} onChanged={() => { load(); loadForecast(); }}
        />
      )}
    </div>
  );
}

function ContactCard({
  contact, stages, stageLabels, assignees, onToggle, onStageChange, onOwnerChange, now, children,
}: {
  contact: Contact; stages: string[]; stageLabels: Record<string, string>; assignees: Person[];
  open: boolean; onToggle: () => void; onStageChange: (s: string) => void; onOwnerChange: (id: number | null) => void;
  now: number | null; children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-md border border-line overflow-hidden shadow-sm">
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
            <p className="text-sm font-semibold truncate" style={{ color: "var(--o-text)" }}>{contact.name || contact.email}</p>
            {contact.company && <p className="text-[11px] truncate" style={{ color: "var(--o-faint)" }}>{contact.company}</p>}
          </div>
          {contact.has_note && <StickyNote className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--o-accent)" }} />}
        </div>
        <p className="text-[11px] truncate mb-1.5" style={{ color: "var(--o-faint)" }}>{contact.email}</p>
        <div className="flex items-center gap-1.5 mb-1.5">
          {contact.prospects > 0 && <CountChip icon={Users} n={contact.prospects} />}
          {contact.enquiries > 0 && <CountChip icon={MessageSquare} n={contact.enquiries} />}
          {contact.orders > 0 && <CountChip icon={ShoppingCart} n={contact.orders} />}
          {contact.messages > 0 && <CountChip icon={FileText} n={contact.messages} />}
        </div>
        {(contact.deal_value || contact.next_action_on) && (
          <div className="flex items-center gap-2 mb-1.5 text-[12px]">
            {contact.deal_value ? <span className="font-semibold text-ink tabular-nums">{money(contact.deal_value, contact.deal_currency)}</span> : null}
            {contact.next_action_on && (
              <span className="inline-flex items-center gap-1 truncate" title={contact.next_action ?? undefined}
                style={{ color: contact.next_action_on < isoDay() ? "var(--o-danger)" : contact.next_action_on === isoDay() ? "var(--o-warning)" : "var(--o-muted)" }}>
                <CalendarClock className="w-3 h-3 shrink-0" />{contact.next_action ?? "Follow up"} · {new Date(`${contact.next_action_on}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <p className="text-[10px]" style={{ color: "var(--o-faint)" }}>{now ? `Active ${formatRelativeTime(contact.last_activity, now)}` : ""}</p>
          {/* "Quiet", not "cold": Cold is the decision engine's tier in Marketing. */}
          {contact.stale && (
            <span className="c-chip" data-tone="gold" title="No activity for 90 days or more">Quiet 90+ days</span>
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


function CountChip({ icon: Icon, n }: { icon: typeof Mail; n: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--o-surface-2)", color: "var(--o-muted)" }}>
      <Icon className="w-3 h-3" />{n}
    </span>
  );
}


