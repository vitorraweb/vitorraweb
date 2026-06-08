"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type AppLocale } from "@/i18n/routing";
import { SWAHILI_ENABLED } from "@/lib/config";

/* EN / SW segmented toggle — mirrors CurrencyToggle. Switching navigates to the
   same page under the chosen locale (usePathname is already locale-stripped, so
   /about ↔ /sw/about round-trips). The active locale persists via next-intl's
   NEXT_LOCALE cookie. Hidden entirely when SWAHILI_ENABLED is off.            */
const LABELS: Record<AppLocale, string> = { en: "EN", sw: "SW" };

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

  return (
    <div
      role="group"
      aria-label="Select language"
      className="inline-flex items-center rounded-full p-1 pl-2"
      style={{
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.07)",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <Globe
        className="w-3.5 h-3.5 mr-1 shrink-0"
        style={{ color: dark ? "rgba(255,255,255,0.55)" : "#7A6020" }}
        aria-hidden="true"
      />
      {locales.map((opt) => {
        const isActive = active === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => change(opt)}
            aria-pressed={isActive}
            className="px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-colors"
            style={{
              backgroundColor: isActive ? "#C5B27A" : "transparent",
              color: isActive ? "#1E1E1E" : dark ? "rgba(255,255,255,0.6)" : "#666666",
            }}
          >
            {LABELS[opt]}
          </button>
        );
      })}
    </div>
  );
}
