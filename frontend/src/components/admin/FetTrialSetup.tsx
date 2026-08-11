"use client";

import { useState } from "react";
import { Loader2, Save, Trash2, Link2, Copy, Check, Unlink, FileDown, FileSpreadsheet } from "lucide-react";
import { apiAdmin, downloadFile } from "@/lib/auth";
import { type Trial, TRIAL_STATUSES, STATUS_LABEL, fmtDate } from "@/lib/fet-trials";

const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

/** Trial settings, the evidence rules, and the read-only link for the client. */
export default function FetTrialSetup({
  trial,
  onChange,
  onDelete,
}: {
  trial: Trial;
  onChange: (t: Trial) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState<Trial>(trial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Trial>(k: K, v: Trial[K]) => setD((x) => ({ ...x, [k]: v }));
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

  const shareUrl = trial.share_token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/trial/${trial.share_token}`
    : null;

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          client_company: d.client_company, contact_name: d.contact_name, contact_email: d.contact_email,
          contact_phone: d.contact_phone, registration: d.registration, vehicle_make: d.vehicle_make,
          vehicle_type: d.vehicle_type, rated_capacity_kg: d.rated_capacity_kg, tare_kg: d.tare_kg,
          device_serial: d.device_serial, device_model: d.device_model,
          installed_on: d.installed_on, trial_start: d.trial_start, trial_end: d.trial_end,
          fuel_price: d.fuel_price, currency: d.currency,
          fleet_standard_km_per_l: d.fleet_standard_km_per_l,
          declared_baseline_l_per_100: d.declared_baseline_l_per_100,
          required_matched_trips: d.required_matched_trips,
          min_baseline_trips_per_route: d.min_baseline_trips_per_route,
          status: d.status, notes: d.notes,
        }),
      });
      onChange(res.data); setD(res.data); setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save.");
    } finally { setBusy(false); }
  };

  const share = async () => {
    setBusy(true); setMsg("");
    try {
      await apiAdmin<{ token: string }>(`/admin/fet-trials/${trial.id}/share`, {
        method: "POST",
        body: JSON.stringify({ include_driver: false }),
      });
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}`);
      onChange(res.data); setD(res.data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not create the link.");
    } finally { setBusy(false); }
  };

  const revoke = async () => {
    if (!confirm("Turn off the client's link? Anyone holding it will lose access immediately.")) return;
    setBusy(true);
    try {
      await apiAdmin(`/admin/fet-trials/${trial.id}/share`, { method: "DELETE" });
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}`);
      onChange(res.data); setD(res.data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not turn the link off.");
    } finally { setBusy(false); }
  };

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => setMsg("Could not copy — select the link and copy it by hand."));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
        <Section label="Client" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Company"><input value={d.client_company} onChange={(e) => set("client_company", e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Stage">
            <select value={d.status} onChange={(e) => set("status", e.target.value)} className={inputCls} style={inputStyle}>
              {TRIAL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Contact name"><input value={d.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Contact email"><input value={d.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>

        <Section label="Vehicle" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Number plate" hint="encrypted"><input value={d.registration ?? ""} onChange={(e) => set("registration", e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Make"><input value={d.vehicle_make ?? ""} onChange={(e) => set("vehicle_make", e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Type"><input value={d.vehicle_type ?? ""} onChange={(e) => set("vehicle_type", e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Rated capacity" hint="kg"><input value={d.rated_capacity_kg ?? ""} onChange={(e) => set("rated_capacity_kg", numOrNull(e.target.value))} type="number" className={inputCls} style={inputStyle} /></Field>
          <Field label="Empty weight" hint="kg — blank infers it"><input value={d.tare_kg ?? ""} onChange={(e) => set("tare_kg", numOrNull(e.target.value))} type="number" className={inputCls} style={inputStyle} /></Field>
          <Field label="Fleet standard" hint="km/L"><input value={d.fleet_standard_km_per_l ?? ""} onChange={(e) => set("fleet_standard_km_per_l", e.target.value === "" ? null : e.target.value)} type="number" step="0.001" className={inputCls} style={inputStyle} /></Field>
        </div>

        <Section label="Device &amp; dates" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Device serial"><input value={d.device_serial ?? ""} onChange={(e) => set("device_serial", e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Fitted on" hint="splits before from after"><input value={d.installed_on ?? ""} onChange={(e) => set("installed_on", e.target.value)} type="date" className={inputCls} style={inputStyle} /></Field>
          <Field label="Trial ends"><input value={d.trial_end ?? ""} onChange={(e) => set("trial_end", e.target.value)} type="date" className={inputCls} style={inputStyle} /></Field>
          <Field label="Fuel price" hint="per litre"><input value={d.fuel_price ?? ""} onChange={(e) => set("fuel_price", numOrNull(e.target.value))} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
          <Field label="Currency">
            <select value={d.currency} onChange={(e) => set("currency", e.target.value)} className={inputCls} style={inputStyle}>
              <option value="UGX">UGX</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </select>
          </Field>
        </div>

        <Section label="What counts as proof" />
        <p className="text-xs mb-3 leading-relaxed" style={{ color: "#999" }}>
          These decide when the system is willing to state a result. Raising them makes a result harder to reach and
          harder to argue with; lowering them does the opposite. The defaults suit a single vehicle running mixed routes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Comparable trips needed" hint="after the device was fitted"><input value={d.required_matched_trips} onChange={(e) => set("required_matched_trips", Number(e.target.value))} type="number" min={1} className={inputCls} style={inputStyle} /></Field>
          <Field label="Earlier trips a route needs" hint="before it can be compared against"><input value={d.min_baseline_trips_per_route} onChange={(e) => set("min_baseline_trips_per_route", Number(e.target.value))} type="number" min={1} className={inputCls} style={inputStyle} /></Field>
        </div>

        <Field label="Internal notes"><textarea value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} className={`${inputCls} mt-3`} style={inputStyle} /></Field>

        {msg && <p className="text-sm mt-3" style={{ color: /saved/i.test(msg) ? "#16A34A" : "#C0392B" }}>{msg}</p>}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: busy ? 0.7 : 1 }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
          </button>
          <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full ml-auto" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
            <Trash2 className="w-3.5 h-3.5" />Delete trial
          </button>
        </div>
      </div>

      <OutcomePanel trial={trial} onChange={onChange} />

      <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>Send it to the client</p>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "#999" }}>
          Both are generated from the checked figures, never retyped. The spreadsheet uses the columns this client
          actually records &mdash; a fleet working from tank readings is not handed odometer columns it cannot fill.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadFile(`/admin/fet-trials/${trial.id}/report`, `fet-trial-${trial.reference}.pdf`).catch(() => setMsg("Could not download the report."))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
            style={{ background: "#1E1E1E", color: "#fff" }}
          >
            <FileDown className="w-3.5 h-3.5" />Branded report (PDF)
          </button>
          <button
            onClick={() => downloadFile(`/admin/fet-trials/${trial.id}/spreadsheet`, `fet-trial-${trial.reference}.xlsx`).catch(() => setMsg("Could not download the spreadsheet."))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
            style={{ background: "#F2F2F2", color: "#555" }}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />Trip log (Excel)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>The client&rsquo;s own view</p>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "#999" }}>
          A read-only page showing this trial as it stands — no login needed. It shows the same strict result: if the
          evidence does not carry a figure, the client sees what is still needed rather than a number with a caveat.
          Contact details, internal notes, the device serial and driver names are never included.
        </p>

        {shareUrl ? (
          <>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ background: "#F7F7F5" }}>
              <Link2 className="w-4 h-4 shrink-0" style={{ color: "#AAA" }} />
              <span className="text-xs flex-1 min-w-0 truncate font-mono" style={{ color: "#555" }}>{shareUrl}</span>
              <button onClick={copy} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0" style={{ background: "#fff", color: "#555" }}>
                {copied ? <Check className="w-3 h-3" style={{ color: "#16A34A" }} /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {trial.share_expires_at && <p className="text-xs mb-3" style={{ color: "#999" }}>Expires {fmtDate(trial.share_expires_at)}.</p>}
            <button onClick={revoke} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
              <Unlink className="w-3.5 h-3.5" />Turn the link off
            </button>
          </>
        ) : (
          <button onClick={share} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#1E1E1E", color: "#fff", opacity: busy ? 0.7 : 1 }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}Create a client link
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * How the trial ended.
 *
 * Winning one is not just a status change: it creates the installation that
 * keeps measuring this customer afterwards, and carries the baseline the trial
 * actually measured into it — so their ongoing savings are compared against
 * their own history rather than a class average.
 */
function OutcomePanel({ trial, onChange }: { trial: Trial; onChange: (t: Trial) => void }) {
  const [open, setOpen] = useState<"won" | "lost" | null>(null);
  const [note, setNote] = useState("");
  const [units, setUnits] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const closed = trial.status === "won" || trial.status === "lost";

  const submit = async (outcome: "won" | "lost") => {
    setBusy(true); setMsg("");
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/outcome`, {
        method: "POST",
        body: JSON.stringify({
          outcome,
          outcome_note: note || null,
          units_sold: outcome === "won" && units ? Number(units) : null,
          deal_value: outcome === "won" && value ? Number(value) : null,
        }),
      });
      onChange(res.data); setOpen(null); setNote(""); setUnits(""); setValue("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not record the outcome.");
    } finally { setBusy(false); }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/reopen`, { method: "POST" });
      onChange(res.data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not reopen the trial.");
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
      <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>How it ended</p>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#999" }}>
        Recorded against the trial, so the decision sits beside the evidence the client was shown.
        {trial.prospect_name && ` Linked to ${trial.prospect_name} in the prospect list, which is updated to match.`}
      </p>

      {closed ? (
        <div className="rounded-2xl p-4" style={{ background: trial.status === "won" ? "rgba(34,197,94,0.08)" : "#F7F7F5" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: trial.status === "won" ? "#16A34A" : "#777" }}>
            {trial.status === "won" ? "Won" : "Lost"}
            {trial.decided_on && <span className="font-normal" style={{ color: "#999" }}> · {fmtDate(trial.decided_on)}</span>}
          </p>
          {trial.outcome_note && <p className="text-sm leading-relaxed mb-2" style={{ color: "#454545" }}>{trial.outcome_note}</p>}
          {trial.status === "won" && (trial.units_sold || trial.deal_value) && (
            <p className="text-xs" style={{ color: "#777" }}>
              {trial.units_sold ? `${trial.units_sold} unit${trial.units_sold === 1 ? "" : "s"}` : ""}
              {trial.units_sold && trial.deal_value ? " · " : ""}
              {trial.deal_value ? `${trial.currency} ${trial.deal_value.toLocaleString("en-GB")}` : ""}
            </p>
          )}
          {trial.installation && (
            <p className="text-xs mt-2 rounded-lg px-2.5 py-1.5" style={{ background: "#fff", color: "#555" }}>
              Now measured as <strong>{trial.installation.reference}</strong> in FET savings — the baseline this trial
              measured carried across, so their ongoing savings are compared with their own history.
            </p>
          )}
          <button onClick={reopen} disabled={busy} className="mt-3 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Reopen the trial"}
          </button>
        </div>
      ) : open ? (
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: "#1E1E1E" }}>
            {open === "won" ? "Mark this trial won" : "Mark this trial lost"}
          </p>
          {open === "won" && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Units sold"><input value={units} onChange={(e) => setUnits(e.target.value)} type="number" min={1} className={inputCls} style={inputStyle} /></Field>
              <Field label={`Deal value (${trial.currency})`}><input value={value} onChange={(e) => setValue(e.target.value)} type="number" min={0} className={inputCls} style={inputStyle} /></Field>
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={open === "won" ? "What swung it? e.g. “Fleet-wide rollout agreed for 12 trucks.”" : "Why did it not land? e.g. “Went with a competitor on price.”"}
            className={inputCls}
            style={inputStyle}
          />
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => submit(open)} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: open === "won" ? "#16A34A" : "#1E1E1E", color: "#fff", opacity: busy ? 0.7 : 1 }}>
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Record it
            </button>
            <button onClick={() => setOpen(null)} className="text-sm font-medium px-3 py-1.5" style={{ color: "#999" }}>Cancel</button>
          </div>
          {open === "won" && (
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "#999" }}>
              This also creates their FET savings record, so measurement carries on after the sale without re-entering anything.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setOpen("won"); setMsg(""); }} className="text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}>
            Mark won
          </button>
          <button onClick={() => { setOpen("lost"); setMsg(""); }} className="text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
            Mark lost
          </button>
        </div>
      )}

      {msg && <p className="text-sm mt-3" style={{ color: "#C0392B" }}>{msg}</p>}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return <p className="text-[10px] font-bold uppercase tracking-wide mt-5 first:mt-0 mb-2" style={{ color: "#AAA" }}>{label}</p>;
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
