"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TrendingDown } from "lucide-react";
import { FET_TIERS, SAVINGS, DEFAULT_FUEL_PRICE_EUR, computeSavings } from "@/lib/fet-pricing";
import { useRates, convert, formatMoney } from "@/lib/currency";

/* FET savings tracker — shown on a delivered order whose line item carries a
   `fet-{tier}` product_slug (set by both the self-serve reservation flow and
   staff-side enquiry conversion). Anchors on the same conservative 10% default
   used by the public savings calculator, pro-rated by time since install. */

export default function FetSavingsWidget({
  productSlug, quantity, deliveredAt,
}: {
  productSlug: string;
  quantity: number;
  deliveredAt: string;
}) {
  const t = useTranslations("account");
  const { rates } = useRates();
  const [now] = useState(() => Date.now());

  const tierId = productSlug.replace("fet-", "");
  const tier = FET_TIERS.find((tr) => tr.id === tierId);
  if (!tier) return null;

  const savings = computeSavings({
    annualKm: tier.defaultAnnualKm,
    fuelPriceEur: DEFAULT_FUEL_PRICE_EUR,
    savingsPct: SAVINGS.default,
    baselineLPer100: tier.baselineLPer100,
    deviceCostEur: tier.priceEur,
    vehicles: quantity,
  });

  const daysSince = Math.max(0, (now - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24));
  const fraction = Math.min(1, daysSince / 365);
  const savedSoFarEur = savings.annualSavingEurFleet * fraction;
  const co2SoFarKg = savings.co2KgFleet * fraction;

  const fmt = (eur: number) =>
    rates ? formatMoney(convert(eur, "EUR", "UGX", rates), "UGX", { roundUgxTo: 1000 }) : `€${eur.toFixed(0)}`;

  return (
    <div className="mt-7 pt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-4 flex items-center gap-1.5" style={{ color: "#8a8a8a" }}>
        <TrendingDown className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />
        {t("savingsTitle")}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[11px] mb-1" style={{ color: "#999" }}>{t("savingsFleetSize")}</p>
          <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 700, color: "#1E1E1E" }}>{quantity}</p>
        </div>
        <div>
          <p className="text-[11px] mb-1" style={{ color: "#999" }}>{t("savingsSinceInstall")}</p>
          <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 700, color: "#1E1E1E" }}>{fmt(savedSoFarEur)}</p>
        </div>
        <div>
          <p className="text-[11px] mb-1" style={{ color: "#999" }}>{t("savingsAnnualProjection")}</p>
          <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 700, color: "#1E1E1E" }}>{fmt(savings.annualSavingEurFleet)}</p>
        </div>
        <div>
          <p className="text-[11px] mb-1" style={{ color: "#999" }}>{t("savingsCo2")}</p>
          <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 700, color: "#1E1E1E" }}>{co2SoFarKg.toFixed(0)} kg</p>
        </div>
      </div>
    </div>
  );
}
