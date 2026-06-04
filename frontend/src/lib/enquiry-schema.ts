import type { ProductCategory, EnquiryRequirement } from "@/types";
import { FET_TIERS } from "@/lib/fet-pricing";

/* ─── Product-aware enquiry schema ────────────────────────────────────────────
   The "intelligence" in the enquiry form: each product declares exactly the
   questions its quote requires — the ones the ops/sales team would otherwise
   have to email the customer to ask. A single renderer (EnquiryForm) consumes
   these, branching with `showIf` so the form stays short. Answers are captured
   as structured data and turned into a quote-ready brief — no back-and-forth.

   To add or change a question, edit this file only. Nothing else needs to know
   about individual fields.                                                     */

export type UiCategory = ProductCategory | "GENERAL";

/** Field answers keyed by field id. Single/number/text → string; multi → string[]. */
export type Answers = Record<string, string | string[]>;

export type FieldType = "single" | "multi" | "number" | "text";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  /** Static helper text shown under the field. */
  help?: string;
  /** Unit appended to a number answer, e.g. "kg", "vehicles". */
  unit?: string;
  /** Show this field only when the predicate passes (branching). */
  showIf?: (a: Answers) => boolean;
  /** Context-aware helper text computed from current answers (e.g. MOQ guidance). */
  dynamicHelp?: (a: Answers) => string | null;
}

/* Shared option sets ------------------------------------------------------- */

const TIMELINE: FieldOption[] = [
  { value: "now", label: "Immediately" },
  { value: "soon", label: "Within 1–3 months" },
  { value: "exploring", label: "Just exploring" },
];

/* ─── The question sets ───────────────────────────────────────────────────── */

export const ENQUIRY_SCHEMAS: Record<UiCategory, FieldDef[]> = {
  /* Fuel Eco Tech — fleet fuel efficiency (B2B). Vehicle + fleet can arrive
     pre-filled from the savings calculator. */
  FET: [
    {
      id: "vehicle_type",
      label: "Vehicle type",
      type: "single",
      required: true,
      options: FET_TIERS.map((t) => ({ value: t.id, label: `${t.label} · ${t.model}` })),
    },
    { id: "fleet_size", label: "Fleet size", type: "number", required: true, unit: "vehicles", placeholder: "e.g. 12" },
    {
      id: "fuel_type",
      label: "Fuel type",
      type: "single",
      required: true,
      options: [
        { value: "diesel", label: "Diesel" },
        { value: "petrol", label: "Petrol" },
        { value: "mixed", label: "Mixed fleet" },
      ],
    },
    {
      id: "goal",
      label: "Main goal",
      type: "single",
      options: [
        { value: "cost", label: "Cut fuel costs" },
        { value: "emissions", label: "Meet emissions rules" },
        { value: "engine", label: "Extend engine life" },
        { value: "all", label: "All of these" },
      ],
    },
    { id: "timeline", label: "Timeline", type: "single", required: true, options: TIMELINE },
    {
      id: "role",
      label: "Your role in the decision",
      type: "single",
      options: [
        { value: "decide", label: "I make the decision" },
        { value: "recommend", label: "I recommend / influence" },
        { value: "research", label: "Just researching" },
      ],
    },
  ],

  /* SEAL — hemostatic wound spray (B2B medical). */
  SEAL: [
    {
      id: "org_type",
      label: "Organisation type",
      type: "single",
      required: true,
      options: [
        { value: "hospital", label: "Hospital" },
        { value: "clinic", label: "Clinic" },
        { value: "ambulance", label: "Ambulance service" },
        { value: "pharmacy", label: "Pharmacy" },
        { value: "distributor", label: "Medical distributor" },
        { value: "ngo", label: "NGO" },
        { value: "military", label: "Military / defence" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "use_case",
      label: "Primary use",
      type: "single",
      options: [
        { value: "emergency", label: "Emergency response" },
        { value: "surgical", label: "Surgical / theatre" },
        { value: "firstaid", label: "First-aid kits" },
        { value: "resale", label: "Resale / distribution" },
        { value: "other", label: "Other" },
      ],
    },
    { id: "volume", label: "Estimated volume", type: "number", unit: "units / month", placeholder: "e.g. 200" },
    {
      id: "needs",
      label: "What do you need from us?",
      type: "multi",
      required: true,
      options: [
        { value: "info", label: "Product information" },
        { value: "clinical", label: "Clinical documentation" },
        { value: "sample", label: "A sample" },
        { value: "pricing", label: "Pricing" },
        { value: "procurement", label: "Procurement support" },
      ],
    },
    {
      id: "procurement",
      label: "How do you procure?",
      type: "single",
      options: [
        { value: "direct", label: "Direct purchase" },
        { value: "tender", label: "Formal tender" },
        { value: "distributor", label: "Through a distributor" },
      ],
    },
    { id: "timeline", label: "Timeline", type: "single", required: true, options: TIMELINE },
  ],

  /* Coffee — wholesale & export (retail is self-serve, handled by the shop). */
  COFFEE: [
    {
      id: "buyer_type",
      label: "You are a…",
      type: "single",
      required: true,
      options: [
        { value: "cafe", label: "Café" },
        { value: "hotel", label: "Hotel / restaurant" },
        { value: "office", label: "Office" },
        { value: "retailer", label: "Retailer / supermarket" },
        { value: "distributor", label: "Distributor" },
        { value: "importer", label: "International importer" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "channel",
      label: "Buying for…",
      type: "single",
      required: true,
      options: [
        { value: "local", label: "Local wholesale (Uganda)" },
        { value: "export", label: "Export (international)" },
      ],
    },
    {
      id: "volume",
      label: "Volume per order",
      type: "number",
      required: true,
      unit: "kg",
      placeholder: "e.g. 60",
      dynamicHelp: (a) =>
        a.channel === "export"
          ? "Export starts at 60 kg (one bag)."
          : a.channel === "local"
            ? "Local wholesale minimum is 10 kg."
            : null,
    },
    {
      id: "frequency",
      label: "How often?",
      type: "single",
      options: [
        { value: "oneoff", label: "One-off" },
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
      ],
    },
    {
      id: "prep",
      label: "Preferred preparation",
      type: "multi",
      options: [
        { value: "whole", label: "Whole bean" },
        { value: "ground", label: "Ground" },
      ],
    },
    {
      id: "destination",
      label: "Destination country",
      type: "text",
      required: true,
      placeholder: "e.g. Germany",
      showIf: (a) => a.channel === "export",
    },
    {
      id: "docs",
      label: "Export documents needed",
      type: "multi",
      showIf: (a) => a.channel === "export",
      options: [
        { value: "origin", label: "Certificate of Origin" },
        { value: "foodsafety", label: "Food-safety certification" },
        { value: "phyto", label: "Phytosanitary certificate" },
        { value: "grading", label: "Quality grading report" },
      ],
    },
    {
      id: "private_label",
      label: "Branding",
      type: "single",
      options: [
        { value: "vitorra", label: "Vitorra branding" },
        { value: "own", label: "My own brand (private label)" },
      ],
    },
  ],

  /* Logistics — freight & supply chain (B2B). The most data-rich quote. */
  LOGISTICS: [
    {
      id: "services",
      label: "Services needed",
      type: "multi",
      required: true,
      options: [
        { value: "freight", label: "Freight transport" },
        { value: "forwarding", label: "Freight forwarding (import/export)" },
        { value: "warehousing", label: "Warehousing & distribution" },
        { value: "customs", label: "Customs & clearance" },
        { value: "supplychain", label: "Supply-chain management" },
      ],
    },
    { id: "cargo", label: "What are you shipping?", type: "text", required: true, placeholder: "e.g. 18 tonnes of packaged coffee" },
    {
      id: "handling",
      label: "Special handling",
      type: "multi",
      options: [
        { value: "refrigerated", label: "Refrigerated" },
        { value: "hazardous", label: "Hazardous" },
        { value: "oversized", label: "Oversized" },
        { value: "fragile", label: "Fragile" },
        { value: "none", label: "None" },
      ],
      dynamicHelp: (a) =>
        Array.isArray(a.handling) && a.handling.includes("hazardous")
          ? "Hazardous cargo needs extra documentation — we'll guide you through it."
          : null,
    },
    { id: "origin", label: "Origin", type: "text", required: true, placeholder: "City / country" },
    { id: "destination", label: "Destination", type: "text", required: true, placeholder: "City / country" },
    {
      id: "mode",
      label: "Preferred mode",
      type: "single",
      options: [
        { value: "road", label: "Road" },
        { value: "ocean", label: "Ocean" },
        { value: "air", label: "Air" },
        { value: "notsure", label: "Not sure — advise me" },
      ],
    },
    {
      id: "frequency",
      label: "Shipment type",
      type: "single",
      required: true,
      options: [
        { value: "oneoff", label: "One-off shipment" },
        { value: "ongoing", label: "Ongoing / recurring" },
      ],
    },
    { id: "timeline", label: "Timeline", type: "single", options: TIMELINE },
  ],

  /* General enquiry — no structured fields; the free-text message carries it. */
  GENERAL: [],
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fieldsFor(cat: UiCategory | null): FieldDef[] {
  return cat ? (ENQUIRY_SCHEMAS[cat] ?? []) : [];
}

function optionLabel(field: FieldDef, value: string): string {
  return field.options?.find((o) => o.value === value)?.label ?? value;
}

/** The fields currently visible for a category, after applying `showIf` branching. */
export function visibleFields(cat: UiCategory | null, answers: Answers): FieldDef[] {
  return fieldsFor(cat).filter((f) => !f.showIf || f.showIf(answers));
}

/** Validate required visible fields. Returns { fieldId: errorMessage }. */
export function validateAnswers(cat: UiCategory | null, answers: Answers): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of visibleFields(cat, answers)) {
    if (!f.required) continue;
    const v = answers[f.id];
    const empty = v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
    if (empty) errors[f.id] = "This field is required.";
  }
  return errors;
}

/** Turn raw answers into display-ready { key, label, value } pairs for the brief. */
export function buildRequirements(cat: UiCategory | null, answers: Answers): EnquiryRequirement[] {
  const out: EnquiryRequirement[] = [];
  for (const f of visibleFields(cat, answers)) {
    const v = answers[f.id];
    if (v == null) continue;

    let value = "";
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      value = v.map((x) => optionLabel(f, x)).join(", ");
    } else {
      const s = String(v).trim();
      if (s === "") continue;
      if (f.type === "number") value = f.unit ? `${s} ${f.unit}` : s;
      else value = f.options ? optionLabel(f, s) : s;
    }
    out.push({ key: f.id, label: f.label, value });
  }
  return out;
}
