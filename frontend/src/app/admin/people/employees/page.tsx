"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Save, Check, X, AlertTriangle } from "lucide-react";
import { apiAdmin, auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { TeamsChatButton } from "@/components/teams/TeamsButtons";

/* ─── People → Employees ──────────────────────────────────────────────────────
   The HR record for everyone on staff: job, department, supervisor,
   employment type and dates, emergency contact, and leave taken this year.
   HR edits these here. Sign-in, role and console access stay with admins in
   Settings → Staff.                                                        */

type Employee = {
  id: number; name: string; email: string; role: string; phone: string | null;
  department: string | null; supervisor_id: number | null; supervisor: string | null; job_title: string | null;
  staff_status: string | null; employment_type: string | null; start_date: string | null; contract_end_date: string | null;
  date_of_birth: string | null; leave_entitlement_days: number | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null; emergency_contact_relation: string | null;
  teams_email: string | null; documents: number; on_probation: boolean;
  leave: { entitlement: number; annual_used: number; annual_left: number; sick_used: number; other_used: number };
};
type Form = Record<"job_title" | "department" | "supervisor_id" | "phone" | "start_date" | "staff_status" | "employment_type" | "contract_end_date" | "date_of_birth" | "leave_entitlement_days" | "emergency_contact_name" | "emergency_contact_phone" | "emergency_contact_relation", string>;

const STATUS: Record<string, { label: string; tone: string }> = { active: { label: "Active", tone: "ok" }, on_leave: { label: "On leave", tone: "gold" }, left: { label: "Left", tone: "muted" } };
const date = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function EmployeesPage() {
  const isAdmin = auth.getUser()?.role === "admin";
  const [list, setList] = useState<Employee[] | null>(null);
  const [types, setTypes] = useState<Record<string, string>>({});
  const [depts, setDepts] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [showLeft, setShowLeft] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    const r = await apiAdmin<{ data: Employee[]; types: Record<string, string>; departments: Record<string, string> }>("/admin/people/employees");
    setList(r.data); setTypes(r.types); setDepts(r.departments);
  }, []);
  useEffect(() => { load().catch(() => setList([])); }, [load]);

  const shown = useMemo(() => (list ?? []).filter((e) =>
    (showLeft || e.staff_status !== "left") && (!dept || e.department === dept)
    && (!q || `${e.name} ${e.email} ${e.job_title ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [list, q, dept, showLeft]);

  return (
    <div className="pb-12">
      <PageHeader
        title="Employees"
        subtitle="Everyone's HR record: role, dates, emergency contact and leave taken this year."
        actions={isAdmin ? <Link href="/admin/staff" className="c-btn">Sign-in & access</Link> : undefined}
      />

      <div className="c-toolbar mt-5">
        <label className="relative flex-1 min-w-[12rem]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="c-input w-full pl-8" placeholder="Search name, email or job" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="c-select" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {Object.entries(depts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[13px] text-ink-muted px-1"><input type="checkbox" checked={showLeft} onChange={(e) => setShowLeft(e.target.checked)} />Show leavers</label>
      </div>

      {list === null ? <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p> : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table">
            <thead><tr><th>Person</th><th>Department</th><th>Type</th><th>Started</th><th className="text-right">Annual leave left</th><th>Emergency contact</th><th>Status</th><th /></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={8} className="text-ink-muted">Nobody matches.</td></tr>}
              {shown.map((e) => (
                <EmployeeRows key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)}
                  types={types} depts={depts} people={list} onSaved={(u) => setList((l) => l?.map((x) => (x.id === u.id ? u : x)) ?? l)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmployeeRows({ e, open, onToggle, types, depts, people, onSaved }: {
  e: Employee; open: boolean; onToggle: () => void; types: Record<string, string>; depts: Record<string, string>; people: Employee[]; onSaved: (u: Employee) => void;
}) {
  const st = STATUS[e.staff_status ?? "active"] ?? STATUS.active;
  return (
    <>
      <tr className="c-row cursor-pointer" data-open={open} onClick={onToggle}>
        <td>
          <span className="block font-semibold text-ink">{e.name}</span>
          <span className="block text-[12.5px] text-ink-muted">{e.job_title ?? "No job title"}{e.supervisor ? ` · reports to ${e.supervisor}` : ""}</span>
        </td>
        <td>{e.department ? depts[e.department] ?? e.department : "—"}</td>
        <td>{e.employment_type ? types[e.employment_type] : "—"}{e.on_probation && <span className="c-chip ml-1.5" data-tone="blue">Probation</span>}</td>
        <td className="whitespace-nowrap">{date(e.start_date)}</td>
        <td className="text-right tabular-nums">{e.leave.annual_left} / {e.leave.entitlement}</td>
        <td>{e.emergency_contact_phone ? <span className="text-ink-soft">{e.emergency_contact_name ?? "On file"}</span> : <span className="inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--o-warning)" }}><AlertTriangle className="w-3.5 h-3.5" />Missing</span>}</td>
        <td><span className="c-chip" data-tone={st.tone}>{st.label}</span></td>
        <td onClick={(ev) => ev.stopPropagation()}><TeamsChatButton email={e.teams_email} name={e.name} compact /></td>
      </tr>
      {open && (
        <tr><td colSpan={8} style={{ background: "var(--o-surface-2)" }}><Editor e={e} types={types} depts={depts} people={people} onSaved={onSaved} onClose={onToggle} /></td></tr>
      )}
    </>
  );
}

function Editor({ e, types, depts, people, onSaved, onClose }: { e: Employee; types: Record<string, string>; depts: Record<string, string>; people: Employee[]; onSaved: (u: Employee) => void; onClose: () => void }) {
  const [f, setF] = useState<Form>(() => ({
    job_title: e.job_title ?? "", department: e.department ?? "", supervisor_id: e.supervisor_id ? String(e.supervisor_id) : "", phone: e.phone ?? "",
    start_date: e.start_date ?? "", staff_status: e.staff_status ?? "active", employment_type: e.employment_type ?? "", contract_end_date: e.contract_end_date ?? "",
    date_of_birth: e.date_of_birth ?? "", leave_entitlement_days: String(e.leave_entitlement_days ?? 21),
    emergency_contact_name: e.emergency_contact_name ?? "", emergency_contact_phone: e.emergency_contact_phone ?? "", emergency_contact_relation: e.emergency_contact_relation ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof Form) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setSaved(false); setF({ ...f, [k]: ev.target.value }); };

  const save = async () => {
    setBusy(true); setError("");
    const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() === "" ? null : k === "supervisor_id" || k === "leave_entitlement_days" ? Number(v) : v.trim()]));
    try { onSaved((await apiAdmin<{ data: Employee }>(`/admin/people/employees/${e.id}`, { method: "PATCH", body: JSON.stringify(body) })).data); setSaved(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save"); }
    finally { setBusy(false); }
  };

  const field = (label: string, el: React.ReactNode, wide = false) => (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="block text-[12.5px] text-ink-muted mb-1">{label}</span>{el}</label>
  );

  return (
    <div className="py-3 px-1 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
        <Mini label="Annual leave used" value={`${e.leave.annual_used} of ${e.leave.entitlement} days`} />
        <Mini label="Sick days this year" value={String(e.leave.sick_used)} />
        <Mini label="Other leave" value={`${e.leave.other_used} days`} />
        <Mini label="HR documents" value={String(e.documents)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {field("Job title", <input className="c-input w-full" value={f.job_title} onChange={set("job_title")} />, true)}
        {field("Department", <select className="c-select w-full" value={f.department} onChange={set("department")}><option value="">—</option>{Object.entries(depts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>)}
        {field("Reports to", <select className="c-select w-full" value={f.supervisor_id} onChange={set("supervisor_id")}><option value="">Nobody</option>{people.filter((p) => p.id !== e.id && p.staff_status !== "left").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
        {field("Employment type", <select className="c-select w-full" value={f.employment_type} onChange={set("employment_type")}><option value="">—</option>{Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>)}
        {field("Start date", <input type="date" className="c-input w-full" value={f.start_date} onChange={set("start_date")} />)}
        {field("Contract ends", <input type="date" className="c-input w-full" value={f.contract_end_date} onChange={set("contract_end_date")} />)}
        {field("Status", <select className="c-select w-full" value={f.staff_status} onChange={set("staff_status")}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>)}
        {field("Annual leave days / year", <input type="number" min={0} max={60} className="c-input w-full" value={f.leave_entitlement_days} onChange={set("leave_entitlement_days")} />)}
        {field("Date of birth", <input type="date" className="c-input w-full" value={f.date_of_birth} onChange={set("date_of_birth")} />)}
        {field("Phone", <input className="c-input w-full" value={f.phone} onChange={set("phone")} />)}
        <span className="hidden sm:block" />
        {field("Emergency contact", <input className="c-input w-full" value={f.emergency_contact_name} onChange={set("emergency_contact_name")} placeholder="Full name" />)}
        {field("Relationship", <input className="c-input w-full" value={f.emergency_contact_relation} onChange={set("emergency_contact_relation")} />)}
        {field("Their phone", <input className="c-input w-full" value={f.emergency_contact_phone} onChange={set("emergency_contact_phone")} />, true)}
      </div>

      {error && <p className="text-[13px] text-alert-ink">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button className="c-btn c-btn-primary" onClick={save} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save record</button>
        <button className="c-btn c-btn-ghost" onClick={onClose}><X className="w-4 h-4" />Close</button>
        {saved && <span className="inline-flex items-center gap-1.5 text-[13px] text-ok-ink"><Check className="w-4 h-4" />Saved</span>}
        <span className="ml-auto text-[12.5px] text-ink-muted">{e.email}</span>
      </div>
    </div>
  );
}

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border p-2.5" style={{ borderColor: "var(--o-line)", background: "var(--o-surface)" }}>
    <span className="block text-ink-muted">{label}</span><span className="block font-semibold text-ink">{value}</span>
  </div>
);
