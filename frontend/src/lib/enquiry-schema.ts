import type { ProductCategory, EnquiryRequirement } from "@/types";
import { FET_TIERS } from "@/lib/fet-pricing";

/* ─── Product-aware enquiry schema ────────────────────────────────────────────
   The "intelligence" in the enquiry form: each product declares exactly the
   questions its quote requires. A single renderer (EnquiryForm) consumes these,
   branching with `showIf` so the form stays short.

   Display strings are resolved through translators so the whole question set is
   localised: `t` is scoped to the "enquiry" messages namespace, `tt` to
   "fetTiers" (for the vehicle tier labels). To add or change a question, edit
   this builder plus the matching keys in messages/*.json.                      */

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

type Translator = (key: string) => string;

/* ─── The question sets (built per-locale) ────────────────────────────────── */

export function getEnquirySchemas(t: Translator, tt: Translator): Record<UiCategory, FieldDef[]> {
  const TIMELINE: FieldOption[] = [
    { value: "now", label: t("tlNow") },
    { value: "soon", label: t("tlSoon") },
    { value: "exploring", label: t("tlExploring") },
  ];

  return {
    /* Fuel Eco Tech — fleet fuel efficiency (B2B). Vehicle + fleet can arrive
       pre-filled from the savings calculator. */
    FET: [
      {
        id: "vehicle_type",
        label: t("fetVehicleType"),
        type: "single",
        required: true,
        options: FET_TIERS.map((tier) => ({ value: tier.id, label: `${tt(`${tier.id}.label`)} · ${tier.model}` })),
      },
      { id: "fleet_size", label: t("fetFleetSize"), type: "number", required: true, unit: t("unitVehicles"), placeholder: t("fetFleetSizePh") },
      {
        id: "fuel_type",
        label: t("fetFuelType"),
        type: "single",
        required: true,
        options: [
          { value: "diesel", label: t("fetDiesel") },
          { value: "petrol", label: t("fetPetrol") },
          { value: "mixed", label: t("fetMixed") },
        ],
      },
      {
        id: "goal",
        label: t("fetGoal"),
        type: "single",
        options: [
          { value: "cost", label: t("fetGoalCost") },
          { value: "emissions", label: t("fetGoalEmissions") },
          { value: "engine", label: t("fetGoalEngine") },
          { value: "all", label: t("fetGoalAll") },
        ],
      },
      { id: "timeline", label: t("timeline"), type: "single", required: true, options: TIMELINE },
      {
        id: "role",
        label: t("fetRole"),
        type: "single",
        options: [
          { value: "decide", label: t("fetRoleDecide") },
          { value: "recommend", label: t("fetRoleRecommend") },
          { value: "research", label: t("fetRoleResearch") },
        ],
      },
    ],

    /* SEAL — hemostatic wound spray (B2B medical). */
    SEAL: [
      {
        id: "org_type",
        label: t("sealOrgType"),
        type: "single",
        required: true,
        options: [
          { value: "hospital", label: t("sealHospital") },
          { value: "clinic", label: t("sealClinic") },
          { value: "ambulance", label: t("sealAmbulance") },
          { value: "pharmacy", label: t("sealPharmacy") },
          { value: "distributor", label: t("sealDistributor") },
          { value: "ngo", label: t("sealNgo") },
          { value: "military", label: t("sealMilitary") },
          { value: "other", label: t("sealOther") },
        ],
      },
      {
        id: "use_case",
        label: t("sealUseCase"),
        type: "single",
        options: [
          { value: "emergency", label: t("sealEmergency") },
          { value: "surgical", label: t("sealSurgical") },
          { value: "firstaid", label: t("sealFirstaid") },
          { value: "resale", label: t("sealResale") },
          { value: "other", label: t("sealUseOther") },
        ],
      },
      { id: "volume", label: t("sealVolume"), type: "number", unit: t("unitUnitsMonth"), placeholder: t("sealVolumePh") },
      {
        id: "needs",
        label: t("sealNeeds"),
        type: "multi",
        required: true,
        options: [
          { value: "info", label: t("sealNeedInfo") },
          { value: "clinical", label: t("sealNeedClinical") },
          { value: "sample", label: t("sealNeedSample") },
          { value: "pricing", label: t("sealNeedPricing") },
          { value: "procurement", label: t("sealNeedProcurement") },
        ],
      },
      {
        id: "procurement",
        label: t("sealProcurement"),
        type: "single",
        options: [
          { value: "direct", label: t("sealProcDirect") },
          { value: "tender", label: t("sealProcTender") },
          { value: "distributor", label: t("sealProcDistributor") },
        ],
      },
      { id: "timeline", label: t("timeline"), type: "single", required: true, options: TIMELINE },
    ],

    /* Coffee — wholesale & export (retail is self-serve, handled by the shop). */
    COFFEE: [
      {
        id: "buyer_type",
        label: t("coffeeBuyerType"),
        type: "single",
        required: true,
        options: [
          { value: "cafe", label: t("coffeeCafe") },
          { value: "hotel", label: t("coffeeHotel") },
          { value: "office", label: t("coffeeOffice") },
          { value: "retailer", label: t("coffeeRetailer") },
          { value: "distributor", label: t("coffeeDistributor") },
          { value: "importer", label: t("coffeeImporter") },
          { value: "other", label: t("coffeeBuyerOther") },
        ],
      },
      {
        id: "channel",
        label: t("coffeeChannel"),
        type: "single",
        required: true,
        options: [
          { value: "local", label: t("coffeeLocal") },
          { value: "export", label: t("coffeeExport") },
        ],
      },
      {
        id: "volume",
        label: t("coffeeVolume"),
        type: "number",
        required: true,
        unit: t("unitKg"),
        placeholder: t("coffeeVolumePh"),
        dynamicHelp: (a) =>
          a.channel === "export"
            ? t("coffeeHelpExport")
            : a.channel === "local"
              ? t("coffeeHelpLocal")
              : null,
      },
      {
        id: "frequency",
        label: t("coffeeFrequency"),
        type: "single",
        options: [
          { value: "oneoff", label: t("coffeeOneoff") },
          { value: "weekly", label: t("coffeeWeekly") },
          { value: "monthly", label: t("coffeeMonthly") },
          { value: "quarterly", label: t("coffeeQuarterly") },
        ],
      },
      {
        id: "prep",
        label: t("coffeePrep"),
        type: "multi",
        options: [
          { value: "whole", label: t("coffeeWhole") },
          { value: "ground", label: t("coffeeGround") },
        ],
      },
      {
        id: "destination",
        label: t("coffeeDestination"),
        type: "text",
        required: true,
        placeholder: t("coffeeDestinationPh"),
        showIf: (a) => a.channel === "export",
      },
      {
        id: "docs",
        label: t("coffeeDocs"),
        type: "multi",
        showIf: (a) => a.channel === "export",
        options: [
          { value: "origin", label: t("coffeeDocOrigin") },
          { value: "foodsafety", label: t("coffeeDocFoodsafety") },
          { value: "phyto", label: t("coffeeDocPhyto") },
          { value: "grading", label: t("coffeeDocGrading") },
        ],
      },
      {
        id: "private_label",
        label: t("coffeePrivateLabel"),
        type: "single",
        options: [
          { value: "vitorra", label: t("coffeeBrandVitorra") },
          { value: "own", label: t("coffeeBrandOwn") },
        ],
      },
    ],

    /* Logistics — freight & supply chain (B2B). The most data-rich quote. */
    LOGISTICS: [
      {
        id: "services",
        label: t("logServices"),
        type: "multi",
        required: true,
        options: [
          { value: "freight", label: t("logFreight") },
          { value: "forwarding", label: t("logForwarding") },
          { value: "warehousing", label: t("logWarehousing") },
          { value: "customs", label: t("logCustoms") },
          { value: "supplychain", label: t("logSupplychain") },
        ],
      },
      { id: "cargo", label: t("logCargo"), type: "text", required: true, placeholder: t("logCargoPh") },
      {
        id: "handling",
        label: t("logHandling"),
        type: "multi",
        options: [
          { value: "refrigerated", label: t("logRefrigerated") },
          { value: "hazardous", label: t("logHazardous") },
          { value: "oversized", label: t("logOversized") },
          { value: "fragile", label: t("logFragile") },
          { value: "none", label: t("logHandlingNone") },
        ],
        dynamicHelp: (a) =>
          Array.isArray(a.handling) && a.handling.includes("hazardous")
            ? t("logHelpHazardous")
            : null,
      },
      { id: "origin", label: t("logOrigin"), type: "text", required: true, placeholder: t("logOriginPh") },
      { id: "destination", label: t("logDestination"), type: "text", required: true, placeholder: t("logDestinationPh") },
      {
        id: "mode",
        label: t("logMode"),
        type: "single",
        options: [
          { value: "road", label: t("logRoad") },
          { value: "ocean", label: t("logOcean") },
          { value: "air", label: t("logAir") },
          { value: "notsure", label: t("logNotsure") },
        ],
      },
      {
        id: "frequency",
        label: t("logShipmentType"),
        type: "single",
        required: true,
        options: [
          { value: "oneoff", label: t("logOneoff") },
          { value: "ongoing", label: t("logOngoing") },
        ],
      },
      { id: "timeline", label: t("timeline"), type: "single", options: TIMELINE },
    ],

    /* General enquiry — no structured fields; the free-text message carries it. */
    GENERAL: [],
  };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function optionLabel(field: FieldDef, value: string): string {
  return field.options?.find((o) => o.value === value)?.label ?? value;
}

/** The fields currently visible, after applying `showIf` branching. */
export function visibleFields(fields: FieldDef[], answers: Answers): FieldDef[] {
  return fields.filter((f) => !f.showIf || f.showIf(answers));
}

/** Validate required visible fields. Returns { fieldId: errorMessage }. */
export function validateAnswers(fields: FieldDef[], answers: Answers, requiredMsg: string): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of visibleFields(fields, answers)) {
    if (!f.required) continue;
    const v = answers[f.id];
    const empty = v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
    if (empty) errors[f.id] = requiredMsg;
  }
  return errors;
}

/** Turn raw answers into display-ready { key, label, value } pairs for the brief. */
export function buildRequirements(fields: FieldDef[], answers: Answers): EnquiryRequirement[] {
  const out: EnquiryRequirement[] = [];
  for (const f of visibleFields(fields, answers)) {
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
