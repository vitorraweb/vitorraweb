"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";
import { TeamsJoinButton } from "@/components/teams/TeamsButtons";

/* ─── Meetings: Teams join links the team can open from the console + portal ─
   Staff paste the join link of a meeting they already created in Teams or
   Outlook; nothing here creates meetings or reads calendars. The server only
   accepts real Teams meeting links (https on a Teams host).               */

type Meeting = {
  id: number; title: string; starts_at: string; ends_at: string | null; join_url: string;
  notes: string | null; department: string | null; created_by: string | null; can_edit: boolean;
};

const DEPARTMENTS: Record<string, string> = {
  leadership: "Leadership", operations: "Operations", finance: "Finance", marketing: "Marketing", sales: "Sales", it: "IT",
};
const blank = { title: "", starts_at: "", ends_at: "", join_url: "", notes: "", department: "" };

/** ISO → value for <input type="datetime-local"> in the viewer's time zone. */
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function MeetingsPage() {
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");
  const [list, setList] = useState<Meeting[] | null>(null);
  const [form, setForm] = useState<typeof blank | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setList((await apiAdmin<{ data: Meeting[] }>(`/admin/meetings${when === "past" ? "?when=past" : ""}`)).data);
  }, [when]);
  useEffect(() => { load().catch(() => setList([])); }, [load]);

  const open = (m?: Meeting) => {
    setError(null);
    setEditing(m?.id ?? null);
    setForm(m ? { title: m.title, starts_at: toLocal(m.starts_at), ends_at: toLocal(m.ends_at), join_url: m.join_url, notes: m.notes ?? "", department: m.department ?? "" } : { ...blank });
  };

  const save = async () => {
    if (!form) return;
    setBusy(true); setError(null);
    const body = {
      ...form,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : "",
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      department: form.department || null,
      notes: form.notes || null,
    };
    try {
      await apiAdmin(editing ? `/admin/meetings/${editing}` : "/admin/meetings", { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) });
      setForm(null); setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  };

  const remove = async (m: Meeting) => {
    if (!window.confirm(`Remove "${m.title}"?`)) return;
    await apiAdmin(`/admin/meetings/${m.id}`, { method: "DELETE" });
    await load();
  };

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle="Teams meetings the team should know about. Paste the join link from Teams or Outlook — staff see it in their portal."
        actions={<button className="c-btn c-btn-primary" onClick={() => open()}><Plus className="w-4 h-4" />Add meeting</button>}
      />

      <div className="space-y-5 mt-5">
      {form && (
        <section className="c-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">{editing ? "Edit meeting" : "New meeting"}</h3>
            <button className="c-btn c-btn-ghost" onClick={() => setForm(null)} aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block md:col-span-2"><span className="block text-[13px] text-ink-muted mb-1">Title</span><input className="c-input w-full" value={form.title} onChange={set("title")} maxLength={200} /></label>
            <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Starts</span><input className="c-input w-full" type="datetime-local" value={form.starts_at} onChange={set("starts_at")} /></label>
            <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Ends (optional)</span><input className="c-input w-full" type="datetime-local" value={form.ends_at} onChange={set("ends_at")} /></label>
            <label className="block md:col-span-2"><span className="block text-[13px] text-ink-muted mb-1">Teams join link</span><input className="c-input w-full" value={form.join_url} onChange={set("join_url")} placeholder="https://teams.microsoft.com/l/meetup-join/…" /></label>
            <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Who can see it</span>
              <select className="c-select w-full" value={form.department} onChange={set("department")}>
                <option value="">Everyone on the team</option>
                {Object.entries(DEPARTMENTS).map(([k, v]) => <option key={k} value={k}>{v} only</option>)}
              </select>
            </label>
            <label className="block md:col-span-2"><span className="block text-[13px] text-ink-muted mb-1">Notes (optional)</span><textarea className="c-input w-full h-auto py-2" rows={2} value={form.notes} onChange={set("notes")} maxLength={2000} /></label>
          </div>
          {error && <p className="text-[13px] text-alert-ink">{error}</p>}
          <button className="c-btn c-btn-primary" onClick={save} disabled={busy || !form.title || !form.starts_at || !form.join_url}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
          </button>
        </section>
      )}

      <div className="o-seg">
        {(["upcoming", "past"] as const).map((w) => (
          <button key={w} aria-pressed={when === w} onClick={() => setWhen(w)}>{w === "upcoming" ? "Upcoming" : "Past"}</button>
        ))}
      </div>

      {list === null ? <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />
        : list.length === 0 ? <Empty label={when === "upcoming" ? "No upcoming meetings. Add one with its Teams join link." : "No past meetings."} />
        : (
          <div className="c-panel overflow-x-auto">
            <table className="c-table">
              <thead><tr><th>Meeting</th><th>When</th><th>For</th><th>Added by</th><th /></tr></thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id}>
                    <td><span className="block font-semibold text-ink">{m.title}</span>{m.notes && <span className="block text-[13px] text-ink-muted max-w-[24rem] truncate">{m.notes}</span>}</td>
                    <td className="whitespace-nowrap">{fmt(m.starts_at)}</td>
                    <td>{m.department ? DEPARTMENTS[m.department] ?? m.department : "Everyone"}</td>
                    <td className="text-ink-muted">{m.created_by ?? "—"}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <TeamsJoinButton url={m.join_url} title={m.title} />
                        {m.can_edit && <>
                          <button className="c-btn" onClick={() => open(m)}>Edit</button>
                          <button className="c-btn c-btn-ghost" onClick={() => remove(m)} aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
