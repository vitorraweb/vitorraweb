"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
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

  return (
    <div
      role="group"
      aria-label="Select language"
      className="inline-flex items-center rounded-full p-1 pl-2"
      style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.07)", opacity: isPending ? 0.6 : 1 }}
    >
      <Globe className="w-3.5 h-3.5 mr-1 shrink-0" style={{ color: "#7A6020" }} aria-hidden="true" />
      {OPTIONS.map((opt) => {
        const isActive = active === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => change(opt.code)}
            aria-pressed={isActive}
            className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide transition-colors"
            style={{ backgroundColor: isActive ? "#C5B27A" : "transparent", color: isActive ? "#1E1E1E" : "#666666" }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
