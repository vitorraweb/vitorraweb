"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, MapPin, Phone, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { type Demo, type DemoItem, ugx } from "./demos";

/* ─── A sample client website ─────────────────────────────────────────────────
   Exactly the starter package: one page, up to six priced items, hours,
   directions, call and WhatsApp. Tapping an item opens the WhatsApp message a
   real customer would send, so an owner sees the order arrive the way it will
   on their phone. Samples never send anything: there is no real number.

   `framed` = inside the phone on /websites (scrolls within the frame);
   otherwise it fills the screen on /websites/demo/[slug].                   */

export function DemoSite({ demo, framed = false }: { demo: Demo; framed?: boolean }) {
  const t = useTranslations("websites.demo");
  const [picked, setPicked] = useState<DemoItem | null>(null);

  const message = picked
    ? `Hello ${demo.name}, I would like to ${demo.orderVerb}: ${picked.name}${picked.note ? ` (${picked.note})` : ""}, ${ugx(picked.price)}${picked.unit ? ` ${picked.unit}` : ""}. Is it available?`
    : "";

  return (
    <div className={cn("demo-site relative", demo.theme, framed ? "h-full" : "min-h-dvh")}>
      <div className={framed ? "h-full overflow-y-auto overscroll-contain" : undefined}>
      {/* Top bar */}
      <header className="demo-bar sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span aria-hidden="true" className="demo-mark grid place-items-center h-8 w-8 rounded-full text-[15px] font-semibold">{demo.mark}</span>
          <span className="truncate text-[14px] font-semibold">{demo.name}</span>
        </div>
        <button type="button" onClick={() => setPicked(demo.items[0])} className="demo-chip shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium">
          <WhatsAppIcon className="h-3.5 w-3.5" />{t("chat")}
        </button>
      </header>

      {/* Hero */}
      <section className="demo-hero px-5 pt-8 pb-9">
        <p className="demo-kicker text-[11px] uppercase tracking-[0.14em] font-semibold">{demo.kind}</p>
        <h1 className="mt-3 text-[30px] leading-[1.08] font-bold tracking-[-0.01em]">{demo.name}</h1>
        <p className="mt-3 text-[15px] leading-relaxed demo-soft">{demo.tagline}</p>
        <p className="mt-4 flex items-center gap-1.5 text-[13px] demo-soft"><MapPin aria-hidden="true" className="h-3.5 w-3.5" />{demo.area}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => setPicked(demo.items[0])} className="demo-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold">
            <WhatsAppIcon className="h-4 w-4" color="currentColor" />{t("orderWhatsapp")}
          </button>
          <span className="demo-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold">
            <Phone aria-hidden="true" className="h-4 w-4" />{t("call")}
          </span>
        </div>
      </section>

      {/* Items */}
      <section className="px-5 py-7">
        <h2 className="text-[18px] font-bold">{demo.itemsTitle}</h2>
        <p className="mt-1 text-[12px] demo-soft">{t("tapHint")}</p>
        <ul className="mt-4 space-y-2.5">
          {demo.items.map((item) => (
            <li key={item.name}>
              <button type="button" onClick={() => setPicked(item)} className="demo-item w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold">{item.name}</span>
                  {item.note && <span className="block text-[12px] demo-soft mt-0.5">{item.note}</span>}
                  <span className="block text-[13px] font-semibold demo-price mt-1">{ugx(item.price)}{item.unit ? <span className="font-normal demo-soft"> {item.unit}</span> : null}</span>
                </span>
                <span className="demo-primary shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold">{demo.orderLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Hours + directions */}
      <section className="px-5 pb-8 grid gap-3">
        <div className="demo-card rounded-2xl p-4">
          <p className="flex items-center gap-2 text-[14px] font-bold"><Clock aria-hidden="true" className="h-4 w-4" />{t("hours")}</p>
          <dl className="mt-2.5 space-y-1">
            {demo.hours.map(([d, h]) => (
              <div key={d} className="flex justify-between text-[13px]"><dt className="demo-soft">{d}</dt><dd className="font-medium">{h}</dd></div>
            ))}
          </dl>
        </div>
        <div className="demo-card rounded-2xl p-4">
          <p className="flex items-center gap-2 text-[14px] font-bold"><MapPin aria-hidden="true" className="h-4 w-4" />{t("findUs")}</p>
          <p className="mt-2 text-[13px] leading-relaxed">{demo.directions}</p>
          <p className="mt-2 text-[12px] demo-soft">{demo.extra}</p>
        </div>
      </section>

      <footer className="px-5 pb-10 text-[11px] demo-soft">
        <p>{t("sampleNote")}</p>
      </footer>
      </div>

      {/* What the customer's WhatsApp would show */}
      {picked && (
        <div className={cn("z-20 flex items-end", framed ? "absolute inset-0" : "fixed inset-0")} role="dialog" aria-modal="true" aria-label={t("sheetTitle")}>
          <button type="button" aria-label={t("close")} onClick={() => setPicked(null)} className="absolute inset-0 bg-black/45" />
          <div className="demo-sheet relative w-full rounded-t-3xl p-5 pb-7">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[14px] font-bold"><WhatsAppIcon className="h-4 w-4" />{t("sheetTitle")}</p>
              <button type="button" onClick={() => setPicked(null)} aria-label={t("close")} className="p-1"><X className="h-4 w-4" /></button>
            </div>
            <div className="wa-thread mt-4 rounded-2xl p-3">
              <p className="wa-bubble ml-auto max-w-[88%] rounded-xl rounded-tr-sm px-3 py-2 text-[13px] leading-snug">{message}</p>
            </div>
            <p className="mt-3 text-[12px] demo-soft leading-relaxed">{t("sheetBody")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
