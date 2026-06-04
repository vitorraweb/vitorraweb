"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, ArrowRight } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";

type Enquiry = { id: number; product_category: string | null; message: string; status: string; created_at: string };

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const LABEL: Record<string, string> = { FET: "Fuel Eco Tech", SEAL: "SEAL Wound Spray", COFFEE: "Coffee", LOGISTICS: "Logistics" };
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  new: { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  in_progress: { bg: "rgba(59,130,246,0.12)", fg: "#2563EB" },
  quoted: { bg: "rgba(139,92,246,0.12)", fg: "#7C3AED" },
  converted: { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  closed: { bg: "rgba(0,0,0,0.06)", fg: "#777" },
};

export default function AccountEnquiries() {
  const [list, setList] = useState<Enquiry[] | null>(null);

  useEffect(() => {
    apiCustomer<{ data: Enquiry[] }>("/account/enquiries").then((r) => setList(r.data)).catch(() => setList([]));
  }, []);

  if (!list) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-[28px] border border-black/[0.05] shadow-card p-14 text-center">
        <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}><MessageSquare className="w-6 h-6" /></span>
        <p className="text-base font-semibold mb-1" style={{ color: "#1E1E1E" }}>No enquiries yet</p>
        <p className="text-sm mb-6" style={{ color: "#999" }}>Request a quote and track its progress right here.</p>
        <Link href="/enquire" className="btn-primary">Make an enquiry<ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((e) => {
        const sc = STATUS_COLOR[e.status] ?? STATUS_COLOR.closed;
        return (
          <div key={e.id} className="bg-white rounded-[20px] border border-black/[0.05] shadow-card p-6">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: "#1E1E1E" }}>{e.product_category ? (LABEL[e.product_category] ?? e.product_category) : "General enquiry"}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{e.status.replace(/_/g, " ")}</span>
              <span className="text-xs ml-auto" style={{ color: "#999" }}>{date(e.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{e.message}</p>
          </div>
        );
      })}
    </div>
  );
}
