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
   to estimate fuel savings — never quoted as a price.                          */

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
    label: "Car / Mini-bus",
    fits: "Compact & mid-range cars, mini-buses",
    segment: "Petrol / diesel · 1.4–2.0L",
    examples: "Corolla, Golf, Hiace, mini-buses & vans",
    priceEur: 365.4,
    baselineLPer100: 7.5,
    defaultAnnualKm: 15000,
  },
  {
    id: "suv",
    model: "FET-PRO-FII",
    label: "SUV / Large car",
    fits: "SUVs, sports, upper-class & large cars",
    segment: "Petrol / diesel · 1.5–3.0L",
    examples: "Tiguan, RAV4, X5, GLE, Sprinter vans",
    priceEur: 630.71,
    baselineLPer100: 10,
    defaultAnnualKm: 25000,
  },
  {
    id: "lighttruck",
    model: "FET-PRO-FIII",
    label: "Light truck",
    fits: "Light commercial trucks & vans",
    segment: "Diesel · 3.0–6.7L",
    examples: "City & distribution trucks, 5–18t",
    priceEur: 1028.69,
    baselineLPer100: 22,
    defaultAnnualKm: 40000,
  },
  {
    id: "heavytruck",
    model: "FET-PRO-FIV",
    label: "Heavy truck",
    fits: "Heavy goods vehicles & haulage",
    segment: "Diesel · 12–13L",
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
  min: 8,
  max: 15,
  default: 10,
  verified: 13.9,
} as const;

/** Default pump price used by the calculator, in EUR per litre. Editable by the user. */
export const DEFAULT_FUEL_PRICE_EUR = 1.65;

/** CO₂ emitted per litre of diesel burned (kg). Used to estimate emissions avoided.
    Diesel ≈ 2.64 kg/L; most commercial fleets run diesel, so we use that figure. */
export const CO2_KG_PER_LITRE = 2.64;

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
