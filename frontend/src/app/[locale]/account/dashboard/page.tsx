"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";

/* Account dashboard — Quiet Authority. The three things a customer comes for,
   as figures in a hairline row, then shortcuts to the next useful action. */
export default function AccountDashboard() {
  const t = useTranslations("account");
  const [stats, setStats] = useState<{ orders: number; enquiries: number } | null>(null);

  useEffect(() => {
    Promise.all([
      apiCustomer<{ data: unknown[] }>("/account/orders"),
      apiCustomer<{ data: unknown[] }>("/account/enquiries"),
    ])
      .then(([o, e]) => setStats({ orders: o.data.length, enquiries: e.data.length }))
      .catch(() => setStats({ orders: 0, enquiries: 0 }));
  }, []);

  const cards = [
    { label: t("tabOrders"), value: stats ? String(stats.orders) : "·", sub: t("cardOrdersSub"), href: "/account/orders" },
    { label: t("tabEnquiries"), value: stats ? String(stats.enquiries) : "·", sub: t("cardEnquiriesSub"), href: "/account/enquiries" },
    { label: t("tabDocuments"), value: "", sub: t("cardDocumentsSub"), href: "/account/documents" },
  ];

  const quick = [
    { label: t("quickEnquiry"), href: "/enquire" },
    { label: t("quickCalc"), href: "/products/fuel-eco-tech#fet-calculator" },
    { label: t("quickContact"), href: "/contact" },
  ];

  return (
    <div className="space-y-16">
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border-y border-line">
        {cards.map((c) => (
          <li key={c.label} className="bg-paper">
            <Link href={c.href} className="group flex h-full flex-col py-8 sm:px-8 sm:first:pl-0">
              <span className="t-label text-ink-muted">{c.label}</span>
              {c.value !== "" ? (
                <span className="t-figure text-[clamp(3rem,2.4rem+2vw,4.5rem)] text-ink mt-5" aria-live="polite">{c.value}</span>
              ) : (
                <span className="t-h2 text-ink mt-5">{c.label}</span>
              )}
              <span className="t-small text-ink-muted mt-3 flex-1">{c.sub}</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4 mt-6 text-ink-muted transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>

      <div>
        <p className="t-label text-ink-muted pb-4 border-b border-line-strong">{t("quickLabel")}</p>
        <ul>
          {quick.map((q) => (
            <li key={q.href} className="border-b border-line">
              <Link href={q.href} className="group flex items-center justify-between py-5">
                <span className="font-display text-[1.375rem] text-ink group-hover:text-gold-ink transition-colors">{q.label}</span>
                <ArrowRight aria-hidden="true" className="w-4 h-4 text-ink-muted transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
