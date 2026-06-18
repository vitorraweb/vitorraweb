"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";
import OrderTimeline from "@/components/account/OrderTimeline";
import FetSavingsWidget from "@/components/account/FetSavingsWidget";
import InstallationScheduler from "@/components/account/InstallationScheduler";

type Item = { id: number; product_name: string; product_slug: string; options: { grind?: string } | null; quantity: number; line_total: number };
type Order = {
  reference: string; currency: string; subtotal: number; total: number; status: string; payment_status: string;
  tracking_number: string | null; invoice_url: string | null; shipping_address: Record<string, string> | null;
  preferred_installation_date: string | null; installation_location: string | null; delivered_at: string | null;
  items: Item[]; created_at: string;
  installment_plan?: {
    total: number; paid: number; balance: number;
    payments: { label: string | null; amount: number; due_date: string | null; paid: boolean; paid_at: string | null }[];
  } | null;
};

const money = (c: string, t: number) => (c === "USD" ? `$${(t / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `UGX ${t.toLocaleString("en-US")}`);

export default function OrderDetail({ params }: { params: Promise<{ reference: string }> }) {
  const t = useTranslations("account");
  const { reference } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiCustomer<{ data: Order }>(`/account/orders/${reference}`).then((r) => setOrder(r.data)).catch((e) => setError(e instanceof Error ? e.message : t("notFound")));
  }, [reference, t]);

  if (error) return <p className="text-sm" style={{ color: "#C0392B" }}>{error}. <Link href="/account/orders" className="underline">{t("backToOrders")}</Link></p>;
  if (!order) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  const addr = order.shipping_address ?? {};
  const fetItem = order.items?.find((it) => it.product_slug?.startsWith("fet-"));

  return (
    <div className="max-w-2xl">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm mb-5" style={{ color: "#777" }}><ArrowLeft className="w-4 h-4" />{t("allOrders")}</Link>

      <div className="bg-white rounded-[28px] border border-black/[0.05] shadow-card p-7 md:p-9">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h1 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E" }}>{order.reference}</h1>
            {order.tracking_number && (
              <p className="text-xs mt-1.5" style={{ color: "#999" }}>{t("trackingLabel")}: {order.tracking_number}</p>
            )}
          </div>
          {order.invoice_url && (
            <a href={order.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#1E1E1E" }}>
              <Download className="w-4 h-4" />{t("invoice")}
            </a>
          )}
        </div>

        <OrderTimeline status={order.status} paymentStatus={order.payment_status} />

        <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          {order.items?.map((it) => (
            <div key={it.id} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-medium" style={{ color: "#1E1E1E" }}>{it.product_name}</p>
                <p className="text-xs" style={{ color: "#999" }}>{t("qty")} {it.quantity}{it.options?.grind ? ` · ${it.options.grind}` : ""}</p>
              </div>
              <span className="text-sm" style={{ color: "#1E1E1E" }}>{money(order.currency, it.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-5 mt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: "#777" }}>{t("total")}</span>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#1E1E1E" }}>{money(order.currency, order.total)}</span>
        </div>

        {order.installment_plan && (
          <div className="mt-7 pt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: "#8a8a8a" }}>{t("paymentPlan")}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 text-sm">
              <span style={{ color: "#16A34A" }}>{t("paymentPaid")}: <strong>{money(order.currency, order.installment_plan.paid)}</strong></span>
              <span style={{ color: "#C0392B" }}>{t("balanceLabel")}: <strong>{money(order.currency, order.installment_plan.balance)}</strong></span>
            </div>
            <div className="space-y-1.5">
              {order.installment_plan.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm rounded-xl px-3.5 py-2.5" style={{ background: "#FAFAF8" }}>
                  <span style={{ color: "#454545" }}>
                    {p.label}
                    {p.due_date && !p.paid && <span style={{ color: "#999" }}> · {t("dueLabel")} {new Date(p.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    {p.paid && p.paid_at && <span style={{ color: "#999" }}> · {new Date(p.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums" style={{ color: "#1E1E1E" }}>{money(order.currency, p.amount)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={p.paid ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" } : { background: "rgba(0,0,0,0.06)", color: "#888" }}>
                      {p.paid ? t("paymentPaid") : t("dueLabel")}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(addr.line1 || addr.city) && (
          <div className="mt-7 pt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "#8a8a8a" }}>{t("delivery")}</p>
            <p className="text-sm" style={{ color: "#555" }}>{[addr.line1, addr.line2, addr.city, addr.country, addr.postcode].filter(Boolean).join(", ")}</p>
          </div>
        )}

        {order.delivered_at && fetItem && (
          <FetSavingsWidget productSlug={fetItem.product_slug} quantity={fetItem.quantity} deliveredAt={order.delivered_at} />
        )}

        {(order.status === "pending" || order.status === "processing") && (
          <InstallationScheduler
            reference={order.reference}
            preferredDate={order.preferred_installation_date}
            location={order.installation_location}
            onSaved={(data) => setOrder((o) => (o ? { ...o, ...data } : o))}
          />
        )}
      </div>
    </div>
  );
}
