"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ChevronDown, ChevronLeft, ChevronRight, Mail, Phone, Building2, UserCheck, ArrowRight, Download } from "lucide-react";
import { apiAdmin, downloadCsv } from "@/lib/auth";
import { StatusBadge, PageHeader, formatDate, Empty, type Paginated } from "@/components/admin/admin-ui";
import { FET_TIERS } from "@/lib/fet-pricing";

type Requirement = { key: string; label: string; value: string };

type Enquiry = {
  id: number; product_category: string | null; name: string; email: string;
  company: string | null; phone: string | null; country: string; message: string;
  requirements: Requirement[] | null; assigned_to: string | null; assigned_user_id: number | null;
  status: string; created_at: string;
  lead_source: string | null;
};

type AssignableUser = { id: number; name: string };

const STATUSES = ["new", "in_progress", "quoted", "converted", "closed"];
const CATEGORIES = ["FET", "SEAL", "COFFEE", "LOGISTICS"];

/* Convert to Order — "Reserve Online, Pay Cash on Installation" for fleet
   enquiries staff have quoted. Tier picked explicitly (Enquiry.requirements
   stores translated display labels, not raw tier ids), which sets
   product_slug = 'fet-{tier}' on the new order's line item for the customer
   portal's savings widget. */
type ConvertForm = {
  currency: "UGX" | "USD";
  agreed_total: string;
  tier: "" | "car" | "suv" | "lighttruck" | "heavytruck";
  quantity: string;
  product_name: string;
  notes: string;
};

function defaultConvertForm(e: Enquiry): ConvertForm {
  const desc = e.requirements?.map((r) => r.value).filter(Boolean).join(", ") ?? "";
  return {
    currency: "UGX",
    agreed_total: "",
    tier: "",
    quantity: "1",
    product_name: desc,
    notes: "",
  };
}

/* Reassignment targets. Teams mirror the auto-routing in backend/config/enquiries.php
   — `assigned_to` stays a free string for these, so this list can grow without a
   schema change. People are fetched live from real staff accounts (not a
   hardcoded list) so assigning one actually notifies a real, current account. */
const TEAMS = ["Sales & Operations", "Medical Sales", "Marketing", "Operations", "General Enquiries"];

export default function EnquiriesPage() {
  const [list, setList]       = useState<Enquiry[]>([]);
  const [people, setPeople]   = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");
  const [cat, setCat]         = useState("");
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [q, setQ]             = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [open, setOpen]       = useState<number | null>(null);

  useEffect(() => {
    apiAdmin<{ data: AssignableUser[] }>("/admin/enquiries/assignable-users")
      .then((r) => setPeople(r.data)).catch(() => {});
  }, []);

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try { await downloadCsv("/admin/enquiries/export", `enquiries-${new Date().toISOString().slice(0, 10)}.csv`); }
    catch { /* ignore */ }
    finally { setExporting(false); }
  };

  const [convertOpen, setConvertOpen]     = useState<number | null>(null);
  const [convertForms, setConvertForms]   = useState<Record<number, ConvertForm>>({});
  const [convertStatus, setConvertStatus] = useState<Record<number, "idle" | "submitting" | "error">>({});
  const [convertedRefs, setConvertedRefs] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (cat) params.set("category", cat);
      if (appliedQ) params.set("q", appliedQ);
      params.set("page", String(page));
      const res = await apiAdmin<Paginated<Enquiry>>(`/admin/enquiries?${params.toString()}`);
      setList(res.data);
      setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [filter, cat, appliedQ, page]);

  useEffect(() => { load(); }, [load]);

  // Filter changes show the spinner (set from the click, not synchronously in the effect).
  const selStatus = (s: string) => { setLoading(true); setPage(1); setFilter(s); };
  const selCat = (c: string) => { setLoading(true); setPage(1); setCat(c); };
  const search = () => { setLoading(true); setPage(1); setAppliedQ(q.trim()); };
  const goPage = (n: number) => { setLoading(true); setOpen(null); setPage(n); };
  const filtered = !!(filter || cat || appliedQ);
  const clearFilters = () => { setLoading(true); setPage(1); setFilter(""); setCat(""); setQ(""); setAppliedQ(""); };

  const updateStatus = async (id: number, status: string) => {
    setList((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));
    try { await apiAdmin(`/admin/enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
    catch { load(); }
  };

  // A numeric value means a specific person (their user id); anything else is
  // a team label (or empty = unassigned). Only the person path sets
  // assigned_user_id, which is what actually triggers their notification.
  const assign = async (id: number, value: string) => {
    const person = /^\d+$/.test(value) ? people.find((p) => String(p.id) === value) : undefined;
    const assigned_to = person ? person.name : (value || null);
    const assigned_user_id = person ? person.id : null;
    setList((l) => l.map((e) => (e.id === id ? { ...e, assigned_to, assigned_user_id } : e)));
    try { await apiAdmin(`/admin/enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ assigned_to, assigned_user_id }) }); }
    catch { load(); }
  };

  const toggleConvert = (e: Enquiry) => {
    if (convertOpen === e.id) { setConvertOpen(null); return; }
    setConvertForms((f) => ({ ...f, [e.id]: f[e.id] ?? defaultConvertForm(e) }));
    setConvertStatus((s) => ({ ...s, [e.id]: "idle" }));
    setConvertOpen(e.id);
  };

  const setConvertField = (id: number, patch: Partial<ConvertForm>) => {
    setConvertForms((f) => ({ ...f, [id]: { ...f[id], ...patch } }));
  };

  const convert = async (e: Enquiry) => {
    const f = convertForms[e.id];
    if (!f) return;
    const totalMajor = Number(f.agreed_total);
    if (!totalMajor || totalMajor <= 0) {
      setConvertStatus((s) => ({ ...s, [e.id]: "error" }));
      return;
    }

    setConvertStatus((s) => ({ ...s, [e.id]: "submitting" }));

    const payload: Record<string, unknown> = {
      currency: f.currency,
      agreed_total: f.currency === "USD" ? Math.round(totalMajor * 100) : Math.round(totalMajor),
      quantity: Number(f.quantity) || 1,
    };
    if (f.tier) payload.tier = f.tier;
    if (f.product_name.trim()) payload.product_name = f.product_name.trim();
    if (f.notes.trim()) payload.notes = f.notes.trim();

    try {
      const res = await apiAdmin<{ data: { reference: string } }>(`/admin/enquiries/${e.id}/convert`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setList((l) => l.map((it) => (it.id === e.id ? { ...it, status: "converted" } : it)));
      setConvertedRefs((r) => ({ ...r, [e.id]: res.data.reference }));
      setConvertStatus((s) => ({ ...s, [e.id]: "idle" }));
      setConvertOpen(null);
    } catch {
      setConvertStatus((s) => ({ ...s, [e.id]: "error" }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Enquiries"
        subtitle="Quote requests from the website, routed to the team that owns the product."
        actions={
          <button onClick={handleExport} disabled={exporting} className="c-btn">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Export CSV
          </button>
        }
      />

      <div className="c-toolbar">
        <form onSubmit={(ev) => { ev.preventDefault(); search(); }} className="flex items-center gap-1 flex-1 min-w-[14rem]">
          <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Search name, email, company…" className="c-input flex-1" aria-label="Search enquiries" />
          <button type="submit" className="c-btn">Search</button>
        </form>
        <select aria-label="Status" value={filter} onChange={(ev) => selStatus(ev.target.value)} className="c-select capitalize" data-active={!!filter}>
          <option value="">All statuses</option>
          {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, " ")}</option>)}
        </select>
        <select aria-label="Product" value={cat} onChange={(ev) => selCat(ev.target.value)} className="c-select" data-active={!!cat}>
          <option value="">All products</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {filtered && <button onClick={clearFilters} className="c-btn c-btn-ghost text-ink-muted">Clear</button>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label={filtered ? "No enquiries match these filters." : "No enquiries yet."} />
      ) : (
        <>
        <div className="c-panel overflow-x-auto">
          <table className="c-table min-w-[820px]">
            <thead>
              <tr>
                <th>Received</th>
                <th>From</th>
                <th>Product</th>
                <th>Country</th>
                <th>Owner</th>
                <th>Source</th>
                <th>Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
          {list.map((e) => (
            <Fragment key={e.id}>
              <tr className="c-row" data-open={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                <td className="whitespace-nowrap text-ink-muted">{formatDate(e.created_at)}</td>
                <td className="max-w-[16rem]">
                  <span className="block font-medium text-ink truncate">{e.name}</span>
                  <span className="block text-[12px] text-ink-muted truncate">{e.company ? `${e.company} · ` : ""}{e.email}</span>
                </td>
                <td><span className="text-[12px] font-medium text-gold-ink">{e.product_category ?? "General"}</span></td>
                <td className="whitespace-nowrap">{e.country}</td>
                <td className="max-w-[10rem] truncate">{e.assigned_to ?? <span className="text-ink-muted">Unassigned</span>}</td>
                {/* Enquiries taken before lead-source tracking existed have
                    none, and show nothing rather than a guess. */}
                <td className="max-w-[8rem] truncate text-ink-muted">{e.lead_source ?? "—"}</td>
                <td><StatusBadge status={e.status} /></td>
                <td><ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${open === e.id ? "rotate-180" : ""}`} aria-hidden="true" /></td>
              </tr>

              {open === e.id && (
                <tr><td colSpan={8} className="!bg-paper-deep !px-5 !pb-5 !pt-1">
                <div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 mt-4 text-xs" style={{ color: "#555" }}>
                    <a href={`mailto:${e.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{e.email}</a>
                    {e.phone && <a href={`tel:${e.phone}`} className="flex items-center gap-1.5 hover:underline"><Phone className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{e.phone}</a>}
                    {e.company && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />{e.company}</span>}
                    {e.assigned_to && <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />Routed to {e.assigned_to}</span>}
                  </div>

                  {/* Structured brief — the quote-ready answers captured on the form */}
                  {e.requirements && e.requirements.length > 0 && (
                    <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide px-4 py-2" style={{ background: "#F8F7F5", color: "#999" }}>Requirements</p>
                      <dl>
                        {e.requirements.map((r, i) => (
                          <div key={r.key} className="flex gap-4 px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.04)" }}>
                            <dt className="text-xs w-40 shrink-0" style={{ color: "#999" }}>{r.label}</dt>
                            <dd className="text-xs font-medium" style={{ color: "#1E1E1E" }}>{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {e.message && (
                    <p className="text-sm leading-relaxed mb-5 p-4 rounded-xl" style={{ color: "#444", background: "#F8F7F5" }}>{e.message}</p>
                  )}

                  {/* Reassign — overrides the auto-routed team to a team or person */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold" style={{ color: "#777" }}>Assigned to:</span>
                    <select
                      value={e.assigned_user_id ? String(e.assigned_user_id) : (e.assigned_to ?? "")}
                      onChange={(ev) => assign(e.id, ev.target.value)}
                      className="text-xs rounded-full px-3 py-1.5 border outline-none cursor-pointer"
                      style={{ borderColor: "rgba(0,0,0,0.12)", background: "#FFFFFF", color: "#1E1E1E" }}
                    >
                      <option value="">— Unassigned —</option>
                      {e.assigned_to && !e.assigned_user_id && !TEAMS.includes(e.assigned_to) && (
                        <option value={e.assigned_to}>{e.assigned_to}</option>
                      )}
                      <optgroup label="Teams">
                        {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                      <optgroup label="People">
                        {people.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: "#777" }}>Status:</span>
                    {STATUSES.map((s) => (
                      <button key={s} onClick={() => updateStatus(e.id, s)} className={`c-btn !h-7 capitalize ${e.status === s ? "!bg-ink !text-paper !border-ink" : ""}`}>
                        {s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>

                  {/* Convert to Order — turns a quoted enquiry into a cash-reserved order */}
                  {e.status === "quoted" && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      {convertedRefs[e.id] && (
                        <p className="text-xs mb-3 inline-flex items-center gap-1.5" style={{ color: "#16A34A" }}>
                          Converted to order <strong>{convertedRefs[e.id]}</strong> —{" "}
                          <Link href="/admin/orders" className="inline-flex items-center gap-1 font-semibold hover:underline" style={{ color: "#7A6020" }}>
                            view in Orders <ArrowRight className="w-3 h-3" />
                          </Link>
                        </p>
                      )}

                      {convertOpen !== e.id ? (
                        <button
                          onClick={() => toggleConvert(e)}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                          style={{ background: "#1E1E1E", color: "#FFFFFF" }}
                        >
                          Convert to Order
                        </button>
                      ) : (
                        <ConvertForm
                          form={convertForms[e.id] ?? defaultConvertForm(e)}
                          status={convertStatus[e.id] ?? "idle"}
                          onChange={(patch) => setConvertField(e.id, patch)}
                          onSubmit={() => convert(e)}
                          onCancel={() => setConvertOpen(null)}
                        />
                      )}
                    </div>
                  )}
                </div>
                </td></tr>
              )}
            </Fragment>
          ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 mt-3 text-[12px] text-ink-muted">
          <span>{meta.total.toLocaleString("en-GB")} enquir{meta.total === 1 ? "y" : "ies"}</span>
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
    </div>
  );
}

const FIELD_CLS = "w-full text-xs rounded-lg px-3 py-2 border outline-none";
const FIELD_STYLE = { borderColor: "rgba(0,0,0,0.12)", background: "#FFFFFF", color: "#1E1E1E" } as const;

function ConvertForm({
  form, status, onChange, onSubmit, onCancel,
}: {
  form: ConvertForm;
  status: "idle" | "submitting" | "error";
  onChange: (patch: Partial<ConvertForm>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#F8F7F5", border: "1px solid rgba(0,0,0,0.06)" }}>
      <p className="text-xs font-semibold mb-3" style={{ color: "#1E1E1E" }}>
        Convert to order — &ldquo;Reserve online, pay cash before installation&rdquo;
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>Currency</label>
          <select value={form.currency} onChange={(ev) => onChange({ currency: ev.target.value as ConvertForm["currency"] })} className={FIELD_CLS} style={FIELD_STYLE}>
            <option value="UGX">UGX</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>
            Agreed total ({form.currency === "USD" ? "$" : "UGX"})
          </label>
          <input
            type="number" min={0} step={form.currency === "USD" ? "0.01" : "1"}
            value={form.agreed_total}
            onChange={(ev) => onChange({ agreed_total: ev.target.value })}
            className={FIELD_CLS} style={FIELD_STYLE}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>FET device tier</label>
          <select value={form.tier} onChange={(ev) => onChange({ tier: ev.target.value as ConvertForm["tier"] })} className={FIELD_CLS} style={FIELD_STYLE}>
            <option value="">Custom / fleet (no tier)</option>
            {FET_TIERS.map((t) => (
              <option key={t.id} value={t.id}>{t.model} — {t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>Quantity</label>
          <input
            type="number" min={1} max={50}
            value={form.quantity}
            onChange={(ev) => onChange({ quantity: ev.target.value })}
            className={FIELD_CLS} style={FIELD_STYLE}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>Description</label>
        <input
          type="text"
          value={form.product_name}
          onChange={(ev) => onChange({ product_name: ev.target.value })}
          className={FIELD_CLS} style={FIELD_STYLE}
          placeholder="e.g. FET-PRO-FII for fleet of 5 SUVs"
        />
      </div>

      <div className="mb-3">
        <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#999" }}>Internal notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(ev) => onChange({ notes: ev.target.value })}
          className={`${FIELD_CLS} min-h-16`} style={FIELD_STYLE}
        />
      </div>

      {status === "error" && (
        <p className="text-xs mb-3" style={{ color: "#C0392B" }}>
          Enter a valid agreed total, then try again.
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onSubmit}
          disabled={status === "submitting"}
          className="text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-opacity"
          style={{ background: "#C5B27A", color: "#1E1E1E", opacity: status === "submitting" ? 0.7 : 1 }}
        >
          {status === "submitting" ? "Converting…" : "Create order"}
        </button>
        <button onClick={onCancel} className="text-[11px] font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
