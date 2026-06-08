import { defineRouting } from "next-intl/routing";

/* ── Locale routing ───────────────────────────────────────────────────────
   The public site is available in English (default) and Swahili. English keeps
   clean, unprefixed URLs (/about); Swahili is served under a prefix (/sw/about)
   so Google can index and rank each language separately.
   `as-needed` means the default locale gets NO prefix — every existing English
   URL stays byte-for-byte identical (zero SEO churn, no redirects).            */
export const locales = ["en", "sw"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
