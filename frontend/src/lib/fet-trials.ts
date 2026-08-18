/**
 * Shapes returned by the FET trial API, plus the small helpers the screens
 * share. Mirrors App\Http\Controllers\Api\FetTrialController::shape().
 */

export type Weighted = {
  trips: number;
  km: number;
  litres: number;
  l_per_100: number;
  km_per_l: number;
};

export type RouteRow = {
  route_key: string;
  route_label: string;
  baseline: Weighted | null;
  trial: Weighted | null;
  /** Recorded but not counted — shown in grey, never in the maths. */
  baseline_held: Weighted | null;
  trial_held: Weighted | null;
  baseline_load_kg: number | null;
  trial_load_kg: number | null;
  load_gap_pct: number | null;
  matched: boolean;
  unmatched_reason: "no_trial_trip" | "trial_excluded" | "no_baseline" | "baseline_excluded" | "sparse_baseline" | "load_mismatch" | null;
  change_pct: number | null;
};

export type Headline = {
  matched_routes: number;
  matched_trial_trips: number;
  distance_km: number;
  expected_litres: number;
  actual_litres: number;
  litres_saved: number;
  saving_pct: number;
  cost_saved: number | null;
  co2_saved_kg: number;
  trial_l_per_100: number;
  baseline_l_per_100: number;
};

export type Confidence = {
  level: "insufficient" | "low" | "moderate" | "high";
  score: number;
  states_verdict: boolean;
  shortfall: string[];
};

export type Finding = {
  id: number;
  trip_id: number | null;
  code: string;
  message: string;
  action: string | null;
};

export type Analysis = {
  currency: string;
  fuel_price: number | null;
  verified_pct: number;
  counts: {
    trips_total: number;
    baseline_measurable: number;
    trial_measurable: number;
    trial_recorded: number;
    trial_held: number;
    needs_review: number;
    excluded: number;
  };
  routes: RouteRow[];
  routes_ready: { route_label: string; baseline_trips: number; l_per_100: number }[];
  headline: Headline | null;
  confidence: Confidence;
  verdict: { direction: "saving" | "increase"; saving_pct: number; statement: string } | null;
  unmatched_trial_trips: {
    route_label: string;
    trips: number;
    km: number;
    l_per_100: number;
    reason: string;
    explanation: string;
  }[];
  blocking_flags: Finding[];
  open_questions: Finding[];

  /* Secondary lenses. They explain the headline; they never move it. */
  transport_work: {
    baseline: { trips: number; tonne_km: number; litres: number; tkm_per_l: number };
    trial: { trips: number; tonne_km: number; litres: number; tkm_per_l: number };
    change_pct: number;
    note: string;
  } | null;
  reference: { km_per_l: number; baseline_pct: number | null; trial_pct: number | null } | null;
  secondary: {
    baseline: { km_per_l: number; l_per_100: number };
    trial: { km_per_l: number; l_per_100: number };
    change_pct: number;
  } | null;
  load_sensitivity: {
    route_label: string;
    baseline_mass_t: number;
    trial_mass_t: number;
    mass_gap_pct: number;
    rows: { mass_dependent_pct: number; litres: number; km_per_l: number; change_pct: number }[];
    break_even_pct: number | null;
  } | null;
};

export type Trip = {
  id: number;
  sequence: number;
  trip_date: string | null;
  return_date: string | null;
  route_label: string | null;
  route_key: string | null;
  region: string | null;
  distance_km: number | null;
  distance_source: string;
  fuel_opening_l: number | null;
  fuel_issued_l: number | null;
  fuel_topup_l: number | null;
  fuel_closing_l: number | null;
  fuel_used_l: number | null;
  fuel_method: string;
  fuel_used_ivms_l: number | null;
  fuel_variance_l: number | null;
  load_out_kg: number | null;
  load_in_kg: number | null;
  utilisation_pct: number | null;
  avg_speed_kmh: number | null;
  driver_name: string | null;
  phase: "baseline" | "trial";
  phase_override: string | null;
  phase_override_reason: string | null;
  status: "valid" | "review" | "excluded";
  exclusion_reason: string | null;
  l_per_100: number | null;
  km_per_l: number | null;
  source: string;
  source_row_ref: string | null;
  notes: string | null;
};

export type Flag = {
  id: number;
  trip_id: number | null;
  code: string;
  severity: "info" | "warn" | "error";
  field: string | null;
  message: string;
  suggested_action: string | null;
  context: Record<string, unknown> | null;
  resolution: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
};

export type Trial = {
  id: number;
  reference: string;
  client_company: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  registration: string | null;
  vehicle_make: string | null;
  vehicle_type: string | null;
  rated_capacity_kg: number | null;
  tare_kg: number | null;
  device_serial: string | null;
  device_model: string | null;
  installed_on: string | null;
  trial_start: string | null;
  trial_end: string | null;
  fuel_price: number | null;
  currency: string;
  baseline_method: string;
  declared_baseline_l_per_100: string | number | null;
  fleet_standard_km_per_l: string | number | null;
  required_matched_trips: number;
  min_baseline_trips_per_route: number;
  status: string;
  // How the deal closed. Internal only — never present on the client's link.
  decided_on: string | null;
  outcome_note: string | null;
  units_sold: number | null;
  deal_value: number | null;
  enquiry_id: number | null;
  prospect_id: number | null;
  prospect_name: string | null;
  installation: { id: number; reference: string } | null;
  notes: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  review_token: string | null;
  review_expires_at: string | null;
  trips: Trip[];
  flags: Flag[];
  analysis: Analysis;
};

export type TrialSummary = {
  id: number;
  reference: string;
  client_company: string;
  registration: string | null;
  status: string;
  installed_on: string | null;
  trips_count: number;
  confidence: Confidence["level"];
  saving_pct: number | null;
  open_findings: number;
  updated_at: string;
};

/* ── labels ──────────────────────────────────────────────────────────────── */

export const TRIAL_STATUSES = [
  "draft", "baseline", "installed", "active", "review",
  "report_ready", "presented", "won", "lost",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  baseline: "Collecting baseline",
  installed: "Device fitted",
  active: "Trial running",
  review: "Reviewing data",
  report_ready: "Report ready",
  presented: "Presented to client",
  won: "Won",
  lost: "Lost",
};

/**
 * Confidence in words a marketer can act on, not a technical grade.
 * `insufficient` and `low` deliberately state no figure — see the analysis
 * service: a number that cannot be defended is worse for the deal than none.
 */
export const CONFIDENCE_LABEL: Record<Confidence["level"], string> = {
  insufficient: "No result yet",
  low: "Questions outstanding",
  moderate: "Result stands",
  high: "Result is strong",
};

export const CONFIDENCE_STYLE: Record<Confidence["level"], { background: string; color: string }> = {
  insufficient: { background: "rgba(0,0,0,0.05)", color: "#8A8A8A" },
  low: { background: "rgba(184,120,45,0.12)", color: "#8A5A18" },
  moderate: { background: "rgba(34,197,94,0.12)", color: "#16A34A" },
  high: { background: "rgba(34,197,94,0.16)", color: "#15803D" },
};

export const SEVERITY_STYLE: Record<Flag["severity"], { background: string; color: string; label: string }> = {
  error: { background: "rgba(158,59,51,0.1)", color: "#9E3B33", label: "Must settle" },
  warn: { background: "rgba(138,90,24,0.1)", color: "#8A5A18", label: "Worth checking" },
  info: { background: "rgba(0,0,0,0.05)", color: "#777", label: "For information" },
};

export const TRIP_STATUS_STYLE: Record<Trip["status"], { background: string; color: string; label: string }> = {
  valid: { background: "rgba(34,197,94,0.1)", color: "#16A34A", label: "Counted" },
  review: { background: "rgba(158,59,51,0.1)", color: "#9E3B33", label: "Needs review" },
  excluded: { background: "rgba(0,0,0,0.05)", color: "#8A8A8A", label: "Left out" },
};

/** Why a route cannot anchor a comparison, in plain words. */
export const UNMATCHED_REASON: Record<string, string> = {
  no_trial_trip: "No trip here since the device was fitted",
  trial_excluded: "Driven since fitting, but the trip was left out of the calculation",
  no_baseline: "Never driven before the device was fitted",
  baseline_excluded: "The earlier trip here was left out of the calculation",
  sparse_baseline: "Only driven once before the device was fitted",
  load_mismatch: "Carrying a different load from the baseline trips",
};

/* ── formatting ──────────────────────────────────────────────────────────── */

export const fmtDate = (d: string | null): string =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtNumber = (n: number | null | undefined, dp = 0): string =>
  n === null || n === undefined ? "—" : n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/**
 * Money in the trial's own currency. Trial amounts are stored as plain decimals
 * (unlike orders, which are in cents), so no division here.
 */
export const fmtMoney = (currency: string, amount: number | null): string => {
  if (amount === null || amount === undefined) return "—";
  const rounded = Math.round(amount);
  if (currency === "UGX") return `UGX ${rounded.toLocaleString("en-GB")}`;
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;
  return `${symbol}${rounded.toLocaleString("en-GB")}`;
};

/** Kilogrammes shown as tonnes, which is how fleets talk about loads. */
export const fmtTonnes = (kg: number | null): string =>
  kg === null || kg === undefined ? "—" : `${(kg / 1000).toFixed(1)} t`;
