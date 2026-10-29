"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ExternalLink, PlayCircle, AlertTriangle } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { LiveDot, PageHeader } from "@/components/admin/admin-ui";
import { GraphView, KpiTile } from "@/components/admin/reporting";

/* ─── Insights → Website ──────────────────────────────────────────────────────
   Who is on vitorra.org right now, how many people visited, where they came
   from and what they read — from PostHog, read on the server with a key the
   browser never sees. Session replays and the live event feed open in
   PostHog itself (the buttons top right).                                   */

type Pair = { label: string; people: number };
type Delta = { now: number; before: number };
type Summary = {
  configured: boolean; error?: string; period?: string;
  links?: { web: string; replays: string; live: string };
  visitors?: Delta; sessions?: Delta; pageviews?: Delta; leads?: Delta;
  avg_session_seconds?: number | null; bounce_rate?: number | null;
  by_time?: { label: string; visitors: number; pageviews: number }[]; hourly?: boolean;
  pages?: { path: string; views: number; people: number }[];
  channels?: { label: string; sessions: number }[];
  countries?: Pair[]; devices?: Pair[]; browsers?: Pair[];
};
type Live = { configured: boolean; error?: string; now?: number; pages?: { path: string; people: number }[] };

const PERIODS: Record<string, string> = { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days" };
const num = (v: number) => v.toLocaleString("en-US");
const duration = (s: number | null | undefined) => (s == null ? "—" : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);
const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function WebsitePage() {
  const [period, setPeriod] = useState("7d");
  const [s, setS] = useState<Summary | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setS((await apiAdmin<{ data: Summary }>(`/admin/web-analytics/summary?period=${period}`)).data); }
    catch (e) { setS({ configured: true, error: e instanceof Error ? e.message : "Could not load" }); }
    finally { setLoading(false); }
  }, [period]);

  const loadLive = useCallback(async () => {
    try { setLive((await apiAdmin<{ data: Live }>("/admin/web-analytics/live")).data); } catch { /* keep the last figure */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    loadLive();
    const t = setInterval(() => { if (document.visibilityState === "visible") loadLive(); }, 30_000);
    return () => clearInterval(t);
  }, [loadLive]);

  const links = s?.links;

  return (
    <div className="pb-12">
      <PageHeader
        title="Website"
        subtitle="Who is on vitorra.org right now, how many people visit, where they come from and what they read."
        actions={
          <>
            <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} className="c-select">
              {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {links && <a href={links.replays} target="_blank" rel="noopener noreferrer" className="c-btn"><PlayCircle className="w-4 h-4" />Watch visits</a>}
            {links && <a href={links.web} target="_blank" rel="noopener noreferrer" className="c-btn"><ExternalLink className="w-4 h-4" />Open PostHog</a>}
          </>
        }
      />

      {s && !s.configured ? (
        <div className="c-panel p-6 max-w-2xl space-y-2">
          <p className="text-[15px] font-semibold text-ink">Website analytics isn&apos;t connected yet</p>
          <p className="text-[14px] text-ink-soft">
            The website starts sending visits to PostHog once <span className="font-mono">NEXT_PUBLIC_POSTHOG_KEY</span> is set on Vercel.
            To show the numbers here, the API server also needs <span className="font-mono">POSTHOG_PROJECT_ID</span> and a
            read-only <span className="font-mono">POSTHOG_PERSONAL_API_KEY</span>. See docs/posthog.md.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {s?.error && (
            <div className="c-panel px-4 py-3 flex items-start gap-2 text-[13px]">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-alert-ink" /><span className="text-ink-soft">{s.error}</span>
            </div>
          )}

          {/* ── Right now ─────────────────────────────────────────────────── */}
          <div className="c-panel p-5 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-5 items-start">
            <div>
              <p className="text-[13.5px] text-ink-muted flex items-center gap-2"><LiveDot />On the site now</p>
              <p className="text-[40px] leading-tight font-semibold text-ink tabular-nums">{live?.now ?? (live?.error ? "—" : "…")}</p>
              <p className="text-[12.5px] text-ink-muted">Active in the last 5 minutes · updates every 30s</p>
              {links && <a href={links.live} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-gold-ink hover:underline inline-flex items-center gap-1 mt-2">Live activity feed<ExternalLink className="w-3.5 h-3.5" /></a>}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink mb-2">Pages they are on</p>
              {live?.pages?.length ? (
                <ul className="divide-y" style={{ borderColor: "var(--o-line)" }}>
                  {live.pages.map((p) => (
                    <li key={p.path} className="flex items-center justify-between py-1.5 text-[14px]">
                      <span className="font-mono text-[13px] text-ink-soft truncate">{p.path}</span>
                      <span className="tabular-nums text-ink">{p.people}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[13px] text-ink-muted">{live?.error ?? "Nobody on the site in the last five minutes."}</p>}
            </div>
          </div>

          {loading && !s?.visitors ? (
            <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
          ) : s?.visitors && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <KpiTile label="Visitors" value={num(s.visitors.now)} now={s.visitors.now} before={s.visitors.before} />
                <KpiTile label="Visits" value={num(s.sessions!.now)} now={s.sessions!.now} before={s.sessions!.before} />
                <KpiTile label="Pages viewed" value={num(s.pageviews!.now)} now={s.pageviews!.now} before={s.pageviews!.before} />
                <KpiTile label="Average visit" value={duration(s.avg_session_seconds)} sub="Time on the site" />
                <KpiTile label="Left after one page" value={s.bounce_rate == null ? "—" : `${s.bounce_rate}%`} sub="Bounce rate" />
                <KpiTile label="Leads from the website" value={num(s.leads!.now)} sub="Enquiries, messages, reservations" now={s.leads!.now} before={s.leads!.before} />
              </div>

              <GraphView
                title={s.hourly ? "Hour by hour" : "Day by day"}
                rows={(s.by_time ?? []).map((r) => ({ label: s.hourly ? `${r.label.padStart(2, "0")}:00` : day(r.label), values: { visitors: r.visitors, pageviews: r.pageviews } }))}
                measures={[{ key: "visitors", label: "Visitors", format: num }, { key: "pageviews", label: "Pages viewed", format: num }]}
                types={["line", "bar"]}
                defaultType="line"
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <GraphView
                  title="How they found us"
                  rows={(s.channels ?? []).map((c) => ({ label: c.label, values: { sessions: c.sessions } }))}
                  measures={[{ key: "sessions", label: "Visits", format: num }]}
                  types={["pie", "bar"]}
                  defaultType="pie"
                />
                <GraphView
                  title="Where they are"
                  rows={(s.countries ?? []).map((c) => ({ label: c.label, values: { people: c.people } }))}
                  measures={[{ key: "people", label: "Visitors", format: num }]}
                  types={["bar", "pie"]}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="c-panel overflow-x-auto">
                  <div className="c-panel-head"><span className="c-panel-title">Most read pages</span></div>
                  <table className="c-table">
                    <thead><tr><th>Page</th><th className="text-right">Views</th><th className="text-right">Visitors</th></tr></thead>
                    <tbody>
                      {(s.pages ?? []).length === 0 && <tr><td colSpan={3} className="text-ink-muted">No page views in this period.</td></tr>}
                      {(s.pages ?? []).map((p) => (
                        <tr key={p.path}><td className="font-mono text-[13px] max-w-[22rem] truncate">{p.path}</td><td className="text-right tabular-nums">{num(p.views)}</td><td className="text-right tabular-nums">{num(p.people)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <GraphView
                  title="Phone or computer"
                  rows={(s.devices ?? []).map((c) => ({ label: c.label, values: { people: c.people } }))}
                  measures={[{ key: "people", label: "Visitors", format: num }]}
                  types={["pie", "bar"]}
                  defaultType="pie"
                />
              </div>
              <p className="text-[12.5px] text-ink-muted">
                Staff screens and private client links are never counted. Visitors who decline cookies are counted per visit
                (not remembered), and only visitors who accept cookies are recorded for replay.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
