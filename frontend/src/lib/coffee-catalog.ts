import type { Currency } from "@/types";
import { getCoffeeProducts } from "./api";

/* ─── Shop product shape ──────────────────────────────────────────────────
   A normalised, display-ready coffee SKU. The storefront renders these
   whether they come from the live API or the static fallback catalog below,
   so every component downstream works identically in both states.          */
export interface CoffeeProduct {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price_ugx: number;
  price_usd: number;
  weight: string;
  roast: string;
  origin: string;
  notes: string;
  badge?: string;
  /** First image is the primary packshot; the rest form the gallery. */
  images: string[];
  /** null = made-to-order / not tracked; 0 = out of stock; >0 = units left. */
  stock: number | null;
}

/* Grind options offered on the product page. Grind does not change price —
   it is carried on the cart line so the team knows how to prepare the order. */
export const GRIND_OPTIONS = [
  "Whole bean",
  "Ground — Cafetière / French press",
  "Ground — Filter / Pour-over",
  "Ground — Espresso",
] as const;

/* ─── Static fallback catalog ──────────────────────────────────────────────
   Used when the backend coffee endpoint is unavailable (mirrors the way
   BlogPreview falls back to editorial placeholders). Single-origin GOLD —
   the one blend Vitorra roasts — offered in three formats.                  */
export const COFFEE_CATALOG: CoffeeProduct[] = [
  {
    slug: "gold-medium-roast-250g",
    name: "GOLD · Medium Roast",
    tagline: "250g · Single origin Arabica",
    description:
      "Our flagship single-origin Arabica from the highland slopes of Mount Elgon — smooth, balanced, with notes of caramel. Washed, sun-dried, and roasted in Uganda. The everyday bag for home and office.",
    price_ugx: 38000,
    price_usd: 12,
    weight: "250g",
    roast: "Medium",
    origin: "Mount Elgon, Uganda",
    notes: "Smooth · Balanced · Caramel",
    badge: "Bestseller",
    images: [
      "/products/coffee/packshot.png",
      "/products/coffee/label-front.png",
      "/products/coffee/label-back.png",
      "/products/coffee/bean-macro.png",
    ],
    stock: null,
  },
  {
    slug: "gold-medium-roast-1kg",
    name: "GOLD · Medium Roast",
    tagline: "1kg · Single origin Arabica",
    description:
      "The same GOLD medium roast in a 1kg bag — built for busy households, offices, and cafés that go through coffee fast. Best value per cup, sealed fresh at origin.",
    price_ugx: 135000,
    price_usd: 42,
    weight: "1kg",
    roast: "Medium",
    origin: "Mount Elgon, Uganda",
    notes: "Smooth · Balanced · Caramel",
    badge: "Best value",
    images: [
      "/products/coffee/label-front.png",
      "/products/coffee/packshot.png",
      "/products/coffee/lifestyle.png",
      "/products/coffee/beans.png",
    ],
    stock: null,
  },
  {
    slug: "gold-gift-box",
    name: "GOLD Gift Box",
    tagline: "2 × 250g · Presentation box",
    description:
      "Two 250g bags of GOLD medium roast in a premium presentation box — the taste of Uganda, ready to gift. A considered present for clients, colleagues, and coffee lovers.",
    price_ugx: 82000,
    price_usd: 26,
    weight: "2 × 250g",
    roast: "Medium",
    origin: "Mount Elgon, Uganda",
    notes: "Smooth · Balanced · Caramel",
    badge: "Gift",
    images: [
      "/products/coffee/collage.png",
      "/products/coffee/lifestyle.png",
      "/products/coffee/packshot.png",
      "/products/coffee/bean-macro.png",
    ],
    stock: null,
  },
];

/* ─── Live API mapping ─────────────────────────────────────────────────────
   Normalise a backend Product into a CoffeeProduct. The backend Product type
   carries flat SKU fields; we fill display gaps with sensible defaults so the
   storefront never renders blanks if the API omits a field.                 */
import type { Product } from "@/types";

function fromApiProduct(p: Product): CoffeeProduct {
  const images = (p.images ?? [])
    .filter((m) => m.type === "image")
    .map((m) => m.url);
  const meta = p.meta ?? {};

  return {
    slug: p.slug,
    name: p.name,
    tagline: meta.tagline ?? p.description?.split(".")[0] ?? "Single origin Arabica",
    description: p.description ?? "",
    price_ugx: p.price_ugx ?? 0,
    price_usd: p.price_usd ?? 0,
    weight: meta.weight ?? "",
    roast: meta.roast ?? "Medium",
    origin: meta.origin ?? "Mount Elgon, Uganda",
    notes: meta.tasting_notes ?? "Smooth · Balanced · Caramel",
    badge: meta.badge,
    images: images.length ? images : ["/products/coffee/packshot.png"],
    stock: p.stock_quantity,
  };
}

/* ─── Data accessors ───────────────────────────────────────────────────────
   getShopProducts tries the live coffee endpoint and falls back to the static
   catalog. `isLive` lets the UI surface a quiet "preview catalog" note when
   running against the fallback (kept subtle — not an error state).          */
export async function getShopProducts(): Promise<{
  products: CoffeeProduct[];
  isLive: boolean;
}> {
  try {
    const apiProducts = await getCoffeeProducts();
    if (apiProducts && apiProducts.length) {
      return { products: apiProducts.map(fromApiProduct), isLive: true };
    }
  } catch {
    /* backend offline or endpoint not yet implemented — fall through */
  }
  return { products: COFFEE_CATALOG, isLive: false };
}

export async function getShopProduct(
  slug: string
): Promise<CoffeeProduct | null> {
  const { products } = await getShopProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/* ─── Price formatting ─────────────────────────────────────────────────────
   UGX shows whole shillings with thousands separators; USD shows two
   decimals with a leading $. Centralised so cart, grid, and detail agree.   */
export function formatPrice(value: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `UGX ${Math.round(value).toLocaleString("en-US")}`;
}

export function priceFor(product: CoffeeProduct, currency: Currency): number {
  return currency === "USD" ? product.price_usd : product.price_ugx;
}
