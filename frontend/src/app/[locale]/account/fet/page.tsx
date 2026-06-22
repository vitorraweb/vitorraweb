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

const money = (c: string, a: number | null): string => {
  if (a === null) return "—";
  if (c === "USD" || c === "EUR") return `${c === "USD" ? "$" : "€"}${(a / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return `UGX ${a.toLocaleString("en-US")}`;
};
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function AccountFet() {
  const t = useTranslations("account");
  const [list, setList] = useState<Install[] | null>(null);

  const load = () => apiCustomer<{ data: Install[] }>("/account/fet").then((r) => setList(r.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  if (!list) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-[28px] border border-black/[0.05] shadow-card p-14 text-center">
        <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}><Gauge className="w-6 h-6" /></span>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#999" }}>{t("fetEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {list.map((i) => <InstallCard key={i.id} install={i} onLogged={load} />)}
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
  const inp = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
  const inpStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

  return (
    <div className="bg-white rounded-[24px] border border-black/[0.05] shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        <span className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.12)", color: "#7A6020" }}><Gauge className="w-5 h-5" /></span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{install.vehicle ?? install.tier_label}</p>
          <p className="text-xs" style={{ color: "#999" }}>{t("fetDevice")}: {install.device_model} · {install.reference}</p>
        </div>
        {s.has_enough_data && (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full shrink-0" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}>
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
        <div className="px-5 py-4 flex items-center gap-2 text-sm" style={{ color: "#999" }}>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F2F2F2", color: "#999" }}>{t("fetCollecting")}</span>
          {t("fetNoReadings")}
        </div>
      )}

      {/* Log a fill-up */}
      <div className="px-5 pb-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: "#777" }}><Fuel className="w-3.5 h-3.5" />{t("fetLogTitle")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
          <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>{t("fetDate")}<input value={form.logged_on} onChange={(e) => setForm({ ...form, logged_on: e.target.value })} type="date" className={inp} style={inpStyle} /></label>
          <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>{t("fetOdometer")}<input value={form.odometer_km} onChange={(e) => setForm({ ...form, odometer_km: e.target.value })} type="number" className={inp} style={inpStyle} /></label>
          <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>{t("fetLitres")}<input value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} type="number" step="0.1" className={inp} style={inpStyle} /></label>
          <label className="text-[11px] flex flex-col gap-1" style={{ color: "#999" }}>{t("fetCost")} ({install.currency})<input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} type="number" className={inp} style={inpStyle} /></label>
          <button onClick={submit} disabled={busy} className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: "#1E1E1E", color: "#fff", opacity: busy ? 0.7 : 1 }}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{t("fetAdd")}</button>
        </div>
        {msg && <p className="text-sm mt-2" style={{ color: "#16A34A" }}>{msg}</p>}

        {install.logs.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs" style={{ color: "#aaa" }}>{install.logs.length} {t("fetReadings").toLowerCase()} · {fmtDate(install.logs[install.logs.length - 1].logged_on)}</p>
            {s.has_enough_data && (
              <button onClick={cert} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}><FileDown className="w-3.5 h-3.5" />{t("fetCertificate")}</button>
            )}
          </div>
        )}
      </div>
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
