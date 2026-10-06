"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import { StatusChip, STATUS_TONE } from "@/components/account/StatusChip";
import { apiCustomer } from "@/lib/customer-auth";

type Order = { id: number; reference: string; currency: string; total: number; status: string; payment_status: string; created_at: string };

const STATUS_KEY: Record<string, string> = {
  pending: "statusPending", processing: "statusProcessing", shipped: "statusShipped",
  delivered: "statusDelivered", complete: "statusComplete", cancelled: "statusCancelled",
};

const money = (c: string, t: number) => (c === "USD" ? `$${(t / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `UGX ${t.toLocaleString("en-US")}`);
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });


export default function AccountOrders() {
  const t = useTranslations("account");
  const [list, setList] = useState<Order[] | null>(null);

  useEffect(() => {
    apiCustomer<{ data: Order[] }>("/account/orders").then((r) => setList(r.data)).catch(() => setList([]));
  }, []);

  if (!list) return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  if (list.length === 0) {
    return (
      <div className="bg-paper rounded-frame border border-line p-14 text-center">
        <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full bg-paper-deep text-gold-ink"><ShoppingBag className="w-6 h-6" /></span>
        <p className="text-base font-semibold mb-1 text-ink">{t("noOrders")}</p>
        <p className="text-sm text-ink-muted">{t("noOrdersSub")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((o) => {
        return (
          <Link key={o.id} href={`/account/orders/${o.reference}`} className="group bg-paper rounded-frame border border-line p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <span className="font-semibold text-sm tracking-tight text-ink">{o.reference}</span>
                <StatusChip tone={STATUS_TONE[o.status] ?? "neutral"}>{STATUS_KEY[o.status] ? t(STATUS_KEY[o.status]) : o.status}</StatusChip>
              </div>
              <p className="text-xs text-ink-muted">{date(o.created_at)} · {t("paymentLabel")} {o.payment_status}</p>
            </div>
            <span className="font-display text-[1.25rem] leading-tight text-ink">{money(o.currency, o.total)}</span>
            <ArrowRight className="w-4 h-4 arrow-nudge text-line-strong" />
          </Link>
        );
      })}
    </div>
  );
}
