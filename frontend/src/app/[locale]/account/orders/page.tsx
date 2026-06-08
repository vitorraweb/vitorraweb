"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";

type Order = { id: number; reference: string; currency: string; total: number; status: string; payment_status: string; created_at: string };

const money = (c: string, t: number) => (c === "USD" ? `$${(t / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `UGX ${t.toLocaleString("en-US")}`);
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  processing: { bg: "rgba(59,130,246,0.12)", fg: "#2563EB" },
  shipped: { bg: "rgba(139,92,246,0.12)", fg: "#7C3AED" },
  delivered: { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  complete: { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  cancelled: { bg: "rgba(192,57,43,0.1)", fg: "#C0392B" },
};

export default function AccountOrders() {
  const [list, setList] = useState<Order[] | null>(null);

  useEffect(() => {
    apiCustomer<{ data: Order[] }>("/account/orders").then((r) => setList(r.data)).catch(() => setList([]));
  }, []);

  if (!list) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-[28px] border border-black/[0.05] shadow-card p-14 text-center">
        <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}><ShoppingBag className="w-6 h-6" /></span>
        <p className="text-base font-semibold mb-1" style={{ color: "#1E1E1E" }}>No orders yet</p>
        <p className="text-sm" style={{ color: "#999" }}>Your orders will appear here once you place one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((o) => {
        const sc = STATUS_COLOR[o.status] ?? STATUS_COLOR.pending;
        return (
          <Link key={o.id} href={`/account/orders/${o.reference}`} className="group bg-white rounded-[20px] border border-black/[0.05] shadow-card p-5 flex items-center gap-4 hover-lift">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <span className="font-semibold text-sm tracking-tight" style={{ color: "#1E1E1E" }}>{o.reference}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{o.status}</span>
              </div>
              <p className="text-xs" style={{ color: "#999" }}>{date(o.created_at)} · Payment {o.payment_status}</p>
            </div>
            <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 700, color: "#1E1E1E" }}>{money(o.currency, o.total)}</span>
            <ArrowRight className="w-4 h-4 arrow-nudge" style={{ color: "#CCC" }} />
          </Link>
        );
      })}
    </div>
  );
}
