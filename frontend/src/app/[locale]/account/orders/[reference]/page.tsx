"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";
import { ONLINE_PAYMENTS_ENABLED } from "@/lib/config";
import OrderTimeline from "@/components/account/OrderTimeline";
import FetSavingsWidget from "@/components/account/FetSavingsWidget";
import InstallationScheduler from "@/components/account/InstallationScheduler";

type Item = { id: number; product_name: string; product_slug: string; options: { grind?: string } | null; quantity: number; line_total: number };
type Plan = {
  total: number; paid: number; balance: number; online_enabled?: boolean;
  payments: { id: number; label: string | null; amount: number; due_date: string | null; paid: boolean; paid_at: string | null }[];
};
type Order = {
  reference: string; currency: string; subtotal: number; total: number; status: string; payment_status: string;
  tracking_number: string | null; invoice_url: string | null; shipping_address: Record<string, string> | null;
  preferred_installation_date: string | null; installation_location: string | null; delivered_at: string | null;
  items: Item[]; created_at: string;
  installment_plan?: Plan | null;
};

const money = (c: string, t: number) => (c === "USD" ? `$${(t / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `UGX ${t.toLocaleString("en-US")}`);

export default function OrderDetail({ params }: { params: Promise<{ reference: string }> }) {
  const t = useTranslations("account");
  const { reference } = use(params);
  const justPaid = useSearchParams().get("paid") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(justPaid);

  useEffect(() => {
    apiCustomer<{ data: Order }>(`/account/orders/${reference}`).then((r) => setOrder(r.data)).catch((e) => setError(e instanceof Error ? e.message : t("notFound")));
  }, [reference, t]);

  // Returning from Flutterwave: reconcile the just-paid instalment, refreshing the
  // schedule until a payment lands (mobile money is async) or we give up polling.
  useEffect(() => {
    if (!justPaid) return;
    let active = true;
    let attempts = 0;
    let lastPaid = -1;
    const tick = async () => {
      attempts += 1;
      try {
        const r = await apiCustomer<{ data: Plan }>(`/account/orders/${reference}/installment-status`);
        if (!active) return;
        setOrder((o) => (o ? { ...o, installment_plan: r.data } : o));
        if (lastPaid >= 0 && r.data.paid > lastPaid) { setConfirming(false); return; } // a payment landed
        lastPaid = r.data.paid;
      } catch {
        /* transient — keep polling */
      }
      if (active && attempts < 6) setTimeout(tick, 2500);
      else if (active) setConfirming(false);
    };
    tick();
    return () => { active = false; };
  }, [justPaid, reference]);

  async function payInstallment(id: number) {
    setPayingId(id);
    try {
      const r = await apiCustomer<{ data: { redirect_url: string | null } }>(`/account/installments/${id}/pay-online`, { method: "POST" });
      const url = r.data.redirect_url;
      if (url) { window.location.assign(url); return; }
      setPayingId(null);
    } catch {
      setPayingId(null);
    }
  }

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
            {confirming && (
              <div className="flex items-center gap-2 mb-3 rounded-xl px-3.5 py-2.5 text-sm" style={{ background: "rgba(197,178,122,0.12)", color: "#7A6020" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("confirmingPayment")}
              </div>
            )}
            <div className="space-y-1.5">
              {order.installment_plan.payments.map((p) => {
                const canPay = ONLINE_PAYMENTS_ENABLED && !!order.installment_plan?.online_enabled && !p.paid;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm rounded-xl px-3.5 py-2.5" style={{ background: "#FAFAF8" }}>
                    <span style={{ color: "#454545" }}>
                      {p.label}
                      {p.due_date && !p.paid && <span style={{ color: "#999" }}> · {t("dueLabel")} {new Date(p.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      {p.paid && p.paid_at && <span style={{ color: "#999" }}> · {new Date(p.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums" style={{ color: "#1E1E1E" }}>{money(order.currency, p.amount)}</span>
                      {p.paid ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}>
                          {t("paymentPaid")}
                        </span>
                      ) : canPay ? (
                        <button
                          type="button"
                          onClick={() => payInstallment(p.id)}
                          disabled={payingId !== null}
                          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ background: "#C5B27A", color: "#1E1E1E" }}
                        >
                          {payingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : t("payOnline")}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "#888" }}>
                          {t("dueLabel")}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {ONLINE_PAYMENTS_ENABLED && order.installment_plan.online_enabled && order.installment_plan.balance > 0 && (
              <p className="inline-flex items-center gap-1.5 mt-3 text-xs" style={{ color: "#999" }}>
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#7A6020" }} />
                {t("payOnlineNotice")}
              </p>
            )}
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
