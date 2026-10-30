"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiAdmin, downloadFile } from "@/lib/auth";
import { Empty } from "@/components/admin/admin-ui";

/**
 * Finance's FET stock overview (Accounting → Stock): devices on hand per model,
 * where they are kept (the Operations office is the main store), a week-by-week
 * roll-up (Monday–Sunday), and the movements behind it. Stock is always worked
 * out from the movements on the server, never typed in. Finance can correct any
 * entry; only senior finance can remove one.
 */

type Model = { code: string; label: string; on_hand: number; price_ugx: number | null; value_ugx: number | null };
type WeekModel = { opening: number; received: number; sold: number; returned: number; adjusted: number; closing: number };
type Week = { start: string; end: string; models: Record<string, WeekModel> };
type Movement = { id: number; model: string; type: string; quantity: number; moved_on: string; reference: string | null; picked_by: string | null; holder: string; to_holder: string | null; note: string | null; created_by: string | null };
type Holder = { holder: string; main: boolean; models: Record<string, number>; total: number; last_moved_on: string | null };

const TYPE_LABEL: Record<string, string> = { received: "Received", sold: "Sold / installed", returned: "Returned", transfer: "Handed over", adjustment: "Stock-count correction" };
const TYPE_TONE: Record<string, string> = { received: "ok", sold: "blue", returned: "violet", transfer: "muted", adjustment: "gold" };
/** What the "who has them" field means for each kind of entry. */
const HOLDER_LABEL: Record<string, string> = { received: "Received by — where they are kept", returned: "Returned to — where they are kept", sold: "Taken from", adjustment: "Counted at", transfer: "Handed over by" };

const blankForm = () => ({ model: "FI", type: "received", quantity: "", moved_on: today(), reference: "", picked_by: "", holder: "", to_holder: "", note: "" });

const today = () => new Date().toISOString().slice(0, 10);
const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const ugx = (n: number) => `UGX ${n.toLocaleString()}`;
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** That week's devices-out sheet, ready to print and sign. */
function WeekPdf({ start }: { start: string }) {
  const [busy, setBusy] = useState(false);
  const get = async () => {
    setBusy(true);
    try { await downloadFile(`/admin/accounting/stock/week-pdf?week=${start}`, `vitorra-fet-devices-out-${start}.pdf`); }
    catch (e) { alert(e instanceof Error ? e.message : "Could not create the PDF."); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={get} disabled={busy} className="c-btn c-btn-ghost !h-7 !px-2" title="Devices out this week, printable PDF">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}PDF
    </button>
  );
}

/** Where every device is right now, printable for each holder to sign. */
function HoldersPdf() {
  const [busy, setBusy] = useState(false);
  const get = async () => {
    setBusy(true);
    try { await downloadFile("/admin/accounting/stock/holders-pdf", `vitorra-fet-where-kept-${today()}.pdf`); }
    catch (e) { alert(e instanceof Error ? e.message : "Could not create the PDF."); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={get} disabled={busy} className="c-btn">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}Summary PDF
    </button>
  );
}

export function Stock({ canApprove }: { canApprove: boolean }) {
  const [models, setModels] = useState<Model[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [holderNames, setHolderNames] = useState<string[]>([]);
  const [mainHolder, setMainHolder] = useState("Operations office");
  const [editing, setEditing] = useState<number | null>(null);
  const [span, setSpan] = useState(8);
  const [focus, setFocus] = useState(""); // "" = all models side by side
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(blankForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiAdmin<{ models: Model[]; weeks: Week[]; movements: Movement[]; holders: Holder[]; holder_names: string[]; main_holder: string }>(`/admin/accounting/stock?weeks=${span}`);
      setModels(r.models); setWeeks(r.weeks); setMovements(r.movements);
      setHolders(r.holders ?? []); setHolderNames(r.holder_names ?? []); if (r.main_holder) setMainHolder(r.main_holder);
    } catch { setModels([]); setWeeks([]); setMovements([]); setHolders([]); } finally { setLoading(false); }
  }, [span]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setMsg("");
    if (!form.quantity || Number(form.quantity) === 0) { setMsg("Enter how many devices."); return; }
    if (form.type === "sold" && !form.picked_by.trim()) { setMsg("Enter the name of the person who picked up the devices."); return; }
    if (form.type === "transfer" && !form.to_holder.trim()) { setMsg("Enter the person or office the devices were handed to."); return; }
    setSaving(true);
    try {
      const body = JSON.stringify({ ...form, quantity: Number(form.quantity), picked_by: form.type === "sold" ? form.picked_by : null, to_holder: form.type === "transfer" ? form.to_holder : null });
      if (editing) await apiAdmin(`/admin/accounting/stock/${editing}`, { method: "PATCH", body });
      else await apiAdmin("/admin/accounting/stock", { method: "POST", body });
      setForm(editing ? blankForm() : { ...form, quantity: "", reference: "", picked_by: "", to_holder: "", note: "" });
      setMsg(editing ? "Corrected." : "Recorded.");
      if (editing) { setEditing(null); setAdding(false); }
      load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save that."); } finally { setSaving(false); }
  };

  const edit = (m: Movement) => {
    setEditing(m.id); setAdding(true); setMsg("");
    setForm({
      model: m.model, type: m.type, quantity: String(m.type === "adjustment" ? m.quantity : Math.abs(m.quantity)), moved_on: m.moved_on,
      reference: m.reference ?? "", picked_by: m.picked_by ?? "", holder: m.holder === mainHolder ? "" : m.holder, to_holder: m.to_holder ?? "", note: m.note ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeForm = () => { setAdding(false); setEditing(null); setForm(blankForm()); setMsg(""); };

  const remove = async (m: Movement) => {
    if (!confirm(`Remove this entry (${TYPE_LABEL[m.type]} ${Math.abs(m.quantity)} × ${label(m.model)} on ${day(m.moved_on)})? Every week after it is recalculated.`)) return;
    try { await apiAdmin(`/admin/accounting/stock/${m.id}`, { method: "DELETE" }); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "Could not remove that entry."); }
  };

  const label = (code: string) => models.find((m) => m.code === code)?.label ?? code;
  const totalUnits = models.reduce((a, m) => a + m.on_hand, 0);
  const totalValue = models.reduce((a, m) => a + (m.value_ugx ?? 0), 0);
  const isAdjust = form.type === "adjustment";

  if (loading && models.length === 0) return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div>
      {/* On hand now, per model */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {models.map((m) => (
          <button key={m.code} onClick={() => setFocus(focus === m.code ? "" : m.code)} className="c-panel p-4 text-left transition-colors" style={focus === m.code ? { borderColor: "var(--color-gold)" } : undefined}>
            <p className="c-panel-title mb-2">{m.label}</p>
            <p className="text-2xl tabular-nums text-ink" style={{ color: m.on_hand < 0 ? "var(--color-alert-ink)" : undefined }}>{m.on_hand}<span className="text-xs text-ink-muted ml-1">in stock</span></p>
            {m.value_ugx !== null && <p className="text-xs text-ink-muted mt-1 tabular-nums">{ugx(m.value_ugx)} at catalogue price</p>}
          </button>
        ))}
        <div className="c-panel p-4 col-span-2 lg:col-span-1" style={{ background: "var(--color-paper-deep)" }}>
          <p className="c-panel-title mb-2">All FET</p>
          <p className="text-2xl tabular-nums text-ink">{totalUnits}<span className="text-xs text-ink-muted ml-1">devices</span></p>
          <p className="text-xs text-ink-muted mt-1 tabular-nums">{ugx(totalValue)} at catalogue price</p>
        </div>
      </div>

      {/* Where the devices are kept */}
      <div className="c-panel mb-5 overflow-x-auto">
        <div className="c-panel-head"><span className="c-panel-title">Where the devices are kept</span><HoldersPdf /></div>
        <table className="c-table">
          <thead><tr><th>Kept by / at</th>{models.map((m) => <th key={m.code} className="text-right">{m.label}</th>)}<th className="text-right">Total</th><th>Last movement</th></tr></thead>
          <tbody>
            {holders.map((h) => (
              <tr key={h.holder}>
                <td className="whitespace-nowrap">
                  <span className={h.main ? "font-semibold text-ink" : undefined}>{h.holder}</span>
                  {h.main && <span className="c-chip ml-2" data-tone="gold">Main store</span>}
                </td>
                {models.map((m) => {
                  const n = h.models[m.code] ?? 0;
                  return <td key={m.code} className="text-right tabular-nums" style={n < 0 ? { color: "var(--color-alert-ink)" } : undefined}>{n || "–"}</td>;
                })}
                <td className="text-right tabular-nums font-semibold text-ink">{h.total}</td>
                <td className="whitespace-nowrap">{h.last_moved_on ? new Date(`${h.last_moved_on}T00:00:00`).toLocaleDateString("en-GB") : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-ink-muted px-4 py-2">
          Devices stay with the <b>{mainHolder}</b> unless an entry says otherwise. A delivery goes to whoever is entered as <b>Received by</b>; use <b>Handed over</b> when devices move from one person or office to another.
          {holders.some((h) => Object.values(h.models).some((n) => n < 0)) && <span style={{ color: "var(--color-alert-ink)" }}> A figure in red is below zero: devices were recorded leaving that holder before reaching them. Correct the entry below.</span>}
        </p>
      </div>

      <div className="c-toolbar">
        <select value={focus} onChange={(e) => setFocus(e.target.value)} className="c-select" data-active={focus !== ""} aria-label="Model">
          <option value="">All models</option>
          {models.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
        </select>
        <select value={span} onChange={(e) => setSpan(Number(e.target.value))} className="c-select" aria-label="Weeks shown">
          {[4, 8, 13, 26, 52].map((n) => <option key={n} value={n}>Last {n} weeks</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => downloadFile(`/admin/accounting/stock/export?weeks=${span}`, `vitorra-fet-stock-${today()}.csv`)} className="c-btn"><Download className="w-3.5 h-3.5" />Export CSV</button>
          <button onClick={() => (adding ? closeForm() : (setAdding(true), setMsg("")))} className="c-btn c-btn-primary">{adding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{adding ? "Close" : "Record movement"}</button>
        </div>
      </div>

      {adding && (
        <div className="c-panel p-4 mb-4">
          {editing && <p className="text-sm font-semibold text-ink mb-3">Correcting an entry — every week after it is recalculated, and the change is kept in the activity log.</p>}
          <datalist id="fet-holders">{holderNames.map((n) => <option key={n} value={n} />)}</datalist>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="c-select w-full" aria-label="Model">
              {models.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="c-select w-full" aria-label="Movement">
              {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder={isAdjust ? "± devices (e.g. -2)" : "How many devices"} min={isAdjust ? undefined : 1} className="c-input w-full" />
            <input type="date" value={form.moved_on} max={today()} onChange={(e) => setForm({ ...form, moved_on: e.target.value })} className="c-input w-full" aria-label="Date" />
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder={form.type === "received" ? "Delivery note / shipment" : form.type === "sold" ? "Invoice no. or customer" : "Reference (optional)"} className="c-input w-full sm:col-span-2" />
            <label className="sm:col-span-2 block">
              <span className="block text-[11px] text-ink-muted mb-1">{HOLDER_LABEL[form.type]}</span>
              <input list="fet-holders" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} placeholder={mainHolder} className="c-input w-full" />
            </label>
            {form.type === "transfer" && (
              <label className="sm:col-span-2 block">
                <span className="block text-[11px] text-ink-muted mb-1">Handed to — where they are kept now</span>
                <input list="fet-holders" value={form.to_holder} onChange={(e) => setForm({ ...form, to_holder: e.target.value })} placeholder="Person or office (required)" className="c-input w-full" />
              </label>
            )}
            {form.type === "sold" && (
              <label className="sm:col-span-2 block">
                <span className="block text-[11px] text-ink-muted mb-1">Picked up by</span>
                <input value={form.picked_by} onChange={(e) => setForm({ ...form, picked_by: e.target.value })} placeholder="Name (required)" className="c-input w-full" />
              </label>
            )}
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={isAdjust ? "Reason (required, e.g. stock count 24 Oct)" : "Note (optional)"} className="c-input w-full sm:col-span-2" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={save} disabled={saving} className="c-btn c-btn-primary">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{editing ? "Save correction" : "Save"}</button>
            {editing && <button onClick={closeForm} className="c-btn c-btn-ghost">Cancel</button>}
            <p className="text-xs text-ink-muted">{isAdjust ? "Use after a physical count: + if more devices were found than the book says, − if fewer." : form.type === "transfer" ? "Devices stay in company stock; only who holds them changes." : "Leave the holder blank for the main store. Sold also covers devices fitted to a customer's vehicle."}</p>
          </div>
          {msg && <p className="text-sm mt-2" style={{ color: msg === "Recorded." || msg === "Corrected." ? "var(--color-ok-ink)" : "var(--color-alert-ink)" }}>{msg}</p>}
        </div>
      )}

      {!adding && msg === "Corrected." && <p className="text-sm mb-3" style={{ color: "var(--color-ok-ink)" }}>Corrected.</p>}

      {/* Week by week */}
      <div className="c-panel mb-5 overflow-x-auto">
        <div className="c-panel-head"><span className="c-panel-title">Stock per week{focus ? ` · ${label(focus)}` : ""}</span><span className="text-xs text-ink-muted">Weeks run Monday to Sunday</span></div>
        {focus ? (
          <table className="c-table">
            <thead><tr><th>Week</th><th className="text-right">Opening</th><th className="text-right">Received</th><th className="text-right">Sold</th><th className="text-right">Returned</th><th className="text-right">Corrected</th><th className="text-right">Closing</th><th /></tr></thead>
            <tbody>
              {weeks.map((w) => {
                const r = w.models[focus];
                return (
                  <tr key={w.start}>
                    <td className="whitespace-nowrap">{day(w.start)} – {day(w.end)}</td>
                    <td className="text-right tabular-nums">{r.opening}</td>
                    <td className="text-right tabular-nums">{r.received || "–"}</td>
                    <td className="text-right tabular-nums">{r.sold || "–"}</td>
                    <td className="text-right tabular-nums">{r.returned || "–"}</td>
                    <td className="text-right tabular-nums">{r.adjusted ? signed(r.adjusted) : "–"}</td>
                    <td className="text-right tabular-nums font-semibold text-ink">{r.closing}</td>
                    <td className="text-right"><WeekPdf start={w.start} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="c-table">
            <thead><tr><th>Week</th>{models.map((m) => <th key={m.code} className="text-right">{m.label}</th>)}<th className="text-right">Total</th><th /></tr></thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.start}>
                  <td className="whitespace-nowrap">{day(w.start)} – {day(w.end)}</td>
                  {models.map((m) => {
                    const r = w.models[m.code];
                    const inn = r.received + r.returned + Math.max(r.adjusted, 0);
                    const out = r.sold + Math.max(-r.adjusted, 0);
                    return (
                      <td key={m.code} className="text-right tabular-nums">
                        <span className="font-semibold text-ink">{r.closing}</span>
                        {(inn > 0 || out > 0) && <span className="block text-[11px] text-ink-muted">{inn > 0 ? `+${inn}` : ""}{inn > 0 && out > 0 ? " " : ""}{out > 0 ? `−${out}` : ""}</span>}
                      </td>
                    );
                  })}
                  <td className="text-right tabular-nums font-semibold text-ink">{Object.values(w.models).reduce((a, r) => a + r.closing, 0)}</td>
                  <td className="text-right"><WeekPdf start={w.start} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-ink-muted px-4 py-2">Figures are closing stock at the end of each week. <b>PDF</b> prints that week&apos;s devices out, with who picked them up, ready to sign. {focus ? "" : "Underneath: devices in (+) and out (−) that week. Pick a model for the full breakdown."}</p>
      </div>

      {/* The entries behind it */}
      <div className="c-panel overflow-x-auto">
        <div className="c-panel-head"><span className="c-panel-title">Movements</span><span className="text-xs text-ink-muted">Latest 100</span></div>
        {movements.filter((m) => !focus || m.model === focus).length === 0 ? <div className="p-4"><Empty label="No stock movements recorded yet. Start with the devices currently on the shelf, as Received." /></div> : (
          <table className="c-table">
            <thead><tr><th>Date</th><th>Model</th><th>Movement</th><th className="text-right">Qty</th><th>Kept by / taken from</th><th>Picked up by</th><th>Reference</th><th>Note</th><th>Recorded by</th><th /></tr></thead>
            <tbody>
              {movements.filter((m) => !focus || m.model === focus).map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap">{new Date(`${m.moved_on}T00:00:00`).toLocaleDateString("en-GB")}</td>
                  <td className="whitespace-nowrap">{label(m.model)}</td>
                  <td><span className="c-chip" data-tone={TYPE_TONE[m.type]}>{TYPE_LABEL[m.type] ?? m.type}</span></td>
                  <td className="text-right tabular-nums font-semibold text-ink">{m.type === "transfer" ? m.quantity : signed(m.quantity)}</td>
                  <td className="whitespace-nowrap">{m.type === "transfer" ? <>{m.holder} → <b>{m.to_holder ?? "?"}</b></> : m.holder}</td>
                  <td className="whitespace-nowrap">{m.picked_by ?? "–"}</td>
                  <td>{m.reference ?? "–"}</td>
                  <td className="max-w-[240px] truncate" title={m.note ?? undefined}>{m.note ?? "–"}</td>
                  <td className="whitespace-nowrap">{m.created_by ?? "–"}</td>
                  <td className="text-right whitespace-nowrap">
                    <button onClick={() => edit(m)} className="c-btn c-btn-ghost" title="Correct entry" aria-label="Correct entry"><Pencil className="w-3.5 h-3.5" /></button>
                    {canApprove && <button onClick={() => remove(m)} className="c-btn c-btn-ghost" title="Remove entry" aria-label="Remove entry"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!canApprove && <p className="text-xs text-ink-muted mt-3">Use the pencil to correct an entry. Removing one altogether is for a senior finance officer.</p>}
    </div>
  );
}
