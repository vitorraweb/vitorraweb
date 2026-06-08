"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft } from "lucide-react";
import { useRates, convert, formatMoney, type Money } from "@/lib/currency";

/* Reusable, self-contained currency converter (UGX · USD · EUR) backed by the
   site's indicative rates. Drop it anywhere — it fetches the rate itself. */

const CURRENCIES: Money[] = ["UGX", "USD", "EUR"];

export default function CurrencyConverter({ className = "" }: { className?: string }) {
  const t = useTranslations("currency");
  const { rates } = useRates();
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<Money>("EUR");
  const [to, setTo] = useState<Money>("UGX");

  const value = parseFloat(amount) || 0;
  const result = rates ? convert(value, from, to, rates) : null;

  const swap = () => { setFrom(to); setTo(from); };

  const selectStyle = "h-11 rounded-xl px-3 text-sm font-semibold bg-white border outline-none focus:border-[#C5B27A] transition-colors";
  const selectBorder = { borderColor: "rgba(0,0,0,0.14)", color: "#1E1E1E" } as const;

  return (
    <div
      className={`rounded-[24px] p-6 md:p-7 ${className}`}
      style={{ background: "#FAFAF8", border: "1px solid rgba(197,178,122,0.35)" }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: "#7A6020" }}>
        {t("converterTitle")}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        {/* Amount + from */}
        <div className="flex-1">
          <label className="block text-xs mb-1.5" style={{ color: "#999" }}>{t("amountLabel")}</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 rounded-xl px-3 text-sm bg-white border outline-none focus:border-[#C5B27A] transition-colors"
              style={selectBorder}
            />
            <select value={from} onChange={(e) => setFrom(e.target.value as Money)} className={selectStyle} style={selectBorder}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Swap */}
        <button
          type="button"
          onClick={swap}
          aria-label={t("swap")}
          className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-colors hover:bg-white"
          style={{ border: "1px solid rgba(0,0,0,0.14)", color: "#7A6020" }}
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        {/* To */}
        <div className="flex-1">
          <label className="block text-xs mb-1.5" style={{ color: "#999" }}>{t("toLabel")}</label>
          <div className="flex items-center gap-2">
            <div
              className="w-full h-11 rounded-xl px-3 flex items-center text-sm font-semibold"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", color: "#1E1E1E" }}
            >
              {result === null ? "…" : formatMoney(result, to, { roundUgxTo: to === "UGX" ? 10 : 1 })}
            </div>
            <select value={to} onChange={(e) => setTo(e.target.value as Money)} className={selectStyle} style={selectBorder}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs" style={{ color: "#999" }}>{t("indicativeNote")}</p>
    </div>
  );
}
