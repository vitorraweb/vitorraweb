"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, FlaskConical, ChevronRight, AlertCircle } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";
import {
  type TrialSummary, STATUS_LABEL, CONFIDENCE_LABEL, CONFIDENCE_STYLE, fmtDate,
} from "@/lib/fet-trials";

const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

const EMPTY = {
  client_company: "", contact_name: "", contact_email: "", contact_phone: "",
  registration: "", vehicle_make: "", vehicle_type: "",
  rated_capacity_kg: "", tare_kg: "", device_serial: "", device_model: "",
  installed_on: "", trial_start: "", fuel_price: "", currency: "UGX",
  fleet_standard_km_per_l: "",
};

export default function FetTrialsPage() {
  const router = useRouter();
  const [list, setList] = useState<TrialSummary[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ ...EMPTY });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: TrialSummary[] }>("/admin/fet-trials");
      setList(res.data);
    } catch {
      setList([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!add.client_company.trim()) { setMsg("The client's company name is required."); return; }
    setAdding(true); setMsg("");
    try {
      const num = (v: string) => (v.trim() === "" ? null : Number(v));
      const res = await apiAdmin<{ data: { id: number } }>("/admin/fet-trials", {
        method: "POST",
        body: JSON.stringify({
          ...add,
          rated_capacity_kg: num(add.rated_capacity_kg),
          tare_kg: num(add.tare_kg),
          fuel_price: num(add.fuel_price),
          fleet_standard_km_per_l: num(add.fleet_standard_km_per_l),
          installed_on: add.installed_on || null,
          trial_start: add.trial_start || null,
        }),
      });
      router.push(`/admin/fet-trials/${res.data.id}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not start the trial.");
      setAdding(false);
    }
  };

  if (!list) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}>
        <Loader2 className="w-4 h-4 animate-spin" />Loading…
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="FET trials"
          subtitle="Run a fuel trial on a client's own vehicle. Upload the file they already produce, and the system checks it, does the arithmetic route by route, and says what the evidence will and will not support."
        />
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0"
          style={{ background: "#1E1E1E", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />Start a trial
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
          <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>New trial</p>
          <p className="text-xs mb-4" style={{ color: "#999" }}>
            Only the company name is needed to start. Everything else can be filled in as you learn it — but the
            installation date matters most, because it decides which trips count as &ldquo;before&rdquo; and which as &ldquo;after&rdquo;.
          </p>

          <Section label="Client" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company"><input value={add.client_company} onChange={(e) => setAdd({ ...add, client_company: e.target.value })} placeholder="e.g. Hariss International" className={inputCls} style={inputStyle} /></Field>
            <Field label="Contact name"><input value={add.contact_name} onChange={(e) => setAdd({ ...add, contact_name: e.target.value })} className={inputCls} style={inputStyle} /></Field>
            <Field label="Contact email"><input value={add.contact_email} onChange={(e) => setAdd({ ...add, contact_email: e.target.value })} className={inputCls} style={inputStyle} /></Field>
            <Field label="Contact phone"><input value={add.contact_phone} onChange={(e) => setAdd({ ...add, contact_phone: e.target.value })} className={inputCls} style={inputStyle} /></Field>
          </div>

          <Section label="Vehicle" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Number plate" hint="stored encrypted"><input value={add.registration} onChange={(e) => setAdd({ ...add, registration: e.target.value })} placeholder="UA 758AM" className={inputCls} style={inputStyle} /></Field>
            <Field label="Make"><input value={add.vehicle_make} onChange={(e) => setAdd({ ...add, vehicle_make: e.target.value })} placeholder="Faw" className={inputCls} style={inputStyle} /></Field>
            <Field label="Type"><input value={add.vehicle_type} onChange={(e) => setAdd({ ...add, vehicle_type: e.target.value })} placeholder="Trailer" className={inputCls} style={inputStyle} /></Field>
            <Field label="Rated capacity" hint="kg"><input value={add.rated_capacity_kg} onChange={(e) => setAdd({ ...add, rated_capacity_kg: e.target.value })} type="number" placeholder="30000" className={inputCls} style={inputStyle} /></Field>
            <Field label="Empty weight" hint="kg — blank works it out from the readings"><input value={add.tare_kg} onChange={(e) => setAdd({ ...add, tare_kg: e.target.value })} type="number" placeholder="19100" className={inputCls} style={inputStyle} /></Field>
            <Field label="Fleet standard" hint="km/L the client plans on"><input value={add.fleet_standard_km_per_l} onChange={(e) => setAdd({ ...add, fleet_standard_km_per_l: e.target.value })} type="number" step="0.1" placeholder="2.2" className={inputCls} style={inputStyle} /></Field>
          </div>

          <Section label="Device &amp; trial" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Device serial"><input value={add.device_serial} onChange={(e) => setAdd({ ...add, device_serial: e.target.value })} className={inputCls} style={inputStyle} /></Field>
            <Field label="Fitted on" hint="splits before from after"><input value={add.installed_on} onChange={(e) => setAdd({ ...add, installed_on: e.target.value })} type="date" className={inputCls} style={inputStyle} /></Field>
            <Field label="Trial starts"><input value={add.trial_start} onChange={(e) => setAdd({ ...add, trial_start: e.target.value })} type="date" className={inputCls} style={inputStyle} /></Field>
            <Field label="Fuel price" hint="per litre, for the money figure"><input value={add.fuel_price} onChange={(e) => setAdd({ ...add, fuel_price: e.target.value })} type="number" step="0.01" className={inputCls} style={inputStyle} /></Field>
            <Field label="Currency">
              <select value={add.currency} onChange={(e) => setAdd({ ...add, currency: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="UGX">UGX</option><option value="USD">USD</option><option value="EUR">EUR</option>
              </select>
            </Field>
          </div>

          {msg && <p className="text-sm mt-3" style={{ color: "#C0392B" }}>{msg}</p>}
          <button
            onClick={create}
            disabled={adding}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: "#C5B27A", color: "#1E1E1E", opacity: adding ? 0.7 : 1 }}
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Start trial
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty label="No trials yet. Start one when a client agrees to fit a device to one of their vehicles." />
      ) : (
        <div className="space-y-2.5">
          {list.map((t) => (
            <Link
              key={t.id}
              href={`/admin/fet-trials/${t.id}`}
              className="flex items-center gap-3 p-4 bg-white rounded-[18px] border border-black/[0.05] hover:border-black/[0.12] transition-colors"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.12)", color: "#7A6020" }}>
                <FlaskConical className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{t.client_company}</span>
                  <span className="text-[11px]" style={{ color: "#BBB" }}>{t.reference}</span>
                </div>
                <p className="text-xs truncate" style={{ color: "#999" }}>
                  {t.registration ? `${t.registration} · ` : ""}
                  {STATUS_LABEL[t.status] ?? t.status}
                  {t.installed_on ? ` · fitted ${fmtDate(t.installed_on)}` : ""}
                  {` · ${t.trips_count} trip${t.trips_count === 1 ? "" : "s"}`}
                </p>
              </div>

              {t.open_findings > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: "rgba(158,59,51,0.09)", color: "#9E3B33" }}>
                  <AlertCircle className="w-3 h-3" />{t.open_findings}
                </span>
              )}

              {/* A percentage only ever appears when the evidence carries it. */}
              {t.saving_pct !== null ? (
                <span className="text-sm font-bold px-3 py-1.5 rounded-full shrink-0" style={CONFIDENCE_STYLE[t.confidence]}>
                  {t.saving_pct > 0 ? `${t.saving_pct}% saved` : `${Math.abs(t.saving_pct)}% worse`}
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={CONFIDENCE_STYLE[t.confidence]}>
                  {CONFIDENCE_LABEL[t.confidence]}
                </span>
              )}

              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#CCC" }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return <p className="text-[10px] font-bold uppercase tracking-wide mt-4 mb-2" style={{ color: "#AAA" }}>{label}</p>;
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
