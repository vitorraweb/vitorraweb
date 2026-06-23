import { defineRouting } from "next-intl/routing";

/* ── Locale routing ───────────────────────────────────────────────────────
   The public site is available in English (default), Swahili, and French.
   English keeps clean, unprefixed URLs (/about); the others are served under a
   prefix (/sw/about, /fr/careers) so Google can index and rank each language
   separately. `as-needed` means the default locale gets NO prefix — every
   existing English URL stays byte-for-byte identical (zero SEO churn).

   French is being rolled out page-by-page (careers first); untranslated keys
   fall back to English via the deep-merge in i18n/request.ts, and the main-site
   switcher only offers French where it's ready (see primaryLocales).            */
export const locales = ["en", "sw", "fr"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";

/* Locales the MAIN-site switcher offers today. French is live only on the
   careers portal for now, so it's intentionally not here yet — add "fr" when
   French is expanded site-wide. */
export const primaryLocales: AppLocale[] = ["en", "sw"];

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
