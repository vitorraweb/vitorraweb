"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CalendarDays, AlertTriangle, Check, X, Plus, Upload } from "lucide-react";
import { apiStaff, uploadStaff, staffAuth } from "@/lib/staff-auth";

type Leave = {
  id: number; type: string; start_date: string; end_date: string; working_days: number;
  reason: string | null; status: string; has_document: boolean; review_comment: string | null;
  reviewed_at: string | null; created_at: string;
  user?: { id: number; name: string; department: string | null };
  /* Leave needs two signatures — Operations and Finance. `approvals` is what has
     been collected so far, `awaiting` who is still owed one. */
  approvals: { stage: string; label: string; by: string | null; decision: string; at: string | null }[];
  awaiting: string[];
  can_decide: boolean;
};
type Balance = { entitlement: number; used: number; remaining: number; year: number };

const TYPE_LABEL: Record<string, string> = {
  annual: "Annual leave", sick: "Sick leave", unpaid: "Unpaid leave",
  compassionate: "Compassionate", maternity: "Maternity",
};
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  approved:  { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  declined:  { bg: "rgba(192,57,43,0.1)", fg: "#C0392B" },
  cancelled: { bg: "rgba(0,0,0,0.06)", fg: "#777" },
};

export default function StaffLeavePage() {
  const role = staffAuth.getUser()?.role;
  const [mine, setMine] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [pending, setPending] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply form
  const [type, setType] = useState("annual");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ working_days: number; warnings: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([
        apiStaff<{ data: Leave[]; balance: Balance; types: string[] }>("/staff/leave"),
        apiStaff<{ data: Leave[] }>("/staff/leave/pending").catch(() => ({ data: [] as Leave[] })),
      ]);
      setMine(m.data); setBalance(m.balance); setTypes(m.types);
      setPending(p.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live working-day preview + warnings.
  useEffect(() => {
    if (!start || !end || end < start) { setPreview(null); return; }
    const id = setTimeout(() => {
      const params = new URLSearchParams({ type, start_date: start, end_date: end });
      apiStaff<{ working_days: number; warnings: string[] }>(`/staff/leave/preview?${params}`)
        .then(setPreview).catch(() => setPreview(null));
    }, 350);
    return () => clearTimeout(id);
  }, [type, start, end]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    if (!start || !end) { setFormMsg("Choose start and end dates."); return; }
    if (end < start) { setFormMsg("End date can't be before the start date."); return; }
    if (type === "sick" && !file) { setFormMsg("A medical document is required for sick leave."); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("type", type); form.append("start_date", start); form.append("end_date", end);
      if (reason.trim()) form.append("reason", reason.trim());
      if (file) form.append("document", file);
      await uploadStaff("/staff/leave", form);
      setType("annual"); setStart(""); setEnd(""); setReason(""); setFile(null); setPreview(null);
      setFormMsg("");
      load();
    } catch (err) { setFormMsg(err instanceof Error ? err.message : "Could not submit."); }
    finally { setSubmitting(false); }
  };

  const cancel = async (id: number) => {
    if (!confirm("Cancel this leave request?")) return;
    try { await apiStaff(`/staff/leave/${id}/cancel`, { method: "POST" }); load(); } catch { /* */ }
  };

  const decide = async (id: number, status: "approved" | "declined") => {
    const comment = status === "declined" ? (prompt("Reason for declining (optional):") ?? "") : "";
    try { await apiStaff(`/staff/leave/${id}/decision`, { method: "POST", body: JSON.stringify({ status, comment }) }); load(); } catch { /* */ }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  const canReview = role === "admin" || role === "ops" || pending.length > 0;

  return (
    <div className="max-w-3xl pb-16">
      <h2 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#1E1E1E" }}>Leave</h2>
      <p className="text-sm mb-6" style={{ color: "#999" }}>Apply for time off and track your requests.</p>

      {/* Balance */}
      {balance && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label={`Annual ${balance.year}`} value={`${balance.entitlement} days`} />
          <Stat label="Used / booked" value={`${balance.used} days`} />
          <Stat label="Remaining" value={`${balance.remaining} days`} highlight />
        </div>
      )}

      {/* Apply */}
      <form onSubmit={submit} className="bg-white rounded-[20px] border border-black/[0.06] p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4" style={{ color: "#C5B27A" }} />
          <h3 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "#1E1E1E" }}>Apply for leave</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls} style={inputStyle}>
              {(types.length ? types : ["annual"]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
            </select>
          </Field>
          <Field label="Working days">
            <div className="h-[42px] flex items-center px-3.5 rounded-xl border text-sm" style={{ ...inputStyle, color: preview ? "#1E1E1E" : "#bbb" }}>
              {preview ? `${preview.working_days} day${preview.working_days === 1 ? "" : "s"}` : "—"}
            </div>
          </Field>
          <Field label="Start date"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="End date"><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>
        <div className="mt-3">
          <Field label="Reason (optional)"><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={inputCls} style={inputStyle} placeholder="Anything your supervisor should know…" /></Field>
        </div>
        {type === "sick" && (
          <div className="mt-3">
            <Field label="Medical document (required)">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
            </Field>
          </div>
        )}

        {preview && preview.warnings.length > 0 && (
          <div className="mt-4 rounded-xl px-4 py-3 space-y-1" style={{ background: "rgba(192,57,43,0.07)" }}>
            {preview.warnings.map((w, i) => (
              <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "#C0392B" }}><AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />{w}</p>
            ))}
          </div>
        )}
        {formMsg && <p className="text-sm mt-3" style={{ color: "#C0392B" }}>{formMsg}</p>}

        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50" style={{ background: "#1E1E1E", color: "#fff" }}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Submit request
        </button>
      </form>

      {/* Approvals (supervisors / HR) */}
      {canReview && (
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] mb-3" style={{ color: "#1E1E1E" }}>Pending approvals</h3>
          {pending.length === 0 ? (
            <p className="text-sm" style={{ color: "#999" }}>Nothing awaiting your review.</p>
          ) : (
            <div className="space-y-2.5">
              {pending.map((l) => (
                <div key={l.id} className="bg-white rounded-[16px] border border-black/[0.06] p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{l.user?.name ?? "Staff"} · {TYPE_LABEL[l.type] ?? l.type}</p>
                      <p className="text-xs" style={{ color: "#999" }}>{fmt(l.start_date)} → {fmt(l.end_date)} · {l.working_days} day{l.working_days === 1 ? "" : "s"}</p>
                      {l.reason && <p className="text-xs mt-1" style={{ color: "#777" }}>{l.reason}</p>}
                      {l.approvals?.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: "#777" }}>
                          {l.approvals.map((a) => `${a.label} ${a.decision}${a.by ? ` — ${a.by}` : ""}`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => decide(l.id, "approved")} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}><Check className="w-3.5 h-3.5" />Approve</button>
                      <button onClick={() => decide(l.id, "declined")} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><X className="w-3.5 h-3.5" />Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My history */}
      <h3 className="text-sm font-bold uppercase tracking-[0.08em] mb-3" style={{ color: "#1E1E1E" }}>My requests</h3>
      {mine.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-8 text-center">
          <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: "#ddd" }} />
          <p className="text-sm" style={{ color: "#999" }}>No leave requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {mine.map((l) => {
            const sc = STATUS_STYLE[l.status] ?? STATUS_STYLE.pending;
            return (
              <div key={l.id} className="bg-white rounded-[16px] border border-black/[0.06] p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{TYPE_LABEL[l.type] ?? l.type}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{l.status}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#999" }}>{fmt(l.start_date)} → {fmt(l.end_date)} · {l.working_days} day{l.working_days === 1 ? "" : "s"}</p>
                  {l.review_comment && <p className="text-xs mt-1" style={{ color: "#777" }}>Note: {l.review_comment}</p>}
                  {l.status === "pending" && (l.approvals?.length > 0 || l.awaiting?.length > 0) && (
                    <p className="text-xs mt-1" style={{ color: "#777" }}>
                      {[
                        ...(l.approvals ?? []).map((a) => `${a.label} ${a.decision}`),
                        ...((l.awaiting ?? []).length ? [`awaiting ${l.awaiting.join(" + ")}`] : []),
                      ].join(" · ")}
                    </p>
                  )}
                </div>
                {(l.status === "pending" || l.status === "approved") && (
                  <button onClick={() => cancel(l.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0" style={{ background: "#F2F2F2", color: "#777" }}>Cancel</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none focus:border-[#C5B27A]";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-[18px] border p-4" style={{ borderColor: highlight ? "#C5B27A" : "rgba(0,0,0,0.06)" }}>
      <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "#bbb" }}>{label}</p>
      <p className="text-base font-semibold" style={{ color: highlight ? "#7A6020" : "#1E1E1E" }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "#999" }}>{label}</label>
      {children}
    </div>
  );
}

function fmt(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
