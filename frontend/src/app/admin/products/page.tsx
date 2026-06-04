"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Pencil } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, type Paginated } from "@/components/admin/admin-ui";

type Product = {
  id: number; name: string; slug: string; category: string;
  price_ugx: number | null; price_usd: number | null; stock_quantity: number | null;
  is_published: boolean;
};

const CATS = ["", "FET", "SEAL", "COFFEE", "LOGISTICS"];

const fmtUGX = (n: number | null) => (n != null ? `UGX ${n.toLocaleString("en-US")}` : "—");
const fmtUSD = (n: number | null) => (n != null ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—");

export default function ProductsAdminPage() {
  const [list, setList]       = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat]         = useState("");

  const load = useCallback(async () => {
    try {
      const q = cat ? `?category=${cat}` : "";
      const res = await apiAdmin<Paginated<Product>>(`/admin/products${q}`);
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  const select = (c: string) => { setLoading(true); setCat(c); };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Products" subtitle="Manage the product catalogue — copy, prices, stock, and visibility." />
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#1E1E1E", color: "#fff" }}>
          <Plus className="w-4 h-4" />New product
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {CATS.map((c) => (
          <button key={c || "all"} onClick={() => select(c)} className="text-xs font-semibold px-3.5 py-2 rounded-full transition-colors" style={{ background: cat === c ? "#1E1E1E" : "#FFFFFF", color: cat === c ? "#FFFFFF" : "#777777", border: "1px solid rgba(0,0,0,0.06)" }}>
            {c || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No products yet. Add your first one." />
      ) : (
        <div className="space-y-2.5">
          {list.map((p) => (
            <div key={p.id} className="bg-white rounded-[18px] border border-black/[0.05] p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-0.5 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{p.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{p.category}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={p.is_published ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" } : { background: "rgba(0,0,0,0.06)", color: "#777" }}>
                    {p.is_published ? "published" : "draft"}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "#999" }}>
                  {fmtUGX(p.price_ugx)} · {fmtUSD(p.price_usd)}
                  {p.stock_quantity != null ? ` · ${p.stock_quantity} in stock` : " · made-to-order"}
                </p>
              </div>
              <Link href={`/admin/products/${p.id}/edit`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#1E1E1E" }}>
                <Pencil className="w-3.5 h-3.5" />Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
