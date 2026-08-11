"use client";

import { useState } from "react";
import { Loader2, Plus, ChevronDown, Save, Trash2, EyeOff, Eye } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import {
  type Trial, type Trip, type Flag, TRIP_STATUS_STYLE, SEVERITY_STYLE,
  fmtDate, fmtNumber, fmtTonnes,
} from "@/lib/fet-trials";

const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

const EMPTY_TRIP = {
  route_label: "", trip_date: "", return_date: "", distance_km: "",
  fuel_opening_l: "", fuel_issued_l: "", fuel_topup_l: "", fuel_closing_l: "",
  load_out_kg: "", load_in_kg: "", driver_name: "", notes: "",
};

/**
 * Every journey in the trial, with the checks that apply to each attached to
 * its own row. Deliberately not a spreadsheet: the fields are grouped, the
 * derived figures are read-only, and anything questionable is stated in words
 * next to the trip it concerns.
 */
export default function FetTrialTrips({
  trial,
  onChange,
}: {
  trial: Trial;
  onChange: (t: Trial) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState<Trip | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ ...EMPTY_TRIP });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const flagsFor = (tripId: number): Flag[] =>
    trial.flags.filter((f) => f.trip_id === tripId && !f.resolution);

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const expand = (t: Trip) => {
    setMsg("");
    if (open === t.id) { setOpen(null); setDraft(null); return; }
    setOpen(t.id); setDraft({ ...t });
  };

  const createTrip = async () => {
    if (!add.route_label.trim()) { setMsg("A destination is required — it is what trips are compared within."); return; }
    setBusy(true); setMsg("");
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/trips`, {
        method: "POST",
        body: JSON.stringify({
          route_label: add.route_label,
          trip_date: add.trip_date || null,
          return_date: add.return_date || null,
          distance_km: num(add.distance_km),
          fuel_opening_l: num(add.fuel_opening_l),
          fuel_issued_l: num(add.fuel_issued_l),
          fuel_topup_l: num(add.fuel_topup_l),
          fuel_closing_l: num(add.fuel_closing_l),
          load_out_kg: num(add.load_out_kg),
          load_in_kg: num(add.load_in_kg),
          driver_name: add.driver_name || null,
          notes: add.notes || null,
        }),
      });
      onChange(res.data); setAdd({ ...EMPTY_TRIP }); setAddOpen(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not add the trip.");
    } finally { setBusy(false); }
  };

  const saveTrip = async () => {
    if (!draft) return;
    setBusy(true); setMsg("");
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/trips/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          route_label: draft.route_label, trip_date: draft.trip_date, return_date: draft.return_date,
          distance_km: draft.distance_km, fuel_opening_l: draft.fuel_opening_l,
          fuel_issued_l: draft.fuel_issued_l, fuel_topup_l: draft.fuel_topup_l,
          fuel_closing_l: draft.fuel_closing_l, fuel_used_ivms_l: draft.fuel_used_ivms_l,
          load_out_kg: draft.load_out_kg, load_in_kg: draft.load_in_kg,
          driver_name: draft.driver_name, notes: draft.notes,
        }),
      });
      onChange(res.data);
      setDraft(res.data.trips.find((t) => t.id === draft.id) ?? null);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save.");
    } finally { setBusy(false); }
  };

  /** Excluding always needs a reason — a figure that quietly dropped a trip is the failure mode we exist to prevent. */
  const setStatus = async (trip: Trip, status: "valid" | "excluded") => {
    let reason: string | null = null;
    if (status === "excluded") {
      reason = prompt("Why should this trip be left out of the calculation?\n\nThis is recorded against the trial and shown on the report.");
      if (!reason || !reason.trim()) return;
    }
    setBusy(true); setMsg("");
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/trips/${trip.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status, reason }),
      });
      onChange(res.data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not change the trip.");
    } finally { setBusy(false); }
  };

  const deleteTrip = async (trip: Trip) => {
    if (!confirm(`Delete the ${trip.route_label ?? "untitled"} trip? Leaving it out with a reason keeps a better record.`)) return;
    setBusy(true);
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/trips/${trip.id}`, { method: "DELETE" });
      onChange(res.data); setOpen(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not delete the trip.");
    } finally { setBusy(false); }
  };

  const setD = <K extends keyof Trip>(k: K, v: Trip[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const baseline = trial.trips.filter((t) => t.phase === "baseline");
  const after = trial.trips.filter((t) => t.phase === "trial");

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-xs" style={{ color: "#999" }}>
          {baseline.length} before the device · {after.length} after
          {trial.installed_on ? ` · fitted ${fmtDate(trial.installed_on)}` : " · no installation date set, so nothing counts as “after” yet"}
        </p>
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "#F2F2F2", color: "#555" }}
        >
          <Plus className="w-3.5 h-3.5" />Add a trip by hand
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-[18px] border border-black/[0.06] p-4 mb-4">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1E1E1E" }}>New trip</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Destination"><input value={add.route_label} onChange={(e) => setAdd({ ...add, route_label: e.target.value })} className={inputCls} style={inputStyle} /></Field>
            <Field label="Departed"><input value={add.trip_date} onChange={(e) => setAdd({ ...add, trip_date: e.target.value })} type="date" className={inputCls} style={inputStyle} /></Field>
            <Field label="Returned"><input value={add.return_date} onChange={(e) => setAdd({ ...add, return_date: e.target.value })} type="date" className={inputCls} style={inputStyle} /></Field>
            <Field label="Distance" hint="km"><input value={add.distance_km} onChange={(e) => setAdd({ ...add, distance_km: e.target.value })} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
            <Field label="Fuel at departure" hint="litres"><input value={add.fuel_opening_l} onChange={(e) => setAdd({ ...add, fuel_opening_l: e.target.value })} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
            <Field label="Fuel issued" hint="litres"><input value={add.fuel_issued_l} onChange={(e) => setAdd({ ...add, fuel_issued_l: e.target.value })} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
            <Field label="Top-up en route" hint="litres"><input value={add.fuel_topup_l} onChange={(e) => setAdd({ ...add, fuel_topup_l: e.target.value })} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
            <Field label="Fuel on return" hint="litres"><input value={add.fuel_closing_l} onChange={(e) => setAdd({ ...add, fuel_closing_l: e.target.value })} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
            <Field label="Load out" hint="kg"><input value={add.load_out_kg} onChange={(e) => setAdd({ ...add, load_out_kg: e.target.value })} type="number" className={inputCls} style={inputStyle} /></Field>
            <Field label="Weight back" hint="kg"><input value={add.load_in_kg} onChange={(e) => setAdd({ ...add, load_in_kg: e.target.value })} type="number" className={inputCls} style={inputStyle} /></Field>
            <Field label="Driver"><input value={add.driver_name} onChange={(e) => setAdd({ ...add, driver_name: e.target.value })} className={inputCls} style={inputStyle} /></Field>
          </div>
          <p className="text-[11px] mt-2.5" style={{ color: "#AAA" }}>
            Fuel used is worked out for you: fuel at departure + issued + top-up − fuel on return.
          </p>
          <button onClick={createTrip} disabled={busy} className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: busy ? 0.7 : 1 }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add trip
          </button>
        </div>
      )}

      {msg && <p className="text-sm mb-3" style={{ color: /save/i.test(msg) ? "#16A34A" : "#C0392B" }}>{msg}</p>}

      {trial.trips.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "#BBB" }}>
          No trips yet. Upload the client&rsquo;s own export from the Import tab, or add one by hand above.
        </p>
      ) : (
        <div className="space-y-2">
          {trial.trips.map((t) => {
            const isOpen = open === t.id;
            const d = isOpen ? draft : null;
            const tripFlags = flagsFor(t.id);
            const style = TRIP_STATUS_STYLE[t.status];

            return (
              <div key={t.id} className="bg-white rounded-[16px] border border-black/[0.05] overflow-hidden">
                <button onClick={() => expand(t)} className="w-full flex items-center gap-3 p-3.5 text-left">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 w-16 text-center" style={t.phase === "trial" ? { background: "rgba(59,130,246,0.1)", color: "#2563EB" } : { background: "rgba(0,0,0,0.05)", color: "#888" }}>
                    {t.phase === "trial" ? "After" : "Before"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{t.route_label ?? "No destination"}</span>
                      <span className="text-xs" style={{ color: "#AAA" }}>{fmtDate(t.trip_date)}</span>
                    </div>
                    <p className="text-xs" style={{ color: "#999" }}>
                      {t.distance_km ? `${fmtNumber(t.distance_km)} km` : "no distance"}
                      {t.fuel_used_l ? ` · ${fmtNumber(t.fuel_used_l, 1)} L` : ""}
                      {t.load_out_kg ? ` · ${fmtTonnes(t.load_out_kg)}` : ""}
                    </p>
                  </div>

                  {t.l_per_100 !== null && (
                    <span className="text-sm font-semibold tabular-nums shrink-0 hidden sm:block" style={{ color: "#454545" }}>
                      {t.l_per_100}<span className="text-[10px] font-normal" style={{ color: "#BBB" }}> L/100km</span>
                    </span>
                  )}
                  {tripFlags.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={SEVERITY_STYLE[tripFlags.some((f) => f.severity === "error") ? "error" : "warn"]}>
                      {tripFlags.length}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0" style={{ background: style.background, color: style.color }}>{style.label}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "#CCC" }} />
                </button>

                {isOpen && d && (
                  <div className="px-3.5 pb-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    {tripFlags.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {tripFlags.map((f) => (
                          <div key={f.id} className="rounded-xl p-3" style={{ background: SEVERITY_STYLE[f.severity].background }}>
                            <p className="text-xs font-semibold mb-0.5" style={{ color: SEVERITY_STYLE[f.severity].color }}>{SEVERITY_STYLE[f.severity].label}</p>
                            <p className="text-sm leading-relaxed" style={{ color: "#454545" }}>{f.message}</p>
                            {f.suggested_action && <p className="text-xs mt-1.5" style={{ color: "#888" }}>{f.suggested_action}</p>}
                          </div>
                        ))}
                        <p className="text-[11px]" style={{ color: "#AAA" }}>Settle these on the Data checks tab.</p>
                      </div>
                    )}

                    {t.status === "excluded" && t.exclusion_reason && (
                      <p className="text-xs mt-3 rounded-xl p-3" style={{ background: "#F7F7F5", color: "#777" }}>
                        <strong>Left out:</strong> {t.exclusion_reason}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <Field label="Destination"><input value={d.route_label ?? ""} onChange={(e) => setD("route_label", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Departed"><input value={d.trip_date ?? ""} onChange={(e) => setD("trip_date", e.target.value)} type="date" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Returned"><input value={d.return_date ?? ""} onChange={(e) => setD("return_date", e.target.value)} type="date" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Distance" hint="km"><input value={d.distance_km ?? ""} onChange={(e) => setD("distance_km", e.target.value === "" ? null : Number(e.target.value))} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Fuel at departure"><input value={d.fuel_opening_l ?? ""} onChange={(e) => setD("fuel_opening_l", e.target.value === "" ? null : Number(e.target.value))} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Fuel issued"><input value={d.fuel_issued_l ?? ""} onChange={(e) => setD("fuel_issued_l", e.target.value === "" ? null : Number(e.target.value))} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Top-up en route"><input value={d.fuel_topup_l ?? ""} onChange={(e) => setD("fuel_topup_l", e.target.value === "" ? null : Number(e.target.value))} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Fuel on return"><input value={d.fuel_closing_l ?? ""} onChange={(e) => setD("fuel_closing_l", e.target.value === "" ? null : Number(e.target.value))} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Load out" hint="kg"><input value={d.load_out_kg ?? ""} onChange={(e) => setD("load_out_kg", e.target.value === "" ? null : Number(e.target.value))} type="number" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Weight back" hint="kg"><input value={d.load_in_kg ?? ""} onChange={(e) => setD("load_in_kg", e.target.value === "" ? null : Number(e.target.value))} type="number" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Tracker fuel figure" hint="litres, if they have one"><input value={d.fuel_used_ivms_l ?? ""} onChange={(e) => setD("fuel_used_ivms_l", e.target.value === "" ? null : Number(e.target.value))} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Driver"><input value={d.driver_name ?? ""} onChange={(e) => setD("driver_name", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                    </div>

                    {/* Derived, never typed. */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                      <Derived label="Fuel used" value={t.fuel_used_l !== null ? `${fmtNumber(t.fuel_used_l, 2)} L` : "—"} hint={t.fuel_method === "tank_dip" ? "from the tank readings" : t.fuel_method === "issued_only" ? "from what was issued" : "brim to brim"} />
                      <Derived label="Fuel use" value={t.l_per_100 !== null ? `${t.l_per_100} L/100km` : "—"} hint={t.km_per_l !== null ? `${t.km_per_l} km/L` : ""} />
                      <Derived label="Load carried" value={fmtTonnes(t.load_out_kg)} hint={t.utilisation_pct !== null ? `${t.utilisation_pct}% of capacity` : ""} />
                      <Derived label="Manual vs tracker" value={t.fuel_variance_l !== null ? `${t.fuel_variance_l > 0 ? "+" : ""}${fmtNumber(t.fuel_variance_l, 2)} L` : "—"} hint={t.source_row_ref ? `from ${t.source_row_ref}` : t.source} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <button onClick={saveTrip} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}>
                        <Save className="w-3.5 h-3.5" />Save
                      </button>
                      {t.status === "excluded" ? (
                        <button onClick={() => setStatus(t, "valid")} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
                          <Eye className="w-3.5 h-3.5" />Put back in
                        </button>
                      ) : (
                        <button onClick={() => setStatus(t, "excluded")} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
                          <EyeOff className="w-3.5 h-3.5" />Leave out
                        </button>
                      )}
                      <button onClick={() => deleteTrip(t)} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full ml-auto" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
                        <Trash2 className="w-3.5 h-3.5" />Delete
                      </button>
                    </div>
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "#888" }}>
        {label}{hint && <span style={{ color: "#BBB" }}> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Derived({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#F7F7F5" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#AAA" }}>{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: "#1E1E1E" }}>{value}</p>
      {hint && <p className="text-[10px] mt-0.5" style={{ color: "#BBB" }}>{hint}</p>}
    </div>
  );
}
