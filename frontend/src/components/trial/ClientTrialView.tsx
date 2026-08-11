"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, FileDown, CheckCircle2, AlertTriangle, MapPin } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { type Trial, fmtNumber, fmtDate, fmtMoney, UNMATCHED_REASON } from "@/lib/fet-trials";
import { RouteDotPlot, ExpectedVsActual, LoadScatter } from "@/components/admin/FetTrialCharts";

/**
 * What the client sees. Deliberately the same strict standard as the internal
 * view: where the evidence does not carry a result, this page says so and lists
 * what is still needed, rather than showing a figure with a caveat beside it.
 *
 * The API already strips what a client should not see — contact records,
 * internal notes, the device serial, our open questions about their data, and
 * driver names unless the link was explicitly issued with them.
 */
export default function ClientTrialView({ token }: { token: string }) {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/trials/${token}`, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "This link is no longer active.");
        return;
      }
      const body = await res.json();
      setTrial(body.data);
    } catch {
      setError("We could not load this page. Please try again, or contact your Vitorra representative.");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Shell>
        <div className="rounded-[20px] border p-8 text-center" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
          <p className="text-lg mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>{error}</p>
          <p className="text-sm" style={{ color: "#999" }}>Please contact your Vitorra representative for an up-to-date link.</p>
        </div>
      </Shell>
    );
  }

  if (!trial) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: "#999" }}>
          <Loader2 className="w-4 h-4 animate-spin" />Loading your trial…
        </div>
      </Shell>
    );
  }

  return <ClientTrialReport trial={trial} token={token} />;
}

/** The report itself. Takes its data as a prop — no fetching, so it renders
 *  identically wherever it is used and can be reviewed on its own. */
export function ClientTrialReport({ trial, token }: { trial: Trial; token: string }) {
  const a = trial.analysis;
  const h = a.headline;

  return (
    <Shell>
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#7A6020" }}>
          Fuel Eco Tech · trial report
        </p>
        <h1 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
          {trial.client_company}
        </h1>
        <p className="text-sm mt-2" style={{ color: "#777" }}>
          {[trial.registration, trial.vehicle_make, trial.vehicle_type].filter(Boolean).join(" · ")}
          {trial.installed_on ? ` · device fitted ${fmtDate(trial.installed_on)}` : ""}
        </p>
      </header>

      {a.verdict && h ? (
        <section className="rounded-[20px] border p-6 sm:p-8 mb-5" style={{ borderColor: "rgba(34,197,94,0.3)", background: "#fff" }}>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#16A34A" }}>
            <CheckCircle2 className="w-4 h-4" />Result
          </span>
          <p className="text-xl sm:text-2xl leading-snug mb-6" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
            {a.verdict.statement}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Stat label={a.verdict.direction === "saving" ? "Fuel saved" : "Extra fuel"} value={`${Math.abs(h.saving_pct)}%`} highlight />
            <Stat label="Litres" value={`${fmtNumber(Math.abs(h.litres_saved))} L`} hint={`over ${fmtNumber(h.distance_km)} km`} />
            <Stat label="Value" value={fmtMoney(a.currency, h.cost_saved)} />
            <Stat label="CO₂ avoided" value={`${fmtNumber(h.co2_saved_kg)} kg`} />
          </div>
        </section>
      ) : (
        <section className="rounded-[20px] border p-6 sm:p-8 mb-5" style={{ borderColor: "rgba(138,90,24,0.28)", background: "#fff" }}>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#8A5A18" }}>
            <AlertTriangle className="w-4 h-4" />The trial is still running
          </span>
          <p className="text-xl sm:text-2xl leading-snug mb-4" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
            There is no conclusion yet — in either direction.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#555" }}>
            We would rather tell you this than show you a number we cannot stand behind. Here is what would settle it.
          </p>
          {a.confidence.shortfall.length > 0 && (
            <ul className="space-y-2 mb-5">
              {a.confidence.shortfall.map((line, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: "#454545" }}>
                  <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#C5B27A" }} />{line}
                </li>
              ))}
            </ul>
          )}
          {a.routes_ready.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(197,178,122,0.1)" }}>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#7A6020" }}>
                <MapPin className="w-3.5 h-3.5" />Ready to measure against
              </p>
              <p className="text-sm" style={{ color: "#454545" }}>
                {a.routes_ready.map((r) => `${r.route_label} (${r.baseline_trips} earlier trips)`).join(" · ")}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5">
            <Stat label="Trips before fitting" value={`${a.counts.baseline_measurable}`} />
            <Stat label="Trips after fitting" value={`${a.counts.trial_measurable}`} highlight />
            <Stat label="Comparable trips needed" value={`${trial.required_matched_trips}`} />
          </div>
        </section>
      )}

      <div className="space-y-5">
        <RouteDotPlot trial={trial} />
        <ExpectedVsActual trial={trial} />
        <LoadScatter trial={trial} />
      </div>

      {a.unmatched_trial_trips.length > 0 && (
        <section className="rounded-[20px] border p-5 mt-5" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>Trips not counted yet</p>
          <p className="text-xs mb-4" style={{ color: "#999" }}>
            These journeys are recorded — they simply have nothing comparable to measure them against.
          </p>
          <div className="space-y-2.5">
            {a.unmatched_trial_trips.map((u) => (
              <div key={u.route_label} className="rounded-2xl p-3.5" style={{ background: "#F7F7F5" }}>
                <p className="font-semibold text-sm mb-1" style={{ color: "#1E1E1E" }}>
                  {u.route_label}
                  <span className="font-normal text-xs ml-2" style={{ color: "#999" }}>
                    {u.trips} trip{u.trips === 1 ? "" : "s"} · {fmtNumber(u.km)} km
                  </span>
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#777" }}>{u.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <a
          href={`${API_BASE_URL}/trials/${token}/pdf`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "#1E1E1E", color: "#fff" }}
        >
          <FileDown className="w-4 h-4" />Download the report
        </a>
        <p className="text-xs" style={{ color: "#AAA" }}>Updated as new trips are recorded.</p>
      </div>

      <footer className="mt-10 pt-6 border-t text-xs leading-relaxed" style={{ borderColor: "rgba(0,0,0,0.08)", color: "#999" }}>
        <p className="mb-2">
          Figures come from your own trip records. Fuel use is worked out by distance — total litres over total
          kilometres — and comparisons are made within a single destination and load profile, so the result reflects
          the device rather than the road.
        </p>
        <p>
          Vitorra Holdings Limited · vitorra.org · Fuel Eco Tech is independently certified at {a.verified_pct}%
          (CTI GmbH, Germany). Figures above are your vehicle&rsquo;s own measured performance, not a guarantee of
          future results.
        </p>
      </footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ background: "#F2F2F2", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <p className="text-sm tracking-[0.16em] uppercase mb-8" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
          Vitorra <span style={{ color: "#C5B27A" }}>Holdings</span>
        </p>
        {children}
      </div>
    </main>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: highlight ? "rgba(197,178,122,0.12)" : "#F7F7F5" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>{label}</p>
      <p className="font-bold tabular-nums" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "22px", color: highlight ? "#7A6020" : "#1E1E1E" }}>{value}</p>
      {hint && <p className="text-[11px] mt-0.5" style={{ color: "#aaa" }}>{hint}</p>}
    </div>
  );
}
