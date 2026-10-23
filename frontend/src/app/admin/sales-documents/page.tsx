"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, Lock } from "lucide-react";
import { apiAdmin, downloadFile, fetchBlob } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/admin/admin-ui";

/* ─── Sales documents ─────────────────────────────────────────────────────────
   Internal contract templates for the sales team to read and work from: the
   PDF opens in the page, the Word original downloads to be filled in. Served
   only to signed-in staff and never from the public site, as they carry the
   company's bank details and terms still under review.                       */

type SalesDoc = {
  key: string; title: string; product: string; description: string;
  status: string; added: string; formats: ("pdf" | "docx")[];
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function SalesDocumentsPage() {
  const [docs, setDocs] = useState<SalesDoc[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    apiAdmin<{ data: SalesDoc[] }>("/admin/sales-documents")
      .then((r) => { setDocs(r.data); if (r.data[0]?.formats.includes("pdf")) setActive(r.data[0].key); })
      .catch((e) => { setDocs([]); setError(e instanceof Error ? e.message : "Could not load documents."); });
  }, []);

  useEffect(() => {
    if (!active) return;
    let url: string | null = null;
    setViewing(true); setError("");
    fetchBlob(`/admin/sales-documents/${active}/pdf`)
      .then((b) => { url = URL.createObjectURL(b); setPdfUrl(url); })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not open the document."))
      .finally(() => setViewing(false));
    return () => { if (url) URL.revokeObjectURL(url); setPdfUrl(null); };
  }, [active]);

  const download = async (d: SalesDoc) => {
    setBusy(d.key);
    try { await downloadFile(`/admin/sales-documents/${d.key}/docx`, `${d.key}.docx`); }
    catch { setError("Download failed."); }
    finally { setBusy(null); }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Sales documents" subtitle="Contract templates for the sales team. Internal only: do not forward the files outside the company." />

      {docs === null ? (
        <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : docs.length === 0 ? (
        <Empty label={error || "No documents yet."} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-4 items-start">
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.key}>
                <div className={`border p-4 bg-white ${active === d.key ? "border-ink" : "border-line"}`}>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gold-ink shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-ink">{d.title}</p>
                      <p className="text-[12px] text-ink-muted mt-0.5">{d.product} · {d.status} · added {fmt(d.added)}</p>
                      <p className="text-[12.5px] text-ink-muted mt-2">{d.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {d.formats.includes("pdf") && (
                      <button onClick={() => setActive(d.key)} disabled={active === d.key} className="c-btn">Read</button>
                    )}
                    {d.formats.includes("docx") && (
                      <button onClick={() => download(d)} disabled={busy === d.key} className="c-btn">
                        {busy === d.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Word file
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
            <li className="flex items-start gap-2 text-[12px] text-ink-muted px-1 pt-1">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Visible to sales, marketing, quotations and finance staff only. Every open and download is recorded.
            </li>
          </ul>

          <div className="border border-line bg-white min-h-[70vh]">
            {error && <p className="text-[13px] text-alert-ink p-4">{error}</p>}
            {viewing && <div className="flex items-center gap-2 text-[13px] text-ink-muted p-4"><Loader2 className="w-4 h-4 animate-spin" />Opening…</div>}
            {pdfUrl && <iframe src={pdfUrl} title="Document" className="w-full h-[80vh] block" />}
          </div>
        </div>
      )}
    </div>
  );
}
