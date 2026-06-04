"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, MessageSquare, FileText, ArrowRight } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";

export default function AccountDashboard() {
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
    { label: "Orders", value: stats ? String(stats.orders) : "—", sub: "Track & view your orders", href: "/account/orders", icon: ShoppingBag },
    { label: "Enquiries", value: stats ? String(stats.enquiries) : "—", sub: "See where your quotes stand", href: "/account/enquiries", icon: MessageSquare },
    { label: "Documents", value: "", sub: "Datasheets, guides & invoices", href: "/account/documents", icon: FileText },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="group glow-card rounded-[24px] p-7 hover-lift"
          style={{ background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)", border: "1px solid rgba(197,178,122,0.16)", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
              <c.icon className="w-6 h-6" />
            </span>
            <ArrowRight className="w-4 h-4 arrow-nudge" style={{ color: "#CCC" }} />
          </div>
          {c.value !== "" && (
            <p style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "48px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: "#1E1E1E" }}>{c.value}</p>
          )}
          <p className="mt-2.5 text-base font-semibold" style={{ color: "#1E1E1E" }}>{c.label}</p>
          <p className="text-sm" style={{ color: "#999" }}>{c.sub}</p>
        </Link>
      ))}
    </div>
  );
}
