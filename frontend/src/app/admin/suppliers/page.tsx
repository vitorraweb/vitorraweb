"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ChevronDown, Download, Check, X, HelpCircle, UserCheck, Landmark } from "lucide-react";
import { apiAdmin, downloadFile } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

type Assignee = { id: number; name: string; department: string | null };
type ListItem = {
  id: number; company_name: string; contact_name: string | null; email: string; phone: string | null;
  country: string | null; category: string | null; status: string; documents_count: number;
  reviewed_at: string | null; created_at: string;
};
type Bank = { bank_name: string | null; account_name: string | null; account_number: string | null; branch: string | null; swift: string | null };
type Doc = { id: number; type: string; title: string; original_name: string | null; size: number | null; created_at: string };
type Detail = ListItem & { address: string | null; description: string | null; review_note: string | null; bank: Bank; documents: Doc[] };

const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  pending:        { bg: "rgba(197,178,122,0.16)", fg: "#7A6020", label: "Pending" },
  approved:       { bg: "rgba(34,197,94,0.12)", fg: "#16A34A", label: "Approved" },
  rejected:       { bg: "rgba(192,57,43,0.1)", fg: "#C0392B", label: "Rejected" },
  info_requested: { bg: "rgba(59,130,246,0.12)", fg: "#2563EB", label: "Info requested" },
};

export default function AdminSuppliersPage() {
  const [list, setList] = useState<ListItem[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const r = await apiAdmin<{ data: ListItem[]; statuses: string[]; assignees: Assignee[] }>(`/admin/suppliers?${params}`);
      setList(r.data); setStatuses(r.statuses); setAssignees(r.assignees);
    } catch { setList([]); } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const expand = async (id: number) => {
    setMsg("");
    if (open === id) { setOpen(null); setDetail(null); return; }
    setOpen(id); setDetail(null);
    try { const r = await apiAdmin<{ data: Detail }>(`/admin/suppliers/${id}`); setDetail(r.data); } catch { /* */ }
  };

  const setStatusFor = async (id: number, newStatus: string) => {
    const note = newStatus === "rejected" || newStatus === "info_requested" ? (prompt("Note for this decision (optional):") ?? "") : "";
    try {
      await apiAdmin(`/admin/suppliers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus, review_note: note }) });
      setList((l) => l.map((s) => s.id === id ? { ...s, status: newStatus } : s));
      if (detail?.id === id) setDetail({ ...detail, status: newStatus, review_note: note || detail.review_note });
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  const assign = async (id: number, userId: string) => {
    if (!userId) return;
    try { const r = await apiAdmin<{ message: string }>(`/admin/suppliers/${id}/assign`, { method: "POST", body: JSON.stringify({ user_id: Number(userId) }) }); setMsg(r.message); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };

  const doc = async (d: Doc) => { try { await downloadFile(`/admin/supplier-documents/${d.id}/download`, d.original_name ?? d.title); } catch { /* */ } };

  return (
    <div className="pb-12">
      <PageHeader title="Suppliers" subtitle="Review supplier applications, verify documents and bank details, then approve or assign an approver." />

      <div className="flex flex-wrap gap-2 mb-5">
        {[["", "All"], ...(statuses.length ? statuses : ["pending"]).map((s) => [s, STATUS[s]?.label ?? s])].map(([v, label]) => (
          <button key={v} onClick={() => setStatus(v)} className="text-xs font-semibold px-3.5 py-2 rounded-full" style={status === v ? { background: "#1E1E1E", color: "#fff" } : { background: "#fff", color: "#777", border: "1px solid rgba(0,0,0,0.06)" }}>{label}</button>
        ))}
      </div>
      {msg && <p className="text-sm mb-3" style={{ color: "#7A6020" }}>{msg}</p>}

      {loading ? <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      : list.length === 0 ? <Empty label="No suppliers in this view." /> : (
        <div className="space-y-2.5">
          {list.map((s) => {
            const sc = STATUS[s.status] ?? STATUS.pending;
            return (
              <div key={s.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
                <button onClick={() => expand(s.id)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{s.company_name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{sc.label}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#999" }}>{[s.category, s.email, `${s.documents_count} doc${s.documents_count === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === s.id ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
                </button>

                {open === s.id && (
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    {!detail || detail.id !== s.id ? (
                      <div className="flex items-center gap-2 text-sm py-3" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 my-3 text-xs" style={{ color: "#555" }}>
                          {detail.contact_name && <span>{detail.contact_name}</span>}
                          {detail.phone && <span>📞 {detail.phone}</span>}
                          {detail.country && <span>🌍 {detail.country}</span>}
                          {detail.address && <span>📍 {detail.address}</span>}
                        </div>
                        {detail.description && <p className="text-sm mb-3" style={{ color: "#454545" }}>{detail.description}</p>}

                        {/* Bank details */}
                        <div className="rounded-xl p-4 mb-3" style={{ background: "#FAFAF8" }}>
                          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#7A6020" }}><Landmark className="w-3.5 h-3.5" />Bank details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm" style={{ color: "#454545" }}>
                            <span><strong>Bank:</strong> {detail.bank.bank_name || "—"}</span>
                            <span><strong>Account name:</strong> {detail.bank.account_name || "—"}</span>
                            <span><strong>Account no.:</strong> {detail.bank.account_number || "—"}</span>
                            <span><strong>Branch:</strong> {detail.bank.branch || "—"}</span>
                            {detail.bank.swift && <span><strong>SWIFT:</strong> {detail.bank.swift}</span>}
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="mb-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#bbb" }}>Documents</p>
                          {detail.documents.length === 0 ? <p className="text-xs" style={{ color: "#bbb" }}>None provided.</p> : (
                            <div className="space-y-1.5">
                              {detail.documents.map((d) => (
                                <button key={d.id} onClick={() => doc(d)} className="flex items-center gap-2 text-sm w-full text-left rounded-lg px-3 py-2" style={{ background: "#F7F7F5", color: "#454545" }}>
                                  <Download className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} /><span className="truncate">{d.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {detail.review_note && <p className="text-xs mb-3" style={{ color: "#777" }}>Note: {detail.review_note}</p>}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <button onClick={() => setStatusFor(s.id, "approved")} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}><Check className="w-3.5 h-3.5" />Approve</button>
                          <button onClick={() => setStatusFor(s.id, "info_requested")} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "rgba(59,130,246,0.12)", color: "#2563EB" }}><HelpCircle className="w-3.5 h-3.5" />Request info</button>
                          <button onClick={() => setStatusFor(s.id, "rejected")} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><X className="w-3.5 h-3.5" />Reject</button>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#777" }}><UserCheck className="w-3.5 h-3.5" />Assign approver</span>
                          <select onChange={(e) => { assign(s.id, e.target.value); e.target.value = ""; }} defaultValue="" className="text-sm rounded-xl px-3 py-1.5 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}>
                            <option value="" disabled>Choose someone…</option>
                            {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}
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
