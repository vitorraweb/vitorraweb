/* ─── Fuel Eco Tech — line pricing & savings model ────────────────────────────
   Source: "FET FULL LINE PRICING (Kampala + Installation + 35% Margin)".
   The pricing sheet maps every vehicle segment onto one of four device models.
   We collapse it to those four public tiers — each tier is a single SKU with a
   fixed selling price (EUR, landed in Kampala incl. installation).

   Prices are shown in EUR as supplied by the business (the FET supply chain and
   the German field-test data are EUR-denominated). All figures here trace
   directly to the pricing sheet — do not invent values.

   `baselineLPer100` and `defaultAnnualKm` drive the savings calculator only.
   They are representative assumptions for a typical vehicle in the segment, used
   to estimate fuel savings — never quoted as a price.

   ⚠ ENGINE RANGES ARE DERIVED, NOT TYPED. `engineMinL`/`engineMaxL` on each tier
   are computed from data/fet-applications.json — the transcribed manufacturer
   application overview. Until 2026-10-06 the ranges were hand-written here and
   every tier under-stated what the device actually fits (FIV read "12–13L" when
   the manufacturer covers 10–16L; FIII read "3.0–6.7L" against an actual
   3.0–9.0L). A haulier with 15-litre trucks concluded nothing fitted. Change a
   range in the JSON, never here.                                               */

import APPLICATIONS from "@/data/fet-applications.json";

/** Device code → the displacement span the manufacturer lists for it. */
function spanFor(device: string): { engineMinL: number; engineMaxL: number } {
  const rows = APPLICATIONS.rows.filter((r) => r.device === device);
  if (rows.length === 0) throw new Error(`No FET application rows for ${device}`);
  return {
    engineMinL: Math.min(...rows.map((r) => r.engineMinL)),
    engineMaxL: Math.max(...rows.map((r) => r.engineMaxL)),
  };
}

/** "1.0–2.0L" — the tier's displacement span, formatted for display. */
export function engineSpanLabel(device: string): string {
  const { engineMinL: min, engineMaxL: max } = spanFor(device);
  /* One decimal below 10 litres (1.0, 2.5, 9.0), whole litres above (10, 16),
     the way the manufacturer's own tables write them. */
  const n = (v: number) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1));
  return min === max ? `${n(min)}L` : `${n(min)}–${n(max)}L`;
}

export interface FetTier {
  /** Stable id used by the calculator selector. */
  id: "car" | "suv" | "lighttruck" | "heavytruck";
  /** Device model code from the pricing sheet. */
  model: string;
  /** Short selector label. */
  label: string;
  /** One-line description of what the tier covers. */
  fits: string;
  /** Engine / segment detail shown under the price. */
  segment: string;
  /** Displacement span (litres), derived from the manufacturer application table. */
  engineMinL: number;
  engineMaxL: number;
  /** Example vehicles in this class (from the FET application overview). */
  examples: string;
  /** Selling price in EUR (Kampala landed + installation, 35% margin). */
  priceEur: number;
  /** Representative fuel use (l/100km) — calculator assumption only. */
  baselineLPer100: number;
  /** Representative annual distance (km) — calculator default only. */
  defaultAnnualKm: number;
}

/* The four public tiers, cheapest first. Prices verbatim from the pricing sheet. */
export const FET_TIERS: FetTier[] = [
  {
    id: "car",
    model: "FET-PRO-FI",
    ...spanFor("FI"),
    label: "Car / Mini-bus",
    fits: "Small, compact & mid-range cars, mini-buses & vans",
    segment: "Petrol / diesel · 1.0–2.0L",
    examples: "Corolla, Golf, Hiace, mini-buses & vans",
    priceEur: 365.4,
    baselineLPer100: 7.5,
    defaultAnnualKm: 15000,
  },
  {
    id: "suv",
    model: "FET-PRO-FII",
    ...spanFor("FII"),
    label: "SUV / Large car",
    fits: "SUVs, sports & upper-class cars, Sprinter-class vans to 5t",
    segment: "Petrol / diesel · 1.5–3.0L",
    examples: "Tiguan, RAV4, X5, GLE, Sprinter vans",
    priceEur: 630.71,
    baselineLPer100: 10,
    defaultAnnualKm: 25000,
  },
  {
    id: "lighttruck",
    model: "FET-PRO-FIII",
    ...spanFor("FIII"),
    label: "Light truck",
    fits: "Light & medium trucks to 18t, performance cars",
    segment: "Diesel / petrol · 3.0–9.0L",
    examples: "City & distribution trucks, 5–18t",
    priceEur: 1028.69,
    baselineLPer100: 22,
    defaultAnnualKm: 40000,
  },
  {
    id: "heavytruck",
    model: "FET-PRO-FIV",
    ...spanFor("FIV"),
    label: "Heavy truck",
    fits: "Heavy goods vehicles & haulage",
    segment: "Diesel · 10–16L",
    examples: "Long-haul trucks, up to 40t",
    priceEur: 1957.3,
    baselineLPer100: 32,
    defaultAnnualKm: 60000,
  },
];

/* Savings slider bounds, in % fuel reduction. The German field test (CTI GmbH,
   VW T5) measured 13.9% — `verified` anchors that on the slider so the estimate
   is tied to the proof shown above it. We default below it so the figure stays
   conservative and never over-promises. */
export const SAVINGS = {
  /* 0, not 8: a customer must be able to see what the purchase looks like if
     it saves nothing. A calculator whose floor is a profitable answer is a
     brochure, not a decision tool. */
  min: 0,
  max: 15,
  default: 10,
  verified: 13.9,
} as const;

/** Default pump price used by the calculator, in EUR per litre. Editable by the user. */
export const DEFAULT_FUEL_PRICE_EUR = 1.65;

/** CO₂ emitted per litre of diesel burned (kg). Used to estimate emissions avoided.
    Diesel ≈ 2.64 kg/L; most commercial fleets run diesel, so we use that figure. */
export const CO2_KG_PER_LITRE = 2.64;

/* ─── Currency-aware estimator (the public calculator) ───────────────────────
   The calculator used to run in EUR at a German pump price, with each tier's
   fuel consumption hard-coded and hidden. A Ugandan fleet manager got a precise
   figure without ever saying how much fuel their own vehicle burns. This model
   takes the customer's real numbers, in either of the two ways they are likely
   to know them, and is honest about which inputs are assumptions.

     usage mode:  annualSpend = (annualKm / 100) × L/100km × pricePerLitre
     spend mode:  annualSpend = monthlySpend × 12
     both:        annualSaving = annualSpend × saving%
                  payback      = installedDeviceCost ÷ annualSaving
                  CO₂ avoided  = litresSaved × emission factor (fuel-specific)

   Money is in whatever currency the customer chose. The device price is EUR
   (the business quotes it in EUR) and is converted for display only.          */

export type FuelType = "petrol" | "diesel";

/** kg CO₂ per litre burned. Standard combustion factors; petrol is lower. */
export const CO2_KG_PER_LITRE_BY_FUEL: Record<FuelType, number> = {
  petrol: 2.31,
  diesel: 2.64,
};

/** Default fuel per tier — trucks run diesel, cars and SUVs default to petrol.
    Always editable; this only decides the first emissions figure shown. */
export const DEFAULT_FUEL_BY_TIER: Record<FetTier["id"], FuelType> = {
  car: "petrol",
  suv: "petrol",
  lighttruck: "diesel",
  heavytruck: "diesel",
};

/** Indicative Kampala pump price, UGX per litre — the calculator's starting
    figure for a Ugandan visitor. ⚠ An assumption, labelled as one on screen and
    always editable. Confirm against the current pump price before a campaign. */
export const DEFAULT_FUEL_PRICE_UGX = 5000;

/** km/L ↔ L/100km. Ugandan fleets often think in km per litre. */
export const kmPerLitreToLPer100 = (kmPerL: number) => (kmPerL > 0 ? 100 / kmPerL : 0);
export const lPer100ToKmPerLitre = (lPer100: number) => (lPer100 > 0 ? 100 / lPer100 : 0);

export interface SavingsEstimate {
  /* per vehicle */
  annualFuelSpend: number;
  annualLitres: number;
  annualSaving: number;
  litresSaved: number;
  co2Kg: number;
  /** Months to recover the installed device cost; null when nothing is saved. */
  paybackMonths: number | null;
  /* fleet totals */
  annualSavingFleet: number;
  co2KgFleet: number;
  deviceCostFleet: number;
}

export function estimateSavings(input: {
  mode: "usage" | "spend";
  /** usage mode */
  annualKm: number;
  lPer100: number;
  /** spend mode — per vehicle, per month */
  monthlySpend: number;
  /** price per litre, same currency as the money figures */
  fuelPrice: number;
  fuel: FuelType;
  savingsPct: number;
  /** installed device cost, same currency as the money figures */
  deviceCost: number;
  vehicles?: number;
}): SavingsEstimate {
  const vehicles = Math.max(1, Math.floor(input.vehicles ?? 1));
  const pct = Math.max(0, input.savingsPct) / 100;

  let annualLitres: number;
  let annualFuelSpend: number;
  if (input.mode === "usage") {
    annualLitres = (input.annualKm / 100) * input.lPer100;
    annualFuelSpend = annualLitres * input.fuelPrice;
  } else {
    annualFuelSpend = input.monthlySpend * 12;
    /* Litres are only needed for the emissions figure; without a price we
       cannot derive them, so emissions read as zero rather than guessed. */
    annualLitres = input.fuelPrice > 0 ? annualFuelSpend / input.fuelPrice : 0;
  }

  const annualSaving = annualFuelSpend * pct;
  const litresSaved = annualLitres * pct;
  const co2Kg = litresSaved * CO2_KG_PER_LITRE_BY_FUEL[input.fuel];
  const paybackMonths = annualSaving > 0 ? (input.deviceCost / annualSaving) * 12 : null;

  return {
    annualFuelSpend,
    annualLitres,
    annualSaving,
    litresSaved,
    co2Kg,
    paybackMonths,
    annualSavingFleet: annualSaving * vehicles,
    co2KgFleet: co2Kg * vehicles,
    deviceCostFleet: input.deviceCost * vehicles,
  };
}

/** Format an EUR amount the way the pricing guide and calculator display it. */
export function formatEur(
  value: number,
  opts: { decimals?: number } = {}
): string {
  const { decimals = 2 } = opts;
  return `€${value.toLocaleString("en-IE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/* ─── Savings maths ────────────────────────────────────────────────────────
   Per vehicle:
     annualSaving = (annualKm / 100) × baseline l/100km × savings% × fuelPrice
     co2Saved     = litresSaved × CO2_KG_PER_LITRE
     payback      = deviceCost / annualSaving   (same ratio whatever the fleet size)
   Fleet figures simply scale the per-vehicle results by `vehicles`.
   Mirrors the reference calculator: a passenger car at 15,000 km, €1.65/L and
   10% lands at ≈ €173/yr — consistent with that model.                       */
export function computeSavings(input: {
  annualKm: number;
  fuelPriceEur: number;
  savingsPct: number;
  baselineLPer100: number;
  deviceCostEur: number;
  vehicles?: number;
}): {
  /* per vehicle */
  litresSaved: number;
  annualSavingEur: number;
  co2Kg: number;
  paybackYears: number | null;
  /* fleet totals */
  vehicles: number;
  annualSavingEurFleet: number;
  co2KgFleet: number;
  deviceCostFleet: number;
} {
  const { annualKm, fuelPriceEur, savingsPct, baselineLPer100, deviceCostEur } = input;
  const vehicles = Math.max(1, Math.floor(input.vehicles ?? 1));

  const litresSaved = (annualKm / 100) * baselineLPer100 * (savingsPct / 100);
  const annualSavingEur = litresSaved * fuelPriceEur;
  const co2Kg = litresSaved * CO2_KG_PER_LITRE;
  const paybackYears = annualSavingEur > 0 ? deviceCostEur / annualSavingEur : null;

  return {
    litresSaved,
    annualSavingEur,
    co2Kg,
    paybackYears,
    vehicles,
    annualSavingEurFleet: annualSavingEur * vehicles,
    co2KgFleet: co2Kg * vehicles,
    deviceCostFleet: deviceCostEur * vehicles,
  };
}
