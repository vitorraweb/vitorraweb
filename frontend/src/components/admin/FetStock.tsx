"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, Plus, Trash2, X } from "lucide-react";
import { apiAdmin, downloadFile } from "@/lib/auth";
import { Empty } from "@/components/admin/admin-ui";

/**
 * Finance's FET stock overview (Accounting → Stock): devices on hand per model,
 * a week-by-week roll-up (Monday–Sunday), and the movements behind it. Stock is
 * always worked out from the movements on the server, never typed in.
 */

type Model = { code: string; label: string; on_hand: number; price_ugx: number | null; value_ugx: number | null };
type WeekModel = { opening: number; received: number; sold: number; returned: number; adjusted: number; closing: number };
type Week = { start: string; end: string; models: Record<string, WeekModel> };
type Movement = { id: number; model: string; type: string; quantity: number; moved_on: string; reference: string | null; picked_by: string | null; note: string | null; created_by: string | null };

const TYPE_LABEL: Record<string, string> = { received: "Received", sold: "Sold / installed", returned: "Returned", adjustment: "Stock-count correction" };
const TYPE_TONE: Record<string, string> = { received: "ok", sold: "blue", returned: "violet", adjustment: "gold" };

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

export function Stock({ canApprove }: { canApprove: boolean }) {
  const [models, setModels] = useState<Model[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [span, setSpan] = useState(8);
  const [focus, setFocus] = useState(""); // "" = all models side by side
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ model: "FI", type: "received", quantity: "", moved_on: today(), reference: "", picked_by: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiAdmin<{ models: Model[]; weeks: Week[]; movements: Movement[] }>(`/admin/accounting/stock?weeks=${span}`);
      setModels(r.models); setWeeks(r.weeks); setMovements(r.movements);
    } catch { setModels([]); setWeeks([]); setMovements([]); } finally { setLoading(false); }
  }, [span]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setMsg("");
    if (!form.quantity || Number(form.quantity) === 0) { setMsg("Enter how many devices."); return; }
    if (form.type === "sold" && !form.picked_by.trim()) { setMsg("Enter the name of the person who picked up the devices."); return; }
    setSaving(true);
    try {
      await apiAdmin("/admin/accounting/stock", { method: "POST", body: JSON.stringify({ ...form, quantity: Number(form.quantity) }) });
      setForm({ ...form, quantity: "", reference: "", picked_by: "", note: "" });
      setMsg("Recorded.");
      load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not record that."); } finally { setSaving(false); }
  };

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
          <button onClick={() => { setAdding(!adding); setMsg(""); }} className="c-btn c-btn-primary">{adding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{adding ? "Close" : "Record movement"}</button>
        </div>
      </div>

      {adding && (
        <div className="c-panel p-4 mb-4">
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
            <input value={form.picked_by} onChange={(e) => setForm({ ...form, picked_by: e.target.value })} placeholder={form.type === "sold" ? "Picked up by (name, required)" : form.type === "received" ? "Received by (optional)" : "Picked up by (optional)"} className="c-input w-full sm:col-span-2" aria-label="Picked up by" />
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={isAdjust ? "Reason (required, e.g. stock count 24 Oct)" : "Note (optional)"} className="c-input w-full sm:col-span-2" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={save} disabled={saving} className="c-btn c-btn-primary">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save</button>
            <p className="text-xs text-ink-muted">{isAdjust ? "Use after a physical count: + if more devices were found than the book says, − if fewer." : "Sold also covers devices fitted to a customer's vehicle."}</p>
          </div>
          {msg && <p className="text-sm mt-2" style={{ color: msg === "Recorded." ? "var(--color-ok-ink)" : "var(--color-alert-ink)" }}>{msg}</p>}
        </div>
      )}

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
            <thead><tr><th>Date</th><th>Model</th><th>Movement</th><th className="text-right">Qty</th><th>Picked up by</th><th>Reference</th><th>Note</th><th>Recorded by</th>{canApprove && <th />}</tr></thead>
            <tbody>
              {movements.filter((m) => !focus || m.model === focus).map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap">{new Date(`${m.moved_on}T00:00:00`).toLocaleDateString("en-GB")}</td>
                  <td className="whitespace-nowrap">{label(m.model)}</td>
                  <td><span className="c-chip" data-tone={TYPE_TONE[m.type]}>{TYPE_LABEL[m.type] ?? m.type}</span></td>
                  <td className="text-right tabular-nums font-semibold text-ink">{signed(m.quantity)}</td>
                  <td className="whitespace-nowrap">{m.picked_by ?? "–"}</td>
                  <td>{m.reference ?? "–"}</td>
                  <td className="max-w-[240px] truncate" title={m.note ?? undefined}>{m.note ?? "–"}</td>
                  <td className="whitespace-nowrap">{m.created_by ?? "–"}</td>
                  {canApprove && <td className="text-right"><button onClick={() => remove(m)} className="c-btn c-btn-ghost" title="Remove entry" aria-label="Remove entry"><Trash2 className="w-3.5 h-3.5" /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!canApprove && <p className="text-xs text-ink-muted mt-3">A mistaken entry can only be removed by a senior finance officer. Ask them, or record a correction.</p>}
    </div>
  );
}
