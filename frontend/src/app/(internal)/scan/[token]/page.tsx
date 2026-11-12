"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImagePlus, Loader2, Check, AlertTriangle, RotateCw } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { prepareReceipt } from "@/lib/receipt-image";

/* ─── Scan receipts with a phone ──────────────────────────────────────────────
   Opened from the QR code in Accounting → Receipts. No sign-in: the 30-minute
   link is the key, and all it can do is add receipts to Finance's inbox.
   Take a photo (or several), and each one is shrunk, uploaded and kept —
   encrypted — straight away; the computer's inbox shows them as they land. */

type Item = { id: number; name: string; preview: string | null; state: "preparing" | "uploading" | "saved" | "failed"; error?: string; file?: File };
type Info = { for: string | null; expires_at: string; uploaded: number; remaining: number };

export default function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<Info | null>(null);
  const [expired, setExpired] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [minutes, setMinutes] = useState<number | null>(null);
  const seq = useRef(0);
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/scan/${token}`, { headers: { Accept: "application/json" } })
      .then(async (r) => (r.ok ? setInfo((await r.json()).data) : setExpired((await r.json().catch(() => ({}))).message ?? "This link is not valid.")))
      .catch(() => setExpired("Could not reach Vitorra. Check your connection and reload."));
  }, [token]);

  useEffect(() => {
    if (!info) return;
    const tick = () => setMinutes(Math.max(0, Math.round((new Date(info.expires_at).getTime() - Date.now()) / 60000)));
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, [info]);

  const patch = (id: number, p: Partial<Item>) => setItems((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const send = useCallback(async (id: number, file: File) => {
    patch(id, { state: "uploading", error: undefined });
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await fetch(`${API_BASE_URL}/scan/${token}`, { method: "POST", body: form, headers: { Accept: "application/json" } });
      if (r.status === 410) { setExpired((await r.json()).message); patch(id, { state: "failed", error: "Link expired" }); return; }
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message ?? "Upload failed");
      patch(id, { state: "saved", file: undefined });
    } catch (e) {
      patch(id, { state: "failed", error: e instanceof Error ? e.message : "Upload failed", file });
    }
  }, [token]);

  const add = async (files: FileList | null) => {
    if (!files) return;
    for (const raw of Array.from(files)) {
      const id = ++seq.current;
      setItems((list) => [{ id, name: raw.name || "Receipt", preview: null, state: "preparing" }, ...list]);
      const file = await prepareReceipt(raw);
      patch(id, { preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null });
      await send(id, file);
    }
    if (camera.current) camera.current.value = "";
    if (library.current) library.current.value = "";
  };

  const saved = items.filter((i) => i.state === "saved").length;

  return (
    <main className="min-h-screen" style={{ background: "#F2F3F5", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif", color: "#1F2328" }}>
      <header className="flex items-center gap-3 px-5 py-4" style={{ background: "#1E1E1E", color: "#F3F1EC" }}>
        <Image src="/logo.png" alt="" width={28} height={28} />
        <div>
          <p className="text-[16px] font-semibold leading-tight">Scan receipts</p>
          <p className="text-[13px]" style={{ color: "#BDB8AD" }}>Vitorra Finance</p>
        </div>
      </header>

      <div className="max-w-[520px] mx-auto px-5 py-6">
        {expired ? (
          <div className="rounded-lg bg-white p-5 border" style={{ borderColor: "#E1E4E8" }}>
            <AlertTriangle className="w-6 h-6 mb-2" style={{ color: "#B42318" }} />
            <p className="text-[16px] font-semibold">This link can&apos;t be used</p>
            <p className="text-[15px] mt-1" style={{ color: "#3D434B" }}>{expired}</p>
            {saved > 0 && <p className="text-[15px] mt-3" style={{ color: "#1F7A3A" }}>The {saved} receipt{saved === 1 ? "" : "s"} you already sent are safely saved.</p>}
          </div>
        ) : !info ? (
          <p className="flex items-center gap-2 text-[15px]" style={{ color: "#59606A" }}><Loader2 className="w-4 h-4 animate-spin" />Opening…</p>
        ) : (
          <>
            <p className="text-[15px]" style={{ color: "#3D434B" }}>
              Receipts go straight to the Finance inbox{info.for ? <> for <strong>{info.for}</strong></> : ""}. This link works for {minutes ?? "…"} more minute{minutes === 1 ? "" : "s"}.
            </p>

            <button type="button" onClick={() => camera.current?.click()} className="mt-5 w-full flex items-center justify-center gap-3 rounded-xl text-white text-[18px] font-semibold py-5 active:scale-[.99]" style={{ background: "#7A6020" }}>
              <Camera className="w-7 h-7" />Take a photo of a receipt
            </button>
            <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => add(e.target.files)} />

            <button type="button" onClick={() => library.current?.click()} className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[16px] font-medium py-4 border" style={{ borderColor: "#C7CCD3" }}>
              <ImagePlus className="w-5 h-5" />Choose photos or PDFs
            </button>
            <input ref={library} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => add(e.target.files)} />

            <p className="text-[13px] mt-4" style={{ color: "#59606A" }}>Flat on a table, good light, the whole receipt in the frame. Send as many as you like; each one is saved as soon as it shows a tick.</p>

            {items.length > 0 && (
              <div className="mt-6">
                <p className="text-[15px] font-semibold mb-2">{saved} saved{items.length > saved ? ` · ${items.length - saved} in progress` : ""}</p>
                <ul className="space-y-2">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 rounded-lg bg-white p-2.5 border" style={{ borderColor: "#E1E4E8" }}>
                      <span className="w-12 h-12 rounded-md overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#F2F3F5" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {i.preview ? <img src={i.preview} alt="" className="w-full h-full object-cover" /> : <span className="text-[11px]" style={{ color: "#59606A" }}>PDF</span>}
                      </span>
                      <span className="flex-1 min-w-0 text-[14px] truncate">{i.name}</span>
                      {i.state === "saved" && <span className="flex items-center gap-1 text-[14px] font-medium" style={{ color: "#1F7A3A" }}><Check className="w-5 h-5" />Saved</span>}
                      {(i.state === "uploading" || i.state === "preparing") && <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#59606A" }} />}
                      {i.state === "failed" && (
                        <button type="button" onClick={() => i.file && send(i.id, i.file)} className="flex items-center gap-1 text-[14px] font-medium" style={{ color: "#B42318" }} title={i.error}>
                          <RotateCw className="w-4 h-4" />Retry
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
