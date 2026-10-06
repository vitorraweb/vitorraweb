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

  const selectStyle = "h-11 rounded-edge px-3 text-sm font-semibold bg-white border border-line-strong text-ink outline-none focus:border-ink transition-colors";

  return (
    <div
      className={`rounded-frame border border-line bg-paper p-6 md:p-7 ${className}`}
    >
      <p className="t-label text-gold-ink mb-4">
        {t("converterTitle")}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        {/* Amount + from */}
        <div className="flex-1">
          <label className="block t-label text-ink-muted mb-2">{t("amountLabel")}</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 rounded-edge px-3 text-sm bg-white border border-line-strong text-ink outline-none focus:border-ink transition-colors"
             
            />
            <select value={from} onChange={(e) => setFrom(e.target.value as Money)} className={selectStyle}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Swap */}
        <button
          type="button"
          onClick={swap}
          aria-label={t("swap")}
          className="shrink-0 h-11 w-11 rounded-edge border border-line-strong text-gold-ink flex items-center justify-center transition-colors hover:border-ink"
          
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        {/* To */}
        <div className="flex-1">
          <label className="block t-label text-ink-muted mb-2">{t("toLabel")}</label>
          <div className="flex items-center gap-2">
            <div
              className="w-full h-11 rounded-edge px-3 flex items-center text-sm font-semibold bg-paper-deep text-ink"
              
            >
              {result === null ? "…" : formatMoney(result, to, { roundUgxTo: to === "UGX" ? 10 : 1 })}
            </div>
            <select value={to} onChange={(e) => setTo(e.target.value as Money)} className={selectStyle}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <p className="mt-4 t-small text-ink-muted">{t("indicativeNote")}</p>
    </div>
  );
}
