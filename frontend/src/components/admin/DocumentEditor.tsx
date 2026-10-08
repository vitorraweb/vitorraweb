"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Download, FileText, Loader2, Plus, RefreshCw, Send, X, XCircle } from "lucide-react";
import { apiAdmin, auth, canAccess, downloadFile, fetchPdf } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/admin/admin-ui";
import {
  BUSINESS_LABEL, CURRENCIES, FET_DETAILS, FET_LINES, KIND_LABEL, blankForm, formatMoney, fromRecord, toMinor, toPayload,
  type Business, type DocForm, type DocType, type InvoiceKind,
} from "@/lib/documents";

/* ─── Quotation / invoice editor ──────────────────────────────────────────────
   The form on the left, and on the right the exact PDF the customer will
   receive, re-rendered by the server a moment after each change (the same
   template that is emailed and downloaded, so what you see is what they get).
   Used for quotations and for invoices on the Coffee / FET templates.        */

type Linked = { id: number; number: string; kind: string; status: string };
type Meta = { id: number; number: string; status: string; is_expired?: boolean; invoices?: Linked[]; quotation?: { id: number; number: string } | null };

const API = { quotation: "/admin/accounting/quotations", invoice: "/admin/accounting/invoices" } as const;
const ROUTE = { quotation: "/admin/quotations", invoice: "/admin/invoices" } as const;

export default function DocumentEditor({
  type, id, initialBusiness = "coffee", initialKind = "standard",
}: { type: DocType; id?: number; initialBusiness?: Business; initialKind?: InvoiceKind }) {
  const router = useRouter();
  const [form, setForm] = useState<DocForm | null>(() =>
    id ? null : blankForm(initialBusiness, type, initialKind, auth.getUser()?.name ?? ""),
  );
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  /* ── load an existing record ── */
  useEffect(() => {
    if (!id) return;
    apiAdmin<{ data: Meta & Record<string, unknown> }>(`${API[type]}/${id}`)
      .then((r) => { setForm(fromRecord(r.data, type)); setMeta(r.data); })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load."));
  }, [id, type]);

  const editable = !meta || ["draft", "sent"].includes(meta.status);
  // Quoting is open to the named sales staff; invoicing touches the books.
  const canInvoice = canAccess(auth.getUser(), { module: "accounting" });
  const set = <K extends keyof DocForm>(k: K, v: DocForm[K]) => { setForm((f) => (f ? { ...f, [k]: v } : f)); setDirty(true); };
  const setLine = (i: number, patch: Partial<DocForm["lines"][number]>) =>
    setForm((f) => (f ? { ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) } : f));

  /* ── live preview ── */
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const payload = useMemo(() => (form ? toPayload(form, type) : null), [form, type]);
  const docNumber = meta?.number ?? null;

  const renderPreview = useCallback(async () => {
    if (!payload) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPreviewing(true);
    try {
      const blob = await fetchPdf("/admin/accounting/documents/preview", {
        ...payload, type, number: docNumber,
        items: payload.items.map((it) => ({ ...it, name: (it as { name?: string }).name ?? (it as { description?: string }).description })),
      }, ctrl.signal);
      const url = URL.createObjectURL(blob);
      setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
      setPreviewError("");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setPreviewError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      if (abortRef.current === ctrl) setPreviewing(false);
    }
  }, [payload, type, docNumber]);

  useEffect(() => {
    if (!payload) return;
    const t = setTimeout(renderPreview, 700);
    return () => clearTimeout(t);
  }, [payload, renderPreview]);
  useEffect(() => () => { setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return null; }); }, []);

  /* ── actions ── */
  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." }); }
    finally { setBusy(null); }
  };

  const save = () => run("save", async () => {
    if (!form || !payload) return;
    if (!form.customer_name.trim()) throw new Error("Add the customer's name first.");
    if (payload.items.length === 0) throw new Error("Add at least one line.");
    const body = JSON.stringify(payload);
    if (id) {
      const r = await apiAdmin<{ data: Meta & Record<string, unknown> }>(`${API[type]}/${id}`, { method: "PUT", body });
      setMeta(r.data); setDirty(false);
      setMsg({ ok: true, text: "Saved." });
    } else {
      const r = await apiAdmin<{ data: Meta }>(API[type], { method: "POST", body });
      setDirty(false);
      router.replace(`${ROUTE[type]}/${r.data.id}`);
    }
  });

  const send = () => run("send", async () => {
    if (!id) return;
    if (dirty) throw new Error("Save your changes before sending.");
    const r = await apiAdmin<{ data: Meta & Record<string, unknown> }>(`${API[type]}/${id}/send`, { method: "POST" });
    if (r.data?.status) setMeta((m) => (m ? { ...m, ...r.data } : r.data));
    setMsg({ ok: true, text: `Emailed to ${form?.customer_email}.` });
  });

  const setStatus = (status: string) => run(status, async () => {
    const r = await apiAdmin<{ data: Meta & Record<string, unknown> }>(`${API.quotation}/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
    setMeta(r.data);
  });

  const convert = (kind: InvoiceKind) => run(`convert-${kind}`, async () => {
    if (dirty) throw new Error("Save your changes first.");
    const r = await apiAdmin<{ data: { id: number; number: string } }>(`${API.quotation}/${id}/convert`, { method: "POST", body: JSON.stringify({ kind }) });
    router.push(`${ROUTE.invoice}/${r.data.id}`);
  });

  const download = () => run("pdf", async () => {
    if (!id || !meta) return;
    await downloadFile(`${API[type]}/${id}/pdf`, `${meta.number}.pdf`);
  });

  if (loadError) return <p className="text-[13px] text-alert-ink">{loadError}</p>;
  if (!form) return <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  const isQuote = type === "quotation";
  const coffee = form.business === "coffee";
  const docName = isQuote ? "Quotation" : KIND_LABEL[form.kind];
  const sub = form.lines.reduce((n, l) => n + (l.quantity || 0) * toMinor(form.currency, l.price), 0);
  const tax = Math.round((sub * Number(form.tax_rate || 0)) / 100);

  return (
    <div className="pb-10">
      <Link href={isQuote ? "/admin/quotations" : "/admin/accounting?tab=invoices"} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink mb-3">
        <ArrowLeft className="w-3.5 h-3.5" />{isQuote ? "All quotations" : "All invoices"}
      </Link>
      <PageHeader
        title={meta ? meta.number : `New ${docName.toLowerCase()}`}
        subtitle={`${BUSINESS_LABEL[form.business]} · ${docName}${meta?.quotation ? ` · from quotation ${meta.quotation.number}` : ""}`}
        actions={<>
          {meta && <StatusBadge status={meta.is_expired ? "overdue" : meta.status} label={meta.is_expired ? "expired" : meta.status} />}
          {meta && <button onClick={download} disabled={!!busy} className="c-btn">{busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}PDF</button>}
          {meta && editable && <button onClick={send} disabled={!!busy || !form.customer_email} title={form.customer_email ? "" : "Add a customer email to send"} className="c-btn">{busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Email to customer</button>}
          {editable && <button onClick={save} disabled={!!busy} className="c-btn c-btn-primary">{busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{id ? "Save" : "Save draft"}</button>}
        </>}
      />

      {/* Quotation outcome + conversion */}
      {isQuote && meta && meta.status !== "void" && (
        <div className="c-toolbar">
          <span className="text-[12.5px] text-ink-muted px-1">Customer&apos;s answer:</span>
          <button onClick={() => setStatus("accepted")} disabled={!!busy || meta.status === "accepted"} className="c-btn"><Check className="w-4 h-4 text-ok-ink" />Accepted</button>
          <button onClick={() => setStatus("declined")} disabled={!!busy || meta.status === "declined"} className="c-btn"><XCircle className="w-4 h-4 text-alert-ink" />Declined</button>
          {meta.status !== "declined" && !canInvoice && (
            <span className="text-[12.5px] text-ink-muted px-1">Once accepted, Finance turns this quotation into an invoice.</span>
          )}
          {meta.status !== "declined" && canInvoice && <>
            <span className="w-px h-5 bg-line mx-1" />
            <span className="text-[12.5px] text-ink-muted px-1">Make an invoice:</span>
            <button onClick={() => convert("commercial")} disabled={!!busy} className="c-btn">{busy === "convert-commercial" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}Commercial invoice</button>
            <button onClick={() => convert("final")} disabled={!!busy} className="c-btn">{busy === "convert-final" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}Final invoice</button>
          </>}
          {meta.invoices && meta.invoices.length > 0 && (
            <span className="ml-auto flex flex-wrap items-center gap-2 text-[12.5px] text-ink-muted">
              Invoiced as {meta.invoices.map((i) => canInvoice
                ? <Link key={i.id} href={`/admin/invoices/${i.id}`} className="text-gold-ink hover:underline">{i.number}</Link>
                : <span key={i.id} className="text-ink">{i.number}</span>)}
            </span>
          )}
        </div>
      )}
      {!isQuote && meta && (
        <p className="text-[12.5px] text-ink-muted mb-3">Payments against this invoice are recorded in <Link href="/admin/accounting?tab=invoices" className="text-gold-ink hover:underline">Books → Invoices</Link>.</p>
      )}
      {msg && <p className={`text-[13px] mb-3 ${msg.ok ? "text-ok-ink" : "text-alert-ink"}`}>{msg.text}</p>}
      {!editable && <p className="text-[13px] mb-3 text-ink-muted">This {docName.toLowerCase()} is {meta?.status} and can no longer be edited.</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-4 items-start">
        {/* ══ Form ═══════════════════════════════════════════════════════ */}
        <fieldset disabled={!editable} className="space-y-3 min-w-0">
          <Card title="Document">
            <Grid>
              <Field label="Template">
                <select className="c-select w-full" value={form.business} disabled={!!id}
                  onChange={(e) => { const b = e.target.value as Business; setForm(blankForm(b, type, form.kind, form.sales_contact)); setDirty(true); }}>
                  <option value="coffee">Vitorra Coffee</option>
                  <option value="fet">Fuel Eco Tech (FET)</option>
                </select>
              </Field>
              {!isQuote && (
                <Field label="Invoice type">
                  <select className="c-select w-full" value={form.kind} disabled={!!id} onChange={(e) => set("kind", e.target.value as InvoiceKind)}>
                    {(["standard", "commercial", "final"] as InvoiceKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Currency">
                <select className="c-select w-full" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label={isQuote ? "Quotation date" : "Invoice date"}><input type="date" className="c-input w-full" value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} /></Field>
              <Field label={isQuote ? "Valid until" : "Due date"}><input type="date" className="c-input w-full" value={form.second_date} onChange={(e) => set("second_date", e.target.value)} /></Field>
              <Field label="Sales contact"><input className="c-input w-full" value={form.sales_contact} onChange={(e) => set("sales_contact", e.target.value)} /></Field>
              {!coffee && <Field label="Reference"><input className="c-input w-full" value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="e.g. FET – PRO II" /></Field>}
              <Field label="Tax rate %"><input type="number" min={0} max={100} className="c-input w-full" value={form.tax_rate} onChange={(e) => set("tax_rate", e.target.value)} /></Field>
            </Grid>
          </Card>

          <Card title={isQuote ? "Customer / buyer" : "Bill to"}>
            <Grid>
              <Field label={coffee ? "Company" : "Customer name"} wide><input className="c-input w-full" value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} /></Field>
              <Field label="Address" wide hint={coffee ? undefined : "Put the company name on the first line if there is one."}>
                <textarea rows={3} className="c-input w-full !h-auto py-1.5" value={form.customer_address} onChange={(e) => set("customer_address", e.target.value)} />
              </Field>
              {coffee && <Field label="Attention"><input className="c-input w-full" value={form.customer_attention} onChange={(e) => set("customer_attention", e.target.value)} placeholder="Mr. Klaus Weber (Sourcing)" /></Field>}
              <Field label={coffee ? "VAT ID" : "TIN"}><input className="c-input w-full" value={form.customer_tax_id} onChange={(e) => set("customer_tax_id", e.target.value)} /></Field>
              <Field label="Phone"><input className="c-input w-full" value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} /></Field>
              <Field label="Email" hint={coffee ? "Used to send the document; not printed on Coffee documents." : undefined}><input type="email" className="c-input w-full" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} /></Field>
            </Grid>
          </Card>

          <Card title="Lines" aside={<span className="text-[12px] text-ink-muted">Subtotal {formatMoney(form.currency, sub)} · Tax {formatMoney(form.currency, tax)} · <b className="text-ink">Total {formatMoney(form.currency, sub + tax)}</b></span>}>
            <div className="space-y-2">
              {form.lines.map((l, i) => (
                <div key={i} className="border border-line rounded-edge p-2 bg-paper">
                  <div className="flex gap-2">
                    <span className="text-[11px] text-ink-muted w-5 pt-2 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input className="c-input w-full font-medium" placeholder="Item name" value={l.name} onChange={(e) => { setLine(i, { name: e.target.value }); setDirty(true); }} />
                      <textarea rows={2} className="c-input w-full !h-auto py-1 text-[12px]" placeholder="Specification (one line each)" value={l.details} onChange={(e) => { setLine(i, { details: e.target.value }); setDirty(true); }} />
                      <div className="grid grid-cols-[1fr_0.8fr_1.3fr_1.2fr] gap-1.5 items-center">
                        <input type="number" min={1} aria-label="Quantity" className="c-input w-full" value={l.quantity} onChange={(e) => { setLine(i, { quantity: Number(e.target.value) }); setDirty(true); }} />
                        <input aria-label="Unit" placeholder="unit" className="c-input w-full" value={l.unit} onChange={(e) => { setLine(i, { unit: e.target.value }); setDirty(true); }} />
                        <input inputMode="decimal" aria-label={`Unit price (${form.currency})`} placeholder={`Unit price ${form.currency}`} className="c-input w-full text-right" value={l.price} onChange={(e) => { setLine(i, { price: e.target.value }); setDirty(true); }} />
                        <span className="text-[12px] text-right text-ink tabular-nums">{formatMoney(form.currency, (l.quantity || 0) * toMinor(form.currency, l.price))}</span>
                      </div>
                    </div>
                    {form.lines.length > 1 && (
                      <button type="button" aria-label="Remove line" onClick={() => { setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) }); setDirty(true); }} className="c-icon-btn !w-7 !h-7 shrink-0"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button type="button" className="c-btn" onClick={() => { setForm({ ...form, lines: [...form.lines, { name: "", details: "", quantity: 1, unit: coffee ? "kg" : "pcs.", price: "" }] }); setDirty(true); }}><Plus className="w-4 h-4" />Add line</button>
              {coffee
                ? [["Ocean Freight & Logistics", "Freight charges Port of Mombasa (KE) to\nport of destination including terminal handling"], ["Marine Cargo Insurance", "All-Risks Transit Coverage (110% CIF Value)"]].map(([n, d]) => (
                    <button key={n} type="button" className="c-btn c-btn-ghost text-ink-muted" onClick={() => { setForm({ ...form, lines: [...form.lines, { name: n, details: d, quantity: 1, unit: "Lot", price: "" }] }); setDirty(true); }}>+ {n}</button>
                  ))
                : FET_LINES.map((f) => (
                    <button key={f.name} type="button" title={f.fits} className="c-btn c-btn-ghost text-ink-muted" onClick={() => { setForm({ ...form, lines: [...form.lines, { name: f.name, details: FET_DETAILS, quantity: 1, unit: "pcs.", price: "" }] }); setDirty(true); }}>+ {f.name}</button>
                  ))}
            </div>
          </Card>

          <Card title={coffee ? "Payment terms & export specifications" : isQuote ? "Commercial terms" : "Payment & terms"}>
            <Grid>
              {coffee && <>
                <Field label="Incoterms"><input className="c-input w-full" value={form.incoterms} onChange={(e) => set("incoterms", e.target.value)} placeholder="CIF Hamburg (Incoterms® 2020)" /></Field>
                <Field label="Port of loading"><input className="c-input w-full" value={form.port_of_loading} onChange={(e) => set("port_of_loading", e.target.value)} /></Field>
              </>}
              <Field label="Payment terms (information box)" wide><textarea rows={2} className="c-input w-full !h-auto py-1.5" value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} /></Field>
              {(coffee || isQuote) && <>
                <Field label="Deposit %" hint="Fills {deposit} and {balance} below with the amounts.">
                  <input type="number" min={1} max={100} className="c-input w-full" value={form.deposit_percent} onChange={(e) => set("deposit_percent", e.target.value)} />
                </Field>
                <Field label={coffee ? "Payment schedule" : "Payment terms (full wording)"} wide>
                  <textarea rows={3} className="c-input w-full !h-auto py-1.5" value={form.payment_schedule} onChange={(e) => set("payment_schedule", e.target.value)} />
                </Field>
              </>}
              {coffee && <Field label="Inspection & certification" wide><textarea rows={2} className="c-input w-full !h-auto py-1.5" value={form.inspection} onChange={(e) => set("inspection", e.target.value)} /></Field>}
              {(coffee || isQuote) && <Field label={coffee ? "Shipment schedule" : "Delivery terms"} wide><textarea rows={2} className="c-input w-full !h-auto py-1.5" value={form.shipment_schedule} onChange={(e) => set("shipment_schedule", e.target.value)} /></Field>}
              {!coffee && !isQuote && <>
                <Field label="Notes (one per line)" wide hint="Leave empty to print the standard three notes."><textarea rows={3} className="c-input w-full !h-auto py-1.5" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
                <Field label="Terms & conditions (one per line)" wide hint="Leave empty to print the standard FET terms. Bank details come from Settings."><textarea rows={3} className="c-input w-full !h-auto py-1.5" value={form.terms} onChange={(e) => set("terms", e.target.value)} /></Field>
              </>}
              <Field label="Tax label (optional)" hint={coffee ? "Default: TAXES (0% EXPORT)" : "Default: TAX (0%)"}><input className="c-input w-full" value={form.tax_label} onChange={(e) => set("tax_label", e.target.value)} /></Field>
              <Field label="Total label (optional)" hint={coffee ? "Default: TOTAL (your incoterm place)" : "Default: TOTAL"}><input className="c-input w-full" value={form.total_label} onChange={(e) => set("total_label", e.target.value)} /></Field>
            </Grid>
          </Card>
        </fieldset>

        {/* ══ Preview ═══════════════════════════════════════════════════ */}
        <div className="xl:sticky xl:top-16 c-panel overflow-hidden">
          <div className="c-panel-head !py-2">
            <span className="c-panel-title">Preview, exactly as sent</span>
            <span className="flex items-center gap-2 text-[12px] text-ink-muted">
              {previewing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Updating</> : previewError ? <span className="text-alert-ink">{previewError}</span> : "Up to date"}
              <button type="button" onClick={renderPreview} aria-label="Refresh preview" className="c-icon-btn !w-7 !h-7"><RefreshCw className="w-3.5 h-3.5" /></button>
            </span>
          </div>
          <div className="bg-paper-deep h-[78vh] min-h-[520px]">
            {pdfUrl
              ? <iframe title={`${docName} preview`} src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-0" />
              : <div className="h-full flex items-center justify-center text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin mr-2" />Preparing the preview…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="c-panel">
      <div className="c-panel-head !py-2.5"><h2 className="c-panel-title">{title}</h2>{aside}</div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5">{children}</div>;
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-[11px] font-medium text-ink-muted mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-muted mt-1">{hint}</span>}
    </label>
  );
}
