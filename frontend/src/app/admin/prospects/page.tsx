"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, ChevronDown, Mail, Phone, MapPin, AlertTriangle, Upload, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import { apiAdmin, uploadAdmin } from "@/lib/auth";
import { PageHeader, Empty, type Paginated } from "@/components/admin/admin-ui";

type Prospect = {
  id: number; name: string; category: string; location: string | null;
  phone: string | null; email: string | null; outreach_status: string;
  feedback: string | null; follow_up: string | null; assigned_to: string | null;
  flags: string[] | null; source: string | null;
};

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
  not_contacted: { bg: "rgba(0,0,0,0.06)", fg: "#777" },
  contacted:     { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  delivered:     { bg: "rgba(59,130,246,0.12)", fg: "#2563EB" },
  bounced:       { bg: "rgba(192,57,43,0.1)", fg: "#C0392B" },
  responded:     { bg: "rgba(139,92,246,0.12)", fg: "#7C3AED" },
  qualified:     { bg: "rgba(59,130,246,0.12)", fg: "#2563EB" },
  converted:     { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  not_interested:{ bg: "rgba(0,0,0,0.06)", fg: "#777" },
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

  const selCat    = (c: string) => { setLoading(true); setPage(1); setCat(c); };
  const selStatus = (s: string) => { setLoading(true); setPage(1); setStatus(s); };
  const search    = () => { setLoading(true); setPage(1); setAppliedQ(q.trim()); };
  const goPage    = (p: number) => { setLoading(true); setPage(p); };

  const patch = async (id: number, body: Record<string, unknown>) => {
    setList((l) => l.map((p) => (p.id === id ? { ...p, ...body } : p)));
    try { await apiAdmin(`/admin/prospects/${id}`, { method: "PATCH", body: JSON.stringify(body) }); }
    catch { load(); }
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

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Prospects" subtitle="FET outreach database — segmented by industry." />
        <button
          onClick={() => setImportOpen((o) => !o)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "#1E1E1E", color: "#fff" }}
        >
          <Upload className="w-4 h-4" /> Import CSV
        </button>
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
              return (
                <div key={p.id} className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
                  <button onClick={() => setOpen(open === p.id ? null : p.id)} className="w-full flex items-center gap-3 p-4 text-left">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Labelled label="Feedback / notes">
                          <textarea defaultValue={p.feedback ?? ""} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== p.feedback) patch(p.id, { feedback: v }); }} placeholder="Call notes, response, next steps…" className="w-full text-sm rounded-xl px-3 py-2 border min-h-16" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                        </Labelled>
                        <Labelled label="Follow-up">
                          <input defaultValue={p.follow_up ?? ""} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== p.follow_up) patch(p.id, { follow_up: v }); }} placeholder="e.g. Call back next week" className="w-full text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                        </Labelled>
                      </div>
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
