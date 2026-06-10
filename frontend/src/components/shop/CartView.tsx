"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, Mail, ArrowRight } from "lucide-react";
import CurrencyToggle from "./CurrencyToggle";
import { useCart, lineKey } from "@/lib/cart";
import { formatPrice } from "@/lib/coffee-catalog";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";

const WHATSAPP_NUMBER = CONTACT_PHONE.replace(/[^0-9]/g, "");

export default function CartView() {
  const { lines, currency, subtotal, count, setQty, removeLine, clear, ready } = useCart();

  /* Avoid hydration flicker: hold a neutral frame until localStorage loads. */
  if (!ready) {
    return (
      <div className="container-max py-10 text-center text-sm" style={{ color: "#999999" }}>
        Loading your cart…
      </div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────────────────── */
  if (count === 0) {
    return (
      <div className="container-max">
        <div
          className="rounded-[32px] text-center py-16 px-6"
          style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <span
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
            style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
          >
            <ShoppingBag className="w-7 h-7" />
          </span>
          <h2
            className="mb-3"
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 700,
              color: "#1E1E1E",
            }}
          >
            Your cart is empty.
          </h2>
          <p className="mb-8 max-w-sm mx-auto" style={{ fontSize: "15px", lineHeight: 1.7, color: "#666666" }}>
            Single-origin GOLD, roasted in Uganda and delivered to your door.
            Let&apos;s find your bag.
          </p>
          <Link href="/shop" className="btn-primary">
            Browse the shop
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  /* ── Order summary text for WhatsApp / email checkout ─────────────────── */
  function buildOrderText() {
    const itemLines = lines.map((l) => {
      const lineTotal = (currency === "USD" ? l.price_usd : l.price_ugx) * l.qty;
      return `• ${l.qty} × ${l.name} (${l.weight}, ${l.grind}) · ${formatPrice(lineTotal, currency)}`;
    });
    return [
      "Hello Vitorra Coffee, I'd like to place an order:",
      "",
      ...itemLines,
      "",
      `Subtotal: ${formatPrice(subtotal, currency)}`,
      "",
      "My details:",
      "Name:",
      "Delivery address:",
      "Phone:",
    ].join("\n");
  }

  const orderText = buildOrderText();
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Vitorra Coffee order request"
  )}&body=${encodeURIComponent(orderText)}`;

  return (
    <div className="container-max grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start">
      {/* ── Line items ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: "#666666" }}>
            {count} item{count === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-[#1E1E1E]"
            style={{ color: "#999999" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear cart
          </button>
        </div>

        <ul className="space-y-3">
          {lines.map((l) => {
            const key = lineKey(l);
            const unit = currency === "USD" ? l.price_usd : l.price_ugx;
            return (
              <li
                key={key}
                className="flex gap-4 rounded-[20px] p-4"
                style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div
                  className="relative rounded-[14px] overflow-hidden shrink-0"
                  style={{ width: 88, height: 88, backgroundColor: "#F4F1EB" }}
                >
                  <Image src={l.image} alt={l.name} fill sizes="88px" className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/shop/${l.slug}`}
                        className="block font-semibold truncate transition-colors hover:text-[#7A6020]"
                        style={{
                          fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                          fontSize: "18px",
                          color: "#1E1E1E",
                        }}
                      >
                        {l.name}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "#999999" }}>
                        {l.weight} · {l.grind}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(key)}
                      aria-label={`Remove ${l.name}`}
                      className="shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#999999" }} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3">
                    {/* Qty stepper */}
                    <div
                      className="inline-flex items-center rounded-full"
                      style={{ border: "1.5px solid rgba(0,0,0,0.12)", padding: "2px" }}
                    >
                      <button
                        type="button"
                        onClick={() => setQty(key, l.qty - 1)}
                        aria-label="Decrease quantity"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" style={{ color: "#1E1E1E" }} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums" style={{ color: "#1E1E1E" }}>
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(key, l.qty + 1)}
                        aria-label="Increase quantity"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" style={{ color: "#1E1E1E" }} />
                      </button>
                    </div>

                    <span className="font-semibold tabular-nums" style={{ color: "#1E1E1E" }}>
                      {formatPrice(unit * l.qty, currency)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm font-semibold mt-6"
          style={{ color: "#7A6020" }}
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Continue shopping
        </Link>
      </div>

      {/* ── Summary + checkout ─────────────────────────────────────────────── */}
      <div
        className="rounded-[24px] p-6 md:p-7 lg:sticky lg:top-24"
        style={{ background: "#FFFFFF", border: "1px solid rgba(197,178,122,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1E1E1E",
            }}
          >
            Order summary
          </h2>
          <CurrencyToggle />
        </div>

        <div className="space-y-3 pb-5 mb-5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "#666666" }}>Subtotal</span>
            <span className="font-semibold tabular-nums" style={{ color: "#1E1E1E" }}>
              {formatPrice(subtotal, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "#666666" }}>Delivery</span>
            <span style={{ color: "#999999" }}>Confirmed on order</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold" style={{ color: "#1E1E1E" }}>Total</span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "26px",
              fontWeight: 700,
              color: "#1E1E1E",
            }}
          >
            {formatPrice(subtotal, currency)}
          </span>
        </div>

        {/* Checkout */}
        <Link href="/shop/checkout" className="btn-primary w-full justify-center">
          Proceed to checkout
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs leading-relaxed mt-4 mb-4" style={{ color: "#999999" }}>
          No payment is taken now. Our team confirms stock, delivery, and
          payment within 24 hours. Secure online card &amp; mobile-money
          checkout is coming soon.
        </p>

        {/* Alternative order channels */}
        <div className="pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <p className="text-xs font-semibold mb-2.5" style={{ color: "#777777" }}>Prefer to order another way?</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 flex-1 rounded-full text-xs font-semibold py-2.5 transition-colors" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#1E1E1E" }}>
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
            <a href={mailtoHref} className="inline-flex items-center justify-center gap-1.5 flex-1 rounded-full text-xs font-semibold py-2.5 transition-colors" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#1E1E1E" }}>
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
