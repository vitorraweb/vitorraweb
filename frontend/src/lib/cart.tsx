"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { Currency } from "@/types";

/* ─── Cart line ────────────────────────────────────────────────────────────
   A single line in the cart. Identity is slug + grind, so the same coffee in
   two grinds sits on two lines. Prices in both currencies are stored on the
   line so the active-currency subtotal is a pure lookup (no live FX needed). */
export interface CartLine {
  slug: string;
  name: string;
  image: string;
  weight: string;
  grind: string;
  price_ugx: number;
  price_usd: number;
  qty: number;
}

export function lineKey(line: Pick<CartLine, "slug" | "grind">): string {
  return `${line.slug}__${line.grind}`;
}

const CART_KEY = "vitorra-cart-v1";
const CURRENCY_KEY = "vitorra-currency";

interface CartContextValue {
  lines: CartLine[];
  currency: Currency;
  setCurrency: (c: Currency) => void;
  count: number;
  subtotal: number;
  addLine: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  /** false during SSR / first paint — render neutral values until true. */
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [currency, setCurrencyState] = useState<Currency>("UGX");
  const [ready, setReady] = useState(false);

  /* Hydrate from localStorage once on mount. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed);
      }
      const cur = localStorage.getItem(CURRENCY_KEY);
      if (cur === "USD" || cur === "UGX") setCurrencyState(cur);
    } catch {
      /* corrupt storage — start empty */
    }
    setReady(true);
  }, []);

  /* Persist whenever the cart changes (only after hydration). */
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [lines, ready]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {
      /* non-fatal */
    }
  }, []);

  const addLine = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const key = lineKey(line);
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [...prev, { ...line, qty }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines]
  );

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) =>
          sum + (currency === "USD" ? l.price_usd : l.price_ugx) * l.qty,
        0
      ),
    [lines, currency]
  );

  const value: CartContextValue = {
    lines,
    currency,
    setCurrency,
    count,
    subtotal,
    addLine,
    setQty,
    removeLine,
    clear,
    ready,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
