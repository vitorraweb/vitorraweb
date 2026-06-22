"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Gauge, Plus, ChevronDown, Save, Trash2, Fuel, FileDown, X, TrendingDown } from "lucide-react";
import { apiAdmin, downloadFile } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Savings = {
  currency: string;
  baseline_l_per_100: number | null;
  baseline_source: string;
  measured_l_per_100: number | null;
  distance_km: number;
  reduction_pct: number | null;
  litres_saved: number | null;
  money_saved: number | null;
  co2_saved_kg: number | null;
  verified_pct: number;
  after_log_count: number;
  before_log_count: number;
  has_enough_data: boolean;
};
type FuelLog = {
  id: number; logged_on: string; odometer_km: number | null; litres: number;
  cost: number | null; phase: string; source: string; note: string | null;
};
type Install = {
  id: number; reference: string; customer_name: string; company: string | null;
  customer_email: string | null; customer_phone: string | null;
  vehicle: string | null; tier: string; tier_label: string; device_model: string | null;
  fuel_type: string; currency: string; registration: string | null;
  installed_on: string | null; status: string;
  baseline_l_per_100: number | null; baseline_source: string;
  consent_to_publish: boolean; notes: string | null;
  savings: Savings; logs: FuelLog[];
};
type Tier = { model: string; label: string; baseline_l_per_100: number };

const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;
const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  active:  { background: "rgba(34,197,94,0.12)", color: "#16A34A" },
  paused:  { background: "rgba(197,178,122,0.16)", color: "#7A6020" },
  removed: { background: "rgba(0,0,0,0.06)", color: "#777" },
};

const money = (currency: string, amount: number | null): string => {
  if (amount === null) return "—";
  if (currency === "UGX") return `UGX ${amount.toLocaleString("en-US")}`;
  const sym = currency === "USD" ? "$" : "€";
  return `${sym}${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

const EMPTY_NEW = {
  customer_name: "", customer_email: "", customer_phone: "", company: "",
  tier: "car", vehicle: "", registration: "", fuel_type: "diesel", currency: "UGX",
  baseline_l_per_100: "", installed_on: "", status: "active", notes: "",
};

export default function FetPage() {
  const [list, setList] = useState<Install[] | null>(null);
  const [tiers, setTiers] = useState<Record<string, Tier>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState<Install | null>(null);
  const [rowMsg, setRowMsg] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ ...EMPTY_NEW });
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  // New fuel-log row for the open installation.
  const [log, setLog] = useState({ logged_on: "", odometer_km: "", litres: "", cost: "", phase: "after", note: "" });
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: Install[]; tiers: Record<string, Tier> }>("/admin/fet");
      setList(res.data); setTiers(res.tiers);
    } catch { setList([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const expand = (i: Install) => {
    setRowMsg(""); setLog({ logged_on: "", odometer_km: "", litres: "", cost: "", phase: "after", note: "" });
    if (open === i.id) { setOpen(null); setDraft(null); return; }
    setOpen(i.id); setDraft({ ...i });
  };

  const setD = <K extends keyof Install>(k: K, v: Install[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const createInstall = async () => {
    if (!add.customer_name.trim()) { setAddMsg("Customer name is required."); return; }
    setAdding(true); setAddMsg("");
    try {
      const payload = { ...add, baseline_l_per_100: add.baseline_l_per_100 ? Number(add.baseline_l_per_100) : null, installed_on: add.installed_on || null };
      await apiAdmin("/admin/fet", { method: "POST", body: JSON.stringify(payload) });
      setAdd({ ...EMPTY_NEW }); setAddOpen(false); load();
    } catch (e) { setAddMsg(e instanceof Error ? e.message : "Could not create installation."); }
    finally { setAdding(false); }
  };

  const saveInstall = async () => {
    if (!draft) return;
    setRowMsg("");
    try {
      const res = await apiAdmin<{ data: Install }>(`/admin/fet/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          customer_name: draft.customer_name, customer_email: draft.customer_email, customer_phone: draft.customer_phone,
          company: draft.company, tier: draft.tier, vehicle: draft.vehicle, registration: draft.registration,
          fuel_type: draft.fuel_type, currency: draft.currency,
          baseline_l_per_100: draft.baseline_l_per_100, baseline_source: draft.baseline_source,
          installed_on: draft.installed_on, status: draft.status, consent_to_publish: draft.consent_to_publish, notes: draft.notes,
        }),
      });
      setList((l) => (l ? l.map((x) => (x.id === res.data.id ? res.data : x)) : l));
      setDraft(res.data); setRowMsg("Saved.");
    } catch (e) { setRowMsg(e instanceof Error ? e.message : "Save failed."); }
  };

  const addLog = async (id: number) => {
    if (!log.logged_on || !log.litres) { setRowMsg("A date and litres are required."); return; }
    setLogging(true); setRowMsg("");
    try {
      const payload = {
        logged_on: log.logged_on, litres: Number(log.litres), phase: log.phase,
        odometer_km: log.odometer_km ? Number(log.odometer_km) : null,
        cost: log.cost ? Number(log.cost) : null, note: log.note || null,
      };
      const res = await apiAdmin<{ data: Install }>(`/admin/fet/${id}/logs`, { method: "POST", body: JSON.stringify(payload) });
      setList((l) => (l ? l.map((x) => (x.id === id ? res.data : x)) : l));
      setDraft(res.data);
      setLog({ logged_on: "", odometer_km: "", litres: "", cost: "", phase: "after", note: "" });
    } catch (e) { setRowMsg(e instanceof Error ? e.message : "Could not add reading."); }
    finally { setLogging(false); }
  };

  const deleteLog = async (id: number, logId: number) => {
    try {
      const res = await apiAdmin<{ data: Install }>(`/admin/fet/${id}/logs/${logId}`, { method: "DELETE" });
      setList((l) => (l ? l.map((x) => (x.id === id ? res.data : x)) : l));
      setDraft(res.data);
    } catch (e) { setRowMsg(e instanceof Error ? e.message : "Delete failed."); }
  };

  const removeInstall = async (id: number) => {
    if (!confirm("Remove this installation and all its fuel readings? This cannot be undone.")) return;
    try { await apiAdmin(`/admin/fet/${id}`, { method: "DELETE" }); setList((l) => (l ? l.filter((x) => x.id !== id) : l)); setOpen(null); }
    catch (e) { setRowMsg(e instanceof Error ? e.message : "Delete failed."); }
  };

  const downloadCert = (i: Install) => downloadFile(`/admin/fet/${i.id}/certificate`, `fet-savings-${i.reference}.pdf`).catch(() => { /* ignore */ });

  if (!list) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="FET proven savings" subtitle="Record each device fitted to a customer's vehicle, log fuel readings, and show the measured savings — real proof, per vehicle." />
        <button onClick={() => setAddOpen((o) => !o)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0" style={{ background: "#1E1E1E", color: "#fff" }}>
          <Plus className="w-4 h-4" />Add installation
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1E1E1E" }}>New installation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={add.customer_name} onChange={(e) => setAdd({ ...add, customer_name: e.target.value })} placeholder="Customer name" className={inputCls} style={inputStyle} />
            <input value={add.customer_email} onChange={(e) => setAdd({ ...add, customer_email: e.target.value })} placeholder="Customer email (links their portal)" className={inputCls} style={inputStyle} />
            <input value={add.company} onChange={(e) => setAdd({ ...add, company: e.target.value })} placeholder="Company (optional)" className={inputCls} style={inputStyle} />
            <input value={add.customer_phone} onChange={(e) => setAdd({ ...add, customer_phone: e.target.value })} placeholder="Phone (optional)" className={inputCls} style={inputStyle} />
            <select value={add.tier} onChange={(e) => setAdd({ ...add, tier: e.target.value })} className={inputCls} style={inputStyle}>
              {Object.entries(tiers).map(([k, t]) => <option key={k} value={k}>{t.label} ({t.model})</option>)}
            </select>
            <input value={add.vehicle} onChange={(e) => setAdd({ ...add, vehicle: e.target.value })} placeholder="Vehicle (make / model)" className={inputCls} style={inputStyle} />
            <input value={add.registration} onChange={(e) => setAdd({ ...add, registration: e.target.value })} placeholder="Number plate (stored encrypted)" className={inputCls} style={inputStyle} />
            <select value={add.fuel_type} onChange={(e) => setAdd({ ...add, fuel_type: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="diesel">Diesel</option><option value="petrol">Petrol</option>
            </select>
            <select value={add.currency} onChange={(e) => setAdd({ ...add, currency: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="UGX">UGX</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </select>
            <input value={add.baseline_l_per_100} onChange={(e) => setAdd({ ...add, baseline_l_per_100: e.target.value })} placeholder="Baseline l/100km (optional)" type="number" step="0.1" className={inputCls} style={inputStyle} />
            <label className="text-xs flex flex-col gap-1" style={{ color: "#888" }}>Installed on<input value={add.installed_on} onChange={(e) => setAdd({ ...add, installed_on: e.target.value })} type="date" className={inputCls} style={inputStyle} /></label>
          </div>
          <p className="text-xs mt-3" style={{ color: "#999" }}>Leave baseline blank to use the typical figure for the vehicle class, or record &ldquo;before&rdquo; fuel readings later for a measured baseline.</p>
          {addMsg && <p className="text-sm mt-2" style={{ color: "#C0392B" }}>{addMsg}</p>}
          <button onClick={createInstall} disabled={adding} className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: adding ? 0.7 : 1 }}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Create
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty label="No installations recorded yet. Add the first one to start proving savings." />
      ) : (
        <div className="space-y-2.5">
          {list.map((i) => {
            const isOpen = open === i.id;
            const d = isOpen ? draft : null;
            const s = i.savings;
            return (
              <div key={i.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
                <button onClick={() => expand(i)} className="w-full flex items-center gap-3 p-4 text-left">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.12)", color: "#7A6020" }}><Gauge className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{i.customer_name}</span>
                      <span className="text-[11px]" style={{ color: "#BBB" }}>{i.reference}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#999" }}>{i.vehicle ? `${i.vehicle} · ` : ""}{i.tier_label} · {i.device_model}</p>
                  </div>
                  {s.has_enough_data ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full shrink-0" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}>
                      <TrendingDown className="w-3.5 h-3.5" />{s.reduction_pct}% saved
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: "#F2F2F2", color: "#999" }}>collecting data</span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 hidden sm:inline" style={STATUS_STYLE[i.status] ?? STATUS_STYLE.active}>{i.status}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
                </button>

                {isOpen && d && (
                  <div className="px-4 pb-5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    {/* Measured savings panel */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
                      <Stat label="Reduction" value={s.has_enough_data ? `${s.reduction_pct}%` : "—"} hint={`vs ${s.verified_pct}% verified`} highlight />
                      <Stat label="Before → after" value={s.measured_l_per_100 != null ? `${s.baseline_l_per_100} → ${s.measured_l_per_100}` : `${s.baseline_l_per_100 ?? "—"}`} hint="l/100km" />
                      <Stat label="Fuel saved" value={s.litres_saved != null ? `${s.litres_saved} L` : "—"} hint={`${s.distance_km.toLocaleString()} km measured`} />
                      <Stat label="Money saved" value={money(s.currency, s.money_saved)} hint={s.co2_saved_kg != null ? `${s.co2_saved_kg} kg CO₂` : ""} />
                    </div>

                    {/* Fuel logs */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#777" }}><Fuel className="w-3.5 h-3.5" />Fuel readings</span>
                      {d.logs.length === 0 ? (
                        <p className="text-xs mb-2" style={{ color: "#bbb" }}>No readings yet. Add fill-ups below — two odometer readings give the first measured result.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm" style={{ color: "#454545" }}>
                            <thead><tr className="text-[10px] uppercase tracking-wide" style={{ color: "#999" }}>
                              <th className="text-left font-semibold py-1.5">Date</th><th className="text-right font-semibold">Odometer</th><th className="text-right font-semibold">Litres</th><th className="text-right font-semibold">Cost</th><th className="text-left font-semibold pl-3">Phase</th><th></th>
                            </tr></thead>
                            <tbody>
                              {d.logs.map((l) => (
                                <tr key={l.id} className="border-t" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                                  <td className="py-2">{fmtDate(l.logged_on)}</td>
                                  <td className="text-right">{l.odometer_km != null ? l.odometer_km.toLocaleString() : "—"}</td>
                                  <td className="text-right">{l.litres}</td>
                                  <td className="text-right">{money(d.currency, l.cost)}</td>
                                  <td className="pl-3"><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: l.phase === "before" ? "rgba(197,178,122,0.16)" : "rgba(59,130,246,0.1)", color: l.phase === "before" ? "#7A6020" : "#2563EB" }}>{l.phase}</span></td>
                                  <td className="text-right"><button onClick={() => deleteLog(d.id, l.id)} className="p-1.5 rounded-lg" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><X className="w-3.5 h-3.5" /></button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {/* Add reading */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-3 items-end">
                        <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>Date<input value={log.logged_on} onChange={(e) => setLog({ ...log, logged_on: e.target.value })} type="date" className={inputCls} style={inputStyle} /></label>
                        <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>Odometer<input value={log.odometer_km} onChange={(e) => setLog({ ...log, odometer_km: e.target.value })} type="number" placeholder="km" className={inputCls} style={inputStyle} /></label>
                        <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>Litres<input value={log.litres} onChange={(e) => setLog({ ...log, litres: e.target.value })} type="number" step="0.1" className={inputCls} style={inputStyle} /></label>
                        <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>Cost<input value={log.cost} onChange={(e) => setLog({ ...log, cost: e.target.value })} type="number" placeholder={d.currency} className={inputCls} style={inputStyle} /></label>
                        <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>Phase<select value={log.phase} onChange={(e) => setLog({ ...log, phase: e.target.value })} className={inputCls} style={inputStyle}><option value="after">After install</option><option value="before">Before (baseline)</option></select></label>
                        <button onClick={() => addLog(d.id)} disabled={logging} className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: "#1E1E1E", color: "#fff", opacity: logging ? 0.7 : 1 }}>{logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add</button>
                      </div>
                    </div>

                    {/* Edit details */}
                    <div className="mt-5 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <Field label="Customer name"><input value={d.customer_name} onChange={(e) => setD("customer_name", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Customer email"><input value={d.customer_email ?? ""} onChange={(e) => setD("customer_email", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Vehicle"><input value={d.vehicle ?? ""} onChange={(e) => setD("vehicle", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Number plate (encrypted)"><input value={d.registration ?? ""} onChange={(e) => setD("registration", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Tier">
                        <select value={d.tier} onChange={(e) => setD("tier", e.target.value)} className={inputCls} style={inputStyle}>
                          {Object.entries(tiers).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                        </select>
                      </Field>
                      <Field label="Status">
                        <select value={d.status} onChange={(e) => setD("status", e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="active">Active</option><option value="paused">Paused</option><option value="removed">Removed</option>
                        </select>
                      </Field>
                      <Field label="Baseline l/100km"><input value={d.baseline_l_per_100 ?? ""} onChange={(e) => setD("baseline_l_per_100", e.target.value ? Number(e.target.value) : null)} type="number" step="0.1" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Installed on"><input value={d.installed_on ?? ""} onChange={(e) => setD("installed_on", e.target.value)} type="date" className={inputCls} style={inputStyle} /></Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm mt-3 cursor-pointer" style={{ color: "#454545" }}>
                      <input type="checkbox" checked={d.consent_to_publish} onChange={(e) => setD("consent_to_publish", e.target.checked)} />
                      Customer consents to publish this as an (anonymised) case study
                    </label>
                    <Field label="Internal notes"><textarea value={d.notes ?? ""} onChange={(e) => setD("notes", e.target.value)} rows={2} className={`${inputCls} mt-2`} style={inputStyle} /></Field>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <button onClick={saveInstall} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}><Save className="w-3.5 h-3.5" />Save</button>
                      <button onClick={() => downloadCert(i)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}><FileDown className="w-3.5 h-3.5" />Savings certificate</button>
                      <button onClick={() => removeInstall(d.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full ml-auto" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-3.5 h-3.5" />Remove</button>
                    </div>
                    {rowMsg && <p className="text-sm mt-3" style={{ color: /fail|cannot|require|invalid|could/i.test(rowMsg) ? "#C0392B" : "#16A34A" }}>{rowMsg}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: highlight ? "rgba(197,178,122,0.1)" : "#F7F7F5" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>{label}</p>
      <p className="font-bold" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", color: highlight ? "#7A6020" : "#1E1E1E" }}>{value}</p>
      {hint && <p className="text-[11px] mt-0.5" style={{ color: "#aaa" }}>{hint}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium block mb-1" style={{ color: "#888" }}>{label}</span>{children}</label>;
}
