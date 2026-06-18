"use client";

import { useEffect, useState } from "react";
import { Loader2, Hourglass } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Row = {
  id: number; name: string; job_title: string | null; department: string | null;
  start_date: string; probation_ends: string; days_remaining: number;
  supervisor: string | null; reports_submitted: number; reports_reviewed: number;
};

export default function ProbationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiAdmin<{ data: Row[] }>("/admin/probation").then((r) => setRows(r.data)).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="pb-12">
      <PageHeader title="Probation watch" subtitle="Staff still in their first three months — so nobody reaches the probation deadline unreviewed." />

      {rows.length === 0 ? (
        <Empty label="No staff currently on probation." />
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const urgent = r.days_remaining <= 14;
            return (
              <div key={r.id} className="bg-white rounded-[16px] border p-4 flex items-center gap-4 flex-wrap" style={{ borderColor: urgent ? "#C0392B" : "rgba(0,0,0,0.06)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{r.name}</span>
                    {r.department && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{r.department}</span>}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#999" }}>
                    {r.job_title ?? "—"} · started {fmt(r.start_date)} · supervisor {r.supervisor ?? "— none —"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#777" }}>
                    Reports: <strong>{r.reports_submitted}</strong> submitted, <strong>{r.reports_reviewed}</strong> reviewed
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: urgent ? "rgba(192,57,43,0.1)" : "rgba(197,178,122,0.16)", color: urgent ? "#C0392B" : "#7A6020" }}>
                    <Hourglass className="w-3.5 h-3.5" />{r.days_remaining} day{r.days_remaining === 1 ? "" : "s"} left
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "#999" }}>ends {fmt(r.probation_ends)}</p>
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
