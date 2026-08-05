"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, X, Download } from "lucide-react";
import { apiAdmin, auth, downloadFile } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Leave = {
  id: number; type: string; start_date: string; end_date: string; working_days: number;
  reason: string | null; status: string; has_document: boolean; review_comment: string | null;
  reviewed_at: string | null; created_at: string;
  user?: { id: number; name: string; department: string | null };
};

const TYPE_LABEL: Record<string, string> = {
  annual: "Annual", sick: "Sick", unpaid: "Unpaid", compassionate: "Compassionate", maternity: "Maternity",
};
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  approved:  { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  declined:  { bg: "rgba(192,57,43,0.1)", fg: "#C0392B" },
  cancelled: { bg: "rgba(0,0,0,0.06)", fg: "#777" },
};

export default function AdminLeavePage() {
  /* This screen lists everyone's leave, including the signed-in reviewer's own.
     Nobody may decide their own request (the API refuses it), so the buttons are
     hidden on that row rather than shown and then failing. */
  const meId = auth.getUser()?.id;
  const [list, setList] = useState<Leave[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await apiAdmin<{ data: Leave[]; statuses: string[] }>(`/admin/leave?${params}`);
      setList(res.data); setStatuses(res.statuses);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: number, decision: "approved" | "declined") => {
    const comment = decision === "declined" ? (prompt("Reason for declining (optional):") ?? "") : "";
    try { await apiAdmin(`/admin/leave/${id}/decision`, { method: "POST", body: JSON.stringify({ status: decision, comment }) }); load(); } catch { /* */ }
  };

  const note = async (l: Leave) => {
    try { await downloadFile(`/admin/leave/${l.id}/note`, `sick-note-${l.id}.pdf`); } catch { /* */ }
  };

  return (
    <div className="pb-12">
      <PageHeader title="Leave" subtitle="Review and track staff leave across the company." />

      <div className="flex flex-wrap gap-2 mb-5">
        {[["", "All"], ...(statuses.length ? statuses : ["pending", "approved", "declined", "cancelled"]).map((s) => [s, s[0].toUpperCase() + s.slice(1)])].map(([v, label]) => (
          <button key={v} onClick={() => setStatus(v)} className="text-xs font-semibold px-3.5 py-2 rounded-full" style={status === v ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No leave requests in this view." />
      ) : (
        <div className="space-y-2.5">
          {list.map((l) => {
            const sc = STATUS_STYLE[l.status] ?? STATUS_STYLE.pending;
            return (
              <div key={l.id} className="bg-white rounded-[16px] border border-black/[0.06] p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{l.user?.name ?? "Staff"}</span>
                      {l.user?.department && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{l.user.department}</span>}
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{l.status}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#999" }}>{TYPE_LABEL[l.type] ?? l.type} · {fmt(l.start_date)} → {fmt(l.end_date)} · {l.working_days} day{l.working_days === 1 ? "" : "s"}</p>
                    {l.reason && <p className="text-xs mt-1" style={{ color: "#777" }}>{l.reason}</p>}
                    {l.review_comment && <p className="text-xs mt-1" style={{ color: "#777" }}>Note: {l.review_comment}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {l.has_document && <button onClick={() => note(l)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}><Download className="w-3.5 h-3.5" />Note</button>}
                    {l.status === "pending" && l.user?.id !== meId && (
                      <>
                        <button onClick={() => decide(l.id, "approved")} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}><Check className="w-3.5 h-3.5" />Approve</button>
                        <button onClick={() => decide(l.id, "declined")} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><X className="w-3.5 h-3.5" />Decline</button>
                      </>
                    )}
                    {l.status === "pending" && l.user?.id === meId && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>Your request — another reviewer decides</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmt(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
