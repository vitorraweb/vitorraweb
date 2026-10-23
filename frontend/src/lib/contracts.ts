/* ─── Sales contracts ─────────────────────────────────────────────────────────
   Types and form helpers for the FET sales contract (backend:
   App\Support\ContractTemplate / ContractDocument). Money travels in minor
   units like quotations: UGX in shillings, USD/EUR in cents.               */

import { toMajor, toMinor } from "@/lib/documents";

export type Clause = { key: string; title: string; body: string };

export type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "declined" | "void";

export type ContractForm = {
  agreement_date: string;
  seller_company: string; seller_address: string; seller_name: string; seller_title: string;
  buyer_name: string; buyer_registration: string; buyer_address: string; buyer_contact: string; buyer_phone: string; buyer_email: string;
  quantity: string; model_number: string; serial_number: string; vehicle_description: string;
  registration_numbers: string; chassis_numbers: string; engine_numbers: string;
  installation_location: string; installation_date: string;
  currency: string; unit_cost: string; total_amount: string; price_note: string;
  payment_option: "advance" | "instalment"; instalment_amount: string;
  bank_account_name: string; bank_name: string; bank_account_number: string; mobile_money: string;
  clauses: Clause[];
};

export type ContractRecord = {
  id: number; number: string; status: ContractStatus; is_expired: boolean; is_awaiting_signature: boolean;
  buyer_name: string; buyer_email: string | null; currency: string; total_amount: number | null; model_number: string | null;
  sent_at: string | null; sign_expires_at: string | null; signed_at: string | null; created_at: string | null;
  quotation?: { id: number; number: string } | null; sent_by?: string | null; sent_to?: string | null; viewed_at?: string | null;
  signer_name?: string | null; signer_position?: string | null; signature_type?: string | null; signer_ip?: string | null;
  signed_hash?: string | null; declined_at?: string | null; decline_reason?: string | null; template_clauses?: Clause[];
  quotation_id?: number | null;
};

const TEXT_FIELDS = [
  "agreement_date", "seller_company", "seller_address", "seller_name", "seller_title",
  "buyer_name", "buyer_registration", "buyer_address", "buyer_contact", "buyer_phone", "buyer_email",
  "model_number", "serial_number", "vehicle_description", "registration_numbers", "chassis_numbers", "engine_numbers",
  "installation_location", "installation_date", "price_note", "bank_account_name", "bank_name", "bank_account_number", "mobile_money",
] as const;
const MONEY_FIELDS = ["unit_cost", "total_amount", "instalment_amount"] as const;

/** API record (or defaults) → form. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function contractFromRecord(r: any): ContractForm {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const currency = s(r.currency) || "UGX";
  const f = { currency, quantity: s(r.quantity ?? 1), payment_option: r.payment_option === "instalment" ? "instalment" : "advance", clauses: (r.clauses ?? []) as Clause[] } as ContractForm;
  for (const k of TEXT_FIELDS) (f as Record<string, unknown>)[k] = s(r[k]);
  for (const k of MONEY_FIELDS) (f as Record<string, unknown>)[k] = r[k] === null || r[k] === undefined ? "" : toMajor(currency, Number(r[k]));
  return f;
}

/** Form → API payload (shared by save and live preview). */
export function contractPayload(f: ContractForm) {
  const nul = (v: string) => (v.trim() === "" ? null : v);
  const out: Record<string, unknown> = {
    currency: f.currency, quantity: Math.max(1, Math.round(Number(f.quantity) || 1)), payment_option: f.payment_option,
    clauses: f.clauses.map((c) => ({ key: c.key, title: c.title, body: c.body })),
  };
  for (const k of TEXT_FIELDS) out[k] = nul(f[k]);
  for (const k of MONEY_FIELDS) out[k] = f[k].trim() === "" ? null : toMinor(f.currency, f[k]);
  return out;
}

export const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: "Draft", sent: "Sent", viewed: "Opened by client", signed: "Signed", declined: "Declined", void: "Void",
};

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
