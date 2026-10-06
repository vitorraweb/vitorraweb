import { COMPANY_REG_NO } from "@/lib/constants";

/* ─── The evidence centre — one record per credential ─────────────────────────
   The external review's first point: the site presented certifications
   prominently, but the page behind them only described them and asked
   visitors to contact sales. This file is the register the public page reads.

   Each record says what the credential is, who issued it, what it covers,
   and — as important — what it does NOT establish. Words live in
   messages/*.json under `evidence.records.<id>`; facts that are literal
   (dates, numbers) live here.

   ⚠ FOR OPERATIONS — fill these in as the documents are confirmed:
     • `reference`  certificate / clearance / policy number
     • `validUntil` expiry date, ISO format (YYYY-MM-DD)
     • `holder`     the legal entity the certificate is issued to — this matters:
                    for the ISO certificates we do not yet know whether the
                    holder is Vitorra or the FET manufacturer
     • `document`   "public" once Vitorra may publish the file (then add `href`),
                    otherwise "request"
   Empty fields are simply not shown. Never type a value you haven't seen on
   the actual document.                                                      */

export type EvidenceGroup = "company" | "fet" | "seal";

export interface EvidenceRecord {
  id: string;
  group: EvidenceGroup;
  /** Human-readable date the credential was issued or the test signed. */
  issued?: string;
  reference?: string;
  validUntil?: string;
  holder?: string;
  document: "public" | "request";
  href?: string;
}

export const EVIDENCE: EvidenceRecord[] = [
  { id: "ursb", group: "company", reference: COMPANY_REG_NO, holder: "Vitorra Holdings Limited", document: "request" },

  { id: "cti", group: "fet", issued: "10 November 2025", document: "request" },
  { id: "avl", group: "fet", document: "request" },
  { id: "qm", group: "fet", document: "request" },
  { id: "iso9001", group: "fet", document: "request" },
  { id: "iso14001", group: "fet", document: "request" },
  { id: "iso27001", group: "fet", document: "request" },
  { id: "zurich", group: "fet", document: "request" },

  { id: "fda", group: "seal", document: "request" },
  { id: "milstd", group: "seal", document: "request" },
];

export const EVIDENCE_GROUPS: EvidenceGroup[] = ["company", "fet", "seal"];
