"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, X, Check, Save, Send, Star, ClipboardCheck } from "lucide-react";
import { apiStaff, staffAuth } from "@/lib/staff-auth";

type Item = { label: string; done: boolean; note: string };
type Report = {
  id: number; period: string; items: Item[]; summary: string | null; status: string;
  submitted_at: string | null; supervisor_comment: string | null; rating: number | null; reviewed_at: string | null;
  user?: { id: number; name: string; department: string | null };
};

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  draft:     { bg: "var(--o-hover)", fg: "var(--o-muted)" },
  submitted: { bg: "rgba(197,178,122,0.16)", fg: "var(--o-accent-text)" },
  reviewed:  { bg: "rgba(34,197,94,0.12)", fg: "var(--o-success)" },
};

/** Last 6 month-period options (YYYY-MM), newest first. */
function recentPeriods(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) { out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); d.setMonth(d.getMonth() - 1); }
  return out;
}
function periodLabel(p: string): string {
  const [y, m] = p.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function StaffReportsPage() {
  const role = staffAuth.getUser()?.role;
  const [reports, setReports] = useState<Report[]>([]);
  const [team, setTeam] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState(recentPeriods()[0]);
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState("");
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [mine, t] = await Promise.all([
        apiStaff<{ data: Report[]; current_period: string }>("/staff/reports"),
        apiStaff<{ data: Report[] }>("/staff/reports/team").catch(() => ({ data: [] as Report[] })),
      ]);
      setReports(mine.data); setTeam(t.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load the selected period's report into the editor (or a blank draft).
  useEffect(() => {
    const existing = reports.find((r) => r.period === period);
    setItems(existing?.items?.length ? existing.items : []);
    setSummary(existing?.summary ?? "");
    setLocked(existing?.status === "reviewed");
    setMsg("");
  }, [period, reports]);

  const current = reports.find((r) => r.period === period);

  const addItem = () => setItems((x) => [...x, { label: "", done: false, note: "" }]);
  const setItem = (i: number, patch: Partial<Item>) => setItems((x) => x.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems((x) => x.filter((_, j) => j !== i));

  const save = async (status: "draft" | "submitted") => {
    setSaving(true); setMsg("");
    try {
      const clean = items.filter((it) => it.label.trim());
      await apiStaff("/staff/reports", { method: "POST", body: JSON.stringify({ period, items: clean, summary: summary.trim() || null, status }) });
      setMsg(status === "submitted" ? "Submitted to your supervisor." : "Draft saved.");
      load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Save failed."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "var(--o-muted)" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  const canReview = role === "admin" || role === "ops" || team.length > 0;

  return (
    <div className="max-w-3xl pb-16">
      <h2 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "var(--o-text)" }}>My reports</h2>
      <p className="text-sm mb-6" style={{ color: "var(--o-faint)" }}>Record what you did each month so your supervisor stays in the loop.</p>

      {/* Editor */}
      <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" style={{ color: "#C5B27A" }} />
            <h3 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "var(--o-text)" }}>Monthly report</h3>
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm rounded-xl px-3 py-1.5 border" style={inputStyle}>
            {recentPeriods().map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
          </select>
        </div>

        {current && (() => { const sc = STATUS_STYLE[current.status] ?? STATUS_STYLE.draft; return (
          <div className="mb-3"><span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{current.status}</span></div>
        ); })()}

        {locked && current ? (
          <div className="rounded-xl p-4" style={{ background: "var(--o-surface-2)" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--o-text)" }}>This report has been reviewed.</p>
            {current.rating != null && <Stars rating={current.rating} />}
            {current.supervisor_comment && <p className="text-sm mt-2" style={{ color: "var(--o-text-2)" }}>{current.supervisor_comment}</p>}
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "var(--o-faint)" }}>What you worked on</p>
            <div className="space-y-2 mb-3">
              {items.map((it, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl p-2" style={{ background: "var(--o-surface-2)" }}>
                  <button onClick={() => setItem(i, { done: !it.done })} className="mt-1.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center" style={{ background: it.done ? "var(--o-success)" : "#fff", border: "1px solid rgba(0,0,0,0.15)" }}>
                    {it.done && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-1">
                    <input value={it.label} onChange={(e) => setItem(i, { label: e.target.value })} placeholder="Task or deliverable…" className="w-full text-sm rounded-lg px-2.5 py-1.5 border" style={inputStyle} />
                    <input value={it.note} onChange={(e) => setItem(i, { note: e.target.value })} placeholder="Note (optional)" className="w-full text-xs rounded-lg px-2.5 py-1.5 border" style={inputStyle} />
                  </div>
                  <button onClick={() => removeItem(i)} className="mt-1 shrink-0 p-1.5 rounded-lg" style={{ background: "rgba(192,57,43,0.08)", color: "var(--o-danger)" }}><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--o-surface-2)", color: "var(--o-text-2)" }}><Plus className="w-3.5 h-3.5" />Add item</button>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--o-faint)" }}>Summary</p>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Overall progress, blockers, plans for next month…" className="w-full text-sm rounded-xl px-3 py-2 border outline-none focus:border-[#C5B27A]" style={inputStyle} />

            {msg && <p className="text-sm mt-3" style={{ color: /fail|lock/i.test(msg) ? "var(--o-danger)" : "var(--o-success)" }}>{msg}</p>}
            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => save("draft")} disabled={saving} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50" style={{ background: "var(--o-surface-2)", color: "var(--o-text-2)" }}><Save className="w-4 h-4" />Save draft</button>
              <button onClick={() => save("submitted")} disabled={saving} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50" style={{ background: "var(--o-brand)", color: "var(--o-on-brand)" }}><Send className="w-4 h-4" />Submit</button>
            </div>
          </>
        )}
      </div>

      {/* Team review */}
      {canReview && <TeamReview reports={team} onReviewed={load} />}
    </div>
  );
}

function TeamReview({ reports, onReviewed }: { reports: Report[]; onReviewed: () => void }) {
  const submitted = reports.filter((r) => r.status === "submitted");
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.08em] mb-3" style={{ color: "var(--o-text)" }}>Team reports to review</h3>
      {submitted.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--o-faint)" }}>Nothing awaiting your review.</p>
      ) : (
        <div className="space-y-2.5">
          {submitted.map((r) => <ReviewCard key={r.id} report={r} onReviewed={onReviewed} />)}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ report, onReviewed }: { report: Report; onReviewed: () => void }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await apiStaff(`/staff/reports/${report.id}/review`, { method: "POST", body: JSON.stringify({ supervisor_comment: comment.trim() || null, rating: rating || null }) });
      onReviewed();
    } catch { /* */ }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[16px] border border-black/[0.06] p-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left">
        <p className="text-sm font-semibold" style={{ color: "var(--o-text)" }}>{report.user?.name ?? "Staff"} · {periodLabel(report.period)}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--o-faint)" }}>{(report.items ?? []).length} item{(report.items ?? []).length === 1 ? "" : "s"} · tap to {open ? "hide" : "review"}</p>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--o-line)" }}>
          <ul className="space-y-1.5 mb-3">
            {(report.items ?? []).map((it, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--o-text-2)" }}>
                <span className="mt-0.5">{it.done ? "✅" : "⬜"}</span>
                <span><strong>{it.label}</strong>{it.note ? ` — ${it.note}` : ""}</span>
              </li>
            ))}
          </ul>
          {report.summary && <p className="text-sm mb-3" style={{ color: "var(--o-text-2)" }}>{report.summary}</p>}

          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}><Star className="w-5 h-5" style={{ color: n <= rating ? "#C5B27A" : "var(--o-line-strong)", fill: n <= rating ? "#C5B27A" : "none" }} /></button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Feedback for the team member…" className="w-full text-sm rounded-xl px-3 py-2 border outline-none focus:border-[#C5B27A] mb-2" style={inputStyle} />
          <button onClick={submit} disabled={saving} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50" style={{ background: "var(--o-brand)", color: "var(--o-on-brand)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Mark reviewed
          </button>
        </div>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className="w-4 h-4" style={{ color: n <= rating ? "#C5B27A" : "var(--o-line-strong)", fill: n <= rating ? "#C5B27A" : "none" }} />)}
    </div>
  );
}

const inputStyle = { borderColor: "var(--o-line-strong)", background: "var(--o-surface)", color: "var(--o-text)" } as const;
