"use client";

import { Fragment, useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2, ChevronDown, Mail, Phone, MapPin, AlertTriangle, Upload,
  ChevronLeft, ChevronRight, Download, Send, X, ArrowRightCircle,
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
    ["FUNERAL", "Funeral services"], ["INTERNAL_TEST", "Internal test"],
  ],
  SEAL: [
    ["HOSPITAL", "Hospitals"], ["PHARMACY", "Pharmacies"], ["FIRST_RESPONDER", "First responders"],
    ["MANUFACTURING", "Manufacturing"], ["MINING_QUARRY", "Mines & quarries"],
    ["SPORTS_ASSOCIATION", "Sports associations"], ["BODA_BODA", "Boda bodas"],
    ["BIKER_ASSOCIATION", "Biker associations"], ["TRAVEL_COMPANY", "Travel companies"],
    ["INTERNAL_TEST", "Internal test"],
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
const ASSIGNEES = ["Thurayya Nakayima", "Sarah Nuwamanya", "John Oluwaseyi"];

const MAX_FILES = 5;
const MAX_FILE_MB = 8;

/** ?q= on arrival — the command palette links straight to a match. */
const initialQ = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : "";

const STATUS_TONE: Record<string, string> = {
  not_contacted: "muted", contacted: "gold", delivered: "blue", bounced: "alert",
  responded: "violet", qualified: "blue", converted: "ok", not_interested: "muted",
};

const fmtSize = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function ProspectsPage() {
  const [list, setList]       = useState<Prospect[]>([]);
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState("");
  const [cat, setCat]         = useState("");
  const [status, setStatus]   = useState("");
  const [q, setQ]             = useState(initialQ);
  const [appliedQ, setAppliedQ] = useState(initialQ);
  const [assigned, setAssigned] = useState("");
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
      if (assigned) params.set("assigned", assigned);
      params.set("page", String(page));
      const res = await apiAdmin<Paginated<Prospect>>(`/admin/prospects?${params.toString()}`);
      setList(res.data);
      setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [product, cat, status, appliedQ, assigned, page]);

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
  const selAssigned = (a: string) => { reset(); setAssigned(a); };
  const clearFilters = () => { reset(); setProduct(""); setCat(""); setStatus(""); setAssigned(""); setQ(""); setAppliedQ(""); };
  const filtered = !!(product || cat || status || assigned || appliedQ);
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

  /* Bulk edits: one PATCH per selected row (the API has no batch endpoint),
     sent in parallel, then a reload so the list reflects the server. */
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulkPatch = async (body: Record<string, unknown>) => {
    setBulkBusy(true);
    await Promise.allSettled([...selected].map((id) =>
      apiAdmin(`/admin/prospects/${id}`, { method: "PATCH", body: JSON.stringify(body) })));
    setBulkBusy(false);
    load();
  };

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
      <PageHeader
        title="Prospects"
        subtitle="Outreach list, by product then industry. Select rows to send a campaign."
        actions={<>
          <button onClick={handleExport} disabled={exporting} className="c-btn">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export
          </button>
          <button onClick={() => setImportOpen((o) => !o)} className="c-btn c-btn-primary">
            <Upload className="w-4 h-4" />Import CSV
          </button>
        </>}
      />

      {/* Import panel */}
      {importOpen && (
        <div className="c-panel p-4 mb-3">
          <p className="text-[13px] font-medium text-ink mb-1">Import a prospect list (CSV)</p>
          <p className="text-[12px] text-ink-muted mb-3">
            Pick the product this list sells, then its industry. Columns matched by header: name, location, phone, email
            (status and feedback optional). Duplicates are skipped. In Excel use <strong>Save As → CSV</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select value={importProduct} onChange={(e) => selImportProduct(e.target.value)} className="c-select">
              {PRODUCTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={importCat} onChange={(e) => setImportCat(e.target.value)} className="c-select">
              {importCategories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-[13px]" />
            <button onClick={doImport} disabled={importing} className="c-btn c-btn-primary">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</> : "Upload"}
            </button>
          </div>
          {importMsg && <p className="text-[13px] mt-3 text-gold-ink">{importMsg}</p>}
        </div>
      )}

      {/* Toolbar: search + filters as compact selects */}
      <div className="c-toolbar">
        <form onSubmit={(e) => { e.preventDefault(); search(); }} className="flex items-center gap-1 flex-1 min-w-[14rem]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, location…" className="c-input flex-1" aria-label="Search prospects" />
          <button type="submit" className="c-btn">Search</button>
        </form>
        <select aria-label="Product" value={product} onChange={(e) => selProduct(e.target.value)} className="c-select" data-active={!!product}>
          <option value="">All products</option>
          {PRODUCTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Industry" value={cat} onChange={(e) => selCat(e.target.value)} className="c-select" data-active={!!cat}>
          <option value="">All industries</option>
          {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => selStatus(e.target.value)} className="c-select" data-active={!!status}>
          <option value="">All statuses</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Owner" value={assigned} onChange={(e) => selAssigned(e.target.value)} className="c-select" data-active={!!assigned}>
          <option value="">Any owner</option>
          {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {filtered && <button onClick={clearFilters} className="c-btn c-btn-ghost text-ink-muted"><X className="w-3.5 h-3.5" />Clear</button>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No prospects match these filters." />
      ) : (
        <>
          <div className="c-panel overflow-x-auto">
            <table className="c-table min-w-[820px]">
              <thead>
                <tr>
                  <th className="w-10">
                    <input type="checkbox" aria-label="Select all on this page" checked={list.every((p) => selected.has(p.id))} onChange={selectAllOnPage} className="w-3.5 h-3.5 accent-[#7A6020]" />
                  </th>
                  <th>Company</th>
                  <th>Product</th>
                  <th>Industry</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const isSelected = selected.has(p.id);
                  const isOpen = open === p.id;
                  return (
                    <Fragment key={p.id}>
                      <tr className="c-row" data-open={isOpen || isSelected} onClick={() => setOpen(isOpen ? null : p.id)}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Select ${p.name}`} checked={isSelected} onChange={() => toggleSelect(p.id)} className="w-3.5 h-3.5 accent-[#7A6020]" />
                        </td>
                        <td className="max-w-[16rem]">
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium text-ink truncate">{p.name}</span>
                            {p.flags && p.flags.length > 0 && (
                              <span title={p.flags.join(", ")} className="text-alert-ink shrink-0"><AlertTriangle className="w-3.5 h-3.5" aria-label={p.flags.includes("no_contact") ? "No contact details" : "Check email"} /></span>
                            )}
                          </span>
                        </td>
                        <td><span className="text-[12px] font-medium text-gold-ink">{p.product}</span></td>
                        <td className="whitespace-nowrap">{CAT_LABEL[p.category] ?? p.category}</td>
                        <td className="max-w-[15rem]">
                          <span className="block truncate">{p.email ?? <span className="text-ink-muted">No email</span>}</span>
                          {p.phone && <span className="block text-[12px] text-ink-muted truncate">{p.phone}</span>}
                        </td>
                        <td className="max-w-[10rem] truncate">{p.location ?? "—"}</td>
                        <td className="whitespace-nowrap">{p.assigned_to ? p.assigned_to.split(" ")[0] : <span className="text-ink-muted">—</span>}</td>
                        <td><span className="c-chip" data-tone={STATUS_TONE[p.outreach_status] ?? "muted"}>{p.outreach_status.replace(/_/g, " ")}</span></td>
                        <td><ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" /></td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={9} className="!bg-paper-deep !py-4">
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 text-[12.5px] text-ink-soft">
                              {p.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="w-3.5 h-3.5 text-gold-ink" />{p.email}</a>}
                              {p.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 hover:underline"><Phone className="w-3.5 h-3.5 text-gold-ink" />{p.phone}</a>}
                              {p.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold-ink" />{p.location}</span>}
                              {p.source && <span className="text-ink-muted">Source: {p.source}</span>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <Labelled label="Outreach status">
                                <select value={p.outreach_status} onChange={(e) => patch(p.id, { outreach_status: e.target.value })} className="c-select w-full">
                                  {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                              </Labelled>
                              <Labelled label="Owner">
                                <select value={p.assigned_to ?? ""} onChange={(e) => patch(p.id, { assigned_to: e.target.value || null })} className="c-select w-full">
                                  <option value="">Unassigned</option>
                                  {p.assigned_to && !ASSIGNEES.includes(p.assigned_to) && <option value={p.assigned_to}>{p.assigned_to}</option>}
                                  {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                                </select>
                              </Labelled>
                              <Labelled label="Follow-up">
                                <input defaultValue={p.follow_up ?? ""} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== p.follow_up) patch(p.id, { follow_up: v }); }} placeholder="e.g. Call back next week" className="c-input w-full" />
                              </Labelled>
                              <div className="flex items-end">
                                {p.outreach_status !== "converted" ? (
                                  <button onClick={() => convertToEnquiry(p.id)} disabled={converting === p.id} className="c-btn w-full">
                                    {converting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5 text-ok-ink" />}
                                    Convert to enquiry
                                  </button>
                                ) : (
                                  <span className="c-chip" data-tone="ok">Converted to enquiry</span>
                                )}
                              </div>
                              <div className="md:col-span-4">
                                <Labelled label="Notes">
                                  <textarea defaultValue={p.feedback ?? ""} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== p.feedback) patch(p.id, { feedback: v }); }} placeholder="Call notes, response, next steps…" className="c-input w-full !h-auto min-h-16 py-2" />
                                </Labelled>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pager */}
          <div className="flex items-center justify-between gap-3 mt-3 text-[12px] text-ink-muted">
            <span>
              {(meta.current_page - 1) * 25 + 1}–{(meta.current_page - 1) * 25 + list.length} of {meta.total.toLocaleString("en-GB")}
              {selected.size > 0 && <> · <span className="text-gold-ink">{selected.size} selected</span></>}
            </span>
            {meta.last_page > 1 && (
              <span className="flex items-center gap-1">
                <button aria-label="Previous page" disabled={meta.current_page <= 1} onClick={() => goPage(meta.current_page - 1)} className="c-btn !px-2"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-2">Page {meta.current_page} of {meta.last_page}</span>
                <button aria-label="Next page" disabled={meta.current_page >= meta.last_page} onClick={() => goPage(meta.current_page + 1)} className="c-btn !px-2"><ChevronRight className="w-4 h-4" /></button>
              </span>
            )}
          </div>
        </>
      )}

      {/* Sticky bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 pl-4 pr-2 py-2 rounded-frame bg-ink shadow-[0_12px_40px_rgba(0,0,0,0.25)] max-w-[calc(100%-2rem)]">
          <span className="text-[13px] font-medium text-paper whitespace-nowrap">{selected.size} selected</span>
          {bulkBusy && <Loader2 className="w-4 h-4 animate-spin text-ink-fg-muted" />}
          <select aria-label="Set status for selected" value="" disabled={bulkBusy} onChange={(e) => e.target.value && bulkPatch({ outreach_status: e.target.value })} className="c-select !bg-transparent !text-paper !border-ink-line hidden sm:block">
            <option value="">Set status…</option>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label="Assign selected" value="" disabled={bulkBusy} onChange={(e) => e.target.value && bulkPatch({ assigned_to: e.target.value === "-" ? null : e.target.value })} className="c-select !bg-transparent !text-paper !border-ink-line hidden sm:block">
            <option value="">Assign to…</option>
            {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            <option value="-">Unassign</option>
          </select>
          <button onClick={() => setComposerOpen(true)} className="c-btn !bg-gold !border-gold !text-ink">
            <Send className="w-3.5 h-3.5" />Email campaign ({selectedWithEmail})
          </button>
          <button onClick={clearSelection} aria-label="Clear selection" className="c-btn c-btn-ghost !text-paper hover:!bg-white/10">
            <X className="w-3.5 h-3.5" />
          </button>
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

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] mb-1 text-ink-muted">{label}</p>
      {children}
    </div>
  );
}
