import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   Live Exchange Rate Hook — EUR → UGX
   
   Fetches the current EUR/UGX rate from a free public API,
   caches it in localStorage for 2 hours, and provides a
   converter function for EUR → UGX pricing.
   
   Falls back to a reasonable default rate if the API is unreachable.
   ═══════════════════════════════════════════════════════════════════ */

const CACHE_KEY = 'vitorra_eur_ugx_rate';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms
const FALLBACK_RATE = 3950; // Reasonable fallback if API fails

interface CachedRate {
  rate: number;
  fetchedAt: number;
}

function getCachedRate(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRate = JSON.parse(raw);
    // Check if cache is still valid (within 2 hours)
    if (Date.now() - cached.fetchedAt < CACHE_DURATION) {
      return cached;
    }
    return null; // Expired
  } catch {
    return null;
  }
}

function setCachedRate(rate: number): void {
  try {
    const data: CachedRate = { rate, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable — no-op
  }
}

async function fetchRate(): Promise<number> {
  // Try multiple free APIs for redundancy
  const apis = [
    {
      url: 'https://open.er-api.com/v6/latest/EUR',
      extract: (data: any) => data?.rates?.UGX,
    },
    {
      url: 'https://api.frankfurter.app/latest?from=EUR&to=UGX',
      extract: (data: any) => data?.rates?.UGX,
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json',
      extract: (data: any) => data?.eur?.ugx,
    },
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(api.url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const data = await res.json();
      const rate = api.extract(data);
      if (rate && typeof rate === 'number' && rate > 0) {
        return rate;
      }
    } catch {
      continue; // Try next API
    }
  }

  throw new Error('All exchange rate APIs failed');
}

export interface ExchangeRateResult {
  /** Current EUR → UGX rate */
  rate: number;
  /** Whether the rate is still loading */
  loading: boolean;
  /** Whether this is a cached/fallback rate (not freshly fetched) */
  isCached: boolean;
  /** Last time the rate was fetched */
  lastUpdated: Date | null;
  /** Convert EUR amount to UGX (rounded to nearest 500) */
  eurToUgx: (eurAmount: number) => number;
  /** Force a fresh fetch */
  refresh: () => Promise<void>;
}

export function useExchangeRate(): ExchangeRateResult {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const doFetch = useCallback(async (force = false) => {
    // Check cache first (unless forced)
    if (!force) {
      const cached = getCachedRate();
      if (cached) {
        setRate(cached.rate);
        setIsCached(true);
        setLastUpdated(new Date(cached.fetchedAt));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const freshRate = await fetchRate();
      setRate(freshRate);
      setIsCached(false);
      setLastUpdated(new Date());
      setCachedRate(freshRate);
    } catch {
      // Use cached rate if available (even expired), otherwise fallback
      const expired = (() => {
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          return raw ? JSON.parse(raw) as CachedRate : null;
        } catch { return null; }
      })();
      if (expired) {
        setRate(expired.rate);
        setLastUpdated(new Date(expired.fetchedAt));
      } else {
        setRate(FALLBACK_RATE);
        setLastUpdated(null);
      }
      setIsCached(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + refresh every 2 hours
  useEffect(() => {
    doFetch();
    const interval = setInterval(() => doFetch(true), CACHE_DURATION);
    return () => clearInterval(interval);
  }, [doFetch]);

  // Convert EUR → UGX, rounded to nearest 500
  const eurToUgx = useCallback((eurAmount: number): number => {
    const raw = eurAmount * rate;
    return Math.round(raw / 500) * 500;
  }, [rate]);

  return {
    rate,
    loading,
    isCached,
    lastUpdated,
    eurToUgx,
    refresh: () => doFetch(true),
  };
}

/**
 * Parse a EUR price string like "€250.00" or "€750" into a number.
 * Returns null if parsing fails.
 */
export function parseEurPrice(rrpStr: string | undefined): number | null {
  if (!rrpStr) return null;
  const cleaned = rrpStr.replace(/[€,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
