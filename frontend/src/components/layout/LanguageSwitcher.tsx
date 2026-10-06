"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import { primaryLocales, type AppLocale } from "@/i18n/routing";
import { SWAHILI_ENABLED } from "@/lib/config";

/* EN / SW segmented toggle — mirrors CurrencyToggle. Switching navigates to the
   same page under the chosen locale (usePathname is already locale-stripped, so
   /about ↔ /sw/about round-trips). The active locale persists via next-intl's
   NEXT_LOCALE cookie. Hidden entirely when SWAHILI_ENABLED is off.

   Offers only the primary locales (EN / SW). French is live on the careers
   portal for now (its own switcher); add "fr" to primaryLocales when French is
   expanded site-wide.                                                          */
const LABELS: Record<AppLocale, string> = { en: "EN", sw: "SW", fr: "FR" };

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!SWAHILI_ENABLED) return null;

  const change = (next: AppLocale) => {
    if (next === active) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  /* Quiet Authority: a plain "EN / SW" text toggle — the active language in
     ink with a gold hairline beneath, the other muted. No pill, no fill. */
  return (
    <div
      role="group"
      aria-label="Select language"
      className={cn("inline-flex items-center gap-2 t-label", isPending && "opacity-60")}
    >
      {primaryLocales.map((opt, i) => {
        const isActive = active === opt;
        return (
          <span key={opt} className="inline-flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className={dark ? "text-ink-line" : "text-line-strong"}>/</span>}
            <button
              type="button"
              onClick={() => change(opt)}
              aria-pressed={isActive}
              lang={opt}
              className={cn(
                "py-1 border-b transition-colors",
                isActive
                  ? cn("border-gold", dark ? "text-ink-fg" : "text-ink")
                  : cn("border-transparent", dark ? "text-ink-fg-muted hover:text-ink-fg" : "text-ink-muted hover:text-ink"),
              )}
            >
              {LABELS[opt]}
            </button>
          </span>
        );
      })}
    </div>
  );
}
