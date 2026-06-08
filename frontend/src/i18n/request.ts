import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";
import en from "../../messages/en.json";

/* Static importers per non-default locale (kept as literal specifiers so
   Turbopack can resolve them; add a line here when a new locale is introduced). */
const overlays: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  sw: () => import("../../messages/sw.json"),
};

/* Deep-merge an overlay (e.g. Swahili) on top of the English base so any key
   that hasn't been translated yet falls back to its English string — the site
   always renders real copy, never a raw message key. */
type Dict = Record<string, unknown>;
function deepMerge(base: Dict, overlay: Dict): Dict {
  const out: Dict = { ...base };
  for (const key of Object.keys(overlay)) {
    const b = base[key];
    const o = overlay[key];
    out[key] =
      b && o && typeof b === "object" && typeof o === "object" && !Array.isArray(b) && !Array.isArray(o)
        ? deepMerge(b as Dict, o as Dict)
        : o;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale =
    requested && (routing.locales as readonly string[]).includes(requested)
      ? (requested as AppLocale)
      : routing.defaultLocale;

  const messages =
    locale === routing.defaultLocale || !overlays[locale]
      ? (en as Dict)
      : deepMerge(en as Dict, (await overlays[locale]()).default);

  return { locale, messages };
});
