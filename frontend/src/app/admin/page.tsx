"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Mail, ShoppingCart, Loader2, ArrowRight } from "lucide-react";
import { apiAdmin } from "@/lib/auth";

type Stats = {
  enquiries_new: number;
  enquiries_total: number;
  messages_unread: number;
  orders_pending: number;
  orders_total: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiAdmin<{ data: Stats }>("/admin/stats")
      .then((res) => setStats(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const cards = stats
    ? [
        { label: "New enquiries", value: stats.enquiries_new, sub: `${stats.enquiries_total} total`, href: "/admin/enquiries", icon: MessageSquare },
        { label: "Unread messages", value: stats.messages_unread, sub: "Contact form", href: "/admin/messages", icon: Mail },
        { label: "Pending orders", value: stats.orders_pending, sub: `${stats.orders_total} total`, href: "/admin/orders", icon: ShoppingCart },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#1E1E1E" }}>
        Dashboard
      </h1>
      <p className="text-sm mb-8" style={{ color: "#777777" }}>Overview of activity across the platform.</p>

      {error && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)" }}>
          <p className="text-sm" style={{ color: "#C0392B" }}>Couldn&apos;t load stats: {error}. Is the backend running?</p>
        </div>
      )}

      {!stats && !error && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777777" }}>
          <Loader2 className="w-4 h-4 animate-spin" />Loading…
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="group bg-white rounded-[24px] p-6 border border-black/[0.05] hover-lift">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                <c.icon className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 arrow-nudge" style={{ color: "#CCCCCC" }} />
            </div>
            <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "40px", fontWeight: 700, lineHeight: 1, color: "#1E1E1E" }}>
              {c.value}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "#1E1E1E" }}>{c.label}</p>
            <p className="text-xs" style={{ color: "#999999" }}>{c.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
