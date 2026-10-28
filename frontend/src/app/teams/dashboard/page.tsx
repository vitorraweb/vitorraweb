"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { initTeams, looksLikeTeamsHost, openTeamsLink } from "@/lib/teams";
import AdminOverview from "@/app/admin/overview/page";

/* ─── The Vitorra dashboard as a personal tab in Microsoft Teams ──────────────
   Sign-in: Teams hands us a Microsoft Entra token for the signed-in person
   (authentication.getAuthToken — no pop-up, no third-party cookie). We never
   trust it here: it goes to POST /api/auth/teams, which verifies the token's
   signature, tenant, audience and scope server-side, matches it to a staff
   account, keeps the console's role rules and two-step verification, and only
   then issues the usual console session. Outside Teams this page just points
   to the normal console.                                                     */

const BROWSER_URL = "https://vitorra.org/admin/overview";

type Phase =
  | { kind: "starting" }
  | { kind: "outside" }
  | { kind: "signing-in" }
  | { kind: "code"; token: string; error?: string }
  | { kind: "ready" }
  | { kind: "error"; message: string };

type SsoResponse = {
  data?: { two_factor_required?: boolean; token?: string | null; expires_at?: string | null; user?: Parameters<typeof auth.save>[1] };
  message?: string;
};

function hasConsoleSession(): boolean {
  const u = auth.getUser();
  const role = u?.role?.toLowerCase();
  return !!u && !auth.isExpired() && (role === "admin" || role === "ops");
}

export default function TeamsDashboard() {
  const [phase, setPhase] = useState<Phase>({ kind: "starting" });
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [code, setCode] = useState("");
  const started = useRef(false);

  const exchange = useCallback(async (entraToken: string, otp?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token: entraToken, code: otp || undefined }),
    });
    const body: SsoResponse = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 422 && otp) { setPhase({ kind: "code", token: entraToken, error: body.message ?? "That code is not valid." }); return; }
      setPhase({ kind: "error", message: body.message ?? (res.status === 429 ? "Too many attempts — wait a minute and try again." : "Sign-in failed.") });
      return;
    }
    if (body.data?.two_factor_required) { setPhase({ kind: "code", token: entraToken }); return; }
    if (!body.data?.user) { setPhase({ kind: "error", message: "Sign-in failed." }); return; }
    auth.save(body.data.token ?? null, body.data.user, body.data.expires_at);
    setPhase({ kind: "ready" });
  }, []);

  const signIn = useCallback(async () => {
    setPhase({ kind: "signing-in" });
    try {
      const { authentication } = await import("@microsoft/teams-js");
      await exchange(await authentication.getAuthToken());
    } catch {
      setPhase({ kind: "error", message: "Teams could not sign you in. Your organisation may still need to approve the Vitorra app — or open the dashboard in your browser." });
    }
  }, [exchange]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      if (!looksLikeTeamsHost() || !(await initTeams())) { setPhase({ kind: "outside" }); return; }
      const { app } = await import("@microsoft/teams-js");
      const apply = (t?: string) => setTheme(t === "dark" || t === "contrast" ? "dark" : "light");
      try { apply((await app.getContext()).app.theme); } catch { /* keep light */ }
      app.registerOnThemeChangeHandler(apply);
      app.notifySuccess();
      // A console session from an earlier visit (our own token) is reused; otherwise sign in.
      if (hasConsoleSession()) setPhase({ kind: "ready" }); else await signIn();
    })();
  }, [signIn]);

  // Links inside the dashboard point at console screens, which are not shown
  // inside Teams — open them in the browser instead.
  const onClickCapture = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    e.preventDefault();
    openTeamsLink(new URL(href, BROWSER_URL).toString());
  };

  const openInBrowser = () => openTeamsLink(BROWSER_URL);

  return (
    <div className="admin-console min-h-screen" data-theme={theme} style={{ background: "var(--o-canvas)", color: "var(--o-text)" }}>
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b" style={{ borderColor: "var(--o-line)", background: "var(--o-surface)" }}>
        <span className="text-[14px] font-semibold">Vitorra dashboard</span>
        <button className="c-btn" onClick={openInBrowser}><ExternalLink className="w-4 h-4" />Open in browser</button>
      </header>

      <main className="px-4 py-4">
        {(phase.kind === "starting" || phase.kind === "signing-in") && (
          <p className="flex items-center gap-2 text-[14px]" style={{ color: "var(--o-muted)" }}>
            <Loader2 className="w-4 h-4 animate-spin" />{phase.kind === "starting" ? "Loading…" : "Signing you in with Microsoft…"}
          </p>
        )}

        {phase.kind === "outside" && (
          <div className="c-panel p-6 max-w-lg space-y-3">
            <p className="text-[15px] font-semibold">This page opens inside Microsoft Teams.</p>
            <p className="text-[14px]" style={{ color: "var(--o-muted)" }}>In a browser, use the console directly.</p>
            <Link className="c-btn c-btn-primary" href="/admin/overview">Go to the console</Link>
          </div>
        )}

        {phase.kind === "code" && (
          <form className="c-panel p-6 max-w-sm space-y-3" onSubmit={(e) => { e.preventDefault(); if (code.trim()) exchange(phase.token, code.trim()); }}>
            <p className="flex items-center gap-2 text-[15px] font-semibold"><ShieldCheck className="w-4 h-4" />Two-step verification</p>
            <p className="text-[14px]" style={{ color: "var(--o-muted)" }}>Enter the code from your authenticator app (or a recovery code).</p>
            <input className="c-input w-full" inputMode="numeric" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
            {phase.error && <p className="text-[13px]" style={{ color: "var(--o-danger)" }}>{phase.error}</p>}
            <button className="c-btn c-btn-primary" type="submit">Continue</button>
          </form>
        )}

        {phase.kind === "error" && (
          <div className="c-panel p-6 max-w-lg space-y-3">
            <p className="text-[15px] font-semibold">Couldn’t open the dashboard here</p>
            <p className="text-[14px]" style={{ color: "var(--o-muted)" }}>{phase.message}</p>
            <div className="flex flex-wrap gap-2">
              <button className="c-btn c-btn-primary" onClick={signIn}>Try again</button>
              <button className="c-btn" onClick={openInBrowser}><ExternalLink className="w-4 h-4" />Open in browser</button>
            </div>
          </div>
        )}

        {phase.kind === "ready" && <div onClickCapture={onClickCapture}><AdminOverview /></div>}
      </main>
    </div>
  );
}
