"use client";

import { useCart } from "@/lib/cart";

/* Small UGX / USD segmented toggle. Reads and writes the shared cart currency
   so prices stay consistent across the grid, product page, and cart.        */
export default function CurrencyToggle({ dark = false }: { dark?: boolean }) {
  const { currency, setCurrency, ready } = useCart();
  const options: ("UGX" | "USD")[] = ["UGX", "USD"];

  return (
    <div
      role="group"
      aria-label="Display currency"
      className="inline-flex items-center rounded-full p-1"
      style={{
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        border: dark
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(0,0,0,0.07)",
      }}
    >
      {options.map((opt) => {
        const active = ready && currency === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setCurrency(opt)}
            aria-pressed={active}
            className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wide transition-colors"
            style={{
              backgroundColor: active ? "#C5B27A" : "transparent",
              color: active ? "#1E1E1E" : dark ? "rgba(255,255,255,0.6)" : "#666666",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
