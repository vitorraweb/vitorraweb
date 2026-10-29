/* Shared CRM helpers: phone links, money, and the activity vocabulary. */

/** wa.me / tel: need the number in international form; Ugandan 07… becomes 2567…. */
export function intlDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/[^\d]/g, "");
  if (!d) return null;
  if (d.startsWith("0") && d.length === 10) d = `256${d.slice(1)}`;
  if (d.length === 9 && d.startsWith("7")) d = `256${d}`;
  return d.length >= 9 ? d : null;
}

export function whatsappUrl(phone: string | null | undefined, text?: string): string | null {
  const d = intlDigits(phone);
  return d ? `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null;
}

export function telUrl(phone: string | null | undefined): string | null {
  const d = intlDigits(phone);
  return d ? `tel:+${d}` : null;
}

export const money = (v: number | null | undefined, cur = "UGX") =>
  v == null ? "—" : cur === "UGX" ? `UGX ${Math.round(v).toLocaleString("en-US")}` : `${cur === "USD" ? "$" : "€"}${Math.round(v).toLocaleString("en-US")}`;

/** Short form for board columns: UGX 12.4M. */
export const moneyShort = (v: number, cur = "UGX") => {
  const n = v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : String(v);
  return cur === "UGX" ? `UGX ${n}` : `${cur === "USD" ? "$" : "€"}${n}`;
};

export const KINDS: Record<string, string> = { call: "Call", whatsapp: "WhatsApp", meeting: "Meeting", visit: "Site visit", email: "Email", note: "Note" };
export const OUTCOMES: Record<string, string> = {
  reached: "Spoke to them", no_answer: "No answer", interested: "Interested", quote_requested: "Wants a quote",
  assessment: "Assessment booked", negotiating: "Negotiating", not_interested: "Not interested", won: "Agreed to buy",
};
export const LOST_REASONS: Record<string, string> = {
  price: "Price too high", timing: "Not the right time", competitor: "Chose a competitor", no_response: "Stopped responding",
  no_budget: "No budget", not_fit: "Not a fit", other: "Other",
};
export const PRODUCTS: Record<string, string> = { FET: "Fuel Eco Tech", SEAL: "SEAL Wound Spray", COFFEE: "Coffee", LOGISTICS: "Logistics" };

export const isoDay = (offsetDays = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
