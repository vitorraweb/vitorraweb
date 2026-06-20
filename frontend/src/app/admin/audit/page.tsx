"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldCheck, Search } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Entry = {
  id: number;
  action: string;
  description: string | null;
  actor: string;
  actor_email: string | null;
  ip: string | null;
  created_at: string | null;
};

// Friendly labels for the action codes recorded by App\Support\Audit.
const ACTION_LABEL: Record<string, string> = {
  "sick_note.download": "Medical note opened",
  "hr_document.download": "HR file downloaded",
  "cv.download": "CV downloaded",
  "supplier.view_bank": "Supplier bank details viewed",
  "supplier_document.download": "Supplier file downloaded",
  "transaction.approve": "Transaction approved",
  "transaction.void": "Transaction voided",
  "user.role_change": "Role changed",
  "user.password_reset": "Password reset",
  "user.delete": "Staff removed",
};

const label = (a: string) => ACTION_LABEL[a] ?? a;

export default function AuditPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (search.trim()) params.set("search", search.trim());
      const r = await apiAdmin<{ data: Entry[]; actions: string[] }>(`/admin/audit?${params}`);
      setRows(r.data); setActions(r.actions);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [action, search]);

  // Re-load on filter change; debounce the free-text search.
  useEffect(() => {
    const id = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  return (
    <div className="pb-12">
      <PageHeader title="Activity log" subtitle="Who accessed confidential records and moved money — a tamper-evident trail for accountability." />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select value={action} onChange={(e) => setAction(e.target.value)} className="text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" }}>
          <option value="">All activity</option>
          {actions.map((a) => <option key={a} value={a}>{label(a)}</option>)}
        </select>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#bbb" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description…" className="text-sm rounded-xl pl-9 pr-3 py-2 border w-64 max-w-full outline-none focus:border-[#C5B27A]" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" }} />
        </div>
      </div>

      {loading ? <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      : rows.length === 0 ? <Empty label="No recorded activity in this view." /> : (
        <div className="space-y-2">
          {rows.map((e) => (
            <div key={e.id} className="bg-white rounded-[14px] border border-black/[0.05] p-3.5 flex items-start gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.14)" }}>
                <ShieldCheck className="w-4 h-4" style={{ color: "#7A6020" }} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{label(e.action)}</span>
                  <span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{e.actor}</span>
                </div>
                {e.description && <p className="text-xs mt-0.5" style={{ color: "#777" }}>{e.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs" style={{ color: "#999" }}>{e.created_at ? new Date(e.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                {e.ip && <p className="text-[10px] tabular-nums" style={{ color: "#ccc" }}>{e.ip}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
