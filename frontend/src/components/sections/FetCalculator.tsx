"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, Fuel, Link2, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import {
  FET_TIERS,
  SAVINGS,
  DEFAULT_FUEL_BY_TIER,
  DEFAULT_FUEL_PRICE_UGX,
  estimateSavings,
  kmPerLitreToLPer100,
  lPer100ToKmPerLitre,
  type FetTier,
  type FuelType,
} from "@/lib/fet-pricing";
import { useRates, convert, formatMoney, FALLBACK_RATES, type Money } from "@/lib/currency";

/* ─── FET Savings Calculator ──────────────────────────────────────────────────
   A decision tool, not a brochure. Rebuilt October 2026 after an external
   review found the old version produced a precise-looking figure without ever
   asking how much fuel the customer's own vehicle burns — consumption was
   hard-coded per tier and hidden, money was in EUR at a German pump price, and
   the savings slider bottomed out at a profitable 8%.

   Now:
     • the customer states fuel use (L/100km or km/L) — or simply what they
       spend on fuel a month, which most fleet managers know better;
     • UGX first, with USD / EUR available;
     • the slider reaches 0%, so "what if it saves nothing?" has an answer;
     • petrol and diesel use their own emission factors;
     • every figure still running on an assumption is labelled as one, and the
       arithmetic is printed in full beneath the result;
     • the whole estimate can be shared as a link that re-opens with the same
       inputs — and travels with the enquiry, so sales sees the same numbers.

   Device price is held in EUR (how the business quotes it) and converted for
   display at the indicative rate.                                             */

type ConsumptionUnit = "l100" | "kml";
type Mode = "usage" | "spend";

const CURRENCIES: Money[] = ["UGX", "USD", "EUR"];
const PARAM = "fetcalc"; // presence marks a shared estimate in the URL

/* Parse a user-typed number, tolerating empty / partial input during editing. */
function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/* Trim an editable figure for display in an input (no float noise). */
function tidy(n: number, decimals = 1): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Number(n.toFixed(decimals)));
}

function formatKg(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} kg`;
}

/* Money for the customer's chosen currency. Large UGX figures round to the
   nearest thousand — false precision on an estimate reads as a promise. */
function money(amount: number, currency: Money): string {
  return formatMoney(amount, currency, { roundUgxTo: amount >= 100_000 ? 1000 : 1 });
}

/* Position of the verified marker along the slider track, as a %. */
const VERIFIED_LEFT_PCT =
  ((SAVINGS.verified - SAVINGS.min) / (SAVINGS.max - SAVINGS.min)) * 100;

/* The interactive card itself, split out so it can be reused verbatim inside
   the floating homepage widget (FetCalculatorWidget). */
export function FetCalculatorCard() {
  const tc = useTranslations("fetCalculator");
  const tt = useTranslations("fetTiers");
  const locale = useLocale();
  const { rates: liveRates } = useRates();
  const rates = liveRates ?? FALLBACK_RATES;
  const ratesLive = !!liveRates && liveRates.source !== "fallback";

  const [tier, setTier] = useState<FetTier>(FET_TIERS[0]);
  const [vehicles, setVehicles] = useState("1");
  const [mode, setMode] = useState<Mode>("usage");
  const [currency, setCurrency] = useState<Money>("UGX");
  const [annualKm, setAnnualKm] = useState(String(FET_TIERS[0].defaultAnnualKm));
  const [unit, setUnit] = useState<ConsumptionUnit>("l100");
  const [consumption, setConsumption] = useState(tidy(FET_TIERS[0].baselineLPer100));
  const [fuelPrice, setFuelPrice] = useState(String(DEFAULT_FUEL_PRICE_UGX));
  const [monthlySpend, setMonthlySpend] = useState("");
  const [fuel, setFuel] = useState<FuelType>(DEFAULT_FUEL_BY_TIER[FET_TIERS[0].id]);
  const [savingsPct, setSavingsPct] = useState<number>(SAVINGS.default);

  /* Which inputs the customer has actually supplied. Anything untouched is a
     default and is labelled "assumed" — the honest core of the rebuild. */
  const [touched, setTouched] = useState({ consumption: false, price: false, fuel: false, spend: false });
  const touch = (k: keyof typeof touched) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  /* Re-open a shared estimate. Read from window rather than useSearchParams so
     the card needs no Suspense boundary on either page that hosts it. */
  useEffect(() => {
    setOrigin(window.location.origin);
    const q = new URLSearchParams(window.location.search);
    if (!q.has(PARAM)) return;
    const t = FET_TIERS.find((x) => x.id === q.get("t"));
    if (t) setTier(t);
    if (q.get("n")) setVehicles(q.get("n")!);
    if (q.get("m") === "spend" || q.get("m") === "usage") setMode(q.get("m") as Mode);
    const cur = q.get("cur") as Money | null;
    if (cur && CURRENCIES.includes(cur)) setCurrency(cur);
    if (q.get("km")) setAnnualKm(q.get("km")!);
    if (q.get("lp")) setConsumption(q.get("lp")!);
    if (q.get("fp")) setFuelPrice(q.get("fp")!);
    if (q.get("ms")) setMonthlySpend(q.get("ms")!);
    if (q.get("f") === "petrol" || q.get("f") === "diesel") setFuel(q.get("f") as FuelType);
    const pct = Number(q.get("s"));
    if (Number.isFinite(pct) && pct >= SAVINGS.min && pct <= SAVINGS.max) setSavingsPct(pct);
    /* A shared link carries the sender's real inputs — none are defaults. */
    setTouched({ consumption: true, price: true, fuel: true, spend: true });
  }, []);

  /* Switching vehicle resets distance to that segment's typical figure, and
     consumption / fuel only if the customer hasn't entered their own. */
  const selectTier = (t: FetTier) => {
    setTier(t);
    setAnnualKm(String(t.defaultAnnualKm));
    if (!touched.consumption) {
      setConsumption(tidy(unit === "l100" ? t.baselineLPer100 : lPer100ToKmPerLitre(t.baselineLPer100)));
    }
    if (!touched.fuel) setFuel(DEFAULT_FUEL_BY_TIER[t.id]);
  };

  /* Changing unit converts the figure rather than leaving a number that now
     means something else. */
  const changeUnit = (next: ConsumptionUnit) => {
    if (next === unit) return;
    const v = num(consumption);
    setConsumption(tidy(next === "kml" ? lPer100ToKmPerLitre(v) : kmPerLitreToLPer100(v)));
    setUnit(next);
  };

  /* Changing currency converts the money the customer typed. */
  const changeCurrency = (next: Money) => {
    if (next === currency) return;
    const conv = (v: string, d: number) => tidy(convert(num(v), currency, next, rates), d);
    setFuelPrice(conv(fuelPrice, next === "UGX" ? 0 : 2));
    if (monthlySpend) setMonthlySpend(conv(monthlySpend, next === "UGX" ? 0 : 2));
    setCurrency(next);
  };

  const fleet = Math.max(1, Math.floor(num(vehicles) || 1));
  const lPer100 = unit === "l100" ? num(consumption) : kmPerLitreToLPer100(num(consumption));
  const deviceCost = convert(tier.priceEur, "EUR", currency, rates);
  const verifiedActive = Math.abs(savingsPct - SAVINGS.verified) < 0.05;

  const result = useMemo(
    () =>
      estimateSavings({
        mode,
        annualKm: num(annualKm),
        lPer100,
        monthlySpend: num(monthlySpend),
        fuelPrice: num(fuelPrice),
        fuel,
        savingsPct,
        deviceCost,
        vehicles: fleet,
      }),
    [mode, annualKm, lPer100, monthlySpend, fuelPrice, fuel, savingsPct, deviceCost, fleet]
  );

  const paybackText = (months: number | null): string => {
    if (months == null) return tc("paybackNever");
    if (months < 24) return tc("paybackMonths", { months: Math.max(1, Math.round(months)) });
    return tc("paybackYears", { years: (months / 12).toFixed(1) });
  };

  /* The estimate as a link — every input, so it re-opens exactly. */
  const shareUrl = useMemo(() => {
    const q = new URLSearchParams({
      [PARAM]: "1", t: tier.id, n: String(fleet), m: mode, cur: currency,
      km: annualKm, lp: consumption, fp: fuelPrice, ms: monthlySpend, f: fuel, s: String(savingsPct),
    });
    /* Always point at the FET page, even from the homepage widget. */
    const prefix = locale === "en" ? "" : `/${locale}`;
    return `${origin}${prefix}/products/fuel-eco-tech?${q.toString()}#fet-calculator`;
  }, [origin, locale, tier, fleet, mode, currency, annualKm, consumption, fuelPrice, monthlySpend, fuel, savingsPct]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed"); // shows the link so it can be copied by hand
    }
    window.setTimeout(() => setCopyState("idle"), 4000);
  };

  const consumptionLabel = unit === "l100" ? "L/100km" : "km/L";

  /* Hand the estimate — and its basis — to the enquiry form. */
  const enquireHref = useMemo(() => {
    const label = tt(`${tier.id}.label`);
    const fleetText =
      fleet > 1 ? tc("fleetTextMulti", { count: fleet, label }) : tc("fleetTextSingle", { label });
    const basis =
      mode === "usage"
        ? tc("basisUsage", {
            km: num(annualKm).toLocaleString("en-US"),
            consumption: `${tidy(num(consumption))} ${consumptionLabel}`,
            price: money(num(fuelPrice), currency),
          })
        : tc("basisSpend", { spend: money(num(monthlySpend), currency) });
    const message = tc("enquiryMessage", {
      fleetText,
      model: tier.model,
      basis,
      pct: savingsPct,
      saving: money(result.annualSavingFleet, currency),
      co2: formatKg(result.co2KgFleet),
      payback: paybackText(result.paybackMonths),
      link: shareUrl,
    });
    const q = new URLSearchParams({ sector: "FET", vehicle: tier.id, fleet: String(fleet), message });
    return `/enquire?${q.toString()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, fleet, mode, annualKm, consumption, unit, fuelPrice, monthlySpend, currency, savingsPct, result, shareUrl]);

  /* What is still an assumption. Shown, not hidden. */
  const assumptions: string[] = [];
  if (mode === "usage" && !touched.consumption) assumptions.push(tc("assumeConsumption"));
  if (!touched.price) assumptions.push(tc("assumePrice"));
  if (mode === "spend" && !touched.spend) assumptions.push(tc("assumeSpendMissing"));
  if (!touched.fuel) assumptions.push(tc("assumeFuel"));
  assumptions.push(tc("assumeSaving", { pct: SAVINGS.verified }));
  if (currency !== "EUR") assumptions.push(ratesLive ? tc("assumeRateLive") : tc("assumeRateOffline"));

  const spendReady = mode === "usage" || num(monthlySpend) > 0;

  return (
      <div
        className="rounded-[28px] p-6 md:p-8 shadow-card"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
      >
            {/* Currency */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <Label>{tc("currency")}</Label>
              <Segmented
                value={currency}
                onChange={(v) => changeCurrency(v as Money)}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                ariaLabel={tc("currency")}
              />
            </div>

            {/* Vehicle type */}
            <Field label={tc("vehicleType")}>
              <div className="grid grid-cols-2 gap-2.5">
                {FET_TIERS.map((t) => {
                  const selected = t.id === tier.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTier(t)}
                      aria-pressed={selected}
                      className="text-left px-3.5 py-3 rounded-2xl border transition-all"
                      style={{
                        borderColor: selected ? "#C5B27A" : "rgba(0,0,0,0.10)",
                        background: selected ? "rgba(197,178,122,0.10)" : "#FFFFFF",
                      }}
                    >
                      <span className="block text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                        {tt(`${t.id}.label`)}
                      </span>
                      <span className="block text-[11px] mt-0.5" style={{ color: "#999999" }}>
                        {t.model} · {tt(`${t.id}.segment`).split("·").pop()?.trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* How do you know your fuel? */}
            <div className="mt-6">
              <Segmented
                value={mode}
                onChange={(v) => setMode(v as Mode)}
                options={[
                  { value: "usage", label: tc("modeUsage") },
                  { value: "spend", label: tc("modeSpend") },
                ]}
                ariaLabel={tc("modeAria")}
                full
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
              <Field label={tc("fleetSize")}>
                <NumberInput value={vehicles} onChange={setVehicles} inputMode="numeric" min={1} />
              </Field>

              {mode === "usage" ? (
                <>
                  <Field label={tc("annualKm")}>
                    <NumberInput value={annualKm} onChange={setAnnualKm} inputMode="numeric" />
                  </Field>
                  <Field
                    label={tc("consumption")}
                    hint={touched.consumption ? undefined : tc("assumedTag")}
                    aside={
                      <Segmented
                        small
                        value={unit}
                        onChange={(v) => changeUnit(v as ConsumptionUnit)}
                        options={[{ value: "l100", label: "L/100km" }, { value: "kml", label: "km/L" }]}
                        ariaLabel={tc("consumptionUnit")}
                      />
                    }
                  >
                    <NumberInput
                      value={consumption}
                      onChange={(v) => { setConsumption(v); touch("consumption"); }}
                      inputMode="decimal"
                      step="0.1"
                    />
                  </Field>
                </>
              ) : (
                <Field label={tc("monthlySpend", { currency })} wide>
                  <NumberInput
                    value={monthlySpend}
                    onChange={(v) => { setMonthlySpend(v); touch("spend"); }}
                    inputMode="decimal"
                    placeholder={tc("monthlySpendPh")}
                  />
                </Field>
              )}

              <Field
                label={tc("fuelPriceIn", { currency })}
                hint={touched.price ? undefined : tc("assumedTag")}
              >
                <NumberInput
                  value={fuelPrice}
                  onChange={(v) => { setFuelPrice(v); touch("price"); }}
                  inputMode="decimal"
                  step={currency === "UGX" ? "50" : "0.01"}
                />
              </Field>
              <Field label={tc("fuelType")} hint={touched.fuel ? undefined : tc("assumedTag")}>
                <Segmented
                  value={fuel}
                  onChange={(v) => { setFuel(v as FuelType); touch("fuel"); }}
                  options={[
                    { value: "petrol", label: tc("petrol") },
                    { value: "diesel", label: tc("diesel") },
                  ]}
                  ariaLabel={tc("fuelType")}
                  full
                />
              </Field>
              <Field label={tc("device")}>
                <div
                  className="h-11 rounded-xl px-3.5 flex items-center text-sm font-semibold"
                  style={{ background: "#F2F2F2", color: "#1E1E1E", border: "1px solid rgba(0,0,0,0.06)" }}
                  title={currency === "EUR" ? undefined : tc("devicePriceEur", { price: money(tier.priceEur, "EUR") })}
                >
                  {money(deviceCost, currency)}
                </div>
              </Field>
            </div>

            {/* Savings slider */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-2">
                <Label>{tc("expectedSavings")}</Label>
                <span className="font-numeric" style={{ fontSize: "20px", fontWeight: 700, color: "#7A6020" }}>
                  {savingsPct}%
                </span>
              </div>

              <div className="relative">
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
                  aria-label={tc("expectedSavings")}
                />
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-[11px]" style={{ color: "#999999" }}>{tc("noSaving")}</span>
                <span className="text-[11px]" style={{ color: "#999999" }}>{tc("optimistic", { pct: SAVINGS.max })}</span>
              </div>

              {/* Scenarios — including the one where it doesn't pay. */}
              <div className="flex flex-wrap gap-2 mt-3">
                <ScenarioChip active={savingsPct === 0} onClick={() => setSavingsPct(0)}>
                  {tc("scenarioZero")}
                </ScenarioChip>
                <ScenarioChip active={savingsPct === 5} onClick={() => setSavingsPct(5)}>
                  {tc("scenarioLow", { pct: 5 })}
                </ScenarioChip>
                <ScenarioChip active={verifiedActive} onClick={() => setSavingsPct(SAVINGS.verified)} verified>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {tc("useVerified", { pct: SAVINGS.verified })}
                </ScenarioChip>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-7">
              <Result
                label={tc("resultSavingsLabel")}
                value={spendReady ? money(result.annualSavingFleet, currency) : "—"}
                sub={fleet > 1 ? tc("resultSavingsSubFleet", { count: fleet }) : tc("resultSavingsSubSingle")}
              />
              <Result
                label={tc("resultPaybackLabel")}
                value={spendReady ? paybackText(result.paybackMonths) : "—"}
                sub={result.paybackMonths == null && spendReady ? tc("resultPaybackNeverSub") : tc("resultPaybackSub")}
              />
              <Result
                label={tc("resultCo2Label")}
                value={spendReady ? formatKg(result.co2KgFleet) : "—"}
                sub={tc("resultCo2Sub", { fuel: tc(fuel) })}
              />
            </div>

            {fleet > 1 && (
              <p className="mt-4 text-center text-[12px]" style={{ color: "#666666" }}>
                {tc("fleetInvestmentPrefix")}{" "}
                <span style={{ color: "#1E1E1E", fontWeight: 600 }}>{money(result.deviceCostFleet, currency)}</span>
                {" "}{tc("fleetInvestmentSuffix", { price: money(deviceCost, currency) })}
              </p>
            )}

            {/* The working, in full. */}
            {spendReady && (
              <div className="mt-5 rounded-2xl p-4" style={{ background: "#FAF8F4", border: "1px solid rgba(197,178,122,0.18)" }}>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#7A6020" }}>
                  {tc("workingTitle")}
                </p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "#454545" }}>
                  {mode === "usage"
                    ? tc("workingUsage", {
                        km: num(annualKm).toLocaleString("en-US"),
                        lp: tidy(lPer100),
                        litres: Math.round(result.annualLitres).toLocaleString("en-US"),
                        price: money(num(fuelPrice), currency),
                        spend: money(result.annualFuelSpend, currency),
                      })
                    : tc("workingSpend", {
                        monthly: money(num(monthlySpend), currency),
                        spend: money(result.annualFuelSpend, currency),
                      })}
                  {" "}
                  {tc("workingSaving", {
                    spend: money(result.annualFuelSpend, currency),
                    pct: savingsPct,
                    saving: money(result.annualSaving, currency),
                  })}
                  {" "}
                  {result.paybackMonths != null
                    ? tc("workingPayback", {
                        device: money(deviceCost, currency),
                        saving: money(result.annualSaving, currency),
                        payback: paybackText(result.paybackMonths),
                      })
                    : tc("workingNoPayback")}
                </p>

                {assumptions.length > 0 && (
                  <>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] mt-3.5 mb-1.5" style={{ color: "#7A6020" }}>
                      {tc("assumptionsTitle")}
                    </p>
                    <ul className="space-y-1">
                      {assumptions.map((a) => (
                        <li key={a} className="flex gap-2 text-[12px] leading-relaxed" style={{ color: "#666666" }}>
                          <span aria-hidden="true" className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: "#C5B27A" }} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* CTA + share */}
            <Link href={enquireHref} className="btn-primary w-full justify-center mt-5" style={{ borderRadius: "16px" }}>
              <Fuel className="w-4 h-4" />
              {tc("requestQuote")}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={copyShare}
              className="w-full mt-2.5 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold py-2 rounded-xl transition-colors"
              style={{ color: "#7A6020", background: "transparent" }}
            >
              {copyState === "copied" ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {copyState === "copied" ? tc("shareCopied") : tc("shareCta")}
            </button>
            {copyState === "failed" && (
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full mt-1 text-[11px] px-3 py-2 rounded-lg"
                style={{ background: "#F2F2F2", color: "#454545", border: "1px solid rgba(0,0,0,0.08)" }}
                aria-label={tc("shareCta")}
              />
            )}

            <p className="mt-3 text-center text-[11px] leading-relaxed" style={{ color: "#9A9A9A" }}>
              {tc("disclaimer")}
            </p>
      </div>
  );
}

/* The full page section — used on the FET product page. Wraps the card above
   with the intro column and section framing. */
export default function FetCalculator() {
  const tc = useTranslations("fetCalculator");

  return (
    <section id="fet-calculator" className="section-padding" style={{ backgroundColor: "#F2F2F2", scrollMarginTop: "96px" }}>
      <div className="container-max grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-center">

        {/* ── Left — intro ─────────────────────────────────────────────── */}
        <Reveal>
          <span className="eyebrow block mb-3">{tc("eyebrow")}</span>
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
            {tc("title")}
          </h2>
          <p className="mb-7" style={{ fontSize: "16px", lineHeight: 1.78, color: "#555555", maxWidth: "420px" }}>
            {tc("body")}
          </p>
          <a
            href="#fet-pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "#7A6020" }}
          >
            {tc("seePricing")}
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </Reveal>

        {/* ── Right — calculator card ──────────────────────────────────── */}
        <Reveal delay={120}>
          <FetCalculatorCard />
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

function Field({
  label, hint, aside, wide, children,
}: {
  label: string;
  /** Small tag beside the label — used to mark an input still on a default. */
  hint?: string;
  aside?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <div className="mb-2 flex items-center justify-between gap-2 min-h-[18px]">
        <span className="flex items-center gap-1.5">
          <Label>{label}</Label>
          {hint && (
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded"
              style={{ color: "#7A6020", background: "rgba(197,178,122,0.16)" }}
            >
              {hint}
            </span>
          )}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function Segmented({
  value, onChange, options, ariaLabel, full, small,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
  full?: boolean;
  small?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex rounded-xl p-0.5 ${full ? "w-full" : ""}`}
      style={{ background: "#F2F2F2", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`${full ? "flex-1" : ""} rounded-[10px] font-semibold transition-all ${small ? "text-[10px] px-2 py-1" : "text-[12px] px-3 py-2"}`}
            style={{
              background: on ? "#FFFFFF" : "transparent",
              color: on ? "#1E1E1E" : "#888888",
              boxShadow: on ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ScenarioChip({
  active, onClick, verified, children,
}: {
  active: boolean;
  onClick: () => void;
  verified?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
      style={{
        background: active ? "#C5B27A" : verified ? "rgba(197,178,122,0.12)" : "#FFFFFF",
        color: active ? "#1E1E1E" : verified ? "#7A6020" : "#666666",
        border: `1px solid ${verified || active ? "rgba(197,178,122,0.4)" : "rgba(0,0,0,0.12)"}`,
      }}
    >
      {children}
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  inputMode,
  step,
  min = 0,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric" | "decimal";
  step?: string;
  min?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      placeholder={placeholder}
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
        className="font-numeric"
        style={{
          fontSize: "clamp(24px, 3.4vw, 34px)",
          fontWeight: 700,
          letterSpacing: "-0.01em",
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
