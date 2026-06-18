"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { apiStaff } from "@/lib/staff-auth";

type Report = { id: number; name: string; email: string; job_title: string | null; department: string | null; staff_status: string | null; start_date: string | null };

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  active:   { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  on_leave: { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  left:     { bg: "rgba(0,0,0,0.06)", fg: "#777" },
};

export default function StaffTeam() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiStaff<{ data: Report[] }>("/staff/team").then((r) => setReports(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) return <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>;
  if (!reports) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="max-w-2xl pb-12">
      <h2 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#1E1E1E" }}>My team</h2>
      <p className="text-sm mb-6" style={{ color: "#999" }}>The people who report to you.</p>

      {reports.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-8 text-center">
          <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#ddd" }} />
          <p className="text-sm" style={{ color: "#999" }}>No direct reports assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((r) => {
            const sc = STATUS_STYLE[r.staff_status ?? "active"] ?? STATUS_STYLE.active;
            return (
              <div key={r.id} className="bg-white rounded-[16px] border border-black/[0.06] p-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full text-[12px] font-bold shrink-0" style={{ background: "rgba(197,178,122,0.18)", color: "#7A6020" }}>
                  {r.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#1E1E1E" }}>{r.name}</p>
                  <p className="text-xs truncate" style={{ color: "#999" }}>{r.job_title ?? "—"}{r.email ? ` · ${r.email}` : ""}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0" style={{ background: sc.bg, color: sc.fg }}>
                  {(r.staff_status ?? "active").replace("_", " ")}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs mt-5" style={{ color: "#bbb" }}>Task tracking, monthly reports, and leave approvals for your team are coming next.</p>
    </div>
  );
}
