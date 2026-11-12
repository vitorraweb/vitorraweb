"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Link2, Unlink, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, StatusBadge, formatDate, formatRelativeTime } from "@/components/admin/admin-ui";
import { GraphView, KpiTile } from "@/components/admin/reporting";

/* ─── Google Ads ──────────────────────────────────────────────────────────────
   What the ad money bought: Google's numbers (spend, clicks, search terms)
   beside ours (enquiries, won deals). Leads are recognised on arrival from the
   gclid, so that half works before Google Ads is connected; spend and search
   terms need the connection. Backend: GoogleAdsController.                  */

type Money = Record<string, number>;

type Status = {
  client_configured: boolean;
  connected: boolean;
  can_manage: boolean;
  redirect_uri: string;
  account: null | {
    connected_email: string | null; customer_id: string | null; login_customer_id: string | null;
    name: string | null; currency: string | null; time_zone: string | null;
    conversion_action_id: string | null; conversion_action_name: string | null;
    last_synced_at: string | null; last_error: string | null; last_error_at: string | null;
  };
};

type Totals = {
  impressions: number; clicks: number; cost: number; ctr: number | null; avg_cpc: number | null; google_conversions: number;
};

type Campaign = Totals & {
  campaign_id: string | null; name: string; status: string | null; channel: string | null;
  leads: number; won: number; won_value: Money; cost_per_lead: number | null;
};

type Summary = {
  period: string; period_label: string; periods: Record<string, string>;
  from: string; to: string; connected: boolean; currency: string | null; last_synced_at: string | null;
  totals: Totals & {
    leads: number; enquiries: number; messages: number; won: number; won_value: Money;
    cost_per_lead: number | null; cost_per_won: number | null;
  };
  previous: { cost: number; clicks: number; leads: number };
  campaigns: Campaign[];
  daily: { date: string; cost: number; clicks: number; leads: number }[];
  search_terms: { term: string; impressions: number; clicks: number; cost: number; conversions: number }[];
  /** Rolling 30-day snapshot (Display placements, Performance Max search themes). */
  insights_window: { from: string; to: string } | null;
  placements: { name: string; type: string | null; url: string | null; impressions: number; clicks: number; cost: number; conversions: number }[];
  placement_types: { type: string; clicks: number; cost: number }[];
  search_themes: { theme: string; impressions: number; clicks: number; conversions: number }[];
  recent_leads: {
    id: number; name: string; company: string | null; product: string | null; status: string; created_at: string;
    campaign: string | null; keyword: string | null; reported_to_google: boolean; report_error: string | null;
  }[];
};

type AdAccount = { customer_id: string; name: string; manager: boolean; login_customer_id: string | null; currency: string | null };
type ConversionAction = { id: string; name: string };


function money(n: number | null | undefined, currency: string | null | undefined): string {
  if (n == null) return "—";
  const cur = currency || "UGX";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: cur === "UGX" ? 0 : 2 }).format(n);
  } catch {
    return `${cur} ${n.toLocaleString("en-US")}`;
  }
}

function moneyMap(m: Money): string {
  const parts = Object.entries(m).filter(([, v]) => v > 0).map(([c, v]) => money(v, c));
  return parts.length ? parts.join(" · ") : "—";
}

const num = (n: number) => n.toLocaleString("en-US");


export default function GoogleAdsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "alert"; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const loadStatus = useCallback(async () => {
    try { setStatus((await apiAdmin<{ data: Status }>("/admin/google-ads/status")).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const d = (await apiAdmin<{ data: Summary }>(`/admin/google-ads/summary?period=${period}`)).data;
      // The website releases itself before the server is updated by hand, so
      // tolerate a server one version behind: sections it doesn't send yet
      // are empty rather than a crash.
      setSummary({
        ...d,
        search_terms: d.search_terms ?? [],
        recent_leads: d.recent_leads ?? [],
        campaigns: d.campaigns ?? [],
        daily: d.daily ?? [],
        placements: d.placements ?? [],
        placement_types: d.placement_types ?? [],
        search_themes: d.search_themes ?? [],
        insights_window: d.insights_window ?? null,
      });
      setError("");
    }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { setNow(Date.now()); }, [summary]);

  // Back from Google's consent screen: ?connected=1 or ?error=…
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("connected")) setNotice({ tone: "ok", text: "Google Ads connected. Choose the ad account below if it was not picked for you." });
    else if (q.get("error")) setNotice({ tone: "alert", text: q.get("error") ?? "Google Ads could not be connected." });
    if (q.has("connected") || q.has("error")) window.history.replaceState(null, "", "/admin/google-ads");
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await apiAdmin<{ message: string }>("/admin/google-ads/sync", { method: "POST" });
      setNotice({ tone: "ok", text: r.message });
      await Promise.all([loadStatus(), loadSummary()]);
    } catch (e) {
      setNotice({ tone: "alert", text: e instanceof Error ? e.message : "Sync failed" });
      loadStatus();
    } finally { setSyncing(false); }
  };

  const s = summary;
  const cur = s?.currency ?? status?.account?.currency ?? "UGX";

  return (
    <div className="pb-12">
      <PageHeader
        title="Google Ads"
        subtitle="What the ad spend bought: Google's clicks and costs beside the enquiries and sales they produced."
        actions={
          <>
            <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} className="c-select">
              {Object.entries(s?.periods ?? { "30d": "Last 30 days" }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {status?.connected && (
              <button onClick={sync} disabled={syncing} className="c-btn">
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Refresh from Google
              </button>
            )}
          </>
        }
      />

      {notice && (
        <div className="c-panel px-4 py-3 mb-4 flex items-start gap-2 text-[13px]" style={{ borderColor: notice.tone === "ok" ? "#C9DECB" : "#E8CACA" }}>
          {notice.tone === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-ok-ink" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-alert-ink" />}
          <span className="flex-1 text-ink-soft">{notice.text}</span>
          <button onClick={() => setNotice(null)} className="text-ink-muted hover:text-ink text-xs">Dismiss</button>
        </div>
      )}

      {error && <p className="text-[13px] text-alert-ink mb-4">Couldn&apos;t load: {error}</p>}

      {status && !status.connected && <Setup status={status} onChange={() => { loadStatus(); loadSummary(); }} />}

      {status?.account?.last_error && status.connected && (
        <div className="c-panel px-4 py-3 mb-4 flex items-start gap-2 text-[13px]" style={{ borderColor: "var(--o-danger-bg)" }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-alert-ink" />
          <span className="text-ink-soft">
            The last sync with Google failed: <strong className="text-ink">{status.account.last_error}</strong>
            {status.account.last_error_at && now ? ` (${formatRelativeTime(status.account.last_error_at, now)})` : ""}. The figures below are from the last good sync.
          </span>
        </div>
      )}

      {loading && !s ? (
        <div className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : s && (
        <div className="space-y-4">
          <p className="text-[12px] text-ink-muted">
            {s.period_label} · {formatDay(s.from)} – {formatDay(s.to)}
            {s.last_synced_at && now ? ` · Google figures updated ${formatRelativeTime(s.last_synced_at, now)}` : ""}
          </p>

          {/* ── Headline numbers ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiTile label="Spent" value={s.connected ? money(s.totals.cost, cur) : "—"} sub={s.connected ? undefined : "Connect to see spend"} now={s.connected ? s.totals.cost : undefined} before={s.connected ? s.previous.cost : undefined} upIsGood={false} />
            <KpiTile label="Clicks" value={s.connected ? num(s.totals.clicks) : "—"} sub={s.totals.ctr != null ? `${s.totals.ctr}% of ${num(s.totals.impressions)} views` : undefined} now={s.connected ? s.totals.clicks : undefined} before={s.connected ? s.previous.clicks : undefined} />
            <KpiTile label="Leads from ads" value={num(s.totals.leads)} sub={`${s.totals.enquiries} enquiries · ${s.totals.messages} messages`} now={s.totals.leads} before={s.previous.leads} />
            <KpiTile label="Cost per lead" value={money(s.totals.cost_per_lead, cur)} sub="Spend ÷ leads" />
            <KpiTile label="Won" value={num(s.totals.won)} sub={moneyMap(s.totals.won_value)} />
            <KpiTile label="Cost per sale" value={money(s.totals.cost_per_won, cur)} sub="Spend ÷ won enquiries" />
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            Leads are counted by the site when a visitor arrives from a Google ad and then sends an enquiry or message. Google&apos;s own
            conversion count ({s.totals.google_conversions}) can differ: it counts calls and form starts too, and models visitors who declined cookies.
          </p>

          {/* ── Day by day ───────────────────────────────────────────────── */}
          <GraphView
            title="Day by day"
            rows={s.daily.map((d) => ({ label: formatDay(d.date), values: { cost: d.cost, clicks: d.clicks, leads: d.leads } }))}
            measures={[
              ...(s.connected ? [{ key: "cost", label: "Spend", format: (v: number) => money(v, cur) }, { key: "clicks", label: "Clicks", format: num }] : []),
              { key: "leads", label: "Leads from ads", format: num },
            ]}
            types={["bar", "line"]}
            defaultType="bar"
          />

          {s.connected && s.campaigns.some((c) => c.campaign_id) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <GraphView
                title="Spend by campaign"
                rows={s.campaigns.filter((c) => c.campaign_id).map((c) => ({ label: c.name, values: { cost: c.cost, clicks: c.clicks } }))}
                measures={[{ key: "cost", label: "Spend", format: (v) => money(v, cur) }, { key: "clicks", label: "Clicks", format: num }]}
                types={["pie", "bar"]}
                defaultType="pie"
              />
              <GraphView
                title="Leads by campaign"
                rows={s.campaigns.map((c) => ({ label: c.name, values: { leads: c.leads, won: c.won } }))}
                series={[{ key: "leads", label: "Leads" }, { key: "won", label: "Won" }]}
                types={["bar"]}
                format={num}
              />
            </div>
          )}

          {/* ── Campaigns ────────────────────────────────────────────────── */}
          <div className="c-panel overflow-x-auto">
            <div className="c-panel-head"><span className="c-panel-title">Campaigns</span></div>
            {s.campaigns.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-ink-muted">{s.connected ? "No campaign activity in this period." : "Campaigns appear once Google Ads is connected."}</p>
            ) : (
              <table className="c-table min-w-[880px]">
                <thead>
                  <tr>
                    <th>Campaign</th><th>Status</th><th className="text-right">Spent</th><th className="text-right">Clicks</th><th className="text-right">CTR</th>
                    <th className="text-right">Avg. click</th><th className="text-right">Leads</th><th className="text-right">Cost / lead</th><th className="text-right">Won</th>
                  </tr>
                </thead>
                <tbody>
                  {s.campaigns.map((c) => (
                    <tr key={c.campaign_id ?? "unmatched"}>
                      <td className="max-w-[18rem]">
                        <span className={`block truncate ${c.campaign_id ? "font-medium text-ink" : "text-ink-muted"}`}>{c.name}</span>
                        {c.channel && <span className="block text-[11px] text-ink-muted">{titleCase(c.channel)}</span>}
                      </td>
                      <td>{c.status ? <span className="c-chip" data-tone={c.status === "ENABLED" ? "ok" : "muted"}>{titleCase(c.status)}</span> : null}</td>
                      <td className="text-right whitespace-nowrap">{c.campaign_id ? money(c.cost, cur) : "—"}</td>
                      <td className="text-right">{c.campaign_id ? num(c.clicks) : "—"}</td>
                      <td className="text-right">{c.ctr != null ? `${c.ctr}%` : "—"}</td>
                      <td className="text-right whitespace-nowrap">{money(c.avg_cpc, cur)}</td>
                      <td className="text-right font-medium text-ink">{c.leads}</td>
                      <td className="text-right whitespace-nowrap">{money(c.cost_per_lead, cur)}</td>
                      <td className="text-right whitespace-nowrap">{c.won}{c.won > 0 && <span className="block text-[11px] text-ink-muted">{moneyMap(c.won_value)}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {s.campaigns.some((c) => !c.campaign_id) && (
              <p className="px-4 py-3 text-[12px] text-ink-muted border-t border-line">
                &ldquo;Not matched&rdquo; leads came from a Google ad but their click has not been tied to a campaign yet. That happens within the hour once Google Ads is connected, or never for clicks older than 90 days.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── Search terms ───────────────────────────────────────────── */}
            <div className="c-panel overflow-x-auto">
              <div className="c-panel-head">
                <span className="c-panel-title">What people searched</span>
                {s.search_terms.length === 0 && s.search_themes.length > 0 && s.insights_window && (
                  <span className="text-[12px] text-ink-muted">Performance Max · {formatDay(s.insights_window.from)} – {formatDay(s.insights_window.to)}</span>
                )}
              </div>
              {s.search_terms.length > 0 ? (
                <table className="c-table">
                  <thead><tr><th>Search</th><th className="text-right">Clicks</th><th className="text-right">Spent</th><th className="text-right">Conv.</th></tr></thead>
                  <tbody>
                    {s.search_terms.map((t) => (
                      <tr key={t.term}>
                        <td className="max-w-[16rem]">
                          <span className="block truncate text-ink">{t.term}</span>
                          {t.cost > 0 && t.conversions === 0 && <span className="text-[11px] text-ink-muted">Costing money, no conversions yet</span>}
                        </td>
                        <td className="text-right">{num(t.clicks)}</td>
                        <td className="text-right whitespace-nowrap">{money(t.cost, cur)}</td>
                        <td className="text-right">{t.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : s.search_themes.length > 0 ? (
                <>
                  {/* Performance Max shares grouped search categories, not the
                      exact words, and no cost per category. */}
                  <table className="c-table">
                    <thead><tr><th>Search theme</th><th className="text-right">Shown</th><th className="text-right">Clicks</th><th className="text-right">Conv.</th></tr></thead>
                    <tbody>
                      {s.search_themes.map((t) => (
                        <tr key={t.theme}>
                          <td className="max-w-[16rem]"><span className="block truncate text-ink">{t.theme}</span></td>
                          <td className="text-right">{num(t.impressions)}</td>
                          <td className="text-right">{num(t.clicks)}</td>
                          <td className="text-right">{t.conversions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="px-4 py-3 text-[12px] text-ink-muted border-t border-line">Performance Max groups searches into themes and does not say what each one cost.</p>
                </>
              ) : (
                <p className="px-4 py-6 text-[13px] text-ink-muted">
                  {!s.connected ? "Search terms appear once Google Ads is connected."
                    : "No searches to show. Display ads are not triggered by searches; Performance Max themes appear after the next sync."}
                </p>
              )}
            </div>

            {/* ── Latest leads from ads ──────────────────────────────────── */}
            <div className="c-panel overflow-x-auto">
              <div className="c-panel-head">
                <span className="c-panel-title">Latest leads from ads</span>
                <Link href="/admin/enquiries" className="text-[12px] font-medium text-gold-ink hover:underline">All enquiries</Link>
              </div>
              {s.recent_leads.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-ink-muted">No enquiries from Google ads yet.</p>
              ) : (
                <ul>
                  {s.recent_leads.map((l) => (
                    <li key={l.id} className="px-4 py-2.5 border-b border-line last:border-0 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-ink truncate">{l.name}{l.company ? ` · ${l.company}` : ""}</p>
                        <p className="text-[12px] text-ink-muted truncate">
                          {l.product ?? "General"} · {l.campaign ?? "campaign not matched yet"}{l.keyword ? ` · “${l.keyword}”` : ""}
                        </p>
                        {l.reported_to_google && <p className="text-[11px] text-ok-ink">Sale reported to Google</p>}
                        {l.report_error && <p className="text-[11px] text-alert-ink">Google refused the sale report: {l.report_error}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge status={l.status} />
                        <p className="text-[11px] text-ink-muted mt-1">{formatDate(l.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Where Display ads showed ─────────────────────────────────── */}
          {s.placements.length > 0 && s.insights_window && (
            <>
              <h2 className="text-[16px] font-semibold text-ink pt-2">
                Where your Display ads showed
                <span className="ml-2 text-[13px] font-normal text-ink-muted">{formatDay(s.insights_window.from)} – {formatDay(s.insights_window.to)}</span>
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GraphView
                  title="Spend by kind of place"
                  rows={s.placement_types.map((t) => ({ label: PLACEMENT_TYPE[t.type] ?? titleCase(t.type), values: { cost: t.cost, clicks: t.clicks } }))}
                  measures={[{ key: "cost", label: "Spend", format: (v) => money(v, cur) }, { key: "clicks", label: "Clicks", format: num }]}
                  types={["pie", "bar"]}
                  defaultType="pie"
                  note="Clicks inside mobile apps and games are cheap and often accidental. If most of the spend lands there, consider excluding app placements in Google Ads."
                />
                <div className="c-panel overflow-x-auto xl:col-span-2">
                  <div className="c-panel-head"><span className="c-panel-title">Top placements by spend</span></div>
                  <table className="c-table">
                    <thead><tr><th>Placement</th><th>Kind</th><th className="text-right">Clicks</th><th className="text-right">Spent</th><th className="text-right">Conv.</th></tr></thead>
                    <tbody>
                      {s.placements.map((p, i) => (
                        <tr key={`${p.name}-${i}`}>
                          <td className="max-w-[18rem]">
                            <span className="block truncate text-ink" title={p.url ?? p.name}>{p.name}</span>
                            {p.cost > 0 && p.conversions === 0 && <span className="text-[11px] text-ink-muted">Costing money, no conversions yet</span>}
                          </td>
                          <td className="whitespace-nowrap text-ink-muted">{p.type ? PLACEMENT_TYPE[p.type] ?? titleCase(p.type) : "—"}</td>
                          <td className="text-right">{num(p.clicks)}</td>
                          <td className="text-right whitespace-nowrap">{money(p.cost, cur)}</td>
                          <td className="text-right">{p.conversions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {status?.connected && status.can_manage && <Connection status={status} onChange={() => { loadStatus(); loadSummary(); }} />}
        </div>
      )}
    </div>
  );
}

/* ─── Pieces ─────────────────────────────────────────────────────────────── */

const PLACEMENT_TYPE: Record<string, string> = {
  MOBILE_APPLICATION: "Mobile apps", MOBILE_APP_CATEGORY: "App categories", WEBSITE: "Websites",
  YOUTUBE_CHANNEL: "YouTube channels", YOUTUBE_VIDEO: "YouTube videos", GOOGLE_PRODUCTS: "Google products", UNKNOWN: "Not reported",
};

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}


/** First-time setup, step by step. Steps 2–4 are admin actions. */
function Setup({ status, onChange }: { status: Status; onChange: () => void }) {
  const a = status.account;
  const steps = [
    { done: status.client_configured, label: "Google Cloud access for the server", detail: status.client_configured ? "Ready." : <>IT sets <code>GOOGLE_ADS_CLIENT_ID</code> and <code>GOOGLE_ADS_CLIENT_SECRET</code> on the server, with <code>{status.redirect_uri}</code> as the redirect address. Run <code>php artisan google-ads:status</code> for the full list.</> },
    { done: !!a?.connected_email, label: "Sign in with the Google login that runs the ads", detail: a?.connected_email ? `Connected as ${a.connected_email}.` : "An admin presses Connect and signs in with Marketing's Google Ads login." },
    { done: !!a?.customer_id, label: "Choose the ad account", detail: a?.customer_id ? `${a.name ?? "Account"} (${a.customer_id}).` : "Pick which Google Ads account to report on." },
  ];

  return (
    <div className="c-panel mb-4">
      <div className="c-panel-head"><span className="c-panel-title">Connect Google Ads</span></div>
      <div className="px-4 py-3">
        <p className="text-[13px] text-ink-soft mb-3">
          Leads from Google ads are already being counted below. Connecting the ad account adds what each campaign cost, what people searched, and reports won deals back to Google so it bids for buyers, not just clicks.
        </p>
        <ol className="space-y-2.5">
          {steps.map((st, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px]">
              {st.done ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-ok-ink" /> : <Circle className="w-4 h-4 mt-0.5 shrink-0 text-ink-muted" />}
              <div>
                <p className="font-medium text-ink">{st.label}</p>
                <p className="text-[12px] text-ink-muted">{st.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        {status.can_manage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {status.client_configured && <ConnectButton reconnect={!!a?.connected_email} />}
            {a?.connected_email && !a.customer_id && <AccountPicker onChange={onChange} />}
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-ink-muted">An admin needs to finish these steps.</p>
        )}
      </div>
    </div>
  );
}

function ConnectButton({ reconnect }: { reconnect?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true); setErr("");
    try { window.location.href = (await apiAdmin<{ data: { url: string } }>("/admin/google-ads/connect")).data.url; }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not start"); setBusy(false); }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={go} disabled={busy} className="c-btn c-btn-primary">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}{reconnect ? "Reconnect Google Ads" : "Connect Google Ads"}
      </button>
      {err && <span className="text-[12px] text-alert-ink">{err}</span>}
    </span>
  );
}

function AccountPicker({ onChange, current }: { onChange: () => void; current?: string | null }) {
  const [list, setList] = useState<AdAccount[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    apiAdmin<{ data: AdAccount[] }>("/admin/google-ads/accounts")
      .then((r) => setList(r.data.filter((x) => !x.manager)))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not list accounts"));
  }, []);

  const choose = async (id: string) => {
    const pick = list?.find((x) => x.customer_id === id);
    if (!pick) return;
    try {
      await apiAdmin("/admin/google-ads/account", { method: "PUT", body: JSON.stringify({ customer_id: pick.customer_id, login_customer_id: pick.login_customer_id }) });
      onChange();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not save"); }
  };

  if (err) return <span className="text-[12px] text-alert-ink">{err}</span>;
  if (!list) return <span className="text-[12px] text-ink-muted inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Finding ad accounts…</span>;
  if (list.length === 0) return <span className="text-[12px] text-ink-muted">This Google login cannot see any ad accounts. Reconnect with the login that runs the ads.</span>;

  return (
    <select aria-label="Ad account" className="c-select" value={current ?? ""} onChange={(e) => choose(e.target.value)}>
      <option value="" disabled>Choose the ad account…</option>
      {list.map((x) => <option key={x.customer_id} value={x.customer_id}>{x.name} ({x.customer_id}){x.currency ? ` · ${x.currency}` : ""}</option>)}
    </select>
  );
}

/** Admin-only: which account, won-deal reporting, disconnect. */
function Connection({ status, onChange }: { status: Status; onChange: () => void }) {
  const a = status.account!;
  const [actions, setActions] = useState<ConversionAction[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [changingAccount, setChangingAccount] = useState(false);

  useEffect(() => {
    apiAdmin<{ data: ConversionAction[] }>("/admin/google-ads/conversion-actions")
      .then((r) => setActions(r.data))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load conversion actions"));
  }, [a.customer_id]);

  const setAction = async (id: string) => {
    const pick = actions?.find((x) => x.id === id);
    setBusy(true);
    try {
      await apiAdmin("/admin/google-ads/account", { method: "PUT", body: JSON.stringify({ conversion_action_id: pick?.id ?? null, conversion_action_name: pick?.name ?? null }) });
      onChange();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  };

  const disconnect = async () => {
    setBusy(true);
    try { await apiAdmin("/admin/google-ads", { method: "DELETE" }); onChange(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not disconnect"); setBusy(false); }
  };

  return (
    <div className="c-panel">
      <div className="c-panel-head"><span className="c-panel-title">Connection (admins)</span></div>
      <div className="px-4 py-3 space-y-3 text-[13px]">
        <p className="text-ink-soft">
          Reporting on <strong className="text-ink">{a.name ?? a.customer_id}</strong> ({a.customer_id}{a.currency ? ` · ${a.currency}` : ""}), signed in as {a.connected_email}.{" "}
          <button className="text-gold-ink hover:underline" onClick={() => setChangingAccount((v) => !v)}>Change account</button>
        </p>
        {changingAccount && <AccountPicker current={a.customer_id} onChange={() => { setChangingAccount(false); onChange(); }} />}

        <div>
          <p className="font-medium text-ink">Report won deals to Google</p>
          <p className="text-[12px] text-ink-muted mb-2">
            When an enquiry that came from an ad is converted to an order, the sale and its value go back to Google, so its bidding learns which searches bring buyers.
            Needs a conversion action in Google Ads of type &ldquo;Import → clicks&rdquo; (Goals → Conversions → New conversion action → Import).
          </p>
          {actions == null && !err ? (
            <span className="text-[12px] text-ink-muted inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</span>
          ) : actions && (
            <select aria-label="Conversion action" className="c-select" disabled={busy} value={a.conversion_action_id ?? ""} onChange={(e) => setAction(e.target.value)}>
              <option value="">Off: don&apos;t report sales</option>
              {actions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          )}
          {actions?.length === 0 && <p className="text-[12px] text-ink-muted mt-1">No import-type conversion action exists in this account yet.</p>}
        </div>

        {err && <p className="text-[12px] text-alert-ink">{err}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          <ConnectButton reconnect />
          <button onClick={disconnect} disabled={busy} className="c-btn c-btn-ghost text-ink-muted"><Unlink className="w-3.5 h-3.5" />Disconnect</button>
        </div>
      </div>
    </div>
  );
}
