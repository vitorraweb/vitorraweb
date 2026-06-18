"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FileText, Users, ShieldCheck, Briefcase, CalendarDays, UserCircle } from "lucide-react";
import { apiStaff } from "@/lib/staff-auth";

type Me = {
  id: number; name: string; email: string; role: string; phone: string | null;
  department: string | null; job_title: string | null; job_description: string | null;
  start_date: string | null; staff_status: string | null; leave_entitlement_days: number;
  supervisor: { id: number; name: string; email: string; job_title: string | null } | null;
  is_supervisor: boolean;
};

export default function StaffDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiStaff<{ data: Me }>("/staff/me").then((r) => setMe(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) return <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>;
  if (!me) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="max-w-3xl pb-12">
      <div className="mb-6">
        <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em", color: "#1E1E1E" }}>
          Welcome, {me.name.split(" ")[0]}
        </h2>
        <p className="text-sm mt-1" style={{ color: "#999" }}>{me.job_title ?? "Team member"}{me.department ? ` · ${cap(me.department)}` : ""}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat icon={Briefcase} label="Role" value={cap(me.role)} />
        <Stat icon={CalendarDays} label="Annual leave" value={`${me.leave_entitlement_days} days`} />
        <Stat icon={UserCircle} label="Status" value={statusLabel(me.staff_status)} />
      </div>

      {/* Supervisor */}
      <Card title="Your supervisor">
        {me.supervisor ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full text-[12px] font-bold shrink-0" style={{ background: "rgba(197,178,122,0.18)", color: "#7A6020" }}>
              {initials(me.supervisor.name)}
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{me.supervisor.name}</p>
              <p className="text-xs" style={{ color: "#999" }}>{me.supervisor.job_title ?? "Supervisor"} · {me.supervisor.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "#999" }}>No supervisor assigned yet. HR will set this up.</p>
        )}
      </Card>

      {/* Job description */}
      <Card title="Your role & responsibilities">
        {me.job_description
          ? <p className="text-sm whitespace-pre-line" style={{ color: "#454545", lineHeight: 1.7 }}>{me.job_description}</p>
          : <p className="text-sm" style={{ color: "#999" }}>Your job description will appear here once HR adds it.</p>}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        <QuickLink href="/staff/documents" icon={FileText} label="My documents" sub="Contract & HR files" />
        {me.is_supervisor && <QuickLink href="/staff/team" icon={Users} label="My team" sub="Your direct reports" />}
        <QuickLink href="/staff/profile" icon={ShieldCheck} label="Profile & security" sub="Change your password" />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
  return (
    <div className="bg-white rounded-[18px] border border-black/[0.06] p-4">
      <div className="flex items-center gap-2 mb-1.5"><Icon className="w-4 h-4" style={{ color: "#C5B27A" }} /><span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#bbb" }}>{label}</span></div>
      <p className="text-base font-semibold" style={{ color: "#1E1E1E" }}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mb-4">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "#bbb" }}>{title}</h3>
      {children}
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, sub }: { href: string; icon: typeof FileText; label: string; sub: string }) {
  return (
    <Link href={href} className="bg-white rounded-[18px] border border-black/[0.06] p-4 hover:border-[#C5B27A] transition-colors">
      <Icon className="w-5 h-5 mb-2" style={{ color: "#C5B27A" }} />
      <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "#999" }}>{sub}</p>
    </Link>
  );
}

function cap(s: string | null): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—"; }
function initials(name: string): string { return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(); }
function statusLabel(s: string | null): string {
  return { active: "Active", on_leave: "On leave", left: "Left" }[s ?? "active"] ?? "Active";
}
