/* ─── Vitorra Coffee — export trade specification ─────────────────────────────
   The B2B/export side of the coffee line: the figures an importer needs before
   they will open a conversation — grade, MOQ, HS code, incoterms, loading port,
   lead time and an indicative price band.

   SOURCE OF TRUTH: Vitorra's own verified listing on go4WorldBusiness
   (member 4781413, product 1950862, "Arabica (Roasted) Coffee Beans").
   Everything here is already published by Vitorra on that portal, so restating
   it on vitorra.org adds no new disclosure.

   DELIBERATELY NOT CARRIED OVER from that listing — see the note in
   PROGRESS.md; each needs the Director's confirmation before it goes public:
     • "Production capacity: 500,000 tons"  — exceeds Uganda's entire national
       annual output (~400,000 MT). Not publishable as written.
     • The export-destination country lists — the company profile and the
       product page give two different sets that overlap only on Germany.
       Until one is confirmed we say "European buyers", which both support.
     • "Annual sales USD 1m–5m" — commercially sensitive, and not something a
       buyer needs in order to enquire.

   Retail (the /shop bags) is a separate motion and is still gated: nothing in
   the trade listing gives a retail price. See COFFEE_SHOP_ENABLED.            */

/** A sellable grade. Screen sizes are deliberately not stated: the trade
    listing does not give them per grade, and inventing them would be a spec a
    buyer could hold us to. The buyer-facing description for each code lives in
    messages/*.json under `coffeeExport.grades`, so it localises. */
export interface CoffeeGrade {
  code: string;
  /** The grade quoted as standard on the trade listing. */
  flagship?: boolean;
}

export const COFFEE_GRADES: CoffeeGrade[] = [
  { code: "AA" },
  { code: "A", flagship: true },
  { code: "AB" },
  { code: "B" },
  { code: "PB" },
];

/* ─── Trade terms ─────────────────────────────────────────────────────────── */

export const COFFEE_EXPORT = {
  /** HS 0901.21 — roasted coffee, not decaffeinated. */
  hsCode: "0901.21",
  product: "Arabica (Roasted) Coffee Beans",
  trademark: "Vitorra Coffee",
  origin: "Uganda",
  /** Minimum order, in metric tonnes. */
  moqTonnes: 1,
  incoterms: "EXW",
  loadingPort: "Mombasa",
  /** Working days from order confirmation, per the trade listing. */
  leadTimeDays: 7,
  packaging: "Customised to the buyer's specification",
  process: "Hand-picked, washed or sun-dried, graded and roasted at origin",
  sampleAvailable: true,
  /** Samples are available; the buyer carries the cost. */
  sampleCostBorneBy: "buyer" as const,
} as const;

/* ─── Indicative price band ───────────────────────────────────────────────────
   USD per metric tonne, EXW. Published openly — it is already public on the
   trade portal, and the Director's precedent on FET is that a real number
   opens more conversations than "price on application".

   ⚠ This band does NOT apply to bulk. The listing says so explicitly, and the
   site must repeat it: bulk is quoted on quantity, format, specification,
   packaging and destination.                                                  */
export const COFFEE_PRICE_BAND = {
  currency: "USD" as const,
  low: 5600,
  high: 5800,
  per: "metric tonne" as const,
  /** Terms the band is quoted on. Shown next to the price, never separated. */
  basis: COFFEE_EXPORT.incoterms,
  appliesToBulk: false,
} as const;

/** "$5,600 – $5,800" — the band, formatted. */
export function formatPriceBand(): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: COFFEE_PRICE_BAND.currency,
      maximumFractionDigits: 0,
    }).format(n);
  return `${fmt(COFFEE_PRICE_BAND.low)} – ${fmt(COFFEE_PRICE_BAND.high)}`;
}

/* ─── Documentation offered on enquiry ────────────────────────────────────────
   Deliberately framed as "provided on enquiry", not as certifications held.
   Vitorra's listed certifications (ISO 9001:2015, ISO 27001) are company
   management-system certifications, NOT coffee-specific ones — no organic,
   food-safety or EUDR certification is claimed anywhere on the trade listing,
   and none is claimed here. See PROGRESS.md for what Operations still needs
   to put in place before selling into the EU.                                 */
export const EXPORT_DOCUMENTS = [
  "certificateOfOrigin",
  "gradingReport",
  "phytosanitary",
  "foodSafety",
] as const;

export type ExportDocument = (typeof EXPORT_DOCUMENTS)[number];
