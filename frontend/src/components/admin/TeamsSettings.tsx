"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, Check, AlertTriangle, CircleDashed } from "lucide-react";
import { apiAdmin } from "@/lib/auth";

/* ─── Settings → Microsoft Teams (admin only) ─────────────────────────────────
   Shows whether the Teams Workflows webhook and Teams sign-in are configured
   on the server (never the secrets themselves), which events post to Teams,
   the latest deliveries, and an explicit "Send test message" button.     */

type Status = {
  webhook_configured: boolean;
  sso_configured: boolean;
  events: { key: string; label: string; enabled: boolean }[];
  recent: { id: number; event: string; title: string; status: string; attempts: number; last_error: string | null; sent_at: string | null; created_at: string }[];
  tab_url: string;
};

export function TeamsSettings() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => { setS((await apiAdmin<{ data: Status }>("/admin/teams")).data); }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const toggle = async (key: string) => {
    if (!s) return;
    const events = s.events.map((e) => (e.key === key ? { ...e, enabled: !e.enabled } : e)).filter((e) => e.enabled).map((e) => e.key);
    setBusy(key);
    try { setS((await apiAdmin<{ data: Status }>("/admin/teams/events", { method: "PUT", body: JSON.stringify({ events }) })).data); }
    finally { setBusy(null); }
  };

  const test = async () => {
    setBusy("test"); setMsg(null);
    try {
      const r = await apiAdmin<{ ok: boolean; message: string }>("/admin/teams/test", { method: "POST" });
      setMsg({ ok: r.ok, text: r.message });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Test failed" }); }
    finally { setBusy(null); load().catch(() => {}); }
  };

  if (!s) return null;
  const pill = (ok: boolean, yes: string, no: string) => (
    <span className="c-chip" data-tone={ok ? "ok" : "muted"}>{ok ? yes : no}</span>
  );

  return (
    <section className="c-panel p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: "var(--o-text)" }}>Microsoft Teams</h2>
        <p className="text-xs" style={{ color: "var(--o-faint)" }}>Post alerts to a Teams channel, and open the Vitorra dashboard as a tab inside Teams.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
        <div className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
          <span>Channel notifications (Workflows webhook)</span>{pill(s.webhook_configured, "Configured", "Not set up")}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
          <span>Teams tab sign-in (Microsoft Entra)</span>{pill(s.sso_configured, "Configured", "Not set up")}
        </div>
      </div>
      {!s.webhook_configured && <p className="text-[13px] text-ink-muted">The webhook address is kept on the server (TEAMS_WORKFLOW_WEBHOOK_URL), never in the browser. See docs/microsoft-teams.md for the setup.</p>}

      <div>
        <p className="text-[13px] font-semibold text-ink mb-2">Post to Teams when…</p>
        <ul className="space-y-1.5">
          {s.events.map((e) => (
            <li key={e.key}>
              <label className="flex items-center gap-2 text-[14px] text-ink-soft">
                <input type="checkbox" checked={e.enabled} disabled={busy !== null} onChange={() => toggle(e.key)} />
                {e.label}{busy === e.key && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="c-btn" onClick={test} disabled={busy !== null || !s.webhook_configured}>
          {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send test message
        </button>
        {msg && <span className={`text-[13px] inline-flex items-center gap-1.5 ${msg.ok ? "text-ok-ink" : "text-alert-ink"}`}>{msg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{msg.text}</span>}
      </div>

      {s.recent.length > 0 && (
        <div className="overflow-x-auto">
          <p className="text-[13px] font-semibold text-ink mb-2">Latest deliveries</p>
          <table className="c-table">
            <thead><tr><th>Message</th><th>Status</th><th>Attempts</th><th>When</th></tr></thead>
            <tbody>
              {s.recent.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-[22rem]"><span className="block truncate text-ink">{r.title}</span>{r.last_error && r.status !== "sent" && <span className="block text-[12px] text-alert-ink truncate" title={r.last_error}>{r.last_error}</span>}</td>
                  <td>{r.status === "sent" ? <span className="c-chip" data-tone="ok">Sent</span> : r.status === "failed" ? <span className="c-chip" data-tone="alert">Failed</span> : <span className="c-chip" data-tone="gold"><CircleDashed className="w-3 h-3" />Waiting</span>}</td>
                  <td>{r.attempts}</td>
                  <td className="text-ink-muted whitespace-nowrap">{new Date(r.sent_at ?? r.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[13px] text-ink-muted">Teams dashboard tab address: <span className="font-mono">{s.tab_url}</span></p>
    </section>
  );
}
