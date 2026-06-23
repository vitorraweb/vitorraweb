import { routing } from "./routing";
import en from "../../messages/en.json";

/* Static importers per non-default locale (kept as literal specifiers so
   Turbopack can resolve them; add a line here when a new locale is introduced). */
const overlays: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  sw: () => import("../../messages/sw.json"),
  fr: () => import("../../messages/fr.json"),
};

type Dict = Record<string, unknown>;

/* Deep-merge an overlay (e.g. Swahili / French) on top of the English base so any
   key that hasn't been translated yet falls back to its English string — the UI
   always renders real copy, never a raw message key. */
export function deepMerge(base: Dict, overlay: Dict): Dict {
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

/** The full message dictionary for a locale, English-merged (used by the request
 *  config and by the careers portal, which resolves its locale from a cookie). */
export async function loadMessages(locale: string): Promise<Dict> {
  if (locale === routing.defaultLocale || !overlays[locale]) {
    return en as Dict;
  }
  return deepMerge(en as Dict, (await overlays[locale]()).default);
}
