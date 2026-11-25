"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SAMPLES } from "./demos";

/* The hero object on /websites: a browser window showing the first screen of
   each sample site (a real capture of the real page), switched by tabs, with
   a link to open the live sample. It sells range: four kinds of business,
   four different looks, all from the same UGX 500,000 offer. */

export function SampleShowcase() {
  const t = useTranslations("websites.showcase");
  const [active, setActive] = useState(0);
  const sample = SAMPLES[active];

  return (
    <div>
      <div role="tablist" aria-label={t("tabsLabel")} className="flex flex-wrap gap-2">
        {SAMPLES.map((x, i) => (
          <button
            key={x.slug}
            type="button"
            role="tab"
            id={`sample-tab-${x.slug}`}
            aria-selected={i === active}
            aria-controls="sample-window"
            onClick={() => setActive(i)}
            className={cn(
              "min-h-11 rounded-full px-4 text-[13px] border transition-colors",
              i === active ? "bg-ink-fg text-ink border-ink-fg" : "border-ink-line text-ink-fg-muted hover:text-ink-fg",
            )}
          >
            {t(`tab.${x.slug}`)}
          </button>
        ))}
      </div>

      <div id="sample-window" role="tabpanel" aria-labelledby={`sample-tab-${sample.slug}`} className="mt-5 rounded-[10px] border border-ink-line bg-ink-line overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-10 bg-ink">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-line" /><span className="h-2.5 w-2.5 rounded-full bg-ink-line" /><span className="h-2.5 w-2.5 rounded-full bg-ink-line" />
          </span>
          <span className="flex-1 truncate text-center text-[12px] text-ink-fg-muted">{t("address", { slug: sample.slug })}</span>
        </div>
        <Link href={`/websites/demo/${sample.slug}`} className="block relative aspect-[16/10] bg-ink" aria-label={t("open", { name: sample.name })}>
          {SAMPLES.map((x, i) => (
            <Image
              key={x.slug}
              src={x.shot}
              alt={t("shotAlt", { name: x.name })}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={cn("object-cover object-top transition-opacity duration-500", i === active ? "opacity-100" : "opacity-0")}
            />
          ))}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <p className="t-small text-ink-fg-muted">{t("caption", { name: sample.name })}</p>
        <Link href={`/websites/demo/${sample.slug}`} className="q-link t-small text-ink-fg">
          {t("openShort")}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
