"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Minus } from "lucide-react";
import { FetCalculatorCard } from "./FetCalculator";

/* Floating, homepage-only entry point to the FET savings calculator — the
   same tool that lives on the FET product page, surfaced without needing to
   navigate there. Marketing's complaint was that the calculator wasn't
   visible enough; this puts it one click away from the homepage, collapsed
   to a small launcher by default so it never competes with the page itself.

   Positioned bottom-left (WhatsAppButton owns bottom-right) and raised clear
   of the mobile StickyQuoteBar, which also renders on the homepage. */
export default function FetCalculatorWidget() {
  const t = useTranslations("fetCalculatorWidget");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed z-40 flex items-center gap-2.5 rounded-full shadow-lg transition-transform hover:scale-[1.03] left-4 bottom-[calc(env(safe-area-inset-bottom)+96px)] lg:left-6 lg:bottom-6 px-4 py-3 lg:px-5"
        style={{ background: "#1E1E1E", border: "1px solid rgba(197,178,122,0.35)", color: "#FAFAF8" }}
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
          style={{ background: "rgba(197,178,122,0.18)" }}
        >
          <Calculator className="w-4 h-4" style={{ color: "#C5B27A" }} />
        </span>
        <span className="text-[13px] font-semibold whitespace-nowrap hidden sm:inline">{t("launcher")}</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={t("panelTitle")}
      className="fixed z-40 flex flex-col rounded-[24px] shadow-2xl overflow-hidden left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+16px)] lg:left-6 lg:right-auto lg:bottom-6 lg:w-[440px]"
      style={{ maxHeight: "min(82vh, 720px)", background: "#F2F2F2", border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: "#1E1E1E" }}>
        <div className="flex items-center gap-2.5">
          <Calculator className="w-4 h-4" style={{ color: "#C5B27A" }} />
          <span className="text-[13px] font-semibold" style={{ color: "#FAFAF8" }}>{t("panelTitle")}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("minimize")}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-white/10"
          style={{ color: "#C5B27A" }}
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        <FetCalculatorCard />
      </div>
    </div>
  );
}
