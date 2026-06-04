"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import CurrencyToggle from "./CurrencyToggle";
import { useCart } from "@/lib/cart";
import { GRIND_OPTIONS, formatPrice, priceFor, type CoffeeProduct } from "@/lib/coffee-catalog";

export default function AddToCart({ product }: { product: CoffeeProduct }) {
  const { currency, addLine } = useCart();
  const router = useRouter();
  const [grind, setGrind] = useState<string>(GRIND_OPTIONS[0]);
  const [qty, setQty] = useState(1);

  const soldOut = product.stock === 0;
  const unit = priceFor(product, currency);

  function add() {
    addLine(
      {
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        weight: product.weight,
        grind,
        price_ugx: product.price_ugx,
        price_usd: product.price_usd,
      },
      qty
    );
    toast.success("Added to cart", {
      description: `${qty} × ${product.name} · ${product.weight} · ${grind}`,
      action: { label: "View cart", onClick: () => router.push("/shop/cart") },
    });
  }

  return (
    <div>
      {/* Price + currency */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <span
          style={{
            fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "34px",
            fontWeight: 700,
            color: "#1E1E1E",
            lineHeight: 1,
          }}
        >
          {formatPrice(unit, currency)}
        </span>
        <CurrencyToggle />
      </div>

      {/* Grind selector */}
      <div className="mb-6">
        <label className="text-[11px] font-bold uppercase tracking-[0.12em] block mb-2.5" style={{ color: "#999999" }}>
          Grind
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GRIND_OPTIONS.map((g) => {
            const active = grind === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGrind(g)}
                aria-pressed={active}
                className="text-left text-sm rounded-[14px] px-4 py-3 transition-all"
                style={{
                  border: active ? "1.5px solid #C5B27A" : "1.5px solid rgba(0,0,0,0.10)",
                  background: active ? "rgba(197,178,122,0.10)" : "#FFFFFF",
                  color: "#1E1E1E",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity + add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="inline-flex items-center justify-between rounded-full shrink-0"
          style={{ border: "1.5px solid rgba(0,0,0,0.12)", padding: "4px" }}
        >
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors"
          >
            <Minus className="w-4 h-4" style={{ color: "#1E1E1E" }} />
          </button>
          <span className="w-10 text-center font-semibold tabular-nums" style={{ color: "#1E1E1E" }}>
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors"
          >
            <Plus className="w-4 h-4" style={{ color: "#1E1E1E" }} />
          </button>
        </div>

        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-4 h-4" />
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
