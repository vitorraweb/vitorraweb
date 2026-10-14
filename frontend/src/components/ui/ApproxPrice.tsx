"use client";

import { useRates, convert, formatMoney } from "@/lib/currency";

/* Shows the indicative USD & EUR equivalent of a UGX amount (FET prices are
   quoted in UGX). Renders nothing until the rate has loaded, so there's no
   layout flash and it degrades silently if the rate API is unreachable. */
export default function ApproxPrice({ ugx, className }: { ugx: number; className?: string }) {
  const { rates } = useRates();
  if (!rates) return null;

  const usd = convert(ugx, "UGX", "USD", rates);
  const eur = convert(ugx, "UGX", "EUR", rates);

  return (
    <span className={className}>
      ≈ {formatMoney(usd, "USD")} · ≈ {formatMoney(eur, "EUR")}
    </span>
  );
}
