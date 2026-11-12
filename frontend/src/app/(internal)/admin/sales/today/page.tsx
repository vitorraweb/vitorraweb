"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, Flame, CalendarClock, MessageSquare, Target, Handshake } from "lucide-react";
import { apiAdmin, auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { KpiTile } from "@/components/admin/reporting";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CustomerDrawer } from "@/components/crm/CustomerDrawer";
import { isoDay, money, telUrl, whatsappUrl } from "@/components/crm/crm";

/* ─── Sales → Today ───────────────────────────────────────────────────────────
   One list to start the day from: follow-ups due (overdue first), new
   enquiries nobody has answered, the hottest prospects from the decision
   engine, and deals expected to close soon. Every row has Call and WhatsApp
   one tap away and opens the customer panel to log what happened.         */

type FollowUp = { kind: "customer" | "prospect"; email: string | null; prospect_id: number | null; name: string; phone: string | null; what: string; due: string; stage: string | null; owner: string | null };
type Enq = { id: number; name: string; company: string | null; email: string; phone: string | null; product_category: string | null; created_at: string; wants_assessment: boolean; assessment_when: string | null; assessment_where: string | null; contact_pref: string | null };
type Hot = { id: number; name: string; email: string | null; phone: string | null; product: string; lead_score: number; lead_tier: string; lead_action: string | null };
type Closing = { email: string; name: string; phone: string | null; deal_value: number | null; deal_currency: string; expected_close: string; stage: string; probability: number };
type Today = { follow_ups: FollowUp[]; overdue: number; new_enquiries: Enq[]; hot_leads: Hot[]; closing_soon: Closing[]; this_week: { activities: number; by_kind: Record<string, number> }; everyone: boolean };
type Open = { email: string | null; prospectId?: number | null; name: string; phone: string | null; company?: string | null };

const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export default function TodayPage() {
  const me = auth.getUser();
  const [all, setAll] = useState(false);
  const [d, setD] = useState<Today | null>(null);
  const [open, setOpen] = useState<Open | null>(null);

  const load = useCallback(() => {
    apiAdmin<{ data: Today }>(`/admin/crm/today${all ? "?all=1" : ""}`).then((r) => setD(r.data)).catch(() => setD(null));
  }, [all]);
  useEffect(() => { load(); }, [load]);

  const today = isoDay();
  const dueToday = d?.follow_ups.filter((f) => f.due === today).length ?? 0;

  return (
    <div className="pb-12">
      <PageHeader
        title="Today"
        subtitle={`${me?.name?.split(/\s+/)[0] ?? "Your"} sales day: who to call, who is waiting, and which deals are close.`}
        actions={me?.role === "admin" ? (
          <div className="o-seg"><button aria-pressed={!all} onClick={() => setAll(false)}>Mine</button><button aria-pressed={all} onClick={() => setAll(true)}>Everyone</button></div>
        ) : undefined}
      />

      {!d ? <p className="flex items-center gap-2 text-[14px] text-ink-muted mt-5"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p> : (
        <div className="space-y-4 mt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile label="Overdue follow-ups" value={String(d.overdue)} sub={d.overdue ? "Call these first" : "All caught up"} />
            <KpiTile label="Due today" value={String(dueToday)} />
            <KpiTile label="New enquiries waiting" value={String(d.new_enquiries.length)} sub="Not yet answered" href="/admin/enquiries" />
            <KpiTile label="Logged this week" value={String(d.this_week.activities)} sub="Calls, chats, visits, meetings" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Panel icon={CalendarClock} title="Follow-ups" note="Overdue, today and the next 7 days">
              {d.follow_ups.length === 0 ? <Empty text="No follow-ups due. Log a call with a next step and it shows up here." /> : d.follow_ups.map((f) => (
                <Row key={`${f.kind}${f.email ?? f.prospect_id}${f.due}`} name={f.name} phone={f.phone}
                  sub={`${f.what}${all && f.owner ? ` · ${f.owner}` : ""}`}
                  right={<span className="text-[12.5px] font-medium whitespace-nowrap" style={{ color: f.due < today ? "var(--o-danger)" : f.due === today ? "var(--o-warning)" : "var(--o-muted)" }}>{f.due < today ? "Overdue · " : ""}{day(f.due)}</span>}
                  onOpen={() => setOpen({ email: f.email, prospectId: f.prospect_id, name: f.name, phone: f.phone })} />
              ))}
            </Panel>

            <Panel icon={MessageSquare} title="New enquiries waiting" note="Answer within the hour — they are comparing suppliers">
              {d.new_enquiries.length === 0 ? <Empty text="Every enquiry has been picked up." /> : d.new_enquiries.map((e) => (
                <Row key={e.id} name={e.company || e.name} phone={e.phone}
                  sub={[
                    e.product_category ?? "General",
                    e.wants_assessment ? `Wants a free assessment${e.assessment_when ? ` ${e.assessment_when.toLowerCase()}` : ""}${e.assessment_where ? ` at ${e.assessment_where}` : ""}` : null,
                    e.contact_pref ? `Prefers ${e.contact_pref}` : null,
                    new Date(e.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
                  ].filter(Boolean).join(" · ")}
                  right={e.wants_assessment ? <span className="c-chip" data-tone="ok">Assessment</span> : undefined}
                  onOpen={() => setOpen({ email: e.email, name: e.name, phone: e.phone, company: e.company })} />
              ))}
            </Panel>

            <Panel icon={Flame} title="Hottest prospects" note="From Lead priorities — engaged with our emails recently">
              {d.hot_leads.length === 0 ? <Empty text="No hot or warm prospects right now." /> : d.hot_leads.map((h) => (
                <Row key={h.id} name={h.name} phone={h.phone}
                  sub={`${h.product} · ${h.lead_action ?? (h.lead_tier === "hot" ? "Call this week" : "Follow up")}`}
                  right={<span className="c-chip" data-tone={h.lead_tier === "hot" ? "alert" : "gold"}>{h.lead_score}</span>}
                  onOpen={() => setOpen({ email: h.email, prospectId: h.id, name: h.name, phone: h.phone })} />
              ))}
            </Panel>

            <Panel icon={Handshake} title="Deals closing in 30 days" note="Expected close date set on the deal">
              {d.closing_soon.length === 0 ? <Empty text="No deals with a close date this month. Set one in the customer panel." /> : d.closing_soon.map((c) => (
                <Row key={c.email} name={c.name} phone={c.phone}
                  sub={`${money(c.deal_value, c.deal_currency)} · ${c.probability}% likely · ${c.stage}`}
                  right={<span className="text-[12.5px] text-ink-muted whitespace-nowrap">{day(c.expected_close)}</span>}
                  onOpen={() => setOpen({ email: c.email, name: c.name, phone: c.phone })} />
              ))}
            </Panel>
          </div>
        </div>
      )}

      {open && <CustomerDrawer email={open.email} prospectId={open.prospectId} name={open.name} phone={open.phone} company={open.company} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

function Panel({ icon: Icon, title, note, children }: { icon: typeof Target; title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="c-panel">
      <div className="c-panel-head">
        <h3 className="c-panel-title inline-flex items-center gap-2"><Icon className="w-4 h-4 text-ink-muted" />{title}</h3>
        <span className="text-[12px] text-ink-muted hidden sm:inline">{note}</span>
      </div>
      <ul className="divide-y divide-line">{children}</ul>
    </section>
  );
}

function Row({ name, phone, sub, right, onOpen }: { name: string; phone: string | null; sub: string; right?: React.ReactNode; onOpen: () => void }) {
  const tel = telUrl(phone);
  const wa = whatsappUrl(phone);
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <button className="min-w-0 flex-1 text-left" onClick={onOpen}>
        <span className="block text-[14px] font-semibold text-ink truncate hover:underline">{name}</span>
        <span className="block text-[12.5px] text-ink-muted truncate">{sub}</span>
      </button>
      {right}
      <span className="flex gap-1 shrink-0">
        {tel ? <a href={tel} className="c-btn c-btn-ghost" title={`Call ${phone}`} aria-label={`Call ${name}`}><Phone className="w-4 h-4" /></a> : null}
        {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="c-btn c-btn-ghost" title="WhatsApp" aria-label={`WhatsApp ${name}`}><WhatsAppIcon className="w-4 h-4" /></a> : null}
      </span>
    </li>
  );
}

const Empty = ({ text }: { text: string }) => <li className="px-4 py-5 text-[13px] text-ink-muted">{text}</li>;
