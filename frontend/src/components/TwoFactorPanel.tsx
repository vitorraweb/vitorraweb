"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, ShieldCheck, ShieldOff, Check, Copy } from "lucide-react";

/**
 * Self-service two-factor setup, shared by the admin and staff portals. The
 * caller passes its own authed JSON fetcher (apiAdmin / apiStaff) so the panel
 * stays portal-agnostic.
 */
type Api = <T>(path: string, options?: RequestInit) => Promise<T>;

export function TwoFactorPanel({ api }: { api: Api }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Enrolment state
  const [setup, setSetup] = useState<{ secret: string; qr_code: string } | null>(null);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState<string[] | null>(null);

  // Disable state
  const [disabling, setDisabling] = useState(false);
  const [pw, setPw] = useState("");

  useEffect(() => {
    api<{ data: { two_factor_enabled?: boolean } }>("/auth/me")
      .then((r) => setEnabled(!!r.data.two_factor_enabled))
      .catch(() => setEnabled(false));
  }, [api]);

  const begin = async () => {
    setError(""); setBusy(true);
    try {
      const r = await api<{ data: { secret: string; qr_code: string } }>("/auth/2fa/setup", { method: "POST" });
      setSetup(r.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start setup."); }
    finally { setBusy(false); }
  };

  const confirm = async () => {
    setError(""); setBusy(true);
    try {
      const r = await api<{ recovery_codes: string[] }>("/auth/2fa/confirm", { method: "POST", body: JSON.stringify({ code }) });
      setRecovery(r.recovery_codes);
      setSetup(null); setCode(""); setEnabled(true);
    } catch (e) { setError(e instanceof Error ? e.message : "That code wasn't valid."); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    setError(""); setBusy(true);
    try {
      await api("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ password: pw, code }) });
      setEnabled(false); setDisabling(false); setPw(""); setCode("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not turn off two-factor."); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mt-5">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4" style={{ color: "#C5B27A" }} />
        <h2 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "#1E1E1E" }}>Two-factor authentication</h2>
        {enabled !== null && (
          <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={enabled ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" } : { background: "#F2F2F2", color: "#999" }}>
            {enabled ? "On" : "Off"}
          </span>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: "#999" }}>
        Protects your account if your password is ever stolen. Use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy).
      </p>

      {enabled === null ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : recovery ? (
        /* One-time recovery codes — shown immediately after enabling. */
        <div>
          <div className="rounded-xl px-4 py-3 mb-3" style={{ background: "rgba(34,197,94,0.08)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#16A34A" }}>Two-factor is now on.</p>
            <p className="text-xs" style={{ color: "#555" }}>Save these recovery codes somewhere safe. Each works once if you lose your phone. They won&apos;t be shown again.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {recovery.map((c) => <code key={c} className="text-sm tabular-nums px-3 py-2 rounded-lg text-center" style={{ background: "#FAFAF8", color: "#1E1E1E", border: "1px solid rgba(0,0,0,0.06)" }}>{c}</code>)}
          </div>
          <button onClick={() => navigator.clipboard?.writeText(recovery.join("\n")).catch(() => {})} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}><Copy className="w-3.5 h-3.5" />Copy codes</button>
          <button onClick={() => setRecovery(null)} className="ml-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#1E1E1E", color: "#fff" }}><Check className="w-3.5 h-3.5" />Done</button>
        </div>
      ) : setup ? (
        /* Enrolment: scan QR, then confirm a code. */
        <div>
          <p className="text-xs mb-3" style={{ color: "#777" }}>1. Scan this with your authenticator app (or enter the key manually), then 2. enter the 6-digit code it shows.</p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Image src={setup.qr_code} alt="Two-factor QR code" width={160} height={160} className="rounded-xl border" style={{ borderColor: "rgba(0,0,0,0.08)" }} unoptimized />
            <div className="flex-1 w-full">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "#bbb" }}>Manual key</p>
              <code className="block text-xs break-all px-3 py-2 rounded-lg mb-3" style={{ background: "#FAFAF8", color: "#1E1E1E", border: "1px solid rgba(0,0,0,0.06)" }}>{setup.secret}</code>
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" className="w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none tracking-widest focus:border-[#C5B27A]" style={{ borderColor: "rgba(0,0,0,0.12)" }} />
              {error && <p className="text-sm mt-2" style={{ color: "#C0392B" }}>{error}</p>}
              <div className="flex items-center gap-2 mt-3">
                <button onClick={confirm} disabled={busy || !code} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50" style={{ background: "#1E1E1E", color: "#fff" }}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Confirm</button>
                <button onClick={() => { setSetup(null); setCode(""); setError(""); }} className="text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#777" }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : enabled ? (
        disabling ? (
          <div className="space-y-3 max-w-sm">
            <p className="text-xs" style={{ color: "#777" }}>Confirm your password and a current code to turn two-factor off.</p>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Your password" autoComplete="current-password" className="w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none focus:border-[#C5B27A]" style={{ borderColor: "rgba(0,0,0,0.12)" }} />
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="6-digit or recovery code" className="w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none tracking-widest focus:border-[#C5B27A]" style={{ borderColor: "rgba(0,0,0,0.12)" }} />
            {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
            <div className="flex items-center gap-2">
              <button onClick={disable} disabled={busy || !pw || !code} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50" style={{ background: "#C0392B", color: "#fff" }}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}Turn off</button>
              <button onClick={() => { setDisabling(false); setPw(""); setCode(""); setError(""); }} className="text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#777" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setDisabling(true); setError(""); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#F2F2F2", color: "#C0392B" }}><ShieldOff className="w-4 h-4" />Turn off two-factor</button>
        )
      ) : (
        <>
          {error && <p className="text-sm mb-2" style={{ color: "#C0392B" }}>{error}</p>}
          <button onClick={begin} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50" style={{ background: "#1E1E1E", color: "#fff" }}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Set up two-factor</button>
        </>
      )}
    </div>
  );
}
