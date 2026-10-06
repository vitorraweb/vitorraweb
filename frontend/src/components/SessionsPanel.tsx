"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MonitorSmartphone, LogOut, X } from "lucide-react";

/**
 * "Active sessions / sign out everywhere" — shared by the admin and staff
 * portals. The caller passes its own authed JSON fetcher (apiAdmin / apiStaff).
 */
type Api = <T>(path: string, options?: RequestInit) => Promise<T>;

type Session = {
  id: number;
  name: string;
  last_used_at: string | null;
  created_at: string | null;
  expires_at: string | null;
  current: boolean;
};

export function SessionsPanel({ api }: { api: Api }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api<{ data: Session[] }>("/auth/sessions");
      setSessions(r.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load sessions."); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const revoke = async (id: number) => {
    setBusy(true); setError("");
    try { await api(`/auth/sessions/${id}`, { method: "DELETE" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not sign out that session."); }
    finally { setBusy(false); }
  };

  const revokeOthers = async () => {
    if (!confirm("Sign out of all other devices? They'll need to log in again.")) return;
    setBusy(true); setError("");
    try { await api("/auth/sessions/revoke-others", { method: "POST" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not sign out other devices."); }
    finally { setBusy(false); }
  };

  const hasOthers = (sessions ?? []).some((s) => !s.current);

  return (
    <div className="bg-paper rounded-frame border border-line p-6 mt-5">
      <div className="flex items-center gap-2 mb-1">
        <MonitorSmartphone className="w-4 h-4 text-gold" />
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink">Active sessions</h2>
        {hasOthers && (
          <button onClick={revokeOthers} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 bg-paper-deep text-alert-ink">
            <LogOut className="w-3.5 h-3.5" />Sign out other devices
          </button>
        )}
      </div>
      <p className="text-xs mb-4 text-ink-muted">Devices currently signed in to your account. If you don&apos;t recognise one, sign it out.</p>

      {error && <p className="text-sm mb-3 text-alert-ink">{error}</p>}

      {sessions === null ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-ink-muted">No active sessions.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-frame border border-line p-3.5">
              <span className="flex items-center justify-center w-9 h-9 rounded-edge shrink-0 bg-paper">
                <MonitorSmartphone className="w-4 h-4 text-gold-ink" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold truncate text-ink">{s.name}</span>
                  {s.current && <span className="t-label text-[0.6875rem] px-2 py-0.5 rounded-full bg-paper-deep text-ok-ink">This device</span>}
                </div>
                <p className="text-xs text-ink-muted">{s.last_used_at ? `Last active ${rel(s.last_used_at)}` : "Not used yet"}{s.expires_at ? ` · expires ${rel(s.expires_at)}` : ""}</p>
              </div>
              {!s.current && (
                <button onClick={() => revoke(s.id)} disabled={busy} className="p-1.5 rounded-edge shrink-0 border border-line-strong text-alert-ink hover:border-alert-ink disabled:opacity-50" title="Sign out this device">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Coarse relative time ("3h ago", "in 2d") — good enough for a session list. */
function rel(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const past = diff < 0;
  const mins = Math.round(Math.abs(diff) / 60000);
  const label =
    mins < 1 ? "just now" :
    mins < 60 ? `${mins}m` :
    mins < 1440 ? `${Math.round(mins / 60)}h` :
    `${Math.round(mins / 1440)}d`;
  if (label === "just now") return label;
  return past ? `${label} ago` : `in ${label}`;
}
