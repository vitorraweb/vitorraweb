import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

/* ─── Indicative FX helper ────────────────────────────────────────────────────
   Reads the storefront rates from the backend (`GET /exchange-rate`) and offers
   tiny pure helpers to convert and format between UGX, USD, and EUR. Rates are
   anchored to USD: ugxPerUsd (UGX for $1) and eurPerUsd (EUR for $1). Used for
   the FET EUR→UGX/USD price helper and the converter widget — all amounts are
   indicative; a real quote is confirmed in the customer's preferred currency. */

export type Money = "UGX" | "USD" | "EUR";

export interface Rates {
  ugxPerUsd: number;
  eurPerUsd: number;
  source: string;
}

/* Sensible offline defaults so the helper still works if the API is unreachable. */
const FALLBACK: Rates = { ugxPerUsd: 3750, eurPerUsd: 0.92, source: "fallback" };

/* One shared in-flight fetch per page session (avoids every card re-fetching). */
let cached: Promise<Rates> | null = null;

export async function fetchRates(): Promise<Rates> {
  try {
    const res = await fetch(`${API_BASE_URL}/exchange-rate`, { cache: "no-store" });
    if (!res.ok) throw new Error("rate fetch failed");
    const d = (await res.json())?.data ?? {};
    return {
      ugxPerUsd: Number(d.ugx_per_usd) || FALLBACK.ugxPerUsd,
      eurPerUsd: Number(d.eur_per_usd) || FALLBACK.eurPerUsd,
      source: d.source ?? "fallback",
    };
  } catch {
    return FALLBACK;
  }
}

/** React hook: fetch the rates once (shared) and return them when ready. */
export function useRates(): { rates: Rates | null } {
  const [rates, setRates] = useState<Rates | null>(null);
  useEffect(() => {
    if (!cached) cached = fetchRates();
    let active = true;
    cached.then((r) => { if (active) setRates(r); });
    return () => { active = false; };
  }, []);
  return { rates };
}

const toUsd = (amount: number, from: Money, r: Rates): number =>
  from === "USD" ? amount : from === "UGX" ? amount / r.ugxPerUsd : amount / r.eurPerUsd;

const fromUsd = (usd: number, to: Money, r: Rates): number =>
  to === "USD" ? usd : to === "UGX" ? usd * r.ugxPerUsd : usd * r.eurPerUsd;

/** Convert `amount` from one currency to another, anchored through USD. */
export function convert(amount: number, from: Money, to: Money, r: Rates): number {
  if (from === to) return amount;
  return fromUsd(toUsd(amount, from, r), to, r);
}

/** Format a money amount for display. UGX shows whole shillings; USD/EUR show
    cents only for small amounts. `roundUgxTo` cleans up big indicative figures. */
export function formatMoney(amount: number, currency: Money, opts: { roundUgxTo?: number } = {}): string {
  if (currency === "UGX") {
    const step = opts.roundUgxTo ?? 1;
    const v = Math.round(amount / step) * step;
    return `UGX ${v.toLocaleString("en-US")}`;
  }
  const decimals = amount < 100 ? 2 : 0;
  const v = amount.toLocaleString(currency === "EUR" ? "en-IE" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return currency === "USD" ? `$${v}` : `€${v}`;
}
