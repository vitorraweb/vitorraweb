"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, Pin, X } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

/* ─── People → Announcements ──────────────────────────────────────────────────
   Company notices shown at the top of every staff member's home — in the
   staff portal and in the console's My work. To everyone or one department,
   optionally pinned, optionally taken down on a date.                      */

type A = { id: number; title: string; body: string; department: string | null; pinned: boolean; expires_at: string | null; created_at: string; author: string | null; expired: boolean };
const DEPTS: Record<string, string> = { leadership: "Leadership", operations: "Operations", finance: "Finance", marketing: "Marketing", sales: "Sales", it: "IT" };
const blank = { title: "", body: "", department: "", pinned: false, expires_at: "" };

export default function AnnouncementsPage() {
  const [list, setList] = useState<A[] | null>(null);
  const [form, setForm] = useState<typeof blank | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => { setList((await apiAdmin<{ data: A[] }>("/admin/announcements")).data); }, []);
  useEffect(() => { load().catch(() => setList([])); }, [load]);

  const open = (a?: A) => {
    setError(""); setEditing(a?.id ?? null);
    setForm(a ? { title: a.title, body: a.body, department: a.department ?? "", pinned: a.pinned, expires_at: a.expires_at ? a.expires_at.slice(0, 10) : "" } : { ...blank });
  };

  const save = async () => {
    if (!form) return;
    setBusy(true); setError("");
    const body = { ...form, department: form.department || null, expires_at: form.expires_at ? `${form.expires_at}T23:59:59` : null };
    try {
      await apiAdmin(editing ? `/admin/announcements/${editing}` : "/admin/announcements", { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) });
      setForm(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  };

  const remove = async (a: A) => {
    if (!window.confirm(`Take down "${a.title}"?`)) return;
    await apiAdmin(`/admin/announcements/${a.id}`, { method: "DELETE" }); await load();
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Announcements"
        subtitle="Notices at the top of every staff member's home, in the staff portal and in My work."
        actions={<button className="c-btn c-btn-primary" onClick={() => open()}><Plus className="w-4 h-4" />New announcement</button>}
      />

      <div className="space-y-4 mt-5">
        {form && (
          <section className="c-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">{editing ? "Edit announcement" : "New announcement"}</h3>
              <button className="c-btn c-btn-ghost" onClick={() => setForm(null)} aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Title</span><input className="c-input w-full" value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Message</span><textarea className="c-input w-full h-auto py-2" rows={5} value={form.body} maxLength={5000} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Who sees it</span>
                <select className="c-select w-full" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Everyone</option>{Object.entries(DEPTS).map(([k, v]) => <option key={k} value={k}>{v} only</option>)}
                </select>
              </label>
              <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Take down after (optional)</span><input type="date" className="c-input w-full" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></label>
              <label className="flex items-center gap-2 text-[14px] text-ink-soft h-9"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />Pin to the top</label>
            </div>
            {error && <p className="text-[13px] text-alert-ink">{error}</p>}
            <button className="c-btn c-btn-primary" onClick={save} disabled={busy || !form.title.trim() || !form.body.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{editing ? "Save" : "Publish"}</button>
          </section>
        )}

        {list === null ? <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
          : list.length === 0 ? <Empty label="No announcements yet. Post one and every staff member sees it on their home page." />
          : (
            <ul className="space-y-3">
              {list.map((a) => (
                <li key={a.id} className="c-panel p-4" style={{ opacity: a.expired ? 0.6 : 1 }}>
                  <div className="flex items-start gap-3">
                    {a.pinned && <Pin className="w-4 h-4 mt-0.5 shrink-0 text-gold-ink" aria-label="Pinned" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-ink">{a.title}</p>
                      <p className="text-[12.5px] text-ink-muted">
                        {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{a.author ? ` · ${a.author}` : ""} · {a.department ? `${DEPTS[a.department] ?? a.department} only` : "Everyone"}
                        {a.expires_at ? ` · ${a.expired ? "taken down" : "until"} ${new Date(a.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                      </p>
                      <p className="text-[14px] text-ink-soft whitespace-pre-line mt-2">{a.body}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="c-btn" onClick={() => open(a)}>Edit</button>
                      <button className="c-btn c-btn-ghost" onClick={() => remove(a)} aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
