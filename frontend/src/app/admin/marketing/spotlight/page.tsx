"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

/* ─── Marketing → Spotlight ───────────────────────────────────────────────────
   The one current message under the homepage and FET page heroes ("This
   month", an assessment drive, a new article). Each has dates, so the site
   changes by itself: when one ends, the next live one shows; with none live,
   the band disappears. Swahili text is optional and falls back to English.
   Keep it to what Vitorra actually offers. */

type Spot = {
  id: number; eyebrow: string | null; title: string; body: string | null; title_sw: string | null; body_sw: string | null;
  cta_label: string | null; cta_label_sw: string | null; cta_url: string | null; pages: string[];
  starts_on: string | null; ends_on: string | null; is_active: boolean; priority: number;
};

const PAGES: [string, string][] = [["home", "Homepage"], ["fet", "Fuel Eco Tech page"]];
const blank = () => ({ eyebrow: "", title: "", body: "", title_sw: "", body_sw: "", cta_label: "", cta_label_sw: "", cta_url: "", pages: ["home"] as string[], starts_on: "", ends_on: "", is_active: true, priority: 0 });
const today = () => new Date().toISOString().slice(0, 10);
const day = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

function status(s: Spot): { label: string; tone: string } {
  const t = today();
  if (!s.is_active) return { label: "Off", tone: "muted" };
  if (s.starts_on && s.starts_on.slice(0, 10) > t) return { label: "Scheduled", tone: "blue" };
  if (s.ends_on && s.ends_on.slice(0, 10) < t) return { label: "Ended", tone: "muted" };
  return { label: "Live", tone: "ok" };
}

export default function SpotlightPage() {
  const [rows, setRows] = useState<Spot[] | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try { setRows((await apiAdmin<{ data: Spot[] }>("/admin/spotlights")).data); } catch { setRows([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = (s?: Spot) => {
    setMsg("");
    if (!s) { setEditing("new"); setForm({ ...blank(), starts_on: today() }); return; }
    setEditing(s.id);
    setForm({
      eyebrow: s.eyebrow ?? "", title: s.title, body: s.body ?? "", title_sw: s.title_sw ?? "", body_sw: s.body_sw ?? "",
      cta_label: s.cta_label ?? "", cta_label_sw: s.cta_label_sw ?? "", cta_url: s.cta_url ?? "", pages: s.pages,
      starts_on: s.starts_on?.slice(0, 10) ?? "", ends_on: s.ends_on?.slice(0, 10) ?? "", is_active: s.is_active, priority: s.priority,
    });
  };

  const save = async () => {
    setMsg("");
    if (!form.title.trim()) { setMsg("Write the headline."); return; }
    if (form.pages.length === 0) { setMsg("Choose at least one page."); return; }
    setSaving(true);
    const body = JSON.stringify(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])));
    try {
      if (editing === "new") await apiAdmin("/admin/spotlights", { method: "POST", body });
      else await apiAdmin(`/admin/spotlights/${editing}`, { method: "PATCH", body });
      setEditing(null);
      load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save."); } finally { setSaving(false); }
  };

  const remove = async (s: Spot) => {
    if (!confirm(`Delete the spotlight "${s.title}"?`)) return;
    try { await apiAdmin(`/admin/spotlights/${s.id}`, { method: "DELETE" }); load(); } catch (e) { alert(e instanceof Error ? e.message : "Could not delete."); }
  };

  const f = (k: keyof ReturnType<typeof blank>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="pb-12">
      <PageHeader
        title="Spotlight"
        subtitle="The current message under the homepage and Fuel Eco Tech headers. Give each one dates and the website changes by itself."
        actions={editing === null ? <button onClick={() => open()} className="c-btn c-btn-primary"><Plus className="w-3.5 h-3.5" />New spotlight</button> : undefined}
      />

      {editing !== null && (
        <div className="c-panel p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="c-panel-title">{editing === "new" ? "New spotlight" : "Edit spotlight"}</p>
            <button onClick={() => setEditing(null)} className="c-btn c-btn-ghost" aria-label="Close"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Small label (e.g. This month, New, Fleet season)</span><input value={form.eyebrow} onChange={f("eyebrow")} maxLength={60} className="c-input w-full" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Show from</span><input type="date" value={form.starts_on} onChange={f("starts_on")} className="c-input w-full" /></label>
              <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Until (blank = no end)</span><input type="date" value={form.ends_on} onChange={f("ends_on")} className="c-input w-full" /></label>
            </div>
            <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Headline (English) *</span><input value={form.title} onChange={f("title")} maxLength={140} className="c-input w-full" /></label>
            <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Headline (Swahili, optional)</span><input value={form.title_sw} onChange={f("title_sw")} maxLength={140} className="c-input w-full" /></label>
            <label className="block"><span className="block text-[12px] text-ink-muted mb-1">One supporting line (English)</span><textarea value={form.body} onChange={f("body")} maxLength={280} rows={2} className="c-input w-full !h-auto py-1.5" /></label>
            <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Supporting line (Swahili, optional)</span><textarea value={form.body_sw} onChange={f("body_sw")} maxLength={280} rows={2} className="c-input w-full !h-auto py-1.5" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Button text (English)</span><input value={form.cta_label} onChange={f("cta_label")} maxLength={40} className="c-input w-full" /></label>
              <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Button text (Swahili)</span><input value={form.cta_label_sw} onChange={f("cta_label_sw")} maxLength={40} className="c-input w-full" /></label>
            </div>
            <label className="block"><span className="block text-[12px] text-ink-muted mb-1">Button goes to (a page like /enquire?sector=FET, or https://…)</span><input value={form.cta_url} onChange={f("cta_url")} maxLength={500} className="c-input w-full" /></label>
            <div className="flex flex-wrap items-center gap-4 md:col-span-2">
              <span className="text-[12px] text-ink-muted">Show on</span>
              {PAGES.map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-[13px] text-ink">
                  <input type="checkbox" checked={form.pages.includes(v)} onChange={(e) => setForm({ ...form, pages: e.target.checked ? [...form.pages, v] : form.pages.filter((p) => p !== v) })} />{l}
                </label>
              ))}
              <label className="flex items-center gap-2 text-[13px] text-ink ml-auto"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />Switched on</label>
              <label className="flex items-center gap-2 text-[13px] text-ink">Priority<input type="number" min={0} max={100} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })} className="c-input w-20" /></label>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={save} disabled={saving} className="c-btn c-btn-primary">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save</button>
            <p className="text-xs text-ink-muted">If two are live on the same page, the higher priority shows. Only say what Vitorra offers and can stand behind.</p>
          </div>
          {msg && <p className="text-sm mt-2 text-alert-ink">{msg}</p>}
        </div>
      )}

      {rows === null ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : rows.length === 0 ? (
        <Empty label="No spotlights yet. Add one to put a current message on the homepage and the FET page." />
      ) : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table">
            <thead><tr><th>Status</th><th>Message</th><th>Pages</th><th>Dates</th><th className="text-right">Priority</th><th /></tr></thead>
            <tbody>
              {rows.map((s) => {
                const st = status(s);
                return (
                  <tr key={s.id}>
                    <td><span className="c-chip" data-tone={st.tone}>{st.label}</span></td>
                    <td className="max-w-[420px]">
                      {s.eyebrow && <span className="block text-[12px] text-gold-ink">{s.eyebrow}</span>}
                      <span className="block text-ink font-medium">{s.title}</span>
                      {s.body && <span className="block text-[12px] text-ink-muted truncate">{s.body}</span>}
                    </td>
                    <td className="whitespace-nowrap">{s.pages.map((p) => PAGES.find(([v]) => v === p)?.[1] ?? p).join(", ")}</td>
                    <td className="whitespace-nowrap">{s.starts_on ? day(s.starts_on) : "Now"} – {s.ends_on ? day(s.ends_on) : "no end"}</td>
                    <td className="text-right tabular-nums">{s.priority}</td>
                    <td className="text-right whitespace-nowrap">
                      <button onClick={() => open(s)} className="c-btn c-btn-ghost" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(s)} className="c-btn c-btn-ghost" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
