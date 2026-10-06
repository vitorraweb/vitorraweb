"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Gauge, TrendingDown, Plus, FileDown, Fuel } from "lucide-react";
import { apiCustomer, downloadCustomerFile } from "@/lib/customer-auth";

type Savings = {
  currency: string; baseline_l_per_100: number | null; measured_l_per_100: number | null;
  distance_km: number; reduction_pct: number | null; litres_saved: number | null;
  money_saved: number | null; co2_saved_kg: number | null; verified_pct: number;
  after_log_count: number; has_enough_data: boolean;
};
type FuelLog = { id: number; logged_on: string; odometer_km: number | null; litres: number; cost: number | null; phase: string };
type Install = {
  id: number; reference: string; vehicle: string | null; tier_label: string;
  device_model: string | null; currency: string; installed_on: string | null;
  status: string; savings: Savings; logs: FuelLog[];
};
type Fleet = {
  vehicles: number; vehicles_with_data: number;
  by_currency: Record<string, { vehicles: number; litres_saved: number; money_saved: number; co2_saved_kg: number }>;
  total_litres_saved: number; total_co2_saved_kg: number; avg_reduction_pct: number | null;
};

const money = (c: string, a: number | null): string => {
  if (a === null) return "—";
  if (c === "USD" || c === "EUR") return `${c === "USD" ? "$" : "€"}${(a / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return `UGX ${a.toLocaleString("en-US")}`;
};
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function AccountFet() {
  const t = useTranslations("account");
  const [list, setList] = useState<Install[] | null>(null);
  const [fleet, setFleet] = useState<Fleet | null>(null);

  const load = () => apiCustomer<{ data: Install[]; fleet: Fleet }>("/account/fet")
    .then((r) => { setList(r.data); setFleet(r.fleet); })
    .catch(() => setList([]));
  useEffect(() => { load(); }, []);

  if (!list) return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  if (list.length === 0) {
    return (
      <div className="bg-paper rounded-frame border border-line p-14 text-center">
        <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full bg-paper-deep text-gold-ink"><Gauge className="w-6 h-6" /></span>
        <p className="text-sm max-w-md mx-auto text-ink-muted">{t("fetEmpty")}</p>
      </div>
    );
  }

  // Fleet band — only meaningful with more than one vehicle that has data.
  const showFleet = fleet && fleet.vehicles > 1 && fleet.vehicles_with_data > 0;

  return (
    <div className="space-y-5">
      {showFleet && (
        <div className="rounded-frame p-6 text-white relative overflow-hidden bg-ink">
          <div aria-hidden className="hero-aurora-right" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">{t("fetFleetTitle")}</span>
              <span className="text-xs text-ink-fg-muted">{t("fetFleetVehicles", { n: fleet!.vehicles })}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FleetStat label={t("fetAvgReduction")} value={fleet!.avg_reduction_pct != null ? `${fleet!.avg_reduction_pct}%` : "—"} highlight />
              {Object.entries(fleet!.by_currency).filter(([, v]) => v.money_saved > 0).slice(0, 1).map(([cur, v]) => (
                <FleetStat key={cur} label={t("fetTotalSaved")} value={money(cur, v.money_saved)} />
              ))}
              <FleetStat label={t("fetTotalFuel")} value={`${fleet!.total_litres_saved} L`} />
              <FleetStat label="CO₂" value={`${fleet!.total_co2_saved_kg} kg`} />
            </div>
          </div>
        </div>
      )}
      {list.map((i) => <InstallCard key={i.id} install={i} onLogged={load} />)}
    </div>
  );
}

function FleetStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="t-label text-[0.6875rem] mb-1 text-ink-fg-muted">{label}</p>
      <p className={`font-display text-[1.75rem] leading-none [font-variant-numeric:lining-nums_tabular-nums] ${highlight ? "text-gold" : "text-ink-fg"}`}>{value}</p>
    </div>
  );
}

function InstallCard({ install, onLogged }: { install: Install; onLogged: () => void }) {
  const t = useTranslations("account");
  const s = install.savings;
  const [form, setForm] = useState({ logged_on: "", odometer_km: "", litres: "", cost: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!form.logged_on || !form.litres) { setMsg(""); return; }
    setBusy(true); setMsg("");
    try {
      await apiCustomer(`/account/fet/${install.reference}/logs`, {
        method: "POST",
        body: JSON.stringify({
          logged_on: form.logged_on, litres: Number(form.litres),
          odometer_km: form.odometer_km ? Number(form.odometer_km) : null,
          cost: form.cost ? Number(form.cost) : null,
        }),
      });
      setForm({ logged_on: "", odometer_km: "", litres: "", cost: "" });
      setMsg(t("fetLogged"));
      onLogged();
    } catch { /* surfaced via reload */ }
    finally { setBusy(false); }
  };

  const cert = () => downloadCustomerFile(`/account/fet/${install.reference}/certificate`, `fet-savings-${install.reference}.pdf`).catch(() => {});
  const inp = "h-11 w-full rounded-edge px-3 t-small bg-white text-ink border border-line-strong outline-none focus:border-ink transition-colors";
  
  return (
    <div className="bg-paper rounded-frame border border-line overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-line">
        <span className="flex items-center justify-center w-11 h-11 rounded-edge shrink-0 bg-paper-deep text-gold-ink"><Gauge className="w-5 h-5" /></span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink">{install.vehicle ?? install.tier_label}</p>
          <p className="text-xs text-ink-muted">{t("fetDevice")}: {install.device_model} · {install.reference}</p>
        </div>
        {s.has_enough_data && (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full shrink-0 bg-paper-deep text-ok-ink">
            <TrendingDown className="w-3.5 h-3.5" />{s.reduction_pct}%
          </span>
        )}
      </div>

      {/* Savings */}
      {s.has_enough_data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-5">
          <Stat label={t("fetReduction")} value={`${s.reduction_pct}%`} hint={t("fetVerified", { pct: s.verified_pct })} highlight />
          <Stat label={t("fetBeforeAfter")} value={`${s.baseline_l_per_100} → ${s.measured_l_per_100}`} />
          <Stat label={t("fetFuelSaved")} value={`${s.litres_saved} L`} hint={t("fetDistanceMeasured", { km: s.distance_km.toLocaleString() })} />
          <Stat label={t("fetMoneySaved")} value={money(s.currency, s.money_saved)} hint={s.co2_saved_kg != null ? t("fetCo2", { kg: s.co2_saved_kg }) : ""} />
        </div>
      ) : (
        <div className="px-5 py-4 flex items-center gap-2 text-sm text-ink-muted">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-paper-deep text-ink-muted">{t("fetCollecting")}</span>
          {t("fetNoReadings")}
        </div>
      )}

      {/* Log a fill-up */}
      <div className="px-5 pb-5">
        <p className="inline-flex items-center gap-1.5 t-label mb-2.5 text-ink-muted"><Fuel className="w-3.5 h-3.5" />{t("fetLogTitle")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
          <label className="t-label text-[0.6875rem] flex flex-col gap-1.5 text-ink-muted">{t("fetDate")}<input value={form.logged_on} onChange={(e) => setForm({ ...form, logged_on: e.target.value })} type="date" className={inp} /></label>
          <label className="t-label text-[0.6875rem] flex flex-col gap-1.5 text-ink-muted">{t("fetOdometer")}<input value={form.odometer_km} onChange={(e) => setForm({ ...form, odometer_km: e.target.value })} type="number" className={inp} /></label>
          <label className="t-label text-[0.6875rem] flex flex-col gap-1.5 text-ink-muted">{t("fetLitres")}<input value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} type="number" step="0.1" className={inp} /></label>
          <label className="t-label text-[0.6875rem] flex flex-col gap-1.5 text-ink-muted">{t("fetCost")} ({install.currency})<input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} type="number" className={inp} /></label>
          <button onClick={submit} disabled={busy} className="q-btn min-h-11 px-4 bg-ink text-paper hover:bg-black disabled:opacity-70">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{t("fetAdd")}</button>
        </div>
        {msg && <p className="text-sm mt-2 text-ok-ink">{msg}</p>}

        {install.logs.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-ink-muted">{install.logs.length} {t("fetReadings").toLowerCase()} · {fmtDate(install.logs[install.logs.length - 1].logged_on)}</p>
            {s.has_enough_data && (
              <button onClick={cert} className="q-btn min-h-10 px-4 border border-line-strong text-ink hover:border-ink"><FileDown className="w-3.5 h-3.5" />{t("fetCertificate")}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-frame p-4 border ${highlight ? "border-gold bg-paper" : "border-line bg-paper-deep"}`}>
      <p className="t-label text-[0.6875rem] mb-1 text-ink-muted">{label}</p>
      <p className={`font-display text-[1.375rem] leading-none mt-1 [font-variant-numeric:lining-nums_tabular-nums] ${highlight ? "text-gold-ink" : "text-ink"}`}>{value}</p>
      {hint && <p className="text-[11px] mt-0.5 text-ink-muted">{hint}</p>}
    </div>
  );
}
