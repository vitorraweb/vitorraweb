"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2, Save, X, FileText } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Template = {
  id: number; name: string; subject: string; body: string;
  category: string | null; creator: { id: number; name: string } | null;
  created_at: string;
};

const CATEGORIES = ["FET", "SEAL", "Coffee", "Logistics", "General"] as const;

const CAT_COLOR: Record<string, { background: string; color: string }> = {
  FET:       { background: "rgba(197,178,122,0.16)", color: "#7A6020" },
  SEAL:      { background: "rgba(59,130,246,0.12)",  color: "#2563EB" },
  Coffee:    { background: "rgba(139,92,246,0.12)",  color: "#7C3AED" },
  Logistics: { background: "rgba(34,197,94,0.12)",   color: "#16A34A" },
  General:   { background: "rgba(0,0,0,0.06)",       color: "#555" },
};

const inputCls  = "w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

type FormState = { name: string; subject: string; body: string; category: string };
const EMPTY_FORM: FormState = { name: "", subject: "", body: "", category: "" };

export default function TemplatesPage() {
  const [list, setList]       = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId]   = useState<number | "new" | null>(null);
  const [form, setForm]       = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<Template[]>("/admin/templates");
      setList(Array.isArray(res) ? res : []);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY_FORM); setEditId("new"); };
  const openEdit = (t: Template) => {
    setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category ?? "" });
    setEditId(t.id);
  };
  const cancel   = () => { setEditId(null); setForm(EMPTY_FORM); };

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), subject: form.subject.trim(), body: form.body.trim(), category: form.category || null };
      if (editId === "new") {
        const res = await apiAdmin<{ data: Template }>("/admin/templates", { method: "POST", body: JSON.stringify(payload) });
        setList((l) => [res.data, ...l]);
      } else {
        const res = await apiAdmin<{ data: Template }>(`/admin/templates/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setList((l) => l.map((t) => (t.id === editId ? res.data : t)));
      }
      cancel();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const destroy = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    setDeleting(id);
    try {
      await apiAdmin(`/admin/templates/${id}`, { method: "DELETE" });
      setList((l) => l.filter((t) => t.id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  const filtered = filterCat ? list.filter((t) => t.category === filterCat) : list;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Reply Templates" subtitle="Pre-saved email responses. Pick one when replying to a customer — it fills the subject and body instantly." />
        <button onClick={openNew} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full shrink-0"
          style={{ background: "#C5B27A", color: "#1E1E1E" }}>
          <Plus className="w-4 h-4" />New template
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterCat("")} className="text-xs font-semibold px-3 py-1 rounded-full"
          style={!filterCat ? { background: "#1E1E1E", color: "#fff" } : { background: "#F2F2F2", color: "#555" }}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCat(filterCat === c ? "" : c)} className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
            style={filterCat === c ? { background: "#1E1E1E", color: "#fff" } : { background: "#F2F2F2", color: "#555" }}>
            {c}
          </button>
        ))}
      </div>

      {/* New / Edit form */}
      {editId !== null && (
        <div className="bg-white rounded-[18px] border border-black/[0.06] p-5 mb-5">
          <p className="text-sm font-bold mb-4" style={{ color: "#1E1E1E" }}>
            {editId === "new" ? "New template" : "Edit template"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1 block" style={{ color: "#999" }}>Template name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. FET pricing follow-up" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1 block" style={{ color: "#999" }}>Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputCls} style={inputStyle}>
                <option value="">No category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1 block" style={{ color: "#999" }}>Email subject</label>
            <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Re: your FET enquiry — pricing & next steps" className={inputCls} style={inputStyle} />
          </div>
          <div className="mb-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1 block" style={{ color: "#999" }}>Body</label>
            <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder={"Thank you for your interest in FET.\n\nBased on your fleet size, here is our pricing…"}
              className={inputCls + " min-h-[160px] resize-y"} style={inputStyle} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving || !form.name.trim() || !form.subject.trim() || !form.body.trim()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
              style={{ background: "#C5B27A", color: "#1E1E1E" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : "Save template"}
            </button>
            <button onClick={cancel} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
              style={{ background: "#F2F2F2", color: "#555" }}>
              <X className="w-3.5 h-3.5" />Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : filtered.length === 0 ? (
        <Empty label={filterCat ? `No ${filterCat} templates yet.` : "No templates yet. Create your first one above."} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-[18px] border border-black/[0.05] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(197,178,122,0.12)" }}>
                    <FileText className="w-4 h-4" style={{ color: "#C5B27A" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{t.name}</span>
                      {t.category && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={CAT_COLOR[t.category] ?? { background: "#F2F2F2", color: "#555" }}>
                          {t.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mb-1 truncate" style={{ color: "#777" }}>Subject: {t.subject}</p>
                    <p className="text-xs line-clamp-2" style={{ color: "#999" }}>{t.body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                    <Pencil className="w-3.5 h-3.5" style={{ color: "#888" }} />
                  </button>
                  <button onClick={() => destroy(t.id)} disabled={deleting === t.id} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    {deleting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#C0392B" }} /> : <Trash2 className="w-3.5 h-3.5" style={{ color: "#C0392B" }} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
