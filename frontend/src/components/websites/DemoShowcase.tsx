"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Hammer, Scissors, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DEMOS } from "./demos";
import { DemoSite } from "./DemoSite";

/* The signature of the /websites page: a phone holding a working sample site.
   The owner switches between three kinds of business, taps an item and sees
   the WhatsApp order their customers would send. It sells the outcome (orders
   on WhatsApp), not "a website".                                            */

const ICON = { salon: Scissors, hardware: Hammer, restaurant: UtensilsCrossed } as const;

export function DemoShowcase({ onInk = true }: { onInk?: boolean }) {
  const t = useTranslations("websites.showcase");
  const [active, setActive] = useState(0);
  const demo = DEMOS[active];

  return (
    <div className="flex flex-col items-center">
      <div role="tablist" aria-label={t("tabsLabel")} className={cn("inline-flex gap-1 rounded-full p-1 border", onInk ? "border-ink-line" : "border-line-strong")}>
        {DEMOS.map((d, i) => {
          const Icon = ICON[d.slug];
          const on = i === active;
          return (
            <button
              key={d.slug}
              type="button"
              role="tab"
              id={`demo-tab-${d.slug}`}
              aria-selected={on}
              aria-controls="demo-phone"
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] transition-colors",
                on ? (onInk ? "bg-ink-fg text-ink" : "bg-ink text-paper") : (onInk ? "text-ink-fg-muted hover:text-ink-fg" : "text-ink-muted hover:text-ink"),
              )}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />{t(`tab.${d.slug}`)}
            </button>
          );
        })}
      </div>

      <div
        id="demo-phone"
        role="tabpanel"
        aria-labelledby={`demo-tab-${demo.slug}`}
        className="demo-phone relative mt-6 w-[300px] sm:w-[330px] h-[600px] sm:h-[660px] rounded-[44px] p-[10px]"
      >
        <span aria-hidden="true" className="demo-notch absolute left-1/2 top-[18px] z-30 h-[22px] w-[90px] -translate-x-1/2 rounded-full" />
        <div className="relative h-full overflow-hidden rounded-[34px]">
          <DemoSite key={demo.slug} demo={demo} framed />
        </div>
      </div>

      <p className={cn("mt-5 t-small text-center max-w-[22rem]", onInk ? "text-ink-fg-muted" : "text-ink-muted")}>{t("hint")}</p>
      <Link href={`/websites/demo/${demo.slug}`} className={cn("q-link t-small mt-2", onInk ? "text-ink-fg" : "text-ink")}>
        {t("openOnPhone")}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
