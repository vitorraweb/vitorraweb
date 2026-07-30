"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2, ChevronDown, Mail, Phone, MapPin, AlertTriangle, Upload,
  ChevronLeft, ChevronRight, UserCheck, Download, Send, X, ArrowRightCircle,
  Paperclip, Save, CheckCircle2,
} from "lucide-react";
import { apiAdmin, uploadAdmin, downloadCsv } from "@/lib/auth";
import { PageHeader, Empty, type Paginated } from "@/components/admin/admin-ui";

type Prospect = {
  id: number; name: string; category: string; product: string; location: string | null;
  phone: string | null; email: string | null; outreach_status: string;
  feedback: string | null; follow_up: string | null; assigned_to: string | null;
  flags: string[] | null; source: string | null;
};
type Template = { id: number; name: string; subject: string; body: string; category: string | null };
type Campaign = {
  id: number; subject: string; status: string; product: string | null;
  total: number; sent_count: number; failed_count: number;
  pending: number; skipped: number; duplicate: number;
  attachments: { name: string; size: number | null }[];
};

/** Product lines with their own prospect list. Mirrors Prospect::PRODUCTS. */
const PRODUCTS: [string, string][] = [["FET", "Fuel Eco Tech"], ["SEAL", "SEAL Wound Spray"]];

/** Industry verticals per product. Mirrors Prospect::CATEGORIES_BY_PRODUCT. */
const CATEGORIES_BY_PRODUCT: Record<string, [string, string][]> = {
  FET: [
    ["CARGO", "Cargo"], ["DISTRIBUTOR", "Distributors"], ["CONSTRUCTION", "Construction"],
    ["MANUFACTURING", "Manufacturing"], ["PUBLIC_TRANSPORT", "Public transport"], ["SCHOOL", "Schools"],
    ["FARMER", "Farmers"], ["SPARE_PARTS", "Spare parts & garages"], ["CAR_BOND", "Car bonds"],
    ["FUNERAL", "Funeral services"],
  ],
  SEAL: [
    ["HOSPITAL", "Hospitals"], ["PHARMACY", "Pharmacies"], ["FIRST_RESPONDER", "First responders"],
    ["MANUFACTURING", "Manufacturing"], ["MINING_QUARRY", "Mines & quarries"],
    ["SPORTS_ASSOCIATION", "Sports associations"], ["BODA_BODA", "Boda bodas"],
    ["BIKER_ASSOCIATION", "Biker associations"], ["TRAVEL_COMPANY", "Travel companies"],
  ],
};

/** De-duplicated union, for the "all products" view. */
const ALL_CATEGORIES: [string, string][] = Object.values(CATEGORIES_BY_PRODUCT)
  .flat()
  .filter((c, i, a) => a.findIndex((x) => x[0] === c[0]) === i);

const CAT_LABEL = Object.fromEntries(ALL_CATEGORIES);

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

const MAX_FILES = 5;
const MAX_FILE_MB = 8;

const fmtSize = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function ProspectsPage() {
  const [list, setList]       = useState<Prospect[]>([]);
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState("");
  const [cat, setCat]         = useState("");
  const [status, setStatus]   = useState("");
  const [q, setQ]             = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage]       = useState(1);
  const [open, setOpen]       = useState<number | null>(null);

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Campaign composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [subject, setSubject]           = useState("");
  const [body, setBody]                 = useState("");
  const [files, setFiles]               = useState<File[]>([]);
  const [fileError, setFileError]       = useState("");
  const [sending, setSending]           = useState(false);
  const [sendError, setSendError]       = useState("");
  const [campaign, setCampaign]         = useState<Campaign | null>(null);
  const [templates, setTemplates]       = useState<Template[]>([]);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [tplName, setTplName]           = useState("");
  const [tplSaving, setTplSaving]       = useState(false);
  const [tplSaved, setTplSaved]         = useState(false);
  const attachRef = useRef<HTMLInputElement>(null);

  // Per-prospect convert state
  const [converting, setConverting] = useState<number | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);

  // Import panel
  const [importOpen, setImportOpen]       = useState(false);
  const [importProduct, setImportProduct] = useState("FET");
  const [importCat, setImportCat]         = useState("CARGO");
  const [importing, setImporting]         = useState(false);
  const [importMsg, setImportMsg]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = product ? CATEGORIES_BY_PRODUCT[product] : ALL_CATEGORIES;
  const importCategories = CATEGORIES_BY_PRODUCT[importProduct] ?? ALL_CATEGORIES;

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (product) params.set("product", product);
      if (cat) params.set("category", cat);
      if (status) params.set("status", status);
      if (appliedQ) params.set("q", appliedQ);
      params.set("page", String(page));
      const res = await apiAdmin<Paginated<Prospect>>(`/admin/prospects?${params.toString()}`);
      setList(res.data);
      setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [product, cat, status, appliedQ, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiAdmin<Template[]>("/admin/templates").then((r) => setTemplates(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const reset = () => { setLoading(true); setPage(1); setSelected(new Set()); };

  /** Switching product clears a vertical that doesn't exist on the new list. */
  const selProduct = (p: string) => {
    reset();
    setProduct(p);
    const valid = (p ? CATEGORIES_BY_PRODUCT[p] : ALL_CATEGORIES).some(([v]) => v === cat);
    if (!valid) setCat("");
  };
  const selCat    = (c: string) => { reset(); setCat(c); };
  const selStatus = (s: string) => { reset(); setStatus(s); };
  const search    = () => { reset(); setAppliedQ(q.trim()); };
  const goPage    = (p: number) => { setLoading(true); setPage(p); setSelected(new Set()); };

  const selImportProduct = (p: string) => {
    setImportProduct(p);
    setImportCat((CATEGORIES_BY_PRODUCT[p] ?? ALL_CATEGORIES)[0][0]);
  };

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

  const selectAllOnPage = () => {
    const allSelected = list.every((p) => selected.has(p.id));
    setSelected(allSelected ? new Set() : new Set(list.map((p) => p.id)));
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

  const addFiles = (picked: FileList | null) => {
    if (!picked?.length) return;
    setFileError("");
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (next.length >= MAX_FILES) { setFileError(`You can attach at most ${MAX_FILES} files.`); break; }
      if (f.size > MAX_FILE_MB * 1_048_576) { setFileError(`"${f.name}" is over ${MAX_FILE_MB} MB.`); continue; }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      next.push(f);
    }
    setFiles(next);
    if (attachRef.current) attachRef.current.value = "";
  };

  const removeFile = (name: string, size: number) => {
    setFiles((f) => f.filter((x) => !(x.name === name && x.size === size)));
    setFileError("");
  };

  /**
   * Create the campaign, then keep asking the server to send the next batch
   * until it's done. The scheduler does the same job every minute, so closing
   * this screen mid-send doesn't stop the campaign — it just slows it down.
   */
  const startCampaign = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true); setSendError("");
    try {
      const form = new FormData();
      [...selected].forEach((id) => form.append("ids[]", String(id)));
      form.append("subject", subject.trim());
      form.append("body", body.trim());
      files.forEach((f) => form.append("attachments[]", f));

      const res = await uploadAdmin<{ data: Campaign }>("/admin/prospect-campaigns", form);
      setCampaign(res.data);
      drive(res.data);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Could not start the campaign.");
    } finally { setSending(false); }
  };

  const driving = useRef(false);
  const drive = useCallback(async (start: Campaign) => {
    if (driving.current) return;
    driving.current = true;
    let current = start;
    try {
      while (current.status === "sending") {
        const res = await apiAdmin<{ data: Campaign }>(
          `/admin/prospect-campaigns/${current.id}/run`,
          { method: "POST", body: JSON.stringify({ limit: 8 }) },
        );
        current = res.data;
        setCampaign(current);
      }
      // Reflect the pipeline moves the send just made.
      setSelected(new Set());
      load();
    } catch {
      // The scheduler will finish it; surface the last known state.
      setCampaign((c) => c && { ...c, status: c.status });
    } finally { driving.current = false; }
  }, [load]);

  const saveAsTemplate = async () => {
    if (!tplName.trim() || !subject.trim() || !body.trim()) return;
    setTplSaving(true);
    try {
      const res = await apiAdmin<{ data: Template }>("/admin/templates", {
        method: "POST",
        body: JSON.stringify({
          name: tplName.trim(),
          subject: subject.trim(),
          body: body.trim(),
          category: product || "General",
        }),
      });
      setTemplates((t) => [...t, res.data]);
      setTplSaved(true); setTplName("");
      setTimeout(() => setTplSaved(false), 2500);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Could not save the template.");
    } finally { setTplSaving(false); }
  };

  const closeComposer = () => {
    setComposerOpen(false); setSubject(""); setBody(""); setFiles([]);
    setCampaign(null); setTemplateOpen(false); setSendError(""); setFileError("");
    setTplName(""); setTplSaved(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (product) params.set("product", product);
      if (cat) params.set("category", cat);
      if (status) params.set("status", status);
      const suffix = product ? `-${product.toLowerCase()}` : "";
      await downloadCsv(
        `/admin/prospects/export?${params.toString()}`,
        `prospects${suffix}-${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch { /* ignore */ }
    finally { setExporting(false); }
  };

  const doImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setImportMsg("Choose a CSV file first."); return; }
    setImporting(true); setImportMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("product", importProduct);
      form.append("category", importCat);
      const res = await uploadAdmin<{ message: string }>("/admin/prospects/import", form);
      setImportMsg(res.message);
      if (fileRef.current) fileRef.current.value = "";
      setLoading(true); setPage(1); load();
    } catch (e) { setImportMsg(e instanceof Error ? e.message : "Upload failed."); }
    finally { setImporting(false); }
  };

  const selectedRows = list.filter((p) => selected.has(p.id));
  const selectedWithEmail = selectedRows.filter((p) => p.email).length;
  const productLabel = product ? Object.fromEntries(PRODUCTS)[product] : "all products";

  return (
    <div className="pb-24">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Prospects" subtitle="Outreach database — segmented by product, then by industry." />
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
            Pick the product this list sells, then its industry. Columns matched by header: name, location, phone, email
            (status &amp; feedback optional). Duplicates are skipped.
            Tip: in Excel use <strong>Save As → CSV</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select value={importProduct} onChange={(e) => selImportProduct(e.target.value)} className="text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}>
              {PRODUCTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={importCat} onChange={(e) => setImportCat(e.target.value)} className="text-sm rounded-xl px-3 py-2 border" style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}>
              {importCategories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-sm" />
            <button onClick={doImport} disabled={importing} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: importing ? 0.7 : 1 }}>
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</> : "Upload"}
            </button>
          </div>
          {importMsg && <p className="text-sm mt-3" style={{ color: "#7A6020" }}>{importMsg}</p>}
        </div>
      )}

      {/* Product segmentation — the primary filter */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] mr-1" style={{ color: "#bbb" }}>Product</span>
        <Chip active={product === ""} onClick={() => selProduct("")}>All products</Chip>
        {PRODUCTS.map(([v, l]) => <Chip key={v} active={product === v} onClick={() => selProduct(v)}>{l}</Chip>)}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip active={cat === ""} onClick={() => selCat("")}>All industries</Chip>
        {categories.map(([v, l]) => <Chip key={v} active={cat === v} onClick={() => selCat(v)}>{l}</Chip>)}
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
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs" style={{ color: "#999" }}>{meta.total} prospect{meta.total === 1 ? "" : "s"}</p>
            <button onClick={selectAllOnPage} className="text-xs font-semibold" style={{ color: "#7A6020" }}>
              {list.every((p) => selected.has(p.id)) ? "Clear this page" : "Select all on this page"}
            </button>
          </div>
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
                          {p.product && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(197,178,122,0.18)", color: "#7A6020" }}>{p.product}</span>
                          )}
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
            <button onClick={() => setComposerOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
              style={{ background: "#C5B27A", color: "#1E1E1E" }}>
              <Send className="w-3.5 h-3.5" />
              Email campaign ({selectedWithEmail} with email)
            </button>
            <button onClick={clearSelection}
              className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
              <X className="w-3.5 h-3.5" />Clear
            </button>
          </div>
        </div>
      )}

      {/* Campaign composer */}
      {composerOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="bg-white rounded-[24px] w-full max-w-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b shrink-0" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
              <div>
                <p className="font-semibold text-base" style={{ color: "#1E1E1E" }}>Email campaign</p>
                <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                  {campaign
                    ? `Sending to ${campaign.total} recipient${campaign.total === 1 ? "" : "s"}`
                    : `${selectedWithEmail} of ${selected.size} selected have an email address · ${productLabel}`}
                </p>
              </div>
              <button onClick={closeComposer} className="p-1.5 rounded-full" style={{ background: "#F2F2F2" }}>
                <X className="w-4 h-4" style={{ color: "#777" }} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3 overflow-y-auto">
              {campaign ? (
                <CampaignProgress campaign={campaign} />
              ) : (
                <>
                  <p className="text-xs rounded-xl px-3.5 py-2.5" style={{ background: "#FAFAF8", color: "#777" }}>
                    Sent from <strong style={{ color: "#7A6020" }}>support@vitorra.org</strong> — replies come back to the
                    shared inbox, not a personal mailbox. Use <code>{"{name}"}</code> to drop in each company&apos;s name.
                  </p>

                  {/* Template picker */}
                  {templates.length > 0 && (
                    <div className="relative">
                      <button onClick={() => setTemplateOpen((o) => !o)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: "#F2F2F2", color: "#555" }}>
                        Use template <ChevronDown className={`w-3 h-3 transition-transform ${templateOpen ? "rotate-180" : ""}`} />
                      </button>
                      {templateOpen && (
                        <div className="absolute left-0 top-full mt-1 z-10 rounded-xl border shadow-lg overflow-hidden w-72 max-h-64 overflow-y-auto"
                          style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)" }}>
                          {templates.map((t) => (
                            <button key={t.id} onClick={() => { setSubject(t.subject); setBody(t.body); setTemplateOpen(false); }}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-black/[0.03] transition-colors border-b last:border-0"
                              style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#1E1E1E" }}>
                                {t.name}
                                {t.category && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                                    style={{ background: "#F2F2F2", color: "#999" }}>{t.category}</span>
                                )}
                              </p>
                              <p className="text-[11px] truncate" style={{ color: "#999" }}>{t.subject}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.08em] block mb-1" style={{ color: "#bbb" }}>Subject</label>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject…"
                      className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.08em] block mb-1" style={{ color: "#bbb" }}>Message</label>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)}
                      placeholder="Hi {name}, …"
                      className="w-full text-sm rounded-xl px-3 py-2 border min-h-32 outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.08em] block mb-1.5" style={{ color: "#bbb" }}>
                      Attachments <span style={{ textTransform: "none", letterSpacing: 0 }}>· up to {MAX_FILES} files, {MAX_FILE_MB} MB each</span>
                    </label>
                    <input ref={attachRef} type="file" multiple hidden
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.csv,.txt"
                      onChange={(e) => addFiles(e.target.files)} />
                    <button onClick={() => attachRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                      style={{ background: "#F2F2F2", color: "#555" }}>
                      <Paperclip className="w-3.5 h-3.5" />Attach a file
                    </button>
                    {files.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {files.map((f) => (
                          <li key={`${f.name}-${f.size}`} className="flex items-center gap-2 text-xs rounded-xl px-3 py-2" style={{ background: "#FAFAF8", color: "#555" }}>
                            <Paperclip className="w-3 h-3 shrink-0" style={{ color: "#C5B27A" }} />
                            <span className="flex-1 truncate">{f.name}</span>
                            <span style={{ color: "#aaa" }}>{fmtSize(f.size)}</span>
                            <button onClick={() => removeFile(f.name, f.size)} className="p-0.5 rounded-full hover:bg-black/[0.06]">
                              <X className="w-3 h-3" style={{ color: "#999" }} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {fileError && <p className="text-xs mt-2" style={{ color: "#C0392B" }}>{fileError}</p>}
                  </div>

                  {/* Save as a reusable template */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.08em] block mb-1.5" style={{ color: "#bbb" }}>Save as template</label>
                    <div className="flex items-center gap-2">
                      <input value={tplName} onChange={(e) => setTplName(e.target.value)}
                        placeholder="Template name, e.g. SEAL intro — hospitals"
                        className="flex-1 text-sm rounded-xl px-3 py-2 border outline-none"
                        style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
                      <button onClick={saveAsTemplate}
                        disabled={tplSaving || !tplName.trim() || !subject.trim() || !body.trim()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full disabled:opacity-40 shrink-0"
                        style={{ background: "#F2F2F2", color: "#555" }}>
                        {tplSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                      </button>
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: tplSaved ? "#16A34A" : "#aaa" }}>
                      {tplSaved
                        ? "Saved — it's now in the template list above."
                        : `Keeps this subject and message for reuse${product ? ` under ${product}` : ""}. Attachments aren't saved.`}
                    </p>
                  </div>
                </>
              )}

              {sendError && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
                  {sendError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-2 border-t shrink-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <button onClick={closeComposer} className="text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
                {campaign ? "Close" : "Cancel"}
              </button>
              {!campaign && (
                <button onClick={startCampaign} disabled={sending || !subject.trim() || !body.trim() || selectedWithEmail === 0}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
                  style={{ background: "#C5B27A", color: "#1E1E1E" }}>
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send to {selectedWithEmail}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Live send progress. The bar keeps moving because the screen drives each batch. */
function CampaignProgress({ campaign }: { campaign: Campaign }) {
  const done = campaign.sent_count + campaign.failed_count;
  const pct = campaign.total > 0 ? Math.round((done / campaign.total) * 100) : 100;
  const finished = campaign.status !== "sending";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {finished
          ? <CheckCircle2 className="w-5 h-5" style={{ color: "#16A34A" }} />
          : <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C5B27A" }} />}
        <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
          {finished
            ? campaign.status === "cancelled" ? "Campaign cancelled" : "Campaign sent"
            : `Sending… ${done} of ${campaign.total}`}
        </p>
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F2F2F2" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "#C5B27A" }} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Delivered to inbox" value={campaign.sent_count} tone="#16A34A" />
        {campaign.failed_count > 0 && <Stat label="Failed" value={campaign.failed_count} tone="#C0392B" />}
        {campaign.duplicate > 0 && <Stat label="Shared an inbox" value={campaign.duplicate} tone="#777" />}
        {campaign.skipped > 0 && <Stat label="No email on file" value={campaign.skipped} tone="#777" />}
      </div>

      {campaign.attachments.length > 0 && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: "#888" }}>
          <Paperclip className="w-3 h-3" style={{ color: "#C5B27A" }} />
          {campaign.attachments.map((a) => a.name).join(", ")}
        </p>
      )}

      {!finished && (
        <p className="text-[11px]" style={{ color: "#aaa" }}>
          You can close this — sending carries on in the background and finishes on its own.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "#FAFAF8" }}>
      <p className="font-bold text-base" style={{ color: tone }}>{value}</p>
      <p style={{ color: "#999" }}>{label}</p>
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
