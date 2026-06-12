"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ChevronDown, Mail, Phone, Building2, UserCheck, ArrowRight } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { StatusBadge, PageHeader, formatDate, Empty, type Paginated } from "@/components/admin/admin-ui";
import { FET_TIERS } from "@/lib/fet-pricing";

type Requirement = { key: string; label: string; value: string };

type Enquiry = {
  id: number; product_category: string | null; name: string; email: string;
  company: string | null; phone: string | null; country: string; message: string;
  requirements: Requirement[] | null; assigned_to: string | null;
  status: string; created_at: string;
};

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

/* Reassignment targets. Teams mirror the auto-routing in backend/config/enquiries.php;
   people are the staff who handle enquiries day-to-day. `assigned_to` is a free
   string, so this list can grow without any schema change. */
const TEAMS = ["Sales & Operations", "Medical Sales", "Marketing", "Operations", "General Enquiries"];
const PEOPLE = ["Victor Lojum", "Thurayya Nakayima", "Joseph Rwabu", "Sarah Nuwamanya", "Nagawa Shakirah", "Daniel Tuke", "John Oluwaseyi"];

export default function EnquiriesPage() {
  const [list, setList]       = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");
  const [cat, setCat]         = useState("");
  const [open, setOpen]       = useState<number | null>(null);

  const [convertOpen, setConvertOpen]     = useState<number | null>(null);
  const [convertForms, setConvertForms]   = useState<Record<number, ConvertForm>>({});
  const [convertStatus, setConvertStatus] = useState<Record<number, "idle" | "submitting" | "error">>({});
  const [convertedRefs, setConvertedRefs] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (cat) params.set("category", cat);
      const q = params.toString() ? `?${params.toString()}` : "";
      const res = await apiAdmin<Paginated<Enquiry>>(`/admin/enquiries${q}`);
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [filter, cat]);

  useEffect(() => { load(); }, [load]);

  // Filter changes show the spinner (set from the click, not synchronously in the effect).
  const selStatus = (s: string) => { setLoading(true); setFilter(s); };
  const selCat = (c: string) => { setLoading(true); setCat(c); };

  const updateStatus = async (id: number, status: string) => {
    setList((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));
    try { await apiAdmin(`/admin/enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
    catch { load(); }
  };

  const assign = async (id: number, value: string) => {
    const assigned_to = value || null;
    setList((l) => l.map((e) => (e.id === id ? { ...e, assigned_to } : e)));
    try { await apiAdmin(`/admin/enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ assigned_to }) }); }
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
      <PageHeader title="Enquiries" subtitle="Quote requests submitted through the site — auto-routed to the owning team." />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <FilterChip active={filter === ""} onClick={() => selStatus("")}>All statuses</FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => selStatus(s)}>{s.replace(/_/g, " ")}</FilterChip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip active={cat === ""} onClick={() => selCat("")}>All products</FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c} active={cat === c} onClick={() => selCat(c)}>{c}</FilterChip>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No enquiries yet." />
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <div key={e.id} className="bg-white rounded-[20px] border border-black/[0.05] overflow-hidden">
              <button onClick={() => setOpen(open === e.id ? null : e.id)} className="w-full flex items-center gap-4 p-5 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{e.name}</span>
                    {e.product_category && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#F2F2F2", color: "#888" }}>{e.product_category}</span>}
                    {e.assigned_to && <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}><UserCheck className="w-3 h-3" />{e.assigned_to}</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: "#999999" }}>{e.email} · {e.country} · {formatDate(e.created_at)}</p>
                </div>
                <StatusBadge status={e.status} />
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === e.id ? "rotate-180" : ""}`} style={{ color: "#BBBBBB" }} />
              </button>

              {open === e.id && (
                <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
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
                      value={e.assigned_to ?? ""}
                      onChange={(ev) => assign(e.id, ev.target.value)}
                      className="text-xs rounded-full px-3 py-1.5 border outline-none cursor-pointer"
                      style={{ borderColor: "rgba(0,0,0,0.12)", background: "#FFFFFF", color: "#1E1E1E" }}
                    >
                      <option value="">— Unassigned —</option>
                      {e.assigned_to && ![...TEAMS, ...PEOPLE].includes(e.assigned_to) && (
                        <option value={e.assigned_to}>{e.assigned_to}</option>
                      )}
                      <optgroup label="Teams">
                        {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                      <optgroup label="People">
                        {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: "#777" }}>Status:</span>
                    {STATUSES.map((s) => (
                      <button key={s} onClick={() => updateStatus(e.id, s)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors" style={{ background: e.status === s ? "#C5B27A" : "#F2F2F2", color: e.status === s ? "#1E1E1E" : "#888" }}>
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold px-3.5 py-2 rounded-full capitalize transition-colors" style={{ background: active ? "#1E1E1E" : "#FFFFFF", color: active ? "#FFFFFF" : "#777777", border: "1px solid rgba(0,0,0,0.06)" }}>
      {children}
    </button>
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
        Convert to order — &ldquo;Reserve online, pay cash on installation&rdquo;
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
