"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, UserPlus, ChevronDown, Save, Trash2, KeyRound, Plus, X } from "lucide-react";
import { apiAdmin, auth } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Doc = { label: string; url: string };
type Staff = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "ops";
  phone?: string | null;
  department?: string | null;
  job_title?: string | null;
  start_date?: string | null;
  staff_status?: string | null;
  permissions?: string[] | null;
  documents?: Doc[] | null;
  notes?: string | null;
};
type Registry = {
  modules: Record<string, string>;
  departments: Record<string, string>;
  department_modules: Record<string, string[]>;
};

const ROLE_LABEL: Record<string, string> = { admin: "Admin", ops: "Ops" };
const STATUS = { active: "Active", on_leave: "On leave", left: "Left" } as const;
const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  active:   { background: "rgba(34,197,94,0.12)", color: "#16A34A" },
  on_leave: { background: "rgba(197,178,122,0.16)", color: "#7A6020" },
  left:     { background: "rgba(0,0,0,0.06)", color: "#777" },
};
const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

export default function StaffPage() {
  const me = auth.getUser();
  const [list, setList] = useState<Staff[]>([]);
  const [reg, setReg] = useState<Registry>({ modules: {}, departments: {}, department_modules: {} });
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState<Staff | null>(null);
  const [rowMsg, setRowMsg] = useState("");
  const [pw, setPw] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ name: "", email: "", role: "ops", password: "", department: "operations", job_title: "" });
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: Staff[] } & Registry>("/admin/users");
      setList(res.data);
      setReg({ modules: res.modules, departments: res.departments, department_modules: res.department_modules });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const expand = (s: Staff) => {
    setRowMsg(""); setPw("");
    if (open === s.id) { setOpen(null); setDraft(null); return; }
    setOpen(s.id);
    setDraft({ ...s, permissions: s.permissions ?? null, documents: s.documents ?? [] });
  };

  const setD = <K extends keyof Staff>(k: K, v: Staff[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  // Effective module list for display: explicit override, else department default.
  const effective = (s: Pick<Staff, "permissions" | "department">): string[] => {
    const base = s.permissions ?? reg.department_modules[s.department ?? ""] ?? [];
    return base.includes("dashboard") ? base : ["dashboard", ...base];
  };

  const usingDefault = draft ? draft.permissions == null : true;

  const toggleModule = (key: string) => {
    if (!draft) return;
    if (key === "dashboard") return; // always granted
    const current = draft.permissions ?? effective(draft);
    const next = current.includes(key) ? current.filter((m) => m !== key) : [...current, key];
    setD("permissions", next);
  };

  const createStaff = async () => {
    if (!add.name.trim() || !add.email.trim() || add.password.length < 8) { setAddMsg("Name, email, and an 8+ character password are required."); return; }
    setAdding(true); setAddMsg("");
    try {
      await apiAdmin("/admin/users", { method: "POST", body: JSON.stringify(add) });
      setAdd({ name: "", email: "", role: "ops", password: "", department: "operations", job_title: "" });
      setAddOpen(false);
      load();
    } catch (e) { setAddMsg(e instanceof Error ? e.message : "Failed to create staff member."); }
    finally { setAdding(false); }
  };

  const saveStaff = async () => {
    if (!draft) return;
    setRowMsg("");
    try {
      const res = await apiAdmin<{ data: Staff }>(`/admin/users/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name, email: draft.email, role: draft.role, phone: draft.phone,
          department: draft.department, job_title: draft.job_title, start_date: draft.start_date,
          staff_status: draft.staff_status, permissions: draft.permissions,
          documents: (draft.documents ?? []).filter((d) => d.label.trim() && d.url.trim()),
          notes: draft.notes,
        }),
      });
      setList((l) => l.map((u) => (u.id === draft.id ? res.data : u)));
      setRowMsg("Saved.");
    } catch (e) { setRowMsg(e instanceof Error ? e.message : "Save failed."); }
  };

  const resetPassword = async (id: number) => {
    if (pw.length < 8) { setRowMsg("Password must be at least 8 characters."); return; }
    try { await apiAdmin(`/admin/users/${id}/password`, { method: "POST", body: JSON.stringify({ password: pw }) }); setPw(""); setRowMsg("Password updated."); }
    catch (e) { setRowMsg(e instanceof Error ? e.message : "Failed."); }
  };

  const removeStaff = async (id: number) => {
    if (!confirm("Remove this staff member's account and access? This cannot be undone.")) return;
    try { await apiAdmin(`/admin/users/${id}`, { method: "DELETE" }); setList((l) => l.filter((u) => u.id !== id)); setOpen(null); }
    catch (e) { setRowMsg(e instanceof Error ? e.message : "Delete failed."); }
  };

  const shown = filterDept === "all" ? list : list.filter((s) => (s.department ?? "") === filterDept);
  const deptEntries = Object.entries(reg.departments);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Staff" subtitle="Your team directory and access. Each person sees only the areas their department or permissions allow." />
        <button onClick={() => setAddOpen((o) => !o)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0" style={{ background: "#1E1E1E", color: "#fff" }}>
          <UserPlus className="w-4 h-4" />Add staff
        </button>
      </div>

      {/* Add staff (onboarding) */}
      {addOpen && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1E1E1E" }}>Onboard a staff member</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} placeholder="Full name" className={inputCls} style={inputStyle} />
            <input value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} placeholder="Work email" type="email" className={inputCls} style={inputStyle} />
            <select value={add.department} onChange={(e) => setAdd({ ...add, department: e.target.value })} className={inputCls} style={inputStyle}>
              {deptEntries.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <input value={add.job_title} onChange={(e) => setAdd({ ...add, job_title: e.target.value })} placeholder="Job title" className={inputCls} style={inputStyle} />
            <select value={add.role} onChange={(e) => setAdd({ ...add, role: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="ops">Ops — scoped to their department</option>
              <option value="admin">Admin — full access</option>
            </select>
            <input value={add.password} onChange={(e) => setAdd({ ...add, password: e.target.value })} placeholder="Temporary password (8+ chars)" type="text" className={inputCls} style={inputStyle} />
          </div>
          <p className="text-xs mt-3" style={{ color: "#999" }}>Access defaults to the department&apos;s screens. You can fine-tune it after creating the account.</p>
          {addMsg && <p className="text-sm mt-2" style={{ color: "#C0392B" }}>{addMsg}</p>}
          <button onClick={createStaff} disabled={adding} className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: adding ? 0.7 : 1 }}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}Create account
          </button>
        </div>
      )}

      {/* Department filter */}
      {deptEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[["all", "All"], ...deptEntries].map(([k, label]) => (
            <button key={k} onClick={() => setFilterDept(k)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors" style={filterDept === k ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.08)" }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : shown.length === 0 ? (
        <Empty label="No staff in this view yet." />
      ) : (
        <div className="space-y-2.5">
          {shown.map((s) => {
            const isOpen = open === s.id;
            const d = isOpen ? draft : null;
            return (
              <div key={s.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
                <button onClick={() => expand(s)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{s.name}</span>
                      {me?.id === s.id && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>you</span>}
                    </div>
                    <p className="text-xs truncate" style={{ color: "#999" }}>{s.job_title ? `${s.job_title} · ` : ""}{s.email}</p>
                  </div>
                  {s.department && <span className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 hidden sm:inline" style={{ background: "#F2F2F2", color: "#666" }}>{reg.departments[s.department] ?? s.department}</span>}
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0" style={STATUS_STYLE[s.staff_status ?? "active"] ?? STATUS_STYLE.active}>{STATUS[(s.staff_status ?? "active") as keyof typeof STATUS] ?? s.staff_status}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0" style={s.role === "admin" ? { background: "rgba(197,178,122,0.16)", color: "#7A6020" } : { background: "rgba(59,130,246,0.12)", color: "#2563EB" }}>{ROLE_LABEL[s.role] ?? s.role}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
                </button>

                {isOpen && d && (
                  <div className="px-4 pb-5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    {/* Profile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                      <Field label="Name"><input value={d.name} onChange={(e) => setD("name", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Email"><input value={d.email} onChange={(e) => setD("email", e.target.value)} type="email" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Job title"><input value={d.job_title ?? ""} onChange={(e) => setD("job_title", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Phone"><input value={d.phone ?? ""} onChange={(e) => setD("phone", e.target.value)} className={inputCls} style={inputStyle} /></Field>
                      <Field label="Department">
                        <select value={d.department ?? ""} onChange={(e) => setD("department", e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="">—</option>
                          {deptEntries.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                        </select>
                      </Field>
                      <Field label="Role">
                        <select value={d.role} onChange={(e) => setD("role", e.target.value as Staff["role"])} className={inputCls} style={inputStyle}>
                          <option value="ops">Ops</option><option value="admin">Admin</option>
                        </select>
                      </Field>
                      <Field label="Start date"><input value={d.start_date ?? ""} onChange={(e) => setD("start_date", e.target.value)} type="date" className={inputCls} style={inputStyle} /></Field>
                      <Field label="Status">
                        <select value={d.staff_status ?? "active"} onChange={(e) => setD("staff_status", e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="active">Active</option><option value="on_leave">On leave</option><option value="left">Left</option>
                        </select>
                      </Field>
                    </div>

                    {/* Access / permissions */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#777" }}>Access</span>
                        {d.role === "admin" ? (
                          <span className="text-xs" style={{ color: "#999" }}>Admins have full access.</span>
                        ) : usingDefault ? (
                          <button onClick={() => setD("permissions", effective(d).filter((m) => m !== "dashboard"))} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>Customise access</button>
                        ) : (
                          <button onClick={() => setD("permissions", null)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>Reset to department default</button>
                        )}
                      </div>
                      {d.role !== "admin" && (
                        <>
                          {usingDefault && <p className="text-xs mb-3" style={{ color: "#999" }}>Inherited from {d.department ? (reg.departments[d.department] ?? d.department) : "department"}. Click “Customise access” to override per person.</p>}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(reg.modules).map(([key, label]) => {
                              const checked = effective(d).includes(key);
                              const locked = key === "dashboard" || usingDefault;
                              return (
                                <label key={key} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: checked ? "rgba(197,178,122,0.1)" : "#F7F7F5", color: "#1E1E1E", opacity: locked && !checked ? 0.5 : 1, cursor: locked ? "default" : "pointer" }}>
                                  <input type="checkbox" checked={checked} disabled={locked} onChange={() => toggleModule(key)} />
                                  {label}
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#777" }}>Documents</span>
                      <div className="space-y-2 mt-2">
                        {(d.documents ?? []).map((doc, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input value={doc.label} onChange={(e) => setD("documents", (d.documents ?? []).map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Label (e.g. Contract)" className={inputCls} style={inputStyle} />
                            <input value={doc.url} onChange={(e) => setD("documents", (d.documents ?? []).map((x, j) => j === i ? { ...x, url: e.target.value } : x))} placeholder="Link (from Media library)" className={inputCls} style={inputStyle} />
                            <button onClick={() => setD("documents", (d.documents ?? []).filter((_, j) => j !== i))} className="shrink-0 p-2 rounded-lg" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <button onClick={() => setD("documents", [...(d.documents ?? []), { label: "", url: "" }])} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}><Plus className="w-3.5 h-3.5" />Add document</button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                      <Field label="Internal notes"><textarea value={d.notes ?? ""} onChange={(e) => setD("notes", e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <button onClick={saveStaff} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}><Save className="w-3.5 h-3.5" />Save</button>
                      <button onClick={() => removeStaff(d.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-3.5 h-3.5" />Remove</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#777" }}><KeyRound className="w-3.5 h-3.5" />Reset password</span>
                      <input value={pw} onChange={(e) => setPw(e.target.value)} type="text" placeholder="New password (8+)" className="text-sm rounded-xl px-3 py-1.5 border" style={inputStyle} />
                      <button onClick={() => resetPassword(d.id)} className="text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>Set</button>
                    </div>
                    {rowMsg && <p className="text-sm mt-3" style={{ color: /fail|cannot|must|invalid/i.test(rowMsg) ? "#C0392B" : "#16A34A" }}>{rowMsg}</p>}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "#888" }}>{label}</span>
      {children}
    </label>
  );
}
