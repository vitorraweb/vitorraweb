"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FileText, Users, ShieldCheck, Briefcase, CalendarDays, UserCircle } from "lucide-react";
import { apiStaff, staffPath } from "@/lib/staff-auth";
import { AnnouncementsCard } from "@/components/people/AnnouncementsCard";
import { TeamsChatButton, TeamsJoinButton } from "@/components/teams/TeamsButtons";

type Me = {
  id: number; name: string; email: string; role: string; phone: string | null;
  department: string | null; job_title: string | null; job_description: string | null;
  start_date: string | null; staff_status: string | null; leave_entitlement_days: number;
  supervisor: { id: number; name: string; email: string; job_title: string | null; teams_email: string | null } | null;
  is_supervisor: boolean;
};

export default function StaffDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiStaff<{ data: Me }>("/staff/me").then((r) => setMe(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) return <p className="text-sm" style={{ color: "var(--o-danger)" }}>{error}</p>;
  if (!me) return <div className="flex items-center gap-2 text-sm" style={{ color: "var(--o-muted)" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="max-w-3xl pb-12">
      <div className="mb-6">
        <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--o-text)" }}>
          Welcome, {me.name.split(" ")[0]}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--o-faint)" }}>{me.job_title ?? "Team member"}{me.department ? ` · ${cap(me.department)}` : ""}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat icon={Briefcase} label="Role" value={cap(me.role)} />
        <Stat icon={CalendarDays} label="Annual leave" value={`${me.leave_entitlement_days} days`} />
        <Stat icon={UserCircle} label="Status" value={statusLabel(me.staff_status)} />
      </div>

      <AnnouncementsCard />

      {/* Supervisor */}
      <Card title="Your supervisor">
        {me.supervisor ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full text-[12px] font-bold shrink-0" style={{ background: "rgba(197,178,122,0.18)", color: "var(--o-accent-text)" }}>
              {initials(me.supervisor.name)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--o-text)" }}>{me.supervisor.name}</p>
              <p className="text-xs" style={{ color: "var(--o-faint)" }}>{me.supervisor.job_title ?? "Supervisor"} · {me.supervisor.email}</p>
            </div>
            <TeamsChatButton email={me.supervisor.teams_email} name={me.supervisor.name} />
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--o-faint)" }}>No supervisor assigned yet. HR will set this up.</p>
        )}
      </Card>

      <MeetingsCard />
      <ColleaguesCard />

      {/* Job description */}
      <Card title="Your role & responsibilities">
        {me.job_description
          ? <p className="text-sm whitespace-pre-line" style={{ color: "var(--o-text-2)", lineHeight: 1.7 }}>{me.job_description}</p>
          : <p className="text-sm" style={{ color: "var(--o-faint)" }}>Your job description will appear here once HR adds it.</p>}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        <QuickLink href={staffPath("/staff/calendar")} icon={CalendarDays} label="Team calendar" sub="Who is away, and when" />
        <QuickLink href={staffPath("/staff/documents")} icon={FileText} label="My documents" sub="Contract & HR files" />
        {me.is_supervisor && <QuickLink href={staffPath("/staff/team")} icon={Users} label="My team" sub="Your direct reports" />}
        <QuickLink href={staffPath("/staff/profile")} icon={ShieldCheck} label="Profile & security" sub="Contact details, password" />
      </div>
    </div>
  );
}

type Meeting = { id: number; title: string; starts_at: string; ends_at: string | null; join_url: string; notes: string | null };

/** Teams meetings shared with this person (company-wide and their department). */
function MeetingsCard() {
  const [list, setList] = useState<Meeting[] | null>(null);
  useEffect(() => { apiStaff<{ data: Meeting[] }>("/staff/meetings").then((r) => setList(r.data)).catch(() => setList([])); }, []);
  if (!list || list.length === 0) return null;
  return (
    <Card title="Upcoming meetings">
      <ul className="space-y-3">
        {list.slice(0, 5).map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--o-text)" }}>{m.title}</p>
              <p className="text-xs" style={{ color: "var(--o-muted)" }}>{new Date(m.starts_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{m.notes ? ` · ${m.notes}` : ""}</p>
            </div>
            <TeamsJoinButton url={m.join_url} title={m.title} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

type Colleague = { id: number; name: string; job_title: string | null; department: string | null; teams_email: string | null };

/** Everyone on staff, with "Chat in Teams". */
function ColleaguesCard() {
  const [list, setList] = useState<Colleague[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { apiStaff<{ data: Colleague[] }>("/staff/directory").then((r) => setList(r.data)).catch(() => setList([])); }, []);
  if (!list || list.length === 0) return null;
  const shown = list.filter((c) => !q || `${c.name} ${c.job_title ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Colleagues">
      <input className="c-input w-full mb-3" placeholder="Find a colleague…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a colleague" />
      <ul className="divide-y divide-[var(--o-line)]">
        {shown.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--o-text)" }}>{c.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--o-muted)" }}>{c.job_title ?? "—"}</p>
            </div>
            <TeamsChatButton email={c.teams_email} name={c.name} compact />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
  return (
    <div className="bg-white rounded-[18px] border border-black/[0.06] p-4">
      <div className="flex items-center gap-2 mb-1.5"><Icon className="w-4 h-4" style={{ color: "#C5B27A" }} /><span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--o-faint)" }}>{label}</span></div>
      <p className="text-base font-semibold" style={{ color: "var(--o-text)" }}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mb-4">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--o-faint)" }}>{title}</h3>
      {children}
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, sub }: { href: string; icon: typeof FileText; label: string; sub: string }) {
  return (
    <Link href={href} className="bg-white rounded-[18px] border border-black/[0.06] p-4 hover:border-[#C5B27A] transition-colors">
      <Icon className="w-5 h-5 mb-2" style={{ color: "#C5B27A" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--o-text)" }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--o-faint)" }}>{sub}</p>
    </Link>
  );
}

function cap(s: string | null): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—"; }
function initials(name: string): string { return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(); }
function statusLabel(s: string | null): string {
  return { active: "Active", on_leave: "On leave", left: "Left" }[s ?? "active"] ?? "Active";
}
