"use client";

import { useEffect, useState } from "react";
import { Loader2, PenLine, Save, Check } from "lucide-react";

/**
 * Self-service email signature, shared by the admin and staff portals. The
 * caller passes its own authed JSON fetcher (apiAdmin / apiStaff) so the panel
 * stays portal-agnostic — mirrors TwoFactorPanel/SessionsPanel's contract.
 */
type Api = <T>(path: string, options?: RequestInit) => Promise<T>;

export function EmailSignaturePanel({ api }: { api: Api }) {
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ data: { email_signature?: string | null } }>("/auth/me")
      .then((r) => setSignature(r.data.email_signature ?? ""))
      .catch(() => setSignature(""));
  }, [api]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await api("/auth/signature", { method: "PUT", body: JSON.stringify({ signature: signature || null }) });
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
        Appended to replies you send to customers from Customers → Conversation. Leave blank to use the default (your name, Vitorra Holdings).
      </p>

      {signature === null ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : (
        <>
          <textarea value={signature} onChange={(e) => setSignature(e.target.value)}
            placeholder={"— Thurayya Nakayima\nSenior Marketing Officer, Vitorra Holdings"}
            maxLength={500}
            className="w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none min-h-24 focus:border-[#C5B27A]"
            style={{ borderColor: "rgba(0,0,0,0.12)" }} />
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
