"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Send, Users, X } from "lucide-react";
import { apiAdmin, auth } from "@/lib/auth";

/* ─── Sending a quotation or invoice ──────────────────────────────────────────
   Sending used to be one click straight to the customer, and unfinished
   drafts went out. Now "Send…" opens this window: the sender ticks exactly
   who gets it (the customer, other client contacts on record, colleagues for
   review), and a customer send needs a "this is final" tick. The server
   enforces the same rules (DocumentRecipients).                              */

export type Client = { email: string; name: string; company: string | null; phone: string | null; address: string | null; source: string };
type TeamMember = { id: number; name: string; email: string; department: string | null; job_title: string | null };

const RECIPIENTS = "/admin/accounting/documents/recipients";

/** Live search over clients already in the system (prospects, customers, enquiries). */
function useClientSearch(q: string) {
  const [hits, setHits] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      setSearching(true);
      apiAdmin<{ clients: Client[] }>(`${RECIPIENTS}?q=${encodeURIComponent(term)}`)
        .then((r) => { if (live) setHits(r.clients); })
        .catch(() => { if (live) setHits([]); })
        .finally(() => { if (live) setSearching(false); });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);
  return { hits: q.trim().length < 2 ? [] : hits, searching };
}

function ClientResults({ hits, searching, q, onPick, exclude = [] }: { hits: Client[]; searching: boolean; q: string; onPick: (c: Client) => void; exclude?: string[] }) {
  if (q.trim().length < 2) return null;
  const list = hits.filter((h) => !exclude.includes(h.email.toLowerCase()));
  return (
    <div className="absolute z-20 left-0 right-0 mt-1 bg-paper border border-line rounded-edge shadow-lg max-h-64 overflow-y-auto">
      {searching && list.length === 0 && <p className="px-3 py-2 text-[12.5px] text-ink-muted flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Searching…</p>}
      {!searching && list.length === 0 && <p className="px-3 py-2 text-[12.5px] text-ink-muted">No client with that name or email in the system.</p>}
      {list.map((c) => (
        <button key={c.email} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(c)} className="w-full text-left px-3 py-2 hover:bg-paper-deep border-b border-line last:border-0">
          <span className="block text-[13px] text-ink">{c.company && c.company !== c.name ? `${c.company} · ${c.name}` : c.name}</span>
          <span className="block text-[11.5px] text-ink-muted">{c.email} · {c.source}</span>
        </button>
      ))}
    </div>
  );
}

/** "Find a customer" box for the editor: fills the customer details from the system. */
export function ClientFinder({ onPick }: { onPick: (c: Client) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { hits, searching } = useClientSearch(q);
  return (
    <div className="relative w-64 max-w-full">
      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
      <input className="c-input w-full !pl-7" placeholder="Find customer in the system…" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} />
      {open && <ClientResults hits={hits} searching={searching} q={q} onPick={(c) => { onPick(c); setQ(""); setOpen(false); }} />}
    </div>
  );
}

export function SendDocumentDialog({
  endpoint, docLabel, docNumber, customer, onClose, onSent,
}: {
  endpoint: string;            // e.g. /admin/accounting/quotations/12/send
  docLabel: string;            // "Quotation", "Invoice"…
  docNumber: string;
  customer: { name: string; email: string };
  onClose: () => void;
  onSent: (data: Record<string, unknown> | undefined, summary: string) => void;
}) {
  const me = auth.getUser();
  const customerEmail = customer.email.trim().toLowerCase();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [toCustomer, setToCustomer] = useState(false);      // deliberately off: the sender opts in
  const [extraClients, setExtraClients] = useState<Client[]>([]);
  const [picked, setPicked] = useState<string[]>([]);       // team emails
  const [teamFilter, setTeamFilter] = useState("");
  const [clientQ, setClientQ] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [note, setNote] = useState("");
  const [final, setFinal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const { hits, searching } = useClientSearch(clientQ);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    apiAdmin<{ team: TeamMember[] }>(RECIPIENTS).then((r) => setTeam(r.team)).catch(() => setTeam([])).finally(() => setLoadingTeam(false));
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const clientEmails = [...(toCustomer && customerEmail ? [customerEmail] : []), ...extraClients.map((c) => c.email.toLowerCase())];
  const goesToClient = clientEmails.length > 0;
  const total = clientEmails.length + picked.length;

  const shownTeam = useMemo(() => {
    const f = teamFilter.trim().toLowerCase();
    return f ? team.filter((t) => `${t.name} ${t.email} ${t.department ?? ""} ${t.job_title ?? ""}`.toLowerCase().includes(f)) : team;
  }, [team, teamFilter]);

  const toggleTeam = (email: string) => setPicked((p) => (p.includes(email) ? p.filter((e) => e !== email) : [...p, email]));

  const submit = async () => {
    setError("");
    if (total === 0) { setError("Tick at least one person."); return; }
    if (goesToClient && !final) { setError("Confirm the document is final before it goes to the customer."); return; }
    setSending(true);
    try {
      const r = await apiAdmin<{ data?: Record<string, unknown> }>(endpoint, {
        method: "POST",
        body: JSON.stringify({ to: [...clientEmails, ...picked], note: note.trim() || undefined }),
      });
      const parts = [
        goesToClient ? `the customer (${clientEmails.join(", ")})` : "",
        picked.length ? `${picked.length} colleague${picked.length > 1 ? "s" : ""}${goesToClient ? "" : " for review"}` : "",
      ].filter(Boolean);
      onSent(r.data, `${docNumber} emailed to ${parts.join(" and ")}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[8vh] pb-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Send ${docLabel.toLowerCase()} ${docNumber}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl c-panel shadow-2xl">
        <div className="c-panel-head">
          <span className="text-[14px] text-ink font-medium">Send {docLabel.toLowerCase()} {docNumber}</span>
          <button ref={firstRef} onClick={onClose} className="c-btn c-btn-ghost !px-2" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Customer */}
          <section>
            <p className="c-panel-title mb-2">Customer</p>
            {customerEmail ? (
              <label className="flex items-start gap-2.5 p-2.5 border border-line rounded-edge cursor-pointer hover:bg-paper-deep">
                <input type="checkbox" className="mt-0.5" checked={toCustomer} onChange={(e) => setToCustomer(e.target.checked)} />
                <span>
                  <span className="block text-[13px] text-ink">{customer.name || "Customer"}</span>
                  <span className="block text-[12px] text-ink-muted">{customer.email}</span>
                </span>
              </label>
            ) : <p className="text-[12.5px] text-ink-muted">This document has no customer email. Add one on the form and save, or pick a client below.</p>}

            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input className="c-input w-full !pl-7" placeholder="Add another client contact from the system…" value={clientQ}
                onChange={(e) => { setClientQ(e.target.value); setClientOpen(true); }} onFocus={() => setClientOpen(true)} onBlur={() => setClientOpen(false)} />
              {clientOpen && <ClientResults hits={hits} searching={searching} q={clientQ} exclude={[customerEmail, ...extraClients.map((c) => c.email.toLowerCase())]}
                onPick={(c) => { setExtraClients((x) => [...x, c]); setClientQ(""); setClientOpen(false); }} />}
            </div>
            {extraClients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {extraClients.map((c) => (
                  <span key={c.email} className="c-chip" data-tone="gold" data-plain>
                    {c.name} · {c.email}
                    <button type="button" onClick={() => setExtraClients((x) => x.filter((y) => y.email !== c.email))} aria-label={`Remove ${c.email}`}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            {extraClients.length > 0 && customer.name && (
              <p className="text-[12px] text-ink-muted mt-1.5">The document is addressed to <b className="text-ink">{customer.name}</b>. Only add contacts from that client.</p>
            )}
          </section>

          {/* Team */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="c-panel-title flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Vitorra team</p>
              <input className="c-input !h-7 w-40" placeholder="Filter…" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} aria-label="Filter team" />
            </div>
            {loadingTeam ? <p className="text-[12.5px] text-ink-muted flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading the team…</p> : (
              <div className="border border-line rounded-edge max-h-48 overflow-y-auto">
                {shownTeam.map((t) => (
                  <label key={t.id} className="flex items-center gap-2.5 px-2.5 py-1.5 border-b border-line last:border-0 cursor-pointer hover:bg-paper-deep">
                    <input type="checkbox" checked={picked.includes(t.email)} onChange={() => toggleTeam(t.email)} />
                    <span className="flex-1 min-w-0">
                      <span className="text-[13px] text-ink">{t.name}{me?.email === t.email ? " (you)" : ""}</span>
                      <span className="text-[11.5px] text-ink-muted ml-2">{t.job_title || t.department || t.email}</span>
                    </span>
                  </label>
                ))}
                {shownTeam.length === 0 && <p className="px-2.5 py-2 text-[12.5px] text-ink-muted">Nobody matches.</p>}
              </div>
            )}
            <p className="text-[12px] text-ink-muted mt-1.5">Colleagues get a copy marked {goesToClient ? "“Copy”" : "“For review”"}, with the PDF and a link to open it here.</p>
          </section>

          {picked.length > 0 && (
            <section>
              <p className="c-panel-title mb-2">Note to colleagues (optional)</p>
              <textarea rows={2} className="c-input w-full !h-auto py-1.5" placeholder="e.g. Please check the freight line before I send it to the client." value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
            </section>
          )}

          {goesToClient && (
            <label className="flex items-start gap-2.5 p-2.5 rounded-edge border cursor-pointer" style={{ borderColor: "color-mix(in oklab, var(--color-gold) 55%, transparent)", background: "color-mix(in oklab, var(--color-gold) 8%, var(--color-paper))" }}>
              <input type="checkbox" className="mt-0.5" checked={final} onChange={(e) => setFinal(e.target.checked)} />
              <span className="text-[12.5px] text-ink">I have checked the PDF and this {docLabel.toLowerCase()} is final. The customer receives it now and it is marked <b>sent</b>.</span>
            </label>
          )}

          {error && <p className="text-[13px] text-alert-ink">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line">
          <span className="text-[12.5px] text-ink-muted">
            {total === 0 ? "Nobody ticked yet." : goesToClient ? `To the customer${picked.length ? ` + ${picked.length} colleague${picked.length > 1 ? "s" : ""}` : ""}` : `Team only: the customer will not receive it.`}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="c-btn">Cancel</button>
            <button onClick={submit} disabled={sending || total === 0 || (goesToClient && !final)} className="c-btn c-btn-primary">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {goesToClient ? "Send to customer" : `Send for review${picked.length ? ` (${picked.length})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
