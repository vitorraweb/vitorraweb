"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowRight, Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import CurrencyToggle from "./CurrencyToggle";
import { useCart } from "@/lib/cart";
import { GRIND_OPTIONS, formatPrice, priceFor, type CoffeeProduct } from "@/lib/coffee-catalog";

export default function ShopGrid({ products }: { products: CoffeeProduct[] }) {
  const { currency, addLine } = useCart();

  function quickAdd(p: CoffeeProduct) {
    addLine({
      slug: p.slug,
      name: p.name,
      image: p.images[0],
      weight: p.weight,
      grind: GRIND_OPTIONS[0],
      price_ugx: p.price_ugx,
      price_usd: p.price_usd,
    });
    toast.success("Added to cart", {
      description: `${p.name} · ${p.weight} · ${GRIND_OPTIONS[0]}`,
    });
  }

  return (
    <div className="container-max">
      {/* ── Section heading + currency toggle ─────────────────────────────── */}
      <Reveal className="mb-10 lg:mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="max-w-xl">
          <span className="eyebrow block mb-3">The collection</span>
          <h2
            className="gold-underline"
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#1E1E1E",
            }}
          >
            GOLD, in every format.
          </h2>
        </div>
        <CurrencyToggle />
      </Reveal>

      {/* ── Product grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p, i) => {
          const soldOut = p.stock === 0;
          return (
            <Reveal key={p.slug} delay={i * 80}>
              <div
                className="glow-card group rounded-[28px] overflow-hidden h-full flex flex-col"
                style={{
                  background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                  border: "1px solid rgba(197,178,122,0.16)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                {/* Image — links to detail */}
                <Link
                  href={`/shop/${p.slug}`}
                  className="relative block overflow-hidden"
                  style={{ aspectRatio: "4/5", backgroundColor: "#F4F1EB" }}
                >
                  <Image
                    src={p.images[0]}
                    alt={`${p.name}, ${p.weight}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {p.badge && (
                    <span
                      className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(30,30,30,0.85)", color: "#D4C49A" }}
                    >
                      {p.badge}
                    </span>
                  )}
                  {soldOut && (
                    <span
                      className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(30,30,30,0.85)", color: "#FFFFFF" }}
                    >
                      Sold out
                    </span>
                  )}
                </Link>

                {/* Body */}
                <div className="flex flex-col flex-1 p-6">
                  <Link href={`/shop/${p.slug}`}>
                    <h3
                      className="mb-1 transition-colors group-hover:text-[#7A6020]"
                      style={{
                        fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize: "22px",
                        fontWeight: 600,
                        color: "#1E1E1E",
                      }}
                    >
                      {p.name}
                    </h3>
                  </Link>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "#999999" }}>
                    {p.tagline}
                  </p>
                  <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#555555" }}>
                    {p.notes}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#1E1E1E",
                      }}
                    >
                      {formatPrice(priceFor(p, currency), currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => quickAdd(p)}
                      disabled={soldOut}
                      className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "#C5B27A",
                        color: "#1E1E1E",
                        padding: "9px 18px",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  <Link
                    href={`/shop/${p.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold mt-4 self-start"
                    style={{ color: "#7A6020" }}
                  >
                    View details
                    <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                  </Link>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
