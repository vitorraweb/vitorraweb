"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, FileText } from "lucide-react";
import { apiStaff, downloadStaffFile } from "@/lib/staff-auth";

type Doc = { id: number; type: string; title: string; original_name: string | null; size: number | null; created_at: string };

const TYPE_LABEL: Record<string, string> = { contract: "Contract", id: "ID", certificate: "Certificate", other: "Document" };

export default function StaffDocuments() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    apiStaff<{ data: Doc[] }>("/staff/documents").then((r) => setDocs(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const download = async (d: Doc) => {
    setDownloading(d.id);
    try { await downloadStaffFile(`/staff/documents/${d.id}/download`, d.original_name ?? d.title); }
    catch { /* ignore */ }
    finally { setDownloading(null); }
  };

  if (error) return <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>;
  if (!docs) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="max-w-2xl pb-12">
      <h2 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#1E1E1E" }}>My documents</h2>
      <p className="text-sm mb-6" style={{ color: "#999" }}>Your employment contract and HR files. These are private to you, your supervisor, and HR.</p>

      {docs.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-8 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#ddd" }} />
          <p className="text-sm" style={{ color: "#999" }}>No documents yet. HR will upload your contract and any HR files here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {docs.map((d) => (
            <div key={d.id} className="bg-white rounded-[16px] border border-black/[0.06] p-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.14)" }}>
                <FileText className="w-4 h-4" style={{ color: "#7A6020" }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#1E1E1E" }}>{d.title}</p>
                <p className="text-xs" style={{ color: "#999" }}>{TYPE_LABEL[d.type] ?? "Document"}{d.size ? ` · ${formatSize(d.size)}` : ""} · {new Date(d.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <button onClick={() => download(d)} disabled={downloading === d.id}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full shrink-0 disabled:opacity-50"
                style={{ background: "#F2F2F2", color: "#555" }}>
                {downloading === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
