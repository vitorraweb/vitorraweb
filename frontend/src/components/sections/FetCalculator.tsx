"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Fuel, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import {
  FET_TIERS,
  SAVINGS,
  DEFAULT_FUEL_PRICE_EUR,
  computeSavings,
  formatEur,
  type FetTier,
} from "@/lib/fet-pricing";

/* ─── FET Savings Calculator ──────────────────────────────────────────────────
   Interactive estimator: pick a vehicle tier and fleet size, set annual distance,
   fuel price, and an expected-savings %, and see estimated annual saving, payback
   period, and CO₂ avoided. The device cost is read from the selected tier's real
   selling price, so payback is grounded in actual pricing — not a placeholder.

   The savings slider is anchored to the 13.9% field-verified result shown above
   on the page. Fleet size scales the headline figures — the decisive lever for a
   B2B fleet buyer. Every result ends in a prefilled "Request a Quote".          */

/* Parse a user-typed number, tolerating empty / partial input during editing. */
function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/* Whole-number kg with thousands separators, e.g. "5,069 kg". */
function formatKg(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} kg`;
}

/* Position of the verified marker along the slider track, as a %. */
const VERIFIED_LEFT_PCT =
  ((SAVINGS.verified - SAVINGS.min) / (SAVINGS.max - SAVINGS.min)) * 100;

export default function FetCalculator() {
  const [tier, setTier] = useState<FetTier>(FET_TIERS[0]);
  const [vehicles, setVehicles] = useState("1");
  const [annualKm, setAnnualKm] = useState(String(FET_TIERS[0].defaultAnnualKm));
  const [fuelPrice, setFuelPrice] = useState(String(DEFAULT_FUEL_PRICE_EUR));
  const [savingsPct, setSavingsPct] = useState<number>(SAVINGS.default);

  /* Switching vehicle resets the annual distance to that segment's typical
     figure, so the estimate stays sensible without forcing the user to retype. */
  const selectTier = (t: FetTier) => {
    setTier(t);
    setAnnualKm(String(t.defaultAnnualKm));
  };

  const fleet = Math.max(1, Math.floor(num(vehicles) || 1));
  const verifiedActive = Math.abs(savingsPct - SAVINGS.verified) < 0.05;

  const result = useMemo(
    () =>
      computeSavings({
        annualKm: num(annualKm),
        fuelPriceEur: num(fuelPrice),
        savingsPct,
        baselineLPer100: tier.baselineLPer100,
        deviceCostEur: tier.priceEur,
        vehicles: fleet,
      }),
    [annualKm, fuelPrice, savingsPct, tier, fleet]
  );

  /* Hand the estimate to the enquiry form via a prefilled message. */
  const enquireHref = useMemo(() => {
    const saving = formatEur(result.annualSavingEurFleet, { decimals: 0 });
    const payback =
      result.paybackYears != null ? `${result.paybackYears.toFixed(1)} years` : "n/a";
    const fleetText = fleet > 1 ? `a fleet of ${fleet} × ${tier.label}` : `my ${tier.label}`;
    const message =
      `I'd like a Fuel Eco Tech quote for ${fleetText} (${tier.model}). ` +
      `Based on the savings calculator — ${num(annualKm).toLocaleString("en-US")} km/year per vehicle ` +
      `at €${num(fuelPrice).toFixed(2)}/L and ${savingsPct}% expected savings — ` +
      `the estimated annual saving is ${saving} (≈ ${formatKg(result.co2KgFleet)} CO₂ avoided) ` +
      `with a payback of ~${payback}. Please send tailored options.`;
    const q = new URLSearchParams({
      sector: "FET",
      vehicle: tier.id,
      fleet: String(fleet),
      message,
    });
    return `/enquire?${q.toString()}`;
  }, [tier, fleet, annualKm, fuelPrice, savingsPct, result]);

  return (
    <section className="section-padding" style={{ backgroundColor: "#F2F2F2" }}>
      <div className="container-max grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-center">

        {/* ── Left — intro ─────────────────────────────────────────────── */}
        <Reveal>
          <span className="eyebrow block mb-3">Savings calculator</span>
          <h2
            className="mb-5"
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#1E1E1E",
              maxWidth: "440px",
            }}
          >
            How much could your fleet save?
          </h2>
          <p className="mb-7" style={{ fontSize: "16px", lineHeight: 1.78, color: "#555555", maxWidth: "420px" }}>
            Enter your vehicles and usage to see an estimated annual fuel saving,
            payback period, and CO₂ avoided. Your real figures are confirmed in a
            free assessment.
          </p>
          <a
            href="#fet-pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "#7A6020" }}
          >
            See full line pricing
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </Reveal>

        {/* ── Right — calculator card ──────────────────────────────────── */}
        <Reveal delay={120}>
          <div
            className="rounded-[28px] p-6 md:p-8 shadow-card"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            {/* Vehicle type */}
            <Field label="Vehicle type">
              <div className="grid grid-cols-2 gap-2.5">
                {FET_TIERS.map((t) => {
                  const selected = t.id === tier.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTier(t)}
                      className="text-left px-3.5 py-3 rounded-2xl border transition-all"
                      style={{
                        borderColor: selected ? "#C5B27A" : "rgba(0,0,0,0.10)",
                        background: selected ? "rgba(197,178,122,0.10)" : "#FFFFFF",
                      }}
                    >
                      <span className="block text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                        {t.label}
                      </span>
                      <span className="block text-[11px] mt-0.5" style={{ color: "#999999" }}>
                        {t.model}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Numeric inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <Field label="Fleet size">
                <NumberInput value={vehicles} onChange={setVehicles} inputMode="numeric" min={1} />
              </Field>
              <Field label="Annual km (each)">
                <NumberInput value={annualKm} onChange={setAnnualKm} inputMode="numeric" />
              </Field>
              <Field label="Fuel price (€/L)">
                <NumberInput value={fuelPrice} onChange={setFuelPrice} inputMode="decimal" step="0.01" />
              </Field>
              <Field label="Device (each)">
                <div
                  className="h-11 rounded-xl px-3.5 flex items-center text-sm font-semibold"
                  style={{ background: "#F2F2F2", color: "#1E1E1E", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {formatEur(tier.priceEur)}
                </div>
              </Field>
            </div>

            {/* Savings slider */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-2">
                <Label>Expected fuel savings</Label>
                <span
                  style={{
                    fontFamily: "var(--font-playfair, Georgia, serif)",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#7A6020",
                  }}
                >
                  {savingsPct}%
                </span>
              </div>

              <div className="relative">
                {/* Field-verified marker */}
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 z-0"
                  style={{ left: `${VERIFIED_LEFT_PCT}%`, transform: "translateX(-50%)" }}
                >
                  <span style={{ display: "block", width: "2px", height: "10px", background: "#7A6020", borderRadius: "2px", opacity: 0.6 }} />
                </span>
                <input
                  type="range"
                  min={SAVINGS.min}
                  max={SAVINGS.max}
                  step={0.1}
                  value={savingsPct}
                  onChange={(e) => setSavingsPct(Number(e.target.value))}
                  className="relative z-10 w-full"
                  style={{ accentColor: "#C5B27A" }}
                  aria-label="Expected fuel savings percentage"
                />
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-[11px]" style={{ color: "#999999" }}>Conservative {SAVINGS.min}%</span>
                <span className="text-[11px]" style={{ color: "#999999" }}>Optimistic {SAVINGS.max}%</span>
              </div>

              {/* Anchor to the proven field result */}
              <button
                type="button"
                onClick={() => setSavingsPct(SAVINGS.verified)}
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
                style={{
                  background: verifiedActive ? "#C5B27A" : "rgba(197,178,122,0.12)",
                  color: verifiedActive ? "#1E1E1E" : "#7A6020",
                  border: "1px solid rgba(197,178,122,0.4)",
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Use field-verified {SAVINGS.verified}%
              </button>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-7">
              <Result
                label="Annual savings"
                value={formatEur(result.annualSavingEurFleet, { decimals: 0 })}
                sub={fleet > 1 ? `Across ${fleet} vehicles` : "Per year with FET"}
              />
              <Result
                label="Payback period"
                value={result.paybackYears != null ? `${result.paybackYears.toFixed(1)} yr` : "—"}
                sub="Time to break even"
              />
              <Result
                label="CO₂ avoided"
                value={formatKg(result.co2KgFleet)}
                sub="Lower emissions / year"
              />
            </div>

            {/* Fleet investment summary */}
            {fleet > 1 && (
              <p className="mt-4 text-center text-[12px]" style={{ color: "#666666" }}>
                Total device investment{" "}
                <span style={{ color: "#1E1E1E", fontWeight: 600 }}>{formatEur(result.deviceCostFleet, { decimals: 0 })}</span>
                {" "}· {formatEur(tier.priceEur)} per vehicle, installed
              </p>
            )}

            {/* CTA */}
            <Link
              href={enquireHref}
              className="btn-primary w-full justify-center mt-5"
              style={{ borderRadius: "16px" }}
            >
              <Fuel className="w-4 h-4" />
              Request a Quote
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: "#9A9A9A" }}>
              Estimates based on field and lab test data. Actual savings vary by
              vehicle condition and driving pattern.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Small presentational helpers ───────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#999999" }}>
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2">
        <Label>{label}</Label>
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  inputMode,
  step,
  min = 0,
}: {
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric" | "decimal";
  step?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl px-3.5 text-sm font-medium outline-none transition-colors"
      style={{ background: "#FFFFFF", color: "#1E1E1E", border: "1px solid rgba(0,0,0,0.12)" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#C5B27A")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)")}
    />
  );
}

function Result({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      className="rounded-2xl p-5 text-center"
      style={{ backgroundColor: "#161616" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
          fontSize: "clamp(24px, 3.4vw, 34px)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "#C5B27A",
        }}
      >
        {value}
      </p>
      <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</p>
    </div>
  );
}
