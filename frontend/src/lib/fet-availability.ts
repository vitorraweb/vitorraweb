import { API_BASE_URL } from "./constants";

/* ─── FET stock status for the website ────────────────────────────────────────
   Read from Finance's stock book (Accounting → Stock) through the public
   /fet/availability endpoint, which only ever says "in stock", "low" (with the
   number left when it is 1–3) or "available to order" — never full counts.
   Refreshed every five minutes; when the API is unreachable the pages simply
   show no stock line rather than guessing.                                    */

export type FetStock = { status: "in_stock" } | { status: "low"; left: number } | { status: "order" };
export type FetAvailability = { models: Partial<Record<"FI" | "FII" | "FIII" | "FIV", FetStock>>; checked_at: string };

export async function getFetAvailability(): Promise<FetAvailability | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fet/availability`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as FetAvailability;
  } catch {
    return null;
  }
}

/** schema.org availability for a model's Offer. */
export function schemaAvailability(s?: FetStock): string | undefined {
  if (!s) return undefined;
  return s.status === "order" ? "https://schema.org/BackOrder" : s.status === "low" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock";
}
