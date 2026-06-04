"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Upload, Copy, Check, Trash2, FileText, Video } from "lucide-react";
import { apiAdmin, uploadAdmin } from "@/lib/auth";
import { PageHeader, Empty, type Paginated } from "@/components/admin/admin-ui";

type MediaItem = {
  id: number; filename: string; original_name: string; path: string; url: string;
  type: string; mime: string | null; size: number; uploaded_by: string | null;
};

const TYPES = ["", "image", "pdf", "video"];

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [list, setList]       = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType]       = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]         = useState("");
  const [copied, setCopied]   = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const q = type ? `?type=${type}` : "";
      const res = await apiAdmin<Paginated<MediaItem>>(`/admin/media${q}`);
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const select = (t: string) => { setLoading(true); setType(t); };

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true); setMsg("");
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files[]", f));
      const res = await uploadAdmin<{ data: MediaItem[] }>("/admin/media", form);
      setMsg(`Uploaded ${res.data.length} file${res.data.length === 1 ? "" : "s"}.`);
      if (fileRef.current) fileRef.current.value = "";
      setLoading(true); load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUploading(false); }
  };

  const copy = async (m: MediaItem) => {
    try { await navigator.clipboard.writeText(m.url); setCopied(m.id); setTimeout(() => setCopied(null), 1500); } catch { /* */ }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this file? Anything using it will break.")) return;
    try { await apiAdmin(`/admin/media/${id}`, { method: "DELETE" }); setList((l) => l.filter((m) => m.id !== id)); }
    catch { load(); }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Media library" subtitle="Upload images, PDFs, and videos — then copy a URL to use anywhere." />
        <div>
          <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,.mp4,.webm" className="hidden" onChange={(e) => upload(e.target.files)} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#1E1E1E", color: "#fff", opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Upload
          </button>
        </div>
      </div>

      {msg && <p className="text-sm mb-4" style={{ color: "#7A6020" }}>{msg}</p>}

      <div className="flex flex-wrap gap-2 mb-5">
        {TYPES.map((t) => (
          <button key={t || "all"} onClick={() => select(t)} className="text-xs font-semibold px-3.5 py-2 rounded-full capitalize transition-colors" style={{ background: type === t ? "#1E1E1E" : "#FFFFFF", color: type === t ? "#FFFFFF" : "#777777", border: "1px solid rgba(0,0,0,0.06)" }}>
            {t || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No media yet. Upload your first file." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((m) => (
            <div key={m.id} className="bg-white rounded-[16px] border border-black/[0.05] overflow-hidden flex flex-col">
              <div className="aspect-[4/3] flex items-center justify-center" style={{ background: "#F2F2F2" }}>
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.original_name} className="w-full h-full object-cover" />
                ) : m.type === "video" ? (
                  <Video className="w-10 h-10" style={{ color: "#BBB" }} />
                ) : (
                  <FileText className="w-10 h-10" style={{ color: "#BBB" }} />
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-xs font-semibold truncate" style={{ color: "#1E1E1E" }} title={m.original_name}>{m.original_name}</p>
                <p className="text-[11px] mb-3" style={{ color: "#999" }}>{m.type} · {fmtSize(m.size)}</p>
                <div className="mt-auto flex items-center gap-1.5">
                  <button onClick={() => copy(m)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
                    {copied === m.id ? <><Check className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy URL</>}
                  </button>
                  <button onClick={() => remove(m.id)} aria-label="Delete" className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
