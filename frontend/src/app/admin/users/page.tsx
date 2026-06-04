"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, UserPlus, ChevronDown, Save, Trash2, KeyRound } from "lucide-react";
import { apiAdmin, auth } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type User = { id: number; name: string; email: string; role: string; created_at?: string };
type Role = "admin" | "ops";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", ops: "Ops" };
const inputCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

export default function UsersPage() {
  const me = auth.getUser();
  const [list, setList]       = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState<number | null>(null);
  const [rowMsg, setRowMsg]   = useState("");
  const [pw, setPw]           = useState("");

  // Add-user panel
  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd]         = useState({ name: "", email: "", role: "ops" as Role, password: "" });
  const [adding, setAdding]   = useState(false);
  const [addMsg, setAddMsg]   = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: User[] }>("/admin/users");
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const expand = (id: number) => { setRowMsg(""); setPw(""); setOpen(open === id ? null : id); };
  const setField = (id: number, k: keyof User, v: string) => setList((l) => l.map((u) => (u.id === id ? { ...u, [k]: v } : u)));

  const createUser = async () => {
    if (!add.name.trim() || !add.email.trim() || add.password.length < 8) { setAddMsg("Name, email, and an 8+ character password are required."); return; }
    setAdding(true); setAddMsg("");
    try {
      await apiAdmin("/admin/users", { method: "POST", body: JSON.stringify(add) });
      setAdd({ name: "", email: "", role: "ops", password: "" });
      setAddOpen(false);
      load();
    } catch (e) { setAddMsg(e instanceof Error ? e.message : "Failed to create user."); }
    finally { setAdding(false); }
  };

  const saveUser = async (u: User) => {
    setRowMsg("");
    try { await apiAdmin(`/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ name: u.name, email: u.email, role: u.role }) }); setRowMsg("Saved."); }
    catch (e) { setRowMsg(e instanceof Error ? e.message : "Save failed."); load(); }
  };

  const resetPassword = async (id: number) => {
    if (pw.length < 8) { setRowMsg("Password must be at least 8 characters."); return; }
    try { await apiAdmin(`/admin/users/${id}/password`, { method: "POST", body: JSON.stringify({ password: pw }) }); setPw(""); setRowMsg("Password updated."); }
    catch (e) { setRowMsg(e instanceof Error ? e.message : "Failed."); }
  };

  const removeUser = async (id: number) => {
    if (!confirm("Remove this user's access? This cannot be undone.")) return;
    try { await apiAdmin(`/admin/users/${id}`, { method: "DELETE" }); setList((l) => l.filter((u) => u.id !== id)); }
    catch (e) { setRowMsg(e instanceof Error ? e.message : "Delete failed."); }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Users & roles" subtitle="Team accounts and access. Admins manage settings and users; Ops handle day-to-day." />
        <button onClick={() => setAddOpen((o) => !o)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#1E1E1E", color: "#fff" }}>
          <UserPlus className="w-4 h-4" />Add user
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1E1E1E" }}>New team member</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} placeholder="Full name" className={inputCls} style={inputStyle} />
            <input value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} placeholder="Email" type="email" className={inputCls} style={inputStyle} />
            <select value={add.role} onChange={(e) => setAdd({ ...add, role: e.target.value as Role })} className={inputCls} style={inputStyle}>
              <option value="ops">Ops — day-to-day (no settings/users)</option>
              <option value="admin">Admin — full access</option>
            </select>
            <input value={add.password} onChange={(e) => setAdd({ ...add, password: e.target.value })} placeholder="Temporary password (8+ chars)" type="text" className={inputCls} style={inputStyle} />
          </div>
          {addMsg && <p className="text-sm mt-3" style={{ color: "#C0392B" }}>{addMsg}</p>}
          <button onClick={createUser} disabled={adding} className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: adding ? 0.7 : 1 }}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}Create user
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No team users yet." />
      ) : (
        <div className="space-y-2.5">
          {list.map((u) => (
            <div key={u.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
              <button onClick={() => expand(u.id)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{u.name}</span>
                    {me?.id === u.id && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>you</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: "#999" }}>{u.email}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0" style={u.role === "admin" ? { background: "rgba(197,178,122,0.16)", color: "#7A6020" } : { background: "rgba(59,130,246,0.12)", color: "#2563EB" }}>
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === u.id ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
              </button>

              {open === u.id && (
                <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                    <input value={u.name} onChange={(e) => setField(u.id, "name", e.target.value)} className={inputCls} style={inputStyle} />
                    <input value={u.email} onChange={(e) => setField(u.id, "email", e.target.value)} type="email" className={inputCls} style={inputStyle} />
                    <select value={u.role} onChange={(e) => setField(u.id, "role", e.target.value)} className={inputCls} style={inputStyle}>
                      <option value="ops">Ops</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button onClick={() => saveUser(u)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#C5B27A", color: "#1E1E1E" }}><Save className="w-3.5 h-3.5" />Save</button>
                    <button onClick={() => removeUser(u.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-3.5 h-3.5" />Remove</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#777" }}><KeyRound className="w-3.5 h-3.5" />Reset password</span>
                    <input value={pw} onChange={(e) => setPw(e.target.value)} type="text" placeholder="New password (8+)" className="text-sm rounded-xl px-3 py-1.5 border" style={inputStyle} />
                    <button onClick={() => resetPassword(u.id)} className="text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>Set</button>
                  </div>
                  {rowMsg && <p className="text-sm mt-3" style={{ color: rowMsg.includes("fail") || rowMsg.includes("cannot") || rowMsg.includes("must") ? "#C0392B" : "#16A34A" }}>{rowMsg}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
