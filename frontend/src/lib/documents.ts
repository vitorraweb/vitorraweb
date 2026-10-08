/* ─── Quotations & branded invoices ───────────────────────────────────────────
   Shared types and starting text for the Finance team's Coffee / FET document
   templates (backend: App\Support\BrandedDocument). Amounts travel to the API
   in minor units, the same convention as invoices: UGX in shillings, USD/EUR
   in cents. The editor works in major units and converts at the edge.        */

export type Business = "coffee" | "fet";
export type DocType = "quotation" | "invoice";
export type InvoiceKind = "standard" | "commercial" | "final";

export const BUSINESS_LABEL: Record<Business, string> = { coffee: "Vitorra Coffee", fet: "Fuel Eco Tech" };
export const KIND_LABEL: Record<InvoiceKind, string> = { standard: "Invoice", commercial: "Commercial invoice", final: "Final invoice" };
export const CURRENCIES = ["UGX", "USD", "EUR"] as const;

export type DocLine = { name: string; details: string; quantity: number; unit: string; price: string };

export type DocForm = {
  business: Business;
  kind: InvoiceKind;
  currency: string;
  issue_date: string;
  second_date: string; // valid_until (quotation) / due_date (invoice)
  customer_name: string;
  customer_address: string;
  customer_attention: string;
  customer_tax_id: string;
  customer_phone: string;
  customer_email: string;
  sales_contact: string;
  reference: string;
  incoterms: string;
  port_of_loading: string;
  payment_terms: string;
  payment_schedule: string;
  inspection: string;
  shipment_schedule: string;
  deposit_percent: string;
  tax_rate: string;
  tax_label: string;
  total_label: string;
  notes: string;
  terms: string;
  lines: DocLine[];
};

const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Minor units ⇄ the figure a person types. */
export const toMinor = (currency: string, major: string) => {
  const n = Number(String(major).replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  return currency === "UGX" ? Math.round(n) : Math.round(n * 100);
};
export const toMajor = (currency: string, minor: number) => (currency === "UGX" ? String(minor) : (minor / 100).toFixed(2));

export function formatMoney(currency: string, minor: number): string {
  const major = currency === "UGX" ? minor : minor / 100;
  const n = major.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === "EUR" ? `€${n}` : currency === "USD" ? `$${n}` : `${currency} ${n}`;
}

/** Incoterms offered on coffee documents. EXW = Ex Works (collected at origin). */
export const INCOTERMS = [
  { code: "FOB", label: "FOB · Free on Board", place: "Mombasa" },
  { code: "CIF", label: "CIF · Cost, Insurance & Freight", place: "Hamburg" },
  { code: "EXW", label: "EXW · Ex Works", place: "Kampala" },
] as const;
const INCOTERM_SUFFIX = " (Incoterms® 2020)";

/** "CIF Hamburg (Incoterms® 2020)" → { code: "CIF", place: "Hamburg" }; anything else is "other". */
export function splitIncoterm(value: string): { code: string; place: string } {
  const v = value.trim();
  if (!v) return { code: "", place: "" };
  const m = /^(FOB|CIF|EXW)\b\s*(.*?)\s*(\(Incoterms[^)]*\))?$/i.exec(v);
  return m ? { code: m[1].toUpperCase(), place: m[2] } : { code: "OTHER", place: v };
}

export function joinIncoterm(code: string, place: string): string {
  if (!code) return "";
  if (code === "OTHER") return place;
  return `${code}${place.trim() ? ` ${place.trim()}` : ""}${INCOTERM_SUFFIX}`;
}

/** The FET range (lib/fet-pricing.ts) as quick-add lines; the price is quoted per job. */
export const FET_LINES: { name: string; fits: string }[] = [
  { name: "FET – PRO I", fits: "Compact and mid-range cars, mini-buses (1.4–2.0 L)" },
  { name: "FET – PRO II", fits: "SUVs, sports, upper-class and large cars (1.5–3.0 L)" },
  { name: "FET – PRO III", fits: "Light commercial trucks and vans (3.0–6.7 L)" },
  { name: "FET – PRO IV", fits: "Heavy goods vehicles and haulage (12–13 L)" },
];
export const FET_DETAILS = "Fuel Eco Tech System\nfor enhanced fuel efficiency\nand cleaner engine performance";

/** Starting wording per business, taken from the approved templates. */
export function blankForm(business: Business, type: DocType, kind: InvoiceKind = "standard", salesContact = ""): DocForm {
  const base = {
    business, kind, issue_date: today(), second_date: addDays(today(), 30),
    customer_name: "", customer_address: "", customer_attention: "", customer_tax_id: "", customer_phone: "", customer_email: "",
    sales_contact: salesContact, tax_rate: "0", tax_label: "", total_label: "", notes: "", terms: "",
  };
  if (business === "coffee") {
    return {
      ...base,
      currency: "EUR",
      reference: "",
      incoterms: "FOB Mombasa (Incoterms® 2020)",
      port_of_loading: "Mombasa, Kenya",
      payment_terms: "30% Advance, 70% against B/L",
      deposit_percent: "30",
      payment_schedule:
        "30% Advance Deposit ({deposit}) required upon order confirmation.\n70% Balance ({balance}) payable against presentation of shipping documents\n(Clean Shipped on Board Bill of Lading, Phytosanitary Certificate, Certificate of Origin Form ICO).",
      inspection: "Quality inspection and export grading certified by the Uganda Coffee Development Authority (UCDA) prior to dispatch.",
      shipment_schedule: "Estimated departure from Port of Mombasa within 18 days from deposit confirmation.",
      lines: [{ name: "Uganda Arabica AA Green Beans", details: "", quantity: 1000, unit: "kg", price: "" }],
    };
  }
  return {
    ...base,
    currency: "UGX",
    reference: "FET – PRO II",
    incoterms: "",
    port_of_loading: "",
    payment_terms: "50% upon confirmation,\nbalance after 30 days of use",
    deposit_percent: "",
    payment_schedule: "50% upon order confirmation, balance payable after 30 days of use\nand confirmation of the device’s effectiveness in your vehicle.",
    inspection: "",
    shipment_schedule: "To be agreed.",
    lines: [{ name: "FET – PRO II", details: FET_DETAILS, quantity: 1, unit: "pcs.", price: "" }],
  };
}

/** Form → API payload (shared by save and live preview). */
export function toPayload(f: DocForm, type: DocType) {
  const nul = (s: string) => (s.trim() === "" ? null : s);
  return {
    business: f.business,
    ...(type === "invoice" ? { kind: f.kind, due_date: nul(f.second_date), terms: nul(f.terms) } : { valid_until: nul(f.second_date) }),
    currency: f.currency,
    issue_date: f.issue_date || null,
    customer_name: f.customer_name,
    customer_address: nul(f.customer_address),
    customer_attention: nul(f.customer_attention),
    customer_tax_id: nul(f.customer_tax_id),
    customer_phone: nul(f.customer_phone),
    customer_email: nul(f.customer_email),
    sales_contact: nul(f.sales_contact),
    reference: nul(f.reference),
    incoterms: nul(f.incoterms),
    port_of_loading: nul(f.port_of_loading),
    payment_terms: nul(f.payment_terms),
    payment_schedule: nul(f.payment_schedule),
    inspection: nul(f.inspection),
    shipment_schedule: nul(f.shipment_schedule),
    deposit_percent: f.deposit_percent ? Number(f.deposit_percent) : null,
    tax_rate: Number(f.tax_rate || 0),
    tax_label: nul(f.tax_label),
    total_label: nul(f.total_label),
    notes: nul(f.notes),
    items: f.lines
      .filter((l) => l.name.trim())
      .map((l) => ({
        [type === "invoice" ? "description" : "name"]: l.name,
        ...(type === "invoice" ? { name: l.name } : {}),
        details: nul(l.details),
        quantity: Math.max(1, Math.round(l.quantity || 1)),
        unit: nul(l.unit),
        unit_price: toMinor(f.currency, l.price),
      })),
  };
}

/** API record → form. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromRecord(r: any, type: DocType): DocForm {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    business: (r.business ?? "coffee") as Business,
    kind: (r.kind ?? "standard") as InvoiceKind,
    currency: r.currency,
    issue_date: s(r.issue_date),
    second_date: s(type === "quotation" ? r.valid_until : r.due_date),
    customer_name: s(r.customer_name), customer_address: s(r.customer_address), customer_attention: s(r.customer_attention),
    customer_tax_id: s(r.customer_tax_id), customer_phone: s(r.customer_phone), customer_email: s(r.customer_email),
    sales_contact: s(r.sales_contact), reference: s(r.reference), incoterms: s(r.incoterms), port_of_loading: s(r.port_of_loading),
    payment_terms: s(r.payment_terms), payment_schedule: s(r.payment_schedule), inspection: s(r.inspection),
    shipment_schedule: s(r.shipment_schedule), deposit_percent: s(r.deposit_percent), tax_rate: s(r.tax_rate ?? 0),
    tax_label: s(r.tax_label), total_label: s(r.total_label), notes: s(r.notes), terms: s(r.terms),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines: (r.items ?? []).map((it: any) => ({
      name: s(it.name ?? it.description), details: s(it.details), quantity: Number(it.quantity) || 1,
      unit: s(it.unit), price: toMajor(r.currency, Number(it.unit_price) || 0),
    })),
  };
}
