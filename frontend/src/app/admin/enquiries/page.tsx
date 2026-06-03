"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ChevronDown, Mail, Phone, Building2 } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { StatusBadge, PageHeader, formatDate, Empty, type Paginated } from "@/components/admin/admin-ui";

type Enquiry = {
  id: number; product_category: string | null; name: string; email: string;
  company: string | null; phone: string | null; country: string; message: string;
  status: string; created_at: string;
};

const STATUSES = ["new", "in_progress", "quoted", "converted", "closed"];

export default function EnquiriesPage() {
  const [list, setList]       = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");
  const [open, setOpen]       = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?status=${filter}` : "";
      const res = await apiAdmin<Paginated<Enquiry>>(`/admin/enquiries${q}`);
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string) => {
    setList((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));
    try { await apiAdmin(`/admin/enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
    catch { load(); }
  };

  return (
    <div>
      <PageHeader title="Enquiries" subtitle="Quote requests submitted through the site." />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip active={filter === ""} onClick={() => setFilter("")}>All</FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{s.replace(/_/g, " ")}</FilterChip>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No enquiries yet." />
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <div key={e.id} className="bg-white rounded-[20px] border border-black/[0.05] overflow-hidden">
              <button onClick={() => setOpen(open === e.id ? null : e.id)} className="w-full flex items-center gap-4 p-5 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{e.name}</span>
                    {e.product_category && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{e.product_category}</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: "#999999" }}>{e.email} · {e.country} · {formatDate(e.created_at)}</p>
                </div>
                <StatusBadge status={e.status} />
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === e.id ? "rotate-180" : ""}`} style={{ color: "#BBBBBB" }} />
              </button>

              {open === e.id && (
                <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 mt-4 text-xs" style={{ color: "#555" }}>
                    <a href={`mailto:${e.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{e.email}</a>
                    {e.phone && <a href={`tel:${e.phone}`} className="flex items-center gap-1.5 hover:underline"><Phone className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{e.phone}</a>}
                    {e.company && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{e.company}</span>}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 p-4 rounded-xl" style={{ color: "#444", background: "#F8F7F5" }}>{e.message}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: "#777" }}>Status:</span>
                    {STATUSES.map((s) => (
                      <button key={s} onClick={() => updateStatus(e.id, s)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors" style={{ background: e.status === s ? "#C5B27A" : "#F2F2F2", color: e.status === s ? "#1E1E1E" : "#888" }}>
                        {s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold px-3.5 py-2 rounded-full capitalize transition-colors" style={{ background: active ? "#1E1E1E" : "#FFFFFF", color: active ? "#FFFFFF" : "#777777", border: "1px solid rgba(0,0,0,0.06)" }}>
      {children}
    </button>
  );
}
