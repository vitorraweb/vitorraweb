"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Check, Copy, Download, Loader2, RefreshCw, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { apiAdmin, downloadFile, fetchPdf } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { CURRENCIES, formatMoney, toMinor } from "@/lib/documents";
import {
  STATUS_LABEL, contractFromRecord, contractPayload, fmtDateTime,
  type Clause, type ContractForm, type ContractRecord,
} from "@/lib/contracts";

/* ─── Sales contract editor ───────────────────────────────────────────────────
   The client's details and every clause on the left; on the right the exact
   PDF the client receives, re-rendered by the server after each change. Send
   emails the client a private signing link (48 hours, one signature). Editing
   a contract that is out for signature cancels that link, so a client can
   never sign wording that has since changed.                                */

const API = "/admin/contracts";

export default function ContractEditor({ id, quotationId }: { id?: number; quotationId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<ContractForm | null>(null);
  const [record, setRecord] = useState<ContractRecord | null>(null);
  const [standard, setStandard] = useState<Clause[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [link, setLink] = useState<{ url: string; expires: string } | null>(null);
  const [copied, setCopied] = useState(false);

  /* ── load ── */
  useEffect(() => {
    const url = id ? `${API}/${id}` : `${API}/defaults${quotationId ? `?quotation=${quotationId}` : ""}`;
    apiAdmin<{ data: ContractRecord & Record<string, unknown> }>(url)
      .then((r) => {
        setForm(contractFromRecord(r.data));
        setStandard((r.data.template_clauses as Clause[]) ?? []);
        if (id) setRecord(r.data);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load."));
  }, [id, quotationId]);

  const locked = !!record && ["signed", "void"].includes(record.status);
  const out = !!record && ["sent", "viewed"].includes(record.status) && record.is_awaiting_signature;
  const set = <K extends keyof ContractForm>(k: K, v: ContractForm[K]) => { setForm((f) => (f ? { ...f, [k]: v } : f)); setDirty(true); };
  const setClause = (i: number, patch: Partial<Clause>) => {
    setForm((f) => (f ? { ...f, clauses: f.clauses.map((c, j) => (j === i ? { ...c, ...patch } : c)) } : f));
    setDirty(true);
  };

  /* ── live preview ── */
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const payload = useMemo(() => (form ? contractPayload(form) : null), [form]);
  const number = record?.number ?? null;

  const renderPreview = useCallback(async () => {
    if (!payload) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPreviewing(true);
    try {
      const blob = await fetchPdf(`${API}/preview`, { ...payload, number: number ?? "DRAFT" }, ctrl.signal);
      const url = URL.createObjectURL(blob);
      setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
      setPreviewError("");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setPreviewError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      if (abortRef.current === ctrl) setPreviewing(false);
    }
  }, [payload, number]);

  useEffect(() => {
    if (!payload || locked) return;
    const t = setTimeout(renderPreview, 800);
    return () => clearTimeout(t);
  }, [payload, renderPreview, locked]);
  useEffect(() => () => { setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return null; }); }, []);

  /* ── actions ── */
  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." }); }
    finally { setBusy(null); }
  };

  /** Saves the form; returns the id and the server's note (e.g. that a sent link was cancelled). */
  const persist = async (): Promise<{ id: number; note?: string }> => {
    if (!form || !payload) throw new Error("Nothing to save.");
    if (!form.buyer_name.trim()) throw new Error("Add the client's name first.");
    const body = JSON.stringify({ ...payload, quotation_id: quotationId ?? null });
    if (id) {
      const r = await apiAdmin<{ data: ContractRecord; message?: string }>(`${API}/${id}`, { method: "PUT", body });
      setRecord(r.data); setDirty(false);
      if (r.message && r.message !== "Saved.") setLink(null);
      return { id, note: r.message };
    }
    const r = await apiAdmin<{ data: ContractRecord }>(API, { method: "POST", body });
    setDirty(false);
    return { id: r.data.id };
  };

  const save = () => run("save", async () => {
    const saved = await persist();
    if (!id) router.replace(`/admin/contracts/${saved.id}`);
    else setMsg({ ok: true, text: saved.note ?? "Saved." });
  });

  const send = () => run("send", async () => {
    if (!form?.buyer_email.trim()) throw new Error("Add the client's email first.");
    const savedId = dirty || !id ? (await persist()).id : id;
    const r = await apiAdmin<{ data: ContractRecord; sign_url: string; expires_at: string; mailed: boolean }>(`${API}/${savedId}/send`, { method: "POST" });
    setConfirmSend(false);
    if (!id) { router.replace(`/admin/contracts/${savedId}`); return; }
    setRecord(r.data);
    setLink({ url: r.sign_url, expires: r.expires_at });
    setMsg(r.mailed
      ? { ok: true, text: `Sent to ${r.data.buyer_email}.` }
      : { ok: false, text: "The email could not be sent right now. The link below works: share it with the client, or press Send new link to try the email again." });
  });

  const voidIt = () => run("void", async () => {
    if (!id) return;
    const r = await apiAdmin<{ data: ContractRecord }>(`${API}/${id}/void`, { method: "POST" });
    setRecord(r.data); setLink(null);
    setMsg({ ok: true, text: "Contract voided. Its signing link no longer works." });
  });

  const download = () => run("pdf", async () => {
    if (!record) return;
    await downloadFile(`${API}/${record.id}/pdf`, record.status === "signed" ? `${record.number}-signed.pdf` : `${record.number}.pdf`);
  });

  const copyLink = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link.url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };

  if (loadError) return <p className="text-[13px] text-alert-ink">{loadError}</p>;
  if (!form) return <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  const totalShown = form.total_amount ? formatMoney(form.currency, toMinor(form.currency, form.total_amount)) : "—";
  const statusKey = record?.is_expired ? "expired" : record?.status;

  return (
    <div className="pb-10">
      <Link href="/admin/contracts" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink mb-3">
        <ArrowLeft className="w-3.5 h-3.5" />All contracts
      </Link>
      <PageHeader
        title={record ? record.number : "New contract"}
        subtitle={`FET Module Sales and Installation Agreement${form.buyer_name ? ` · ${form.buyer_name}` : ""} · ${totalShown}${record?.quotation ? ` · from quotation ${record.quotation.number}` : ""}`}
        actions={<>
          {record && statusKey && <StatusBadge status={statusKey} label={record.is_expired ? "Link expired" : STATUS_LABEL[record.status]} />}
          {record && <button onClick={download} disabled={!!busy} className="c-btn">{busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{record.status === "signed" ? "Signed PDF" : "PDF"}</button>}
          {!locked && <button onClick={() => setConfirmSend(true)} disabled={!!busy || !form.buyer_email} title={form.buyer_email ? "" : "Add the client's email to send"} className="c-btn"><Send className="w-4 h-4" />{record?.sent_at ? "Send new link" : "Send for signature"}</button>}
          {!locked && <button onClick={save} disabled={!!busy} className="c-btn c-btn-primary">{busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{id ? "Save" : "Save draft"}</button>}
        </>}
      />

      {confirmSend && (
        <div className="c-panel p-3 mb-3 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-ink">
            Email this contract to <b>{form.buyer_email}</b> with a private signing link? It works for 48 hours and for one signature.
            {out && " The link sent earlier will stop working."}
            {dirty && " Your changes are saved first."}
          </span>
          <span className="ml-auto flex gap-2">
            <button onClick={send} disabled={!!busy} className="c-btn c-btn-primary">{busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send</button>
            <button onClick={() => setConfirmSend(false)} disabled={!!busy} className="c-btn">Cancel</button>
          </span>
        </div>
      )}

      {msg && <p className={`text-[13px] mb-3 ${msg.ok ? "text-ok-ink" : "text-alert-ink"}`}>{msg.text}</p>}

      {link && (
        <div className="c-panel p-3 mb-3 text-[13px]">
          <p className="text-ink mb-2">Signing link. You can also share it on WhatsApp. It is shown only now, and expires {fmtDateTime(link.expires)}.</p>
          <div className="flex gap-2">
            <input readOnly value={link.url} className="c-input flex-1 font-mono text-[12px]" onFocus={(e) => e.currentTarget.select()} />
            <button onClick={copyLink} className="c-btn">{copied ? <Check className="w-4 h-4 text-ok-ink" /> : <Copy className="w-4 h-4" />}{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
      )}

      {record && <StatusPanel r={record} onVoid={voidIt} busy={busy} />}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-4 items-start">
        <fieldset disabled={locked} className="space-y-3 min-w-0">
          <Card title="Client (buyer)">
            <Grid>
              <Field label="Name / company" wide><input className="c-input w-full" value={form.buyer_name} onChange={(e) => set("buyer_name", e.target.value)} /></Field>
              <Field label="Email (the signing link goes here)"><input type="email" className="c-input w-full" value={form.buyer_email} onChange={(e) => set("buyer_email", e.target.value)} /></Field>
              <Field label="Telephone"><input className="c-input w-full" value={form.buyer_phone} onChange={(e) => set("buyer_phone", e.target.value)} /></Field>
              <Field label="Contact person"><input className="c-input w-full" value={form.buyer_contact} onChange={(e) => set("buyer_contact", e.target.value)} /></Field>
              <Field label="Registration number (if applicable)"><input className="c-input w-full" value={form.buyer_registration} onChange={(e) => set("buyer_registration", e.target.value)} /></Field>
              <Field label="Address" wide><textarea rows={2} className="c-input w-full !h-auto py-1.5" value={form.buyer_address} onChange={(e) => set("buyer_address", e.target.value)} /></Field>
            </Grid>
          </Card>

          <Card title="Product, vehicle and installation">
            <Grid>
              <Field label="Model number"><input className="c-input w-full" value={form.model_number} onChange={(e) => set("model_number", e.target.value)} placeholder="e.g. FET-PRO-FIII" /></Field>
              <Field label="Serial number"><input className="c-input w-full" value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} /></Field>
              <Field label="Quantity"><input type="number" min={1} className="c-input w-full" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
              <Field label="Registration number(s)"><input className="c-input w-full" value={form.registration_numbers} onChange={(e) => set("registration_numbers", e.target.value)} /></Field>
              <Field label="Vehicle(s) / equipment description" wide><textarea rows={2} className="c-input w-full !h-auto py-1.5" value={form.vehicle_description} onChange={(e) => set("vehicle_description", e.target.value)} /></Field>
              <Field label="Chassis / VIN number(s)"><input className="c-input w-full" value={form.chassis_numbers} onChange={(e) => set("chassis_numbers", e.target.value)} /></Field>
              <Field label="Engine number(s)"><input className="c-input w-full" value={form.engine_numbers} onChange={(e) => set("engine_numbers", e.target.value)} /></Field>
              <Field label="Installation location"><input className="c-input w-full" value={form.installation_location} onChange={(e) => set("installation_location", e.target.value)} /></Field>
              <Field label="Installation date"><input type="date" className="c-input w-full" value={form.installation_date} onChange={(e) => set("installation_date", e.target.value)} /></Field>
            </Grid>
          </Card>

          <Card title="Price and payment">
            <Grid>
              <Field label="Currency">
                <select className="c-select w-full" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Note on the price" hint="e.g. Inclusive of 18% VAT"><input className="c-input w-full" value={form.price_note} onChange={(e) => set("price_note", e.target.value)} /></Field>
              <Field label="FET module unit cost"><input inputMode="decimal" className="c-input w-full" value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} /></Field>
              <Field label="Total amount payable"><input inputMode="decimal" className="c-input w-full" value={form.total_amount} onChange={(e) => set("total_amount", e.target.value)} /></Field>
              <Field label="Payment option">
                <select className="c-select w-full" value={form.payment_option} onChange={(e) => set("payment_option", e.target.value as ContractForm["payment_option"])}>
                  <option value="advance">100% advance payment</option>
                  <option value="instalment">Monthly instalments</option>
                </select>
              </Field>
              {form.payment_option === "instalment" && (
                <Field label="Monthly instalment"><input inputMode="decimal" className="c-input w-full" value={form.instalment_amount} onChange={(e) => set("instalment_amount", e.target.value)} /></Field>
              )}
              <Field label="Account name"><input className="c-input w-full" value={form.bank_account_name} onChange={(e) => set("bank_account_name", e.target.value)} /></Field>
              <Field label="Bank"><input className="c-input w-full" value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} /></Field>
              <Field label="Account number"><input className="c-input w-full" value={form.bank_account_number} onChange={(e) => set("bank_account_number", e.target.value)} /></Field>
              <Field label="Mobile money"><input className="c-input w-full" value={form.mobile_money} onChange={(e) => set("mobile_money", e.target.value)} /></Field>
            </Grid>
          </Card>

          <Card title="Agreement and seller">
            <Grid>
              <Field label="Agreement date" hint="Leave empty to use the date the client signs."><input type="date" className="c-input w-full" value={form.agreement_date} onChange={(e) => set("agreement_date", e.target.value)} /></Field>
              <Field label="Seller company"><input className="c-input w-full" value={form.seller_company} onChange={(e) => set("seller_company", e.target.value)} /></Field>
              <Field label="Represented by"><input className="c-input w-full" value={form.seller_name} onChange={(e) => set("seller_name", e.target.value)} /></Field>
              <Field label="Title"><input className="c-input w-full" value={form.seller_title} onChange={(e) => set("seller_title", e.target.value)} /></Field>
              <Field label="Seller address" wide><textarea rows={3} className="c-input w-full !h-auto py-1.5" value={form.seller_address} onChange={(e) => set("seller_address", e.target.value)} /></Field>
            </Grid>
          </Card>

          <Card title="Clauses" aside={<span className="text-[12px] text-ink-muted">One paragraph per line; start a line with &quot;- &quot; for a bullet.</span>}>
            <div className="space-y-3">
              {form.clauses.map((c, i) => {
                const std = standard.find((s) => s.key === c.key);
                const changed = !!std && (std.title !== c.title || std.body !== c.body);
                return (
                  <div key={c.key} className="border border-line p-2.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12px] text-ink-muted w-6 shrink-0">{i + 1}.</span>
                      <input className="c-input flex-1 font-medium" value={c.title} onChange={(e) => setClause(i, { title: e.target.value })} aria-label={`Clause ${i + 1} title`} />
                      {changed && <span className="text-[11px] text-gold-ink whitespace-nowrap">Changed from standard</span>}
                      {changed && !locked && (
                        <button type="button" onClick={() => setClause(i, { title: std.title, body: std.body })} className="c-icon-btn" title="Reset to the standard wording" aria-label="Reset clause"><RotateCcw className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    <textarea rows={Math.min(12, Math.max(2, c.body.split("\n").length + 1))} className="c-input w-full !h-auto py-1.5 text-[12.5px]" value={c.body} onChange={(e) => setClause(i, { body: e.target.value })} aria-label={`Clause ${i + 1} text`} />
                    {["product", "price", "payment"].includes(c.key) && (
                      <p className="text-[11px] text-ink-muted mt-1">The {c.key === "product" ? "product and vehicle" : c.key === "price" ? "price" : "payment and bank"} details above print with this clause.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </fieldset>

        <div className="xl:sticky xl:top-16 c-panel overflow-hidden">
          <div className="c-panel-head !py-2">
            <span className="c-panel-title">{locked ? "Contract" : "Preview, exactly as the client sees it"}</span>
            {!locked && (
              <span className="flex items-center gap-2 text-[12px] text-ink-muted">
                {previewing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Updating</> : previewError ? <span className="text-alert-ink">{previewError}</span> : "Up to date"}
                <button type="button" onClick={renderPreview} aria-label="Refresh preview" className="c-icon-btn !w-7 !h-7"><RefreshCw className="w-3.5 h-3.5" /></button>
              </span>
            )}
          </div>
          <div className="bg-paper-deep h-[78vh] min-h-[520px]">
            {locked
              ? <div className="h-full flex flex-col items-center justify-center gap-3 text-[13px] text-ink-muted p-6 text-center">
                  This contract is {record?.status} and can no longer be changed.
                  <button onClick={download} className="c-btn"><Download className="w-4 h-4" />{record?.status === "signed" ? "Open the signed PDF" : "Open the PDF"}</button>
                </div>
              : pdfUrl
                ? <iframe title="Contract preview" src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-0" />
                : <div className="h-full flex items-center justify-center text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin mr-2" />Preparing the preview…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Where the contract stands with the client. */
function StatusPanel({ r, onVoid, busy }: { r: ContractRecord; onVoid: () => void; busy: string | null }) {
  const canVoid = !["signed", "void"].includes(r.status);
  let body: React.ReactNode = null;
  if (r.status === "signed") {
    body = (
      <div className="text-[13px]">
        <p className="flex items-center gap-1.5 text-ok-ink font-medium mb-2"><ShieldCheck className="w-4 h-4" />Signed by {r.signer_name}{r.signer_position ? `, ${r.signer_position}` : ""} on {fmtDateTime(r.signed_at)}</p>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-1 text-[12.5px]">
          <dt className="text-ink-muted">Link sent to</dt><dd>{r.sent_to} on {fmtDateTime(r.sent_at)}{r.sent_by ? ` by ${r.sent_by}` : ""}</dd>
          <dt className="text-ink-muted">First opened</dt><dd>{fmtDateTime(r.viewed_at)}</dd>
          <dt className="text-ink-muted">Signature</dt><dd>{r.signature_type === "drawn" ? "Drawn on screen" : "Typed name"}</dd>
          <dt className="text-ink-muted">IP address</dt><dd>{r.signer_ip}</dd>
          <dt className="text-ink-muted">Fingerprint</dt><dd className="font-mono text-[11px] break-all">{r.signed_hash}</dd>
        </dl>
      </div>
    );
  } else if (r.status === "declined") {
    body = <p className="text-[13px]"><span className="text-alert-ink font-medium">Declined by the client</span> on {fmtDateTime(r.declined_at)}{r.decline_reason ? `: "${r.decline_reason}"` : "."} Change the contract and send it again if needed.</p>;
  } else if (r.is_expired) {
    body = <p className="text-[13px]"><span className="text-alert-ink font-medium">The signing link expired</span> on {fmtDateTime(r.sign_expires_at)} without a signature. Press &quot;Send new link&quot; to send a fresh one.</p>;
  } else if (r.is_awaiting_signature) {
    body = <p className="text-[13px]">Waiting for the client. Link sent to <b>{r.sent_to}</b> on {fmtDateTime(r.sent_at)}{r.sent_by ? ` by ${r.sent_by}` : ""}; {r.viewed_at ? `opened ${fmtDateTime(r.viewed_at)}` : "not opened yet"}. Expires {fmtDateTime(r.sign_expires_at)}. Saving a change cancels this link.</p>;
  } else if (r.status === "void") {
    body = <p className="text-[13px] text-ink-muted">This contract is void.</p>;
  }
  if (!body && !canVoid) return null;
  return (
    <div className="c-panel p-3 mb-3 flex flex-wrap items-start gap-3">
      <div className="flex-1 min-w-0">{body ?? <p className="text-[13px] text-ink-muted">Draft. Fill in the client&apos;s details, check the preview, then send it for signature.</p>}</div>
      {canVoid && <button onClick={onVoid} disabled={!!busy} className="c-btn c-btn-ghost text-ink-muted">{busy === "void" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}Void</button>}
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
