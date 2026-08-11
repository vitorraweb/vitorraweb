"use client";

import { CheckCircle2, AlertTriangle, MapPin, ArrowRight } from "lucide-react";
import {
  type Trial, type RouteRow, UNMATCHED_REASON, fmtNumber, fmtMoney, fmtTonnes,
} from "@/lib/fet-trials";
import { RouteDotPlot, ExpectedVsActual, LoadScatter, TripTimeline } from "./FetTrialCharts";

/**
 * What the trial currently proves — or, far more often early on, what it does
 * not yet prove and exactly what would fix that.
 *
 * The design rule is strict by intent: no saving figure is shown as a headline
 * unless the analysis says the evidence carries it. A number that collapses
 * under a client's questioning damages the deal more than an honest "the trial
 * is still running".
 */
export default function FetTrialResult({
  trial,
  onGoToTab,
}: {
  trial: Trial;
  onGoToTab: (tab: "trips" | "findings" | "import") => void;
}) {
  const a = trial.analysis;
  const h = a.headline;

  return (
    <div className="space-y-5">
      {a.verdict && h ? (
        <div className="bg-white rounded-[20px] border p-6" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#16A34A" }}>
            <CheckCircle2 className="w-4 h-4" />The trial has a result
          </span>
          <p className="text-lg leading-relaxed" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
            {a.verdict.statement}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <Stat
              label={a.verdict.direction === "saving" ? "Fuel saved" : "Extra fuel used"}
              value={`${Math.abs(h.saving_pct)}%`}
              hint={`vs ${a.verified_pct}% independently verified`}
              highlight
            />
            <Stat label="Litres" value={`${fmtNumber(Math.abs(h.litres_saved))} L`} hint={`over ${fmtNumber(h.distance_km)} km`} />
            <Stat label="Money" value={fmtMoney(a.currency, h.cost_saved)} hint={a.fuel_price ? `at ${fmtMoney(a.currency, a.fuel_price)}/litre` : "set a fuel price to show this"} />
            <Stat label="CO₂ avoided" value={`${fmtNumber(h.co2_saved_kg)} kg`} hint={`${h.matched_trial_trips} comparable trips`} />
          </div>

          <p className="text-xs mt-4 leading-relaxed" style={{ color: "#999" }}>
            Measured on the client&rsquo;s own readings across {h.matched_routes} route{h.matched_routes === 1 ? "" : "s"} where
            like was compared with like: {fmtNumber(h.expected_litres)} litres expected at the earlier rate,
            {" "}{fmtNumber(h.actual_litres)} litres actually used.
          </p>
        </div>
      ) : (
        <NoResultYet trial={trial} onGoToTab={onGoToTab} />
      )}

      {/* The charts carry the argument; the table below carries the exact
          numbers behind it. Each renders only when it has something to say. */}
      <RouteDotPlot trial={trial} />
      <ExpectedVsActual trial={trial} />
      <LoadScatter trial={trial} />
      <TripTimeline trial={trial} />

      {/* Per-route detail — always shown, because it is what makes the headline
          (or its absence) explicable to a client. */}
      <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>Route by route</p>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "#999" }}>
          Fuel use varies far more between destinations than any device changes it, so every comparison is made within a
          single route and only then added up. A route needs at least {trial.min_baseline_trips_per_route} trips from
          before the device was fitted before it can anchor anything.
        </p>

        {a.routes.length === 0 ? (
          <p className="text-sm" style={{ color: "#BBB" }}>No trips recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: "#454545" }}>
              <thead>
                <tr className="text-[10px] uppercase tracking-wide" style={{ color: "#999" }}>
                  <th className="text-left font-semibold py-2">Destination</th>
                  <th className="text-right font-semibold px-3">Before</th>
                  <th className="text-right font-semibold px-3">After</th>
                  <th className="text-right font-semibold px-3">Change</th>
                  <th className="text-left font-semibold pl-3">Counts?</th>
                </tr>
              </thead>
              <tbody>
                {a.routes.map((r) => <RouteLine key={r.route_key} row={r} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {a.unmatched_trial_trips.length > 0 && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
          <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>Trips that cannot be counted yet</p>
          <p className="text-xs mb-4" style={{ color: "#999" }}>
            These journeys are real and recorded — they simply have nothing comparable to be measured against.
          </p>
          <div className="space-y-2.5">
            {a.unmatched_trial_trips.map((u) => (
              <div key={u.route_label} className="rounded-2xl p-3.5" style={{ background: "#F7F7F5" }}>
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{u.route_label}</span>
                  <span className="text-xs" style={{ color: "#999" }}>
                    {u.trips} trip{u.trips === 1 ? "" : "s"} · {fmtNumber(u.km)} km · {u.l_per_100} L/100km
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#777" }}>{u.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** The honest empty state: what is missing, and what to do about it. */
function NoResultYet({
  trial,
  onGoToTab,
}: {
  trial: Trial;
  onGoToTab: (tab: "trips" | "findings" | "import") => void;
}) {
  const a = trial.analysis;
  const blocking = a.blocking_flags.length;

  return (
    <div className="bg-white rounded-[20px] border p-6" style={{ borderColor: "rgba(138,90,24,0.28)" }}>
      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#8A5A18" }}>
        <AlertTriangle className="w-4 h-4" />
        {a.confidence.level === "low" ? "Result is held back" : "No result yet"}
      </span>
      <p className="text-lg leading-snug mb-4" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
        {a.confidence.level === "low"
          ? "There is a figure, but questions are still open on the trips behind it."
          : "This trial cannot yet prove anything, in either direction."}
      </p>

      {a.confidence.shortfall.length > 0 && (
        <ul className="space-y-2 mb-4">
          {a.confidence.shortfall.map((line, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: "#454545" }}>
              <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#C5B27A" }} />
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <Stat label="Before the device" value={`${a.counts.baseline_measurable}`} hint="usable trips" />
        <Stat
          label="After the device"
          value={`${a.counts.trial_recorded}`}
          hint={a.counts.trial_held > 0
            ? `${a.counts.trial_measurable} countable · ${a.counts.trial_held} held`
            : `${trial.required_matched_trips} comparable needed`}
          highlight
        />
        <Stat label="Need review" value={`${a.counts.needs_review}`} hint="held out of the maths" />
        <Stat label="Left out" value={`${a.counts.excluded}`} hint="excluded by hand" />
      </div>

      {a.routes_ready.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(197,178,122,0.1)" }}>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#7A6020" }}>
            <MapPin className="w-3.5 h-3.5" />Ready to measure against
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#454545" }}>
            {a.routes_ready.map((r) => `${r.route_label} (${r.baseline_trips} earlier trips, ${r.l_per_100} L/100km)`).join(" · ")}
          </p>
          <p className="text-xs mt-2" style={{ color: "#8A7B52" }}>
            A trip down {a.routes_ready.length === 1 ? "this route" : "any of these"} can be compared straight away.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {blocking > 0 && (
          <button
            onClick={() => onGoToTab("findings")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full"
            style={{ background: "rgba(158,59,51,0.09)", color: "#9E3B33" }}
          >
            Settle {blocking} question{blocking === 1 ? "" : "s"}<ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        {trial.trips.length === 0 && (
          <button
            onClick={() => onGoToTab("import")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full"
            style={{ background: "#C5B27A", color: "#1E1E1E" }}
          >
            Upload the client&rsquo;s file<ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function RouteLine({ row }: { row: RouteRow }) {
  const change = row.change_pct;

  return (
    <tr className="border-t" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
      <td className="py-2.5">
        <span className="font-medium" style={{ color: row.matched ? "#1E1E1E" : "#777" }}>{row.route_label}</span>
        {row.baseline_load_kg !== null && (
          <span className="text-[11px] block" style={{ color: "#BBB" }}>{fmtTonnes(row.baseline_load_kg)} typical load</span>
        )}
      </td>
      <td className="text-right px-3 tabular-nums">
        {row.baseline ? (
          <>
            {row.baseline.l_per_100}
            <span className="text-[11px] block" style={{ color: "#BBB" }}>{row.baseline.trips} trip{row.baseline.trips === 1 ? "" : "s"}</span>
          </>
        ) : <span style={{ color: "#CCC" }}>—</span>}
      </td>
      <td className="text-right px-3 tabular-nums">
        {row.trial ? (
          <>
            {row.trial.l_per_100}
            <span className="text-[11px] block" style={{ color: "#BBB" }}>{row.trial.trips} trip{row.trial.trips === 1 ? "" : "s"}</span>
          </>
        ) : row.trial_held ? (
          // The journey happened and has figures — it simply cannot be counted
          // while a question stands against it. Hiding it read as "no data".
          <>
            <span style={{ color: "#8A5A18" }}>{row.trial_held.l_per_100}</span>
            <span className="text-[11px] block" style={{ color: "#B79A6B" }}>
              {row.trial_held.trips} trip{row.trial_held.trips === 1 ? "" : "s"} · not counted
            </span>
          </>
        ) : <span style={{ color: "#CCC" }}>—</span>}
      </td>
      <td className="text-right px-3 tabular-nums font-semibold">
        {change === null ? (
          <span style={{ color: "#CCC" }}>—</span>
        ) : (
          <span style={{ color: row.matched ? (change > 0 ? "#16A34A" : "#9E3B33") : "#BBB" }}>
            {change > 0 ? "−" : "+"}{Math.abs(change)}%
          </span>
        )}
      </td>
      <td className="pl-3">
        {row.matched ? (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>Counted</span>
        ) : (
          <span className="text-[11px]" style={{ color: "#AAA" }}>
            {UNMATCHED_REASON[row.unmatched_reason ?? ""] ?? "Not comparable"}
            {row.unmatched_reason === "load_mismatch" && row.load_gap_pct !== null ? ` (${row.load_gap_pct}% apart)` : ""}
          </span>
        )}
      </td>
    </tr>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: highlight ? "rgba(197,178,122,0.1)" : "#F7F7F5" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>{label}</p>
      <p className="font-bold tabular-nums" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", color: highlight ? "#7A6020" : "#1E1E1E" }}>{value}</p>
      {hint && <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "#aaa" }}>{hint}</p>}
    </div>
  );
}
