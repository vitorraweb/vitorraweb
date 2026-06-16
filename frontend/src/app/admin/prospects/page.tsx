"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2, ChevronDown, Mail, Phone, MapPin, AlertTriangle, Upload,
  ChevronLeft, ChevronRight, UserCheck, Download, Send, X, ArrowRightCircle,
} from "lucide-react";
import { apiAdmin, uploadAdmin, downloadCsv } from "@/lib/auth";
import { PageHeader, Empty, type Paginated } from "@/components/admin/admin-ui";

type Prospect = {
  id: number; name: string; category: string; location: string | null;
  phone: string | null; email: string | null; outreach_status: string;
  feedback: string | null; follow_up: string | null; assigned_to: string | null;
  flags: string[] | null; source: string | null;
};
type Template = { id: number; name: string; subject: string; body: string; category: string | null };

const CATEGORIES: [string, string][] = [
  ["CARGO", "Cargo"], ["DISTRIBUTOR", "Distributors"], ["CONSTRUCTION", "Construction"],
  ["MANUFACTURING", "Manufacturing"], ["PUBLIC_TRANSPORT", "Public transport"], ["SCHOOL", "Schools"],
  ["FARMER", "Farmers"], ["SPARE_PARTS", "Spare parts & garages"], ["CAR_BOND", "Car bonds"],
  ["FUNERAL", "Funeral services"],
];
const CAT_LABEL = Object.fromEntries(CATEGORIES);

const STATUSES: [string, string][] = [
  ["not_contacted", "Not contacted"], ["contacted", "Contacted"], ["delivered", "Delivered"],
  ["bounced", "Bounced"], ["responded", "Responded"], ["qualified", "Qualified"],
  ["converted", "Converted"], ["not_interested", "Not interested"],
];
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  not_contacted:  { bg: "rgba(0,0,0,0.06)",         fg: "#777" },
  contacted:      { bg: "rgba(197,178,122,0.16)",   fg: "#7A6020" },
  delivered:      { bg: "rgba(59,130,246,0.12)",    fg: "#2563EB" },
  bounced:        { bg: "rgba(192,57,43,0.1)",      fg: "#C0392B" },
  responded:      { bg: "rgba(139,92,246,0.12)",    fg: "#7C3AED" },
  qualified:      { bg: "rgba(59,130,246,0.12)",    fg: "#2563EB" },
  converted:      { bg: "rgba(34,197,94,0.12)",     fg: "#16A34A" },
  not_interested: { bg: "rgba(0,0,0,0.06)",         fg: "#777" },
};
const ASSIGNEES = ["Thurayya Nakayima", "Sarah Nuwamanya", "Nagawa Shakirah", "John Oluwaseyi"];

export default function ProspectsPage() {
  const [list, setList]       = useState<Prospect[]>([]);
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [cat, setCat]         = useState("");
  const [status, setStatus]   = useState("");
  const [q, setQ]             = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage]       = useState(1);
  const [open, setOpen]       = useState<number | null>(null);

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Bulk email modal
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkSubject, setBulkSubject]     = useState("");
  const [bulkBody, setBulkBody]           = useState("");
  const [bulkSending, setBulkSending]     = useState(false);
  const [bulkResult, setBulkResult]       = useState<{ sent: number; skipped: number } | null>(null);
  const [templates, setTemplates]         = useState<Template[]>([]);
  const [templateOpen, setTemplateOpen]   = useState(false);

  // Per-prospect convert state
  const [converting, setConverting] = useState<number | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);

  // Import panel
  const [importOpen, setImportOpen] = useState(false);
  const [importCat, setImportCat]   = useState("CARGO");
  const [importing, setImporting]   = useState(false);
  const [importMsg, setImportMsg]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (cat) params.set("category", cat);
      if (status) params.set("status", status);
      if (appliedQ) params.set("q", appliedQ);
      params.set("page", String(page));
      const res = await apiAdmin<Paginated<Prospect>>(`/admin/prospects?${params.toString()}`);
      setList(res.data);
      setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [cat, status, appliedQ, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiAdmin<Template[]>("/admin/templates").then((r) => setTemplates(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const selCat    = (c: string) => { setLoading(true); setPage(1); setCat(c); setSelected(new Set()); };
  const selStatus = (s: string) => { setLoading(true); setPage(1); setStatus(s); setSelected(new Set()); };
  const search    = () => { setLoading(true); setPage(1); setAppliedQ(q.trim()); setSelected(new Set()); };
  const goPage    = (p: number) => { setLoading(true); setPage(p); setSelected(new Set()); };

  const patch = async (id: number, body: Record<string, unknown>) => {
    setList((l) => l.map((p) => (p.id === id ? { ...p, ...body } : p)));
    try { await apiAdmin(`/admin/prospects/${id}`, { method: "PATCH", body: JSON.stringify(body) }); }
    catch { load(); }
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const convertToEnquiry = async (id: number) => {
    setConverting(id);
    try {
      await apiAdmin(`/admin/prospects/${id}/convert`, { method: "POST" });
      setList((l) => l.map((p) => p.id === id ? { ...p, outreach_status: "converted" } : p));
    } catch { /* ignore */ }
    finally { setConverting(null); }
  };

  const sendBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkBody.trim()) return;
    setBulkSending(true); setBulkResult(null);
    try {
      const res = await apiAdmin<{ sent: number; skipped: number }>("/admin/prospects/bulk-email", {
        method: "POST",
        body: JSON.stringify({ ids: [...selected], subject: bulkSubject.trim(), body: bulkBody.trim() }),
      });
      setBulkResult(res);
      setList((l) => l.map((p) => selected.has(p.id) && p.outreach_status === "not_contacted" ? { ...p, outreach_status: "contacted" } : p));
    } catch { /* ignore */ }
    finally { setBulkSending(false); }
  };

  const closeBulkModal = () => {
    setBulkEmailOpen(false); setBulkSubject(""); setBulkBody(""); setBulkResult(null); setTemplateOpen(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try { await downloadCsv("/admin/prospects/export", `prospects-${new Date().toISOString().slice(0, 10)}.csv`); }
    catch { /* ignore */ }
    finally { setExporting(false); }
  };

  const doImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setImportMsg("Choose a CSV file first."); return; }
    setImporting(true); setImportMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", importCat);
      const res = await uploadAdmin<{ message: string }>("/admin/prospects/import", form);
      setImportMsg(res.message);
      if (fileRef.current) fileRef.current.value = "";
      setLoading(true); setPage(1); load();
    } catch (e) { setImportMsg(e instanceof Error ? e.message : "Upload failed."); }
    finally { setImporting(false); }
  };

  const selectedWithEmail = list.filter((p) => selected.has(p.id) && p.email).length;

  return (
    <div className="pb-24">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Prospects" subtitle="FET outreach database — segmented by industry." />
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
            style={{ background: "#F2F2F2", color: "#555" }}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export
          </button>
          <button onClick={() => setImportOpen((o) => !o)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "#1E1E1E", color: "#fff" }}>
            <Upload className="w-4 h-4" /> Import CSV
          </button>
        </div>
      </div>

      {/* Import panel */}
      {importOpen && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 mb-5">
          <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>Import a prospect list (CSV)</p>
          <p className="text-xs mb-4" style={{ color: "#888" }}>
            Columns matched by header: name, location, phone, email (status &amp; feedback optional). Duplicates are skipped.
            Tip: in Excel use <strong>Save As → CSV</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select value={importCat} onChange={(e) => setImportCat(e.target.value)} className="text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-sm" />
            <button onClick={doImport} disabled={importing} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: importing ? 0.7 : 1 }}>
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</> : "Upload"}
            </button>
          </div>
          {importMsg && <p className="text-sm mt-3" style={{ color: "#7A6020" }}>{importMsg}</p>}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip active={cat === ""} onClick={() => selCat("")}>All industries</Chip>
        {CATEGORIES.map(([v, l]) => <Chip key={v} active={cat === v} onClick={() => selCat(v)}>{l}</Chip>)}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Chip active={status === ""} onClick={() => selStatus("")}>All statuses</Chip>
        {STATUSES.map(([v, l]) => <Chip key={v} active={status === v} onClick={() => selStatus(v)}>{l}</Chip>)}
        <div className="flex items-center gap-2 ml-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="Search name, email, location…"
            className="text-sm rounded-full px-4 py-2 border w-64 max-w-full outline-none"
            style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}
          />
          <button onClick={search} className="text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>Search</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No prospects match these filters." />
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: "#999" }}>{meta.total} prospect{meta.total === 1 ? "" : "s"}</p>
          <div className="space-y-2.5">
            {list.map((p) => {
              const sc = STATUS_COLOR[p.outreach_status] ?? STATUS_COLOR.not_contacted;
              const isSelected = selected.has(p.id);
              return (
                <div key={p.id} className="bg-white rounded-[18px] border overflow-hidden" style={{ borderColor: isSelected ? "#C5B27A" : "rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center">
                    {/* Checkbox */}
                    <label className="flex items-center justify-center w-10 h-full cursor-pointer shrink-0 pl-3"
                      onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded accent-[#C5B27A]" />
                    </label>
                    <button onClick={() => setOpen(open === p.id ? null : p.id)} className="flex-1 flex items-center gap-3 p-4 text-left min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{p.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{CAT_LABEL[p.category] ?? p.category}</span>
                          {p.flags && p.flags.length > 0 && (
                            <span title={p.flags.join(", ")} className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#C0392B" }}>
                              <AlertTriangle className="w-3 h-3" />{p.flags.includes("no_contact") ? "no contact" : "check email"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: "#999" }}>
                          {[p.email, p.phone, p.location].filter(Boolean).join("  ·  ") || "—"}
                        </p>
                      </div>
                      {p.assigned_to && <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}><UserCheck className="w-3 h-3" />{p.assigned_to.split(" ")[0]}</span>}
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0" style={{ background: sc.bg, color: sc.fg }}>{p.outreach_status.replace(/_/g, " ")}</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === p.id ? "rotate-180" : ""}`} style={{ color: "#BBB" }} />
                    </button>
                  </div>

                  {open === p.id && (
                    <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 my-3 text-xs" style={{ color: "#555" }}>
                        {p.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{p.email}</a>}
                        {p.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{p.phone}</span>}
                        {p.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{p.location}</span>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <Labelled label="Outreach status">
                          <select value={p.outreach_status} onChange={(e) => patch(p.id, { outreach_status: e.target.value })} className="w-full text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}>
                            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </Labelled>
                        <Labelled label="Assigned to">
                          <select value={p.assigned_to ?? ""} onChange={(e) => patch(p.id, { assigned_to: e.target.value || null })} className="w-full text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}>
                            <option value="">— Unassigned —</option>
                            {p.assigned_to && !ASSIGNEES.includes(p.assigned_to) && <option value={p.assigned_to}>{p.assigned_to}</option>}
                            {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </Labelled>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <Labelled label="Feedback / notes">
                          <textarea defaultValue={p.feedback ?? ""} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== p.feedback) patch(p.id, { feedback: v }); }} placeholder="Call notes, response, next steps…" className="w-full text-sm rounded-xl px-3 py-2 border min-h-16" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                        </Labelled>
                        <Labelled label="Follow-up">
                          <input defaultValue={p.follow_up ?? ""} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== p.follow_up) patch(p.id, { follow_up: v }); }} placeholder="e.g. Call back next week" className="w-full text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                        </Labelled>
                      </div>

                      {/* Convert to enquiry */}
                      {p.outreach_status !== "converted" && (
                        <button onClick={() => convertToEnquiry(p.id)} disabled={converting === p.id}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
                          style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.25)" }}>
                          {converting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5" />}
                          Convert to enquiry
                        </button>
                      )}
                      {p.outreach_status === "converted" && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>
                          ✓ Converted to enquiry
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={meta.current_page <= 1} onClick={() => goPage(meta.current_page - 1)} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full disabled:opacity-40" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}><ChevronLeft className="w-4 h-4" />Prev</button>
              <span className="text-xs" style={{ color: "#777" }}>Page {meta.current_page} of {meta.last_page}</span>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => goPage(meta.current_page + 1)} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full disabled:opacity-40" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>Next<ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}

      {/* Sticky bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 px-6 py-4"
          style={{ background: "#1E1E1E", boxShadow: "0 -4px 24px rgba(0,0,0,0.18)" }}>
          <span className="text-sm font-semibold" style={{ color: "#fff" }}>{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setBulkEmailOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
              style={{ background: "#C5B27A", color: "#1E1E1E" }}>
              <Send className="w-3.5 h-3.5" />
              Bulk email ({selectedWithEmail} with email)
            </button>
            <button onClick={clearSelection}
              className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
              <X className="w-3.5 h-3.5" />Clear
            </button>
          </div>
        </div>
      )}

      {/* Bulk email modal */}
      {bulkEmailOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
              <div>
                <p className="font-semibold text-base" style={{ color: "#1E1E1E" }}>Bulk email</p>
                <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                  Sending to {selectedWithEmail} prospect{selectedWithEmail === 1 ? "" : "s"} with an email address
                </p>
              </div>
              <button onClick={closeBulkModal} className="p-1.5 rounded-full" style={{ background: "#F2F2F2" }}>
                <X className="w-4 h-4" style={{ color: "#777" }} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {/* Template picker */}
              {templates.length > 0 && (
                <div className="relative">
                  <button onClick={() => setTemplateOpen((o) => !o)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "#F2F2F2", color: "#555" }}>
                    Use template <ChevronDown className={`w-3 h-3 transition-transform ${templateOpen ? "rotate-180" : ""}`} />
                  </button>
                  {templateOpen && (
                    <div className="absolute left-0 top-full mt-1 z-10 rounded-xl border shadow-lg overflow-hidden w-72"
                      style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)" }}>
                      {templates.map((t) => (
                        <button key={t.id} onClick={() => { setBulkSubject(t.subject); setBulkBody(t.body); setTemplateOpen(false); }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-black/[0.03] transition-colors border-b last:border-0"
                          style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                          <p className="text-xs font-semibold" style={{ color: "#1E1E1E" }}>{t.name}</p>
                          <p className="text-[11px] truncate" style={{ color: "#999" }}>{t.subject}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] block mb-1" style={{ color: "#bbb" }}>Subject</label>
                <input value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)}
                  placeholder="Email subject…"
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] block mb-1" style={{ color: "#bbb" }}>Message</label>
                <textarea value={bulkBody} onChange={(e) => setBulkBody(e.target.value)}
                  placeholder="Hi {name}, …"
                  className="w-full text-sm rounded-xl px-3 py-2 border min-h-32 outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
              </div>

              {bulkResult && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>
                  Sent to {bulkResult.sent} prospect{bulkResult.sent === 1 ? "" : "s"}.
                  {bulkResult.skipped > 0 && ` ${bulkResult.skipped} skipped (no email).`}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 pb-5">
              <button onClick={closeBulkModal} className="text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
                {bulkResult ? "Close" : "Cancel"}
              </button>
              {!bulkResult && (
                <button onClick={sendBulkEmail} disabled={bulkSending || !bulkSubject.trim() || !bulkBody.trim()}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
                  style={{ background: "#C5B27A", color: "#1E1E1E" }}>
                  {bulkSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Send emails
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold px-3.5 py-2 rounded-full transition-colors" style={{ background: active ? "#1E1E1E" : "#FFFFFF", color: active ? "#FFFFFF" : "#777777", border: "1px solid rgba(0,0,0,0.06)" }}>
      {children}
    </button>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#999" }}>{label}</p>
      {children}
    </div>
  );
}
