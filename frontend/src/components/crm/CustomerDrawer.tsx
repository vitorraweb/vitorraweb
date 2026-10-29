"use client";

import { useEffect, useState } from "react";
import { X, Phone, Mail, Loader2, Save, Check, MessageSquare, ShoppingCart, Megaphone, Inbox, Send, Handshake, StickyNote, MapPin, Users, Trash2 } from "lucide-react";
import { apiAdmin, auth } from "@/lib/auth";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { KINDS, LOST_REASONS, OUTCOMES, PRODUCTS, isoDay, money, telUrl, whatsappUrl } from "./crm";

/* ─── The customer at a glance ────────────────────────────────────────────────
   A side panel used by the pipeline and by Today:
     · one-tap Call / WhatsApp / Email (WhatsApp opens with a greeting),
     · log what happened — call, WhatsApp, visit, meeting — with the outcome
       and the next step; the deal moves forward by itself,
     · the deal: value, product, expected close, why it was lost,
     · everything we know, newest first: enquiries, orders, emails, campaign
       opens and clicks, and the team's own notes.                           */

type Deal = { stage: string; deal_value: number | null; deal_currency: string; deal_product: string | null; expected_close: string | null; lost_reason: string | null; next_action: string | null; next_action_on: string | null; probability: number };
type Event = { type: string; kind?: string; at: string; title: string; body?: string | null; id?: number; by?: string | null; user_id?: number; next_action?: string | null; next_action_on?: string | null; status?: string };

const ICON: Record<string, typeof Phone> = {
  enquiry: MessageSquare, order: ShoppingCart, message: Inbox, email_in: Inbox, email_out: Send, campaign: Megaphone,
  call: Phone, meeting: Handshake, visit: MapPin, email: Mail, note: StickyNote, whatsapp: Users,
};

export function CustomerDrawer({ email, prospectId, name, phone, company, onClose, onChanged }: {
  email: string | null; prospectId?: number | null; name: string; phone?: string | null; company?: string | null;
  onClose: () => void; onChanged?: () => void;
}) {
  const me = auth.getUser();
  const [events, setEvents] = useState<Event[] | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [kind, setKind] = useState("call");
  const [outcome, setOutcome] = useState("");
  const [summary, setSummary] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextOn, setNextOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState("");

  const query = email ? `email=${encodeURIComponent(email)}` : `prospect_id=${prospectId}`;
  // Bumped after a save to reload the history.
  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);
  useEffect(() => {
    let live = true;
    apiAdmin<{ data: Event[]; deal: Deal | null }>(`/admin/crm/timeline?${query}`)
      .then((r) => { if (live) { setEvents(r.data); setDeal(r.deal); } })
      .catch(() => { if (live) setEvents([]); });
    return () => { live = false; };
  }, [query, version]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const first = name.split(/\s+/)[0] || "there";
  const wa = whatsappUrl(phone, `Hello ${first}, this is ${me?.name?.split(/\s+/)[0] ?? "the team"} from Vitorra Holdings. `);
  const tel = telUrl(phone);

  const log = async () => {
    setSaving(true); setError(""); setLogged(false);
    try {
      await apiAdmin("/admin/crm/activities", { method: "POST", body: JSON.stringify({
        email: email || undefined, prospect_id: prospectId || undefined, kind, outcome: outcome || null,
        summary: summary.trim() || null, next_action: nextAction.trim() || null, next_action_on: nextOn || null,
      }) });
      setSummary(""); setOutcome(""); setNextAction(""); setNextOn(""); setLogged(true);
      load(); onChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    await apiAdmin(`/admin/crm/activities/${id}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={name}>
      <button className="absolute inset-0 bg-black/30" onClick={onClose} aria-label="Close" />
      <aside className="relative w-full max-w-[34rem] h-full overflow-y-auto shadow-2xl" style={{ background: "var(--o-canvas)" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 border-b" style={{ background: "var(--o-surface)", borderColor: "var(--o-line)" }}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-semibold text-ink truncate">{name}</h2>
              <p className="text-[13px] text-ink-muted truncate">{[company, email, phone].filter(Boolean).join(" · ") || "No contact details"}</p>
            </div>
            <button className="c-btn c-btn-ghost" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {tel && <a href={tel} className="c-btn" onClick={() => setKind("call")}><Phone className="w-4 h-4" />Call</a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="c-btn" onClick={() => setKind("whatsapp")}><WhatsAppIcon className="w-4 h-4" />WhatsApp</a>}
            {email && <a href={`mailto:${email}`} className="c-btn" onClick={() => setKind("email")}><Mail className="w-4 h-4" />Email</a>}
            {!tel && !wa && <span className="text-[12.5px] text-ink-muted self-center">No phone number on file.</span>}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Log what happened */}
          <section className="c-panel p-4 space-y-3">
            <p className="text-[13px] font-semibold text-ink">Log what happened</p>
            <div className="o-seg flex-wrap">
              {Object.entries(KINDS).map(([k, v]) => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{v}</button>)}
            </div>
            <select className="c-select w-full" value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Outcome">
              <option value="">Outcome (optional)</option>
              {Object.entries(OUTCOMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <textarea className="c-input w-full h-auto py-2" rows={3} placeholder="What did they say? Fleet size, budget, decision maker…" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={5000} />
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-2">
              <input className="c-input w-full" placeholder="Next step, e.g. Send FIII quote" value={nextAction} onChange={(e) => setNextAction(e.target.value)} maxLength={255} />
              <input type="date" className="c-input w-full" value={nextOn} onChange={(e) => setNextOn(e.target.value)} aria-label="Next step date" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[["Tomorrow", 1], ["In 3 days", 3], ["Next week", 7], ["In 2 weeks", 14]].map(([l, n]) => (
                <button key={l} className="c-chip" data-tone={nextOn === isoDay(n as number) ? "gold" : "muted"} data-plain onClick={() => setNextOn(isoDay(n as number))}>{l}</button>
              ))}
            </div>
            {error && <p className="text-[13px] text-alert-ink">{error}</p>}
            <div className="flex items-center gap-2">
              <button className="c-btn c-btn-primary" onClick={log} disabled={saving || (!summary.trim() && !outcome && !nextOn)}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
              </button>
              {logged && <span className="inline-flex items-center gap-1 text-[13px] text-ok-ink"><Check className="w-4 h-4" />Logged</span>}
            </div>
          </section>

          {email && <DealForm email={email} deal={deal} onSaved={(d) => { setDeal(d); onChanged?.(); }} />}

          {/* Timeline */}
          <section>
            <p className="text-[13px] font-semibold text-ink mb-2">History</p>
            {events === null ? <p className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
              : events.length === 0 ? <p className="text-[13px] text-ink-muted">Nothing recorded yet.</p>
              : (
                <ol className="relative border-l pl-4 space-y-3" style={{ borderColor: "var(--o-line-strong)" }}>
                  {events.map((ev, i) => {
                    const Icon = ICON[ev.type === "activity" ? ev.kind ?? "note" : ev.type] ?? StickyNote;
                    return (
                      <li key={`${ev.type}${ev.id ?? i}`} className="relative">
                        <span className="absolute -left-[1.6rem] top-0.5 flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "var(--o-surface)", border: "1px solid var(--o-line-strong)" }}>
                          {ev.kind === "whatsapp" ? <WhatsAppIcon className="w-3 h-3" /> : <Icon className="w-3 h-3 text-ink-muted" />}
                        </span>
                        <p className="text-[13.5px] font-semibold text-ink">{ev.title}</p>
                        <p className="text-[12px] text-ink-muted">
                          {ev.at ? new Date(ev.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                          {ev.by ? ` · ${ev.by}` : ""}{ev.status ? ` · ${ev.status.replace(/_/g, " ")}` : ""}
                        </p>
                        {ev.body && <p className="text-[13px] text-ink-soft whitespace-pre-line mt-0.5">{ev.body}</p>}
                        {ev.next_action_on && <p className="text-[12.5px] mt-0.5" style={{ color: "var(--o-accent-text)" }}>Next: {ev.next_action ?? "Follow up"} · {new Date(`${ev.next_action_on}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>}
                        {ev.type === "activity" && ev.id && (ev.user_id === me?.id || me?.role === "admin") && (
                          <button className="text-[12px] text-ink-muted hover:text-alert-ink inline-flex items-center gap-1 mt-0.5" onClick={() => remove(ev.id!)}><Trash2 className="w-3 h-3" />Remove</button>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function DealForm({ email, deal, onSaved }: { email: string; deal: Deal | null; onSaved: (d: Deal) => void }) {
  const [f, setF] = useState({ value: "", currency: "UGX", product: "", close: "", lost: "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fill the form once the deal arrives (or changes after a save).
  useEffect(() => {
    setF({ value: deal?.deal_value != null ? String(deal.deal_value) : "", currency: deal?.deal_currency ?? "UGX", product: deal?.deal_product ?? "", close: deal?.expected_close ?? "", lost: deal?.lost_reason ?? "" });
  }, [deal]);

  const save = async () => {
    setBusy(true); setSaved(false);
    try {
      const r = await apiAdmin<{ data: Deal }>("/admin/customers/deal", { method: "PUT", body: JSON.stringify({
        email, deal_value: f.value ? Number(f.value.replace(/[^\d]/g, "")) : null, deal_currency: f.currency,
        deal_product: f.product || null, expected_close: f.close || null, lost_reason: f.lost || null,
        next_action: deal?.next_action ?? null, next_action_on: deal?.next_action_on ?? null,
      }) });
      onSaved(r.data); setSaved(true);
    } finally { setBusy(false); }
  };

  const stage = deal?.stage ?? "lead";
  return (
    <section className="c-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">Deal</p>
        <span className="text-[12.5px] text-ink-muted">Stage: <strong className="text-ink capitalize">{stage}</strong> · {deal?.probability ?? 10}% likely</span>
      </div>
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <input className="c-input w-full" inputMode="numeric" placeholder="Value, e.g. 3245000" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} aria-label="Deal value" />
        <select className="c-select" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} aria-label="Currency">{["UGX", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className="c-select w-full" value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })} aria-label="Product">
          <option value="">Product</option>{Object.entries(PRODUCTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="block"><input type="date" className="c-input w-full" value={f.close} onChange={(e) => setF({ ...f, close: e.target.value })} aria-label="Expected close" title="Expected to close" /></label>
      </div>
      {stage === "lost" && (
        <select className="c-select w-full" value={f.lost} onChange={(e) => setF({ ...f, lost: e.target.value })} aria-label="Why lost">
          <option value="">Why was it lost?</option>{Object.entries(LOST_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      )}
      {deal?.next_action_on && <p className="text-[12.5px]" style={{ color: "var(--o-accent-text)" }}>Next step: {deal.next_action ?? "Follow up"} · {new Date(`${deal.next_action_on}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>}
      <div className="flex items-center gap-2">
        <button className="c-btn" onClick={save} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save deal</button>
        {saved && <span className="inline-flex items-center gap-1 text-[13px] text-ok-ink"><Check className="w-4 h-4" />Saved {f.value ? `· ${money(Number(f.value.replace(/[^\d]/g, "")), f.currency)}` : ""}</span>}
      </div>
    </section>
  );
}
