"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Save, Trash2, ChevronDown, CalendarClock, User as UserIcon } from "lucide-react";
import { apiAdmin, auth } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Person = { id: number; name: string; department?: string | null };
type Task = {
  id: number;
  title: string;
  description?: string | null;
  assigned_to?: number | null;
  created_by?: number | null;
  status: string;
  priority: string;
  due_date?: string | null;
  department?: string | null;
  assignee?: { id: number; name: string } | null;
  creator?: { id: number; name: string } | null;
};

const STATUSES = ["todo", "in_progress", "blocked", "done"] as const;
const STATUS_LABEL: Record<string, string> = { todo: "To do", in_progress: "In progress", blocked: "Blocked", done: "Done" };
const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  todo:        { background: "rgba(0,0,0,0.06)", color: "#777" },
  in_progress: { background: "rgba(59,130,246,0.12)", color: "#2563EB" },
  blocked:     { background: "rgba(192,57,43,0.1)", color: "#C0392B" },
  done:        { background: "rgba(34,197,94,0.12)", color: "#16A34A" },
};
const PRIORITY_STYLE: Record<string, { background: string; color: string }> = {
  low:    { background: "rgba(0,0,0,0.05)", color: "#888" },
  normal: { background: "rgba(197,178,122,0.14)", color: "#7A6020" },
  high:   { background: "rgba(192,57,43,0.1)", color: "#C0392B" },
};
const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

const blankNew = { title: "", description: "", assigned_to: "", priority: "normal", due_date: "", department: "" };

export default function TasksPage() {
  const me = auth.getUser();
  const [list, setList] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [mine, setMine] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState<Task | null>(null);
  const [rowMsg, setRowMsg] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ ...blankNew });
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (mine) p.set("mine", "1");
    try {
      const res = await apiAdmin<{ data: Task[]; assignees: Person[] }>(`/admin/tasks?${p}`);
      setList(res.data);
      setPeople(res.assignees);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [statusFilter, mine]);

  useEffect(() => { load(); }, [load]);

  const expand = (t: Task) => {
    setRowMsg("");
    if (open === t.id) { setOpen(null); setDraft(null); return; }
    setOpen(t.id); setDraft({ ...t });
  };
  const setD = <K extends keyof Task>(k: K, v: Task[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const createTask = async () => {
    if (!add.title.trim()) { setAddMsg("A title is required."); return; }
    setAdding(true); setAddMsg("");
    try {
      await apiAdmin("/admin/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: add.title,
          description: add.description || null,
          assigned_to: add.assigned_to ? Number(add.assigned_to) : null,
          priority: add.priority,
          due_date: add.due_date || null,
          department: add.department || null,
        }),
      });
      setAdd({ ...blankNew }); setAddOpen(false); load();
    } catch (e) { setAddMsg(e instanceof Error ? e.message : "Failed to create task."); }
    finally { setAdding(false); }
  };

  // Fast inline status change from the collapsed card.
  const quickStatus = async (t: Task, status: string) => {
    setList((l) => l.map((x) => (x.id === t.id ? { ...x, status } : x)));
    try { await apiAdmin(`/admin/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
    catch { load(); }
  };

  const saveTask = async () => {
    if (!draft) return;
    setRowMsg("");
    try {
      const res = await apiAdmin<{ data: Task }>(`/admin/tasks/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: draft.title, description: draft.description, assigned_to: draft.assigned_to,
          status: draft.status, priority: draft.priority, due_date: draft.due_date, department: draft.department,
        }),
      });
      setList((l) => l.map((x) => (x.id === draft.id ? res.data : x)));
      setRowMsg("Saved.");
    } catch (e) { setRowMsg(e instanceof Error ? e.message : "Save failed."); }
  };

  const removeTask = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try { await apiAdmin(`/admin/tasks/${id}`, { method: "DELETE" }); setList((l) => l.filter((x) => x.id !== id)); setOpen(null); }
    catch (e) { setRowMsg(e instanceof Error ? e.message : "Delete failed."); }
  };

  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Tasks" subtitle="Assign and track work across the team. You see tasks assigned to you, created by you, or in your department." />
        <button onClick={() => setAddOpen((o) => !o)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0" style={{ background: "#1E1E1E", color: "#fff" }}>
          <Plus className="w-4 h-4" />New task
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1E1E1E" }}>New task</p>
          <div className="grid grid-cols-1 gap-3">
            <input value={add.title} onChange={(e) => setAdd({ ...add, title: e.target.value })} placeholder="What needs doing?" className={inputCls} style={inputStyle} />
            <textarea value={add.description} onChange={(e) => setAdd({ ...add, description: e.target.value })} placeholder="Details (optional)" rows={2} className={inputCls} style={inputStyle} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={add.assigned_to} onChange={(e) => setAdd({ ...add, assigned_to: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="">Unassigned</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={add.priority} onChange={(e) => setAdd({ ...add, priority: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option>
              </select>
              <input value={add.due_date} onChange={(e) => setAdd({ ...add, due_date: e.target.value })} type="date" className={inputCls} style={inputStyle} />
            </div>
          </div>
          {addMsg && <p className="text-sm mt-3" style={{ color: "#C0392B" }}>{addMsg}</p>}
          <button onClick={createTask} disabled={adding} className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: adding ? 0.7 : 1 }}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Create task
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {[["all", "All"], ...STATUSES.map((s) => [s, STATUS_LABEL[s]] as const)].map(([k, label]) => (
          <button key={k} onClick={() => setStatusFilter(k)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors" style={statusFilter === k ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.08)" }}>
            {label}
          </button>
        ))}
        <button onClick={() => setMine((m) => !m)} className="ml-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors" style={mine ? { background: "#C5B27A", color: "#1E1E1E" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.08)" }}>
          Assigned to me
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No tasks here yet. Create one to get started." />
      ) : (
        <div className="space-y-2.5">
          {list.map((t) => {
            const isOpen = open === t.id;
            const d = isOpen ? draft : null;
            const overdue = t.due_date && t.status !== "done" && new Date(t.due_date) < new Date(new Date().toDateString());
            return (
              <div key={t.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <select value={t.status} onChange={(e) => quickStatus(t, e.target.value)} onClick={(e) => e.stopPropagation()} className="text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer shrink-0" style={STATUS_STYLE[t.status] ?? STATUS_STYLE.todo}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <button onClick={() => expand(t)} className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm truncate" style={{ color: t.status === "done" ? "#999" : "#1E1E1E", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: "#999" }}>
                      <span className="inline-flex items-center gap-1"><UserIcon className="w-3 h-3" />{t.assignee?.name ?? "Unassigned"}</span>
                      {t.due_date && <span className="inline-flex items-center gap-1" style={{ color: overdue ? "#C0392B" : "#999" }}><CalendarClock className="w-3 h-3" />{fmt(t.due_date)}</span>}
                    </div>
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 hidden sm:inline" style={PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.normal}>{t.priority}</span>
                  <button onClick={() => expand(t)}><ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "#BBB" }} /></button>
                </div>

                {isOpen && d && (
                  <div className="px-4 pb-5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="grid grid-cols-1 gap-3 my-3">
                      <input value={d.title} onChange={(e) => setD("title", e.target.value)} className={inputCls} style={inputStyle} />
                      <textarea value={d.description ?? ""} onChange={(e) => setD("description", e.target.value)} placeholder="Details" rows={3} className={inputCls} style={inputStyle} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <select value={d.assigned_to ?? ""} onChange={(e) => setD("assigned_to", e.target.value ? Number(e.target.value) : null)} className={inputCls} style={inputStyle}>
                          <option value="">Unassigned</option>
                          {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={d.status} onChange={(e) => setD("status", e.target.value)} className={inputCls} style={inputStyle}>
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                        <select value={d.priority} onChange={(e) => setD("priority", e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                        </select>
                        <input value={d.due_date ?? ""} onChange={(e) => setD("due_date", e.target.value)} type="date" className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#AAA" }}>
                      {t.creator?.name ? `Created by ${t.creator.name}` : ""}{t.creator?.name && me?.id ? " · " : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={saveTask} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}><Save className="w-3.5 h-3.5" />Save</button>
                      <button onClick={() => removeTask(d.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    </div>
                    {rowMsg && <p className="text-sm mt-3" style={{ color: /fail|only|cannot/i.test(rowMsg) ? "#C0392B" : "#16A34A" }}>{rowMsg}</p>}
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
