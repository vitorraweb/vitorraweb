"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Download, ChevronDown, Save } from "lucide-react";
import { apiAdmin, downloadFile } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Opening = {
  id: number; title: string; slug: string; department: string | null; location: string | null;
  employment_type: string; description: string | null; status: string; closes_at: string | null;
  applications_count: number;
};
type Extracted = { years_experience: number; skills: string[]; education: string[]; last_role: string };
type Application = {
  id: number; name: string; email: string; phone: string | null; location: string | null;
  cover_note: string | null; extracted: Extracted | null; status: string; admin_note: string | null;
  created_at: string; opening: { id: number; title: string } | null;
};

const TYPE_LABEL: Record<string, string> = { full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship" };
const APP_STATUS: Record<string, { bg: string; fg: string }> = {
  new:       { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  review:    { bg: "rgba(59,130,246,0.12)", fg: "#2563EB" },
  shortlist: { bg: "rgba(139,92,246,0.12)", fg: "#7C3AED" },
  rejected:  { bg: "rgba(0,0,0,0.06)", fg: "#777" },
  hired:     { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
};

export default function AdminCareersPage() {
  const [tab, setTab] = useState<"openings" | "applicants">("openings");
  return (
    <div className="pb-12">
      <PageHeader title="Careers" subtitle="Post roles and review applicants. CVs are auto-read to pre-fill applicant details." />
      <div className="flex gap-2 mb-5">
        {(["openings", "applicants"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="text-sm font-semibold px-4 py-2 rounded-full capitalize" style={tab === t ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{t}</button>
        ))}
      </div>
      {tab === "openings" ? <Openings /> : <Applicants />}
    </div>
  );
}

/* ── Openings ──────────────────────────────────────────────────────────── */

function Openings() {
  const [list, setList] = useState<Opening[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ title: "", department: "", location: "", employment_type: "full_time", description: "", closes_at: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try { const r = await apiAdmin<{ data: Opening[]; employment_types: string[] }>("/admin/job-openings"); setList(r.data); setTypes(r.employment_types); }
    catch { setList([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!add.title.trim()) { setMsg("A title is required."); return; }
    setMsg("");
    try {
      await apiAdmin("/admin/job-openings", { method: "POST", body: JSON.stringify({ ...add, closes_at: add.closes_at || null }) });
      setAdd({ title: "", department: "", location: "", employment_type: "full_time", description: "", closes_at: "" });
      setAddOpen(false); load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  const save = async (o: Opening) => {
    try { const r = await apiAdmin<{ data: Opening }>(`/admin/job-openings/${o.id}`, { method: "PATCH", body: JSON.stringify(o) }); setList((l) => l.map((x) => x.id === o.id ? r.data : x)); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Save failed."); }
  };
  const remove = async (id: number) => { if (!confirm("Delete this opening?")) return; try { await apiAdmin(`/admin/job-openings/${id}`, { method: "DELETE" }); setList((l) => l.filter((x) => x.id !== id)); } catch { /* */ } };
  const setField = (id: number, patch: Partial<Opening>) => setList((l) => l.map((x) => x.id === id ? { ...x, ...patch } : x));

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div>
      <button onClick={() => setAddOpen((o) => !o)} className="inline-flex items-center gap-2 mb-4 px-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#1E1E1E", color: "#fff" }}><Plus className="w-4 h-4" />New role</button>
      {addOpen && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={add.title} onChange={(e) => setAdd({ ...add, title: e.target.value })} placeholder="Role title" className={inputCls} style={inputStyle} />
            <input value={add.department} onChange={(e) => setAdd({ ...add, department: e.target.value })} placeholder="Department" className={inputCls} style={inputStyle} />
            <input value={add.location} onChange={(e) => setAdd({ ...add, location: e.target.value })} placeholder="Location" className={inputCls} style={inputStyle} />
            <select value={add.employment_type} onChange={(e) => setAdd({ ...add, employment_type: e.target.value })} className={inputCls} style={inputStyle}>
              {(types.length ? types : ["full_time"]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
            </select>
          </div>
          <textarea value={add.description} onChange={(e) => setAdd({ ...add, description: e.target.value })} rows={4} placeholder="Role description" className={inputCls} style={inputStyle} />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs" style={{ color: "#777" }}>Closes: <input type="date" value={add.closes_at} onChange={(e) => setAdd({ ...add, closes_at: e.target.value })} className="text-sm rounded-lg px-2 py-1 border ml-1" style={inputStyle} /></label>
            <button onClick={create} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}>Publish</button>
          </div>
        </div>
      )}
      {msg && <p className="text-sm mb-3" style={{ color: "#C0392B" }}>{msg}</p>}

      {list.length === 0 ? <Empty label="No roles posted yet." /> : (
        <div className="space-y-2.5">
          {list.map((o) => (
            <div key={o.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{o.title}</p>
                  <p className="text-xs" style={{ color: "#999" }}>{[o.department, o.location, TYPE_LABEL[o.employment_type]].filter(Boolean).join(" · ")} · {o.applications_count} applicant{o.applications_count === 1 ? "" : "s"}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0" style={o.status === "open" ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" } : { background: "rgba(0,0,0,0.06)", color: "#777" }}>{o.status}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === o.id ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
              </button>
              {open === o.id && (
                <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <input value={o.title} onChange={(e) => setField(o.id, { title: e.target.value })} className={inputCls} style={inputStyle} />
                    <input value={o.department ?? ""} onChange={(e) => setField(o.id, { department: e.target.value })} placeholder="Department" className={inputCls} style={inputStyle} />
                    <input value={o.location ?? ""} onChange={(e) => setField(o.id, { location: e.target.value })} placeholder="Location" className={inputCls} style={inputStyle} />
                    <select value={o.status} onChange={(e) => setField(o.id, { status: e.target.value })} className={inputCls} style={inputStyle}>
                      <option value="open">Open</option><option value="closed">Closed</option>
                    </select>
                  </div>
                  <textarea value={o.description ?? ""} onChange={(e) => setField(o.id, { description: e.target.value })} rows={4} className={inputCls} style={inputStyle} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => save(o)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}><Save className="w-3.5 h-3.5" />Save</button>
                    <button onClick={() => remove(o.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    <a href={`/careers/${o.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold ml-auto" style={{ color: "#7A6020" }}>View public page →</a>
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

/* ── Applicants ────────────────────────────────────────────────────────── */

function Applicants() {
  const [list, setList] = useState<Application[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const r = await apiAdmin<{ data: Application[]; statuses: string[] }>(`/admin/applications?${params}`);
      setList(r.data); setStatuses(r.statuses);
    } catch { setList([]); } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const update = async (id: number, patch: Partial<Application>) => {
    setList((l) => l.map((a) => a.id === id ? { ...a, ...patch } : a));
    try { await apiAdmin(`/admin/applications/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); } catch { load(); }
  };
  const cv = async (a: Application) => { try { await downloadFile(`/admin/applications/${a.id}/cv`, `cv-${a.name.replace(/\s+/g, "-")}.pdf`); } catch { /* */ } };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {[["", "All"], ...(statuses.length ? statuses : ["new"]).map((s) => [s, s[0].toUpperCase() + s.slice(1)])].map(([v, label]) => (
          <button key={v} onClick={() => setStatus(v)} className="text-xs font-semibold px-3.5 py-2 rounded-full" style={status === v ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{label}</button>
        ))}
      </div>

      {loading ? <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      : list.length === 0 ? <Empty label="No applicants in this view." /> : (
        <div className="space-y-2.5">
          {list.map((a) => {
            const sc = APP_STATUS[a.status] ?? APP_STATUS.new;
            return (
              <div key={a.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
                <button onClick={() => setOpen(open === a.id ? null : a.id)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{a.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{a.status}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#999" }}>{a.opening?.title ?? "General"} · {a.email}{a.extracted?.last_role ? ` · ${a.extracted.last_role}` : ""}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === a.id ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
                </button>
                {open === a.id && (
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 my-3 text-xs" style={{ color: "#555" }}>
                      {a.phone && <span>📞 {a.phone}</span>}
                      {a.location && <span>📍 {a.location}</span>}
                      <span>🗓 {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {a.extracted && (
                      <div className="rounded-xl p-3 mb-3 text-xs" style={{ background: "#FAFAF8", color: "#555" }}>
                        <p className="font-semibold mb-1" style={{ color: "#7A6020" }}>From their CV</p>
                        {a.extracted.years_experience > 0 && <p>Experience: ~{a.extracted.years_experience} years</p>}
                        {a.extracted.skills?.length > 0 && <p>Skills: {a.extracted.skills.join(", ")}</p>}
                        {a.extracted.education?.length > 0 && <p>Education: {a.extracted.education.join("; ")}</p>}
                      </div>
                    )}
                    {a.cover_note && <p className="text-sm mb-3" style={{ color: "#454545" }}>{a.cover_note}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "#999" }}>Status</label>
                        <select value={a.status} onChange={(e) => update(a.id, { status: e.target.value })} className={inputCls} style={inputStyle}>
                          {(statuses.length ? statuses : ["new"]).map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "#999" }}>Internal note</label>
                        <input defaultValue={a.admin_note ?? ""} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== a.admin_note) update(a.id, { admin_note: v }); }} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={() => cv(a)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}><Download className="w-4 h-4" />Download CV</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none focus:border-[#C5B27A]";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;
