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
    <div className="bg-paper rounded-frame border border-line p-6 mt-5">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-gold" />
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink">Two-factor authentication</h2>
        {enabled !== null && (
          <span className={`ml-auto inline-flex items-center gap-2 t-label ${enabled ? "text-ok-ink" : "text-ink-muted"}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-ok-ink" : "bg-line-strong"}`} />
            {enabled ? "On" : "Off"}
          </span>
        )}
      </div>
      <p className="text-xs mb-4 text-ink-muted">
        Protects your account if your password is ever stolen. Use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy).
      </p>

      {enabled === null ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : recovery ? (
        /* One-time recovery codes — shown immediately after enabling. */
        <div>
          <div className="rounded-edge px-4 py-3 mb-3 border-l-2 border-ok-ink bg-paper-deep">
            <p className="text-sm font-semibold mb-1 text-ok-ink">Two-factor is now on.</p>
            <p className="text-xs text-ink-soft">Save these recovery codes somewhere safe. Each works once if you lose your phone. They won&apos;t be shown again.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {recovery.map((c) => <code key={c} className="text-sm tabular-nums px-3 py-2 rounded-edge text-center bg-paper-deep text-ink border border-line">{c}</code>)}
          </div>
          <button onClick={() => navigator.clipboard?.writeText(recovery.join("\n")).catch(() => {})} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-paper-deep text-ink-soft"><Copy className="w-3.5 h-3.5" />Copy codes</button>
          <button onClick={() => setRecovery(null)} className="ml-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-ink text-paper"><Check className="w-3.5 h-3.5" />Done</button>
        </div>
      ) : setup ? (
        /* Enrolment: scan QR, then confirm a code. */
        <div>
          <p className="text-xs mb-3 text-ink-muted">1. Scan this with your authenticator app (or enter the key manually), then 2. enter the 6-digit code it shows.</p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Image src={setup.qr_code} alt="Two-factor QR code" width={160} height={160} className="rounded-edge border border-line" unoptimized />
            <div className="flex-1 w-full">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1 text-ink-muted">Manual key</p>
              <code className="block text-xs break-all px-3 py-2 rounded-edge mb-3 bg-paper-deep text-ink border border-line">{setup.secret}</code>
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" className="w-full text-sm rounded-edge px-3.5 py-2.5 border outline-none tracking-widest focus:border-ink border-line-strong" />
              {error && <p className="text-sm mt-2 text-alert-ink">{error}</p>}
              <div className="flex items-center gap-2 mt-3">
                <button onClick={confirm} disabled={busy || !code} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50 bg-ink text-paper">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Confirm</button>
                <button onClick={() => { setSetup(null); setCode(""); setError(""); }} className="q-btn min-h-10 px-4 border border-line-strong text-ink-muted hover:border-ink">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : enabled ? (
        disabling ? (
          <div className="space-y-3 max-w-sm">
            <p className="text-xs text-ink-muted">Confirm your password and a current code to turn two-factor off.</p>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Your password" autoComplete="current-password" className="w-full text-sm rounded-edge px-3.5 py-2.5 border outline-none focus:border-ink border-line-strong" />
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="6-digit or recovery code" className="w-full text-sm rounded-edge px-3.5 py-2.5 border outline-none tracking-widest focus:border-ink border-line-strong" />
            {error && <p className="text-sm text-alert-ink">{error}</p>}
            <div className="flex items-center gap-2">
              <button onClick={disable} disabled={busy || !pw || !code} className="q-btn min-h-10 px-4 bg-alert-ink text-paper hover:opacity-90 disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}Turn off</button>
              <button onClick={() => { setDisabling(false); setPw(""); setCode(""); setError(""); }} className="q-btn min-h-10 px-4 border border-line-strong text-ink-muted hover:border-ink">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setDisabling(true); setError(""); }} className="q-btn min-h-10 px-4 border border-line-strong text-alert-ink hover:border-alert-ink"><ShieldOff className="w-4 h-4" />Turn off two-factor</button>
        )
      ) : (
        <>
          {error && <p className="text-sm mb-2 text-alert-ink">{error}</p>}
          <button onClick={begin} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50 bg-ink text-paper">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Set up two-factor</button>
        </>
      )}
    </div>
  );
}
