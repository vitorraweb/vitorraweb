"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setCookie } from "@/lib/cookies";

/* Language toggle for the careers portal. The portal lives outside the locale-
   prefixed routing (it's a standalone recruitment mini-site), so instead of
   navigating to a /xx/ URL we set our own CAREERS_LOCALE cookie and refresh —
   the server layout reads it and re-renders with the chosen language. A separate
   cookie (not next-intl's NEXT_LOCALE) keeps this isolated from the main site,
   so a French choice here can't redirect the marketing pages. Offers EN/SW/FR. */
const OPTIONS: { code: string; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "sw", label: "SW" },
  { code: "fr", label: "FR" },
];

export default function CareersLocaleSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const change = (next: string) => {
    if (next === active) return;
    setCookie("CAREERS_LOCALE", next, 31536000);
    startTransition(() => router.refresh());
  };

  /* Matches the main site's switcher: plain "EN / SW / FR", the active one
     in ink with a gold hairline beneath. */
  return (
    <div role="group" aria-label="Select language" className={`inline-flex items-center gap-2 t-label ${isPending ? "opacity-60" : ""}`}>
      {OPTIONS.map((opt, i) => {
        const isActive = active === opt.code;
        return (
          <span key={opt.code} className="inline-flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-line-strong">/</span>}
            <button
              type="button"
              onClick={() => change(opt.code)}
              aria-pressed={isActive}
              lang={opt.code}
              className={`py-1 border-b transition-colors ${isActive ? "border-gold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}
            >
              {opt.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
