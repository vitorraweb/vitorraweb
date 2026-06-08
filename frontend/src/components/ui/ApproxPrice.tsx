"use client";

import { useRates, convert, formatMoney } from "@/lib/currency";

/* Shows the indicative UGX & USD equivalent of an EUR amount (FET prices are
   quoted in EUR). Renders nothing until the rate has loaded, so there's no
   layout flash and it degrades silently if the rate API is unreachable. */
export default function ApproxPrice({ eur, className }: { eur: number; className?: string }) {
  const { rates } = useRates();
  if (!rates) return null;

  const ugx = convert(eur, "EUR", "UGX", rates);
  const usd = convert(eur, "EUR", "USD", rates);

  return (
    <span className={className}>
      ≈ {formatMoney(ugx, "UGX", { roundUgxTo: 1000 })} · ≈ {formatMoney(usd, "USD")}
    </span>
  );
}
