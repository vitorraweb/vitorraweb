"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2, PenLine, Save, Check } from "lucide-react";

/**
 * Self-service email signature, shared by the admin and staff portals. The
 * caller passes its own authed JSON fetcher (apiAdmin / apiStaff) so the panel
 * stays portal-agnostic — mirrors TwoFactorPanel/SessionsPanel's contract.
 *
 * The editor is a plain contentEditable, deliberately left to handle paste
 * natively: when someone copies their signature out of Outlook, the clipboard
 * carries real HTML (fonts, colors, an inline logo as a data: image), and the
 * browser already reproduces that faithfully on paste into contentEditable —
 * intercepting it and rebuilding formatting ourselves would only lose fidelity.
 * The one gap native paste doesn't reliably cover is a bare image file with no
 * HTML alongside it (e.g. a copied screenshot), which the onPaste handler below
 * inserts manually. The server (App\Support\SignatureHtml) is what actually
 * decides what's safe to keep — this component just captures what was pasted.
 */
type Api = <T>(path: string, options?: RequestInit) => Promise<T>;

export function EmailSignaturePanel({ api }: { api: Api }) {
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    api<{ data: { email_signature?: string | null } }>("/auth/me")
      .then((r) => setSignature(r.data.email_signature ?? ""))
      .catch(() => setSignature(""));
  }, [api]);

  const initEditor = (el: HTMLDivElement | null) => {
    editorRef.current = el;
    if (el && !initialized.current && signature !== null) {
      el.innerHTML = signature;
      initialized.current = true;
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // HTML on the clipboard (Outlook, Word, another browser tab) — let the
    // browser paste it natively so it lands exactly as copied.
    if (e.clipboardData.getData("text/html")) return;

    // No HTML: a raw image file (e.g. a copied screenshot) needs manual
    // insertion, since some browsers won't otherwise drop it into the editor.
    const imageItem = Array.from(e.clipboardData.items).find(
      (item) => item.kind === "file" && item.type.startsWith("image/")
    );
    if (!imageItem) return; // plain text — default paste handles this fine

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.execCommand("insertImage", false, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true); setSaved(false);
    const html = editorRef.current?.innerHTML ?? "";
    try {
      await api("/auth/signature", { method: "PUT", body: JSON.stringify({ signature: html || null }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mt-5">
      <div className="flex items-center gap-2 mb-1">
        <PenLine className="w-4 h-4" style={{ color: "#C5B27A" }} />
        <h2 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "#1E1E1E" }}>Email signature</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: "#999" }}>
        Appended to replies you send to customers from Customers → Conversation. Copy your signature from Outlook and paste it below — formatting and images come across exactly as they look there. Leave blank to use the default (your name, Vitorra Holdings).
      </p>

      {signature === null ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : (
        <>
          <div
            ref={initEditor}
            contentEditable
            suppressContentEditableWarning
            onPaste={onPaste}
            data-placeholder="Paste your Outlook signature here…"
            className="signature-editable w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none min-h-24 focus:border-[#C5B27A]"
            style={{ borderColor: "rgba(0,0,0,0.12)" }}
          />
          <style>{`
            .signature-editable:empty::before {
              content: attr(data-placeholder);
              color: #b3b3b3;
            }
            .signature-editable img { max-width: 100%; height: auto; }
          `}</style>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ background: "#1E1E1E", color: "#fff" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save signature
            </button>
            {saved && <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#16A34A" }}><Check className="w-3.5 h-3.5" />Saved</span>}
          </div>
        </>
      )}
    </div>
  );
}
