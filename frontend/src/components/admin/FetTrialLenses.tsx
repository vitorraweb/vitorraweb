"use client";

import { Scale, Gauge, Radio, SlidersHorizontal } from "lucide-react";
import { type Trial, fmtNumber } from "@/lib/fet-trials";

/**
 * The three questions a client asks after the headline, answered before they
 * ask them.
 *
 * These came out of an independent assessment of the first trial (S-Line
 * Motors, 11 August 2026), which reached the same distance-efficiency figures
 * we did but read the loaded-return trip very differently. None of them moves
 * the verdict — that stays anchored to distance efficiency — but a result of
 * "20% worse" is indefensible without them, because on the same journeys the
 * truck moved 16% more cargo per litre.
 */
export default function FetTrialLenses({ trial }: { trial: Trial }) {
  const a = trial.analysis;
  const work = a.transport_work;
  const ref = a.reference;
  const second = a.secondary;
  const sens = a.load_sensitivity;

  if (!work && !ref && !second && !sens) return null;

  return (
    <div className="space-y-5">
      {work && (
        <Panel
          icon={<Scale className="w-4 h-4" />}
          title="Cargo moved per litre"
          subtitle="The haulier's measure, alongside the fuel one."
        >
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Figure label="Before" value={`${work.baseline.tkm_per_l}`} unit="t-km/L" hint={`${work.baseline.trips} trips`} />
            <Figure label="After" value={`${work.trial.tkm_per_l}`} unit="t-km/L" hint={`${work.trial.trips} trips`} />
            <Figure
              label="Change"
              value={`${work.change_pct > 0 ? "+" : ""}${work.change_pct}%`}
              tone={work.change_pct > 0 ? "good" : "bad"}
            />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#777" }}>{work.note}</p>
        </Panel>
      )}

      {sens && (
        <Panel
          icon={<SlidersHorizontal className="w-4 h-4" />}
          title={`How much of the ${sens.route_label} result is the extra load?`}
          subtitle={`That trip hauled ${sens.trial_mass_t} tonnes on average against ${sens.baseline_mass_t} before — ${sens.mass_gap_pct}% more.`}
        >
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#777" }}>
            Some of a truck&rsquo;s fuel goes on moving weight and some does not, and nobody knows the exact split without
            leg-by-leg records. So rather than pick a figure, here is the whole range — the answer, and whether it is
            good or bad news, depends on where the truth sits.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: "#454545" }}>
              <thead>
                <tr className="text-[10px] uppercase tracking-wide" style={{ color: "#999" }}>
                  <th className="text-left font-semibold py-2">If this much fuel scales with weight</th>
                  <th className="text-right font-semibold px-3">Adjusted fuel</th>
                  <th className="text-right font-semibold px-3">Adjusted economy</th>
                  <th className="text-right font-semibold">vs before</th>
                </tr>
              </thead>
              <tbody>
                {sens.rows.map((r) => (
                  <tr key={r.mass_dependent_pct} className="border-t" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                    <td className="py-2 tabular-nums">{r.mass_dependent_pct}%</td>
                    <td className="text-right px-3 tabular-nums">{fmtNumber(r.litres, 1)} L</td>
                    <td className="text-right px-3 tabular-nums">{r.km_per_l} km/L</td>
                    <td className="text-right tabular-nums font-semibold" style={{ color: r.change_pct > 0 ? "#16A34A" : "#9E3B33" }}>
                      {r.change_pct > 0 ? "+" : ""}{r.change_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sens.break_even_pct !== null && (
            <p className="text-xs leading-relaxed mt-3 rounded-xl p-3" style={{ background: "rgba(138,90,24,0.07)", color: "#8A5A18" }}>
              The result turns from worse to better at about <strong>{sens.break_even_pct}%</strong>. That the answer flips
              inside a plausible range is the finding: this trip cannot settle the question either way. Only leg-by-leg
              fuel records, or trips carrying the same load as the baseline, can.
            </p>
          )}
        </Panel>
      )}

      {ref && (ref.baseline_pct !== null || ref.trial_pct !== null) && (
        <Panel
          icon={<Gauge className="w-4 h-4" />}
          title="Against the client's own planning figure"
          subtitle={`${trial.client_company} budget on ${ref.km_per_l} km/L for this vehicle.`}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <Figure label="Before the device" value={pct(ref.baseline_pct)} tone={tone(ref.baseline_pct)} />
            <Figure label="After the device" value={pct(ref.trial_pct)} tone={tone(ref.trial_pct)} />
          </div>
          <p className="text-xs leading-relaxed mt-3" style={{ color: "#777" }}>
            This is the number their operation already plans against, so it is the one they will judge by — worth knowing
            where you stand on it before the conversation, not during it.
          </p>
        </Panel>
      )}

      {second && (
        <Panel
          icon={<Radio className="w-4 h-4" />}
          title="The same comparison from their tracker"
          subtitle="An independent second measurement of the same journeys."
        >
          <div className="grid grid-cols-3 gap-2.5">
            <Figure label="Before" value={`${second.baseline.km_per_l}`} unit="km/L" />
            <Figure label="After" value={`${second.trial.km_per_l}`} unit="km/L" />
            <Figure label="Change" value={`${second.change_pct > 0 ? "+" : ""}${second.change_pct}%`} tone={second.change_pct > 0 ? "good" : "bad"} />
          </div>
          <p className="text-xs leading-relaxed mt-3" style={{ color: "#777" }}>
            Two measurements pointing the same way is far stronger evidence than one. Two pointing different ways needs
            settling before anything is shown to the client.
          </p>
        </Panel>
      )}
    </div>
  );
}

const pct = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v}%`);
const tone = (v: number | null): "good" | "bad" | undefined => (v === null ? undefined : v > 0 ? "good" : "bad");

function Panel({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
      <p className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#1E1E1E" }}>
        <span style={{ color: "#7A6020" }}>{icon}</span>{title}
      </p>
      {subtitle && <p className="text-xs mt-0.5 mb-3.5" style={{ color: "#999" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Figure({ label, value, unit, hint, tone }: { label: string; value: string; unit?: string; hint?: string; tone?: "good" | "bad" }) {
  const colour = tone === "good" ? "#16A34A" : tone === "bad" ? "#9E3B33" : "#1E1E1E";
  return (
    <div className="rounded-2xl p-3.5" style={{ background: "#F7F7F5" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>{label}</p>
      <p className="font-bold tabular-nums" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", color: colour }}>
        {value}{unit && <span className="text-[11px] font-normal ml-1" style={{ color: "#AAA" }}>{unit}</span>}
      </p>
      {hint && <p className="text-[11px] mt-0.5" style={{ color: "#AAA" }}>{hint}</p>}
    </div>
  );
}
