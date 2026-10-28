"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search, UserPlus, ArrowRightLeft, Trash2, X, Pencil } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";
import { PRODUCTS, TIERS, pretty, tierOf, type Market } from "@/components/admin/marketing/shared";

/* ─── Marketing → Markets ─────────────────────────────────────────────────────
   Named audiences the team sends to again and again. A contact can belong to
   several; moving takes them out of one market and into another.        */

type Member = {
  id: number; name: string; email: string | null; phone: string | null; product: string; category: string;
  outreach_status: string; lead_score: number | null; lead_tier: string | null; lead_reasons: string[] | null; unsubscribed_at: string | null;
};
type Page<T> = { data: T[]; total: number; current_page: number; last_page: number };

const COLORS = ["#1F64A8", "#17785C", "#B4531F", "#5B44A6", "#A8406E", "#7A6020", "#0E7272", "#4D545E"];

const CATEGORIES: Record<string, string[]> = {
  FET: ["CARGO", "DISTRIBUTOR", "CONSTRUCTION", "MANUFACTURING", "PUBLIC_TRANSPORT", "SCHOOL", "FARMER", "SPARE_PARTS", "CAR_BOND", "FUNERAL"],
  SEAL: ["HOSPITAL", "PHARMACY", "FIRST_RESPONDER", "MANUFACTURING", "MINING_QUARRY", "SPORTS_ASSOCIATION", "BODA_BODA", "BIKER_ASSOCIATION", "TRAVEL_COMPANY"],
  COFFEE: ["GO4WORLD", "CAFE_RESTAURANT", "HOTEL", "SUPERMARKET", "CORPORATE_OFFICE", "DISTRIBUTOR", "EXPORT_BUYER", "INDIVIDUAL"],
};

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [editing, setEditing] = useState<Market | "new" | null>(null);

  const load = useCallback(async () => {
    const r = await apiAdmin<{ data: Market[] }>("/admin/marketing/markets");
    setMarkets(r.data);
    setActive((a) => a ?? r.data[0]?.id ?? null);
  }, []);
  useEffect(() => { load().catch(() => setMarkets([])); }, [load]);

  const current = markets?.find((m) => m.id === active) ?? null;

  return (
    <div className="pb-12">
      <PageHeader title="Markets" subtitle="The audiences you send campaigns to. Add contacts, move them between markets, or create new ones."
        actions={<button className="c-btn c-btn-primary" onClick={() => setEditing("new")}><Plus className="w-4 h-4" />New market</button>} />

      {markets === null ? (
        <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
      ) : markets.length === 0 ? (
        <div className="c-panel px-4 py-10 text-center">
          <p className="text-[15px] text-ink">No markets yet.</p>
          <p className="text-[14px] text-ink-muted mt-1">For example “Kampala fleet operators”, “Hospitals” or “Coffee export buyers”.</p>
          <button className="c-btn c-btn-primary mt-3" onClick={() => setEditing("new")}><Plus className="w-4 h-4" />Create a market</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[20rem_minmax(0,1fr)] gap-4 items-start">
          <ul className="c-panel divide-y divide-line">
            {markets.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setActive(m.id)} className={`w-full text-left px-4 py-3 transition-colors ${m.id === active ? "bg-paper-deep" : "hover:bg-paper-deep"}`}>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color ?? "#C7CCD3" }} />
                    <span className="text-[14.5px] font-semibold text-ink truncate">{m.name}</span>
                    {m.product && <span className="c-chip ml-auto" data-plain>{m.product}</span>}
                  </span>
                  <span className="block text-[13px] text-ink-muted mt-1">{m.members} contacts · {m.emailable} reachable by email</span>
                  <TierBar tiers={m.tiers} total={m.members} />
                </button>
              </li>
            ))}
          </ul>
          {current && <Members key={current.id} market={current} markets={markets} onChanged={load} onEdit={() => setEditing(current)} />}
        </div>
      )}

      {editing && <MarketForm market={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={(id) => { setEditing(null); setActive(id); load(); }} onDeleted={() => { setEditing(null); setActive(null); load(); }} />}
    </div>
  );
}

function TierBar({ tiers, total }: { tiers: Record<string, number>; total: number }) {
  if (!total) return null;
  const order = ["hot", "warm", "cold", "avoid", "do_not_contact", "customer", "unscored"];
  const color: Record<string, string> = { hot: "var(--o-danger)", warm: "var(--o-warning)", cold: "var(--o-info)", avoid: "var(--o-line-strong)", do_not_contact: "var(--o-line-strong)", customer: "var(--o-success)", unscored: "var(--o-line)" };
  return (
    <span className="flex h-1.5 mt-2 rounded-full overflow-hidden gap-px" title={order.filter((k) => tiers[k]).map((k) => `${tierOf(k)?.label ?? "Not scored"}: ${tiers[k]}`).join(" · ")}>
      {order.filter((k) => tiers[k]).map((k) => <span key={k} style={{ width: `${(tiers[k] / total) * 100}%`, background: color[k] }} />)}
    </span>
  );
}

function Members({ market, markets, onChanged, onEdit }: { market: Market; markets: Market[]; onChanged: () => void; onEdit: () => void }) {
  const [page, setPage] = useState<Page<Member> | null>(null);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [p, setP] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [moveTo, setMoveTo] = useState("");
  const [adding, setAdding] = useState<"new" | "existing" | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(p), ...(q ? { q } : {}), ...(tier ? { tier } : {}) });
    setPage(await apiAdmin<Page<Member>>(`/admin/marketing/markets/${market.id}/members?${qs}`));
  }, [market.id, p, q, tier]);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const act = async (path: string, body: unknown) => {
    const r = await apiAdmin<{ message: string }>(`/admin/marketing/markets/${market.id}/${path}`, { method: "POST", body: JSON.stringify(body) });
    setMsg(r.message); setSelected([]); setMoveTo(""); load(); onChanged();
  };

  const all = page?.data ?? [];
  const allOn = all.length > 0 && all.every((m) => selected.includes(m.id));

  return (
    <section className="c-panel overflow-hidden">
      <div className="c-panel-head flex-wrap">
        <div>
          <h3 className="text-[16px] font-semibold text-ink flex items-center gap-2">{market.name}<button className="c-btn c-btn-ghost h-7 px-1.5" onClick={onEdit} aria-label="Edit market"><Pencil className="w-3.5 h-3.5" /></button></h3>
          {market.description && <p className="text-[13px] text-ink-muted">{market.description}</p>}
        </div>
        <div className="flex gap-2">
          <button className="c-btn" onClick={() => setAdding("existing")}><Search className="w-4 h-4" />Add from Prospects</button>
          <button className="c-btn c-btn-primary" onClick={() => setAdding("new")}><UserPlus className="w-4 h-4" />New contact</button>
        </div>
      </div>

      <div className="c-toolbar m-3 mb-0">
        <input className="c-input flex-1 min-w-[12rem]" placeholder="Search name or email…" value={q} onChange={(e) => { setQ(e.target.value); setP(1); }} />
        <select className="c-select" value={tier} onChange={(e) => { setTier(e.target.value); setP(1); }} data-active={!!tier}>
          <option value="">All priorities</option>{TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        {selected.length > 0 && (<>
          <span className="text-[14px] text-ink ml-2">{selected.length} selected</span>
          <select className="c-select" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            <option value="">Move to…</option>{markets.filter((m) => m.id !== market.id).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="c-btn" disabled={!moveTo} onClick={() => act("move", { ids: selected, to: Number(moveTo) })}><ArrowRightLeft className="w-4 h-4" />Move</button>
          <button className="c-btn text-alert-ink" onClick={() => act("remove", { ids: selected })}><Trash2 className="w-4 h-4" />Remove from market</button>
        </>)}
      </div>
      {msg && <p className="px-4 pt-2 text-[14px] text-ok-ink">{msg}</p>}

      {!page ? <p className="p-4 flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
        : all.length === 0 ? <div className="p-4"><Empty label={q || tier ? "No contacts match." : "No contacts in this market yet."} /></div> : (
          <div className="overflow-x-auto mt-3">
            <table className="c-table min-w-[760px]">
              <thead><tr>
                <th className="w-8"><input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? [] : all.map((m) => m.id))} aria-label="Select all" /></th>
                <th>Contact</th><th>Industry</th><th>Priority</th><th>Why</th>
              </tr></thead>
              <tbody>
                {all.map((m) => {
                  const t = tierOf(m.lead_tier);
                  return (
                    <tr key={m.id}>
                      <td><input type="checkbox" checked={selected.includes(m.id)} onChange={() => setSelected((s) => s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id])} aria-label={`Select ${m.name}`} /></td>
                      <td><span className="block text-ink font-medium">{m.name}</span><span className="block text-[13px] text-ink-muted">{m.email ?? m.phone ?? "No contact details"}</span></td>
                      <td className="text-ink-muted">{m.product} · {pretty(m.category)}</td>
                      <td>{t ? <span className="c-chip" data-tone={t.tone}>{t.label}{m.lead_score != null && t.key !== "customer" && t.key !== "do_not_contact" ? ` · ${m.lead_score}` : ""}</span> : <span className="text-ink-muted">Not scored</span>}</td>
                      <td className="text-[13px] text-ink-muted max-w-[22rem] truncate" title={(m.lead_reasons ?? []).join(" · ")}>{(m.lead_reasons ?? []).join(" · ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      {page && page.last_page > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-line text-[14px] text-ink-muted">
          <span>{page.total} contacts</span>
          <span className="flex items-center gap-2">
            <button className="c-btn" disabled={p <= 1} onClick={() => setP(p - 1)}>Previous</button>Page {page.current_page} of {page.last_page}
            <button className="c-btn" disabled={p >= page.last_page} onClick={() => setP(p + 1)}>Next</button>
          </span>
        </div>
      )}

      {adding === "new" && <NewContact market={market} onClose={() => setAdding(null)} onDone={(m) => { setAdding(null); setMsg(m); load(); onChanged(); }} />}
      {adding === "existing" && <AddExisting market={market} onClose={() => setAdding(null)} onDone={(m) => { setAdding(null); setMsg(m); load(); onChanged(); }} />}
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-paper rounded-md w-full max-w-[560px] max-h-[86vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="c-panel-head"><span className="c-panel-title">{title}</span><button className="c-btn c-btn-ghost" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button></div>
        <div className="p-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function NewContact({ market, onClose, onDone }: { market: Market; onClose: () => void; onDone: (msg: string) => void }) {
  const [product, setProduct] = useState(market.product ?? "FET");
  const [f, setF] = useState({ name: "", email: "", phone: "", location: "", category: CATEGORIES[market.product ?? "FET"][0] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    setBusy(true); setErr("");
    try {
      const r = await apiAdmin<{ message: string }>(`/admin/marketing/markets/${market.id}/contacts`, { method: "POST", body: JSON.stringify({ ...f, product, email: f.email || null, phone: f.phone || null }) });
      onDone(r.message);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not add"); setBusy(false); }
  };
  return (
    <Modal title={`New contact in ${market.name}`} onClose={onClose}>
      <Field label="Company or person"><input className="c-input w-full" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email"><input className="c-input w-full" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone"><input className="c-input w-full" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+256…" /></Field>
      </div>
      <Field label="Location"><input className="c-input w-full" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        {!market.product && <Field label="Product"><select className="c-select w-full" value={product} onChange={(e) => { setProduct(e.target.value); setF({ ...f, category: CATEGORIES[e.target.value][0] }); }}>{PRODUCTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>}
        <Field label="Industry"><select className="c-select w-full" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES[product].map((c) => <option key={c} value={c}>{pretty(c)}</option>)}</select></Field>
      </div>
      {err && <p className="text-[13px] text-alert-ink">{err}</p>}
      <div className="flex justify-end gap-2"><button className="c-btn" onClick={onClose}>Cancel</button><button className="c-btn c-btn-primary" disabled={busy || !f.name.trim() || (!f.email && !f.phone)} onClick={save}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}Add to market</button></div>
    </Modal>
  );
}

function AddExisting({ market, onClose, onDone }: { market: Market; onClose: () => void; onDone: (msg: string) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Member[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(market.product ? { product: market.product } : {}) });
      apiAdmin<Page<Member>>(`/admin/prospects?${qs}`).then((r) => setRows(r.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, market.product]);
  const add = async () => {
    setBusy(true);
    const r = await apiAdmin<{ message: string }>(`/admin/marketing/markets/${market.id}/members`, { method: "POST", body: JSON.stringify({ ids: picked }) });
    onDone(r.message);
  };
  return (
    <Modal title={`Add prospects to ${market.name}`} onClose={onClose}>
      <input className="c-input w-full" autoFocus placeholder="Search prospects by name, email or location…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="border border-line rounded-md divide-y divide-line max-h-[50vh] overflow-y-auto">
        {rows.map((r) => (
          <li key={r.id}><label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-paper-deep">
            <input type="checkbox" checked={picked.includes(r.id)} onChange={() => setPicked((p) => p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p, r.id])} />
            <span className="flex-1 min-w-0"><span className="block text-[14px] text-ink truncate">{r.name}</span><span className="block text-[13px] text-ink-muted truncate">{r.product} · {pretty(r.category)} · {r.email ?? "no email"}</span></span>
          </label></li>
        ))}
        {rows.length === 0 && <li className="px-3 py-4 text-[14px] text-ink-muted">No prospects found.</li>}
      </ul>
      <p className="text-[13px] text-ink-muted">To add a whole filtered list at once, filter it on the Prospects screen and choose “Add to market”.</p>
      <div className="flex justify-end gap-2"><button className="c-btn" onClick={onClose}>Cancel</button><button className="c-btn c-btn-primary" disabled={busy || picked.length === 0} onClick={add}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}Add {picked.length || ""}</button></div>
    </Modal>
  );
}

function MarketForm({ market, onClose, onSaved, onDeleted }: { market: Market | null; onClose: () => void; onSaved: (id: number) => void; onDeleted: () => void }) {
  const [f, setF] = useState({ name: market?.name ?? "", description: market?.description ?? "", product: market?.product ?? "", color: market?.color ?? COLORS[0] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    setBusy(true); setErr("");
    try {
      const body = JSON.stringify({ ...f, product: f.product || null, description: f.description || null });
      const r = market
        ? await apiAdmin<{ data: Market }>(`/admin/marketing/markets/${market.id}`, { method: "PATCH", body })
        : await apiAdmin<{ data: Market }>("/admin/marketing/markets", { method: "POST", body });
      onSaved(r.data.id);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not save"); setBusy(false); }
  };
  const remove = async () => {
    if (!market || !window.confirm(`Delete the market "${market.name}"? The contacts stay in Prospects.`)) return;
    await apiAdmin(`/admin/marketing/markets/${market.id}`, { method: "DELETE" });
    onDeleted();
  };
  return (
    <Modal title={market ? "Edit market" : "New market"} onClose={onClose}>
      <Field label="Name"><input className="c-input w-full" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Kampala fleet operators" /></Field>
      <Field label="Description (optional)"><input className="c-input w-full" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Product (optional)"><select className="c-select w-full" value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })}><option value="">Any</option>{PRODUCTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      <Field label="Colour"><div className="flex gap-2">{COLORS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => setF({ ...f, color: c })} className="w-7 h-7 rounded-full" style={{ background: c, outline: f.color === c ? "2px solid var(--o-text)" : undefined, outlineOffset: 2 }} />)}</div></Field>
      {err && <p className="text-[13px] text-alert-ink">{err}</p>}
      <div className="flex justify-between gap-2">
        {market ? <button className="c-btn text-alert-ink" onClick={remove}><Trash2 className="w-4 h-4" />Delete market</button> : <span />}
        <span className="flex gap-2"><button className="c-btn" onClick={onClose}>Cancel</button><button className="c-btn c-btn-primary" disabled={busy || !f.name.trim()} onClick={save}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}Save</button></span>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[13px] text-ink-muted mb-1">{label}</span>{children}</label>;
}
