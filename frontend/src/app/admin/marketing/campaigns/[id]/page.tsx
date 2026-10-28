"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, FlaskConical, Send, Check, AlertTriangle, ShieldCheck, Trash2, MousePointerClick, MailOpen, Users } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, StatusBadge, formatDate } from "@/components/admin/admin-ui";
import { GraphView, KpiTile } from "@/components/admin/reporting";
import { EmailDesigner, type Design } from "@/components/admin/marketing/EmailDesigner";
import { PRODUCTS, pct, type CampaignStats, type CampaignSummary, type Market } from "@/components/admin/marketing/shared";

/* ─── Marketing → Campaigns → one campaign ────────────────────────────────────
   Draft:   1 Set up · 2 Design · 3 Test & send. Changes save as you go.
            Sending is locked until a test has gone to support, and locks
            again if anything changes after that test.
   Sent:    live progress, then the scorer — opens, clicks per link, markets,
            and every person's engagement.                              */

type Campaign = CampaignSummary & { design: Design };
type Audience = { will_send: number; members: number; skipped: { no_email: number; unsubscribed: number; avoid: number; duplicate: number } };
type Report = CampaignSummary & {
  stats: CampaignStats | null;
  links: { url: string; clicks: number; people: number }[];
  by_market: { market: string; sent: number; opened: number; clicked: number }[];
  people: { id: number; name: string | null; email: string; status: string; error: string | null; opened_at: string | null; open_count: number; clicked_at: string | null; click_count: number; unsubscribed_at: string | null }[];
};

export default function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [c, setC] = useState<Campaign | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setC((await apiAdmin<{ data: Campaign }>(`/admin/marketing/campaigns/${id}`)).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <p className="text-[14px] text-alert-ink">{error}</p>;
  if (!c) return <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>;

  return c.status === "draft" ? <Draft initial={c} /> : <Sent campaign={c} onRefresh={load} />;
}

/* ── Draft ─────────────────────────────────────────────────────────────────── */

function Draft({ initial }: { initial: Campaign }) {
  const router = useRouter();
  const [c, setC] = useState<Campaign>(initial);
  const [step, setStep] = useState<"setup" | "design" | "send">("setup");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [markets, setMarkets] = useState<Market[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Partial<Campaign>>({});

  useEffect(() => { apiAdmin<{ data: Market[] }>("/admin/marketing/markets").then((r) => setMarkets(r.data)).catch(() => {}); }, []);

  // Save as you go: changes collect for a moment, then go in one request.
  const change = (p: Partial<Campaign>) => {
    setC((prev) => ({ ...prev, ...p, test_current: false }));
    pending.current = { ...pending.current, ...p };
    if (timer.current) clearTimeout(timer.current);
    setSaving("saving");
    timer.current = setTimeout(async () => {
      const body = pending.current;
      pending.current = {};
      try {
        const r = await apiAdmin<{ data: CampaignSummary }>(`/admin/marketing/campaigns/${c.id}`, { method: "PATCH", body: JSON.stringify(body) });
        setC((prev) => ({ ...prev, test_current: r.data.test_current, markets: r.data.markets }));
        setSaving("saved");
      } catch { setSaving("error"); }
    }, 700);
  };

  const flush = async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (Object.keys(pending.current).length) {
      const body = pending.current; pending.current = {};
      await apiAdmin(`/admin/marketing/campaigns/${c.id}`, { method: "PATCH", body: JSON.stringify(body) });
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this draft?")) return;
    await apiAdmin(`/admin/marketing/campaigns/${c.id}`, { method: "DELETE" });
    router.push("/admin/marketing/campaigns");
  };

  const steps: [typeof step, string][] = [["setup", "1  Set up"], ["design", "2  Design"], ["send", "3  Test & send"]];

  return (
    <div className="pb-12">
      <PageHeader
        title={c.name || c.subject || "New campaign"}
        actions={<>
          <span className="text-[13px] text-ink-muted inline-flex items-center gap-1.5">
            {saving === "saving" && <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>}
            {saving === "saved" && <><Check className="w-3.5 h-3.5 text-ok-ink" />Saved</>}
            {saving === "error" && <span className="text-alert-ink">Not saved — check your connection</span>}
          </span>
          <button className="c-btn c-btn-ghost text-alert-ink" onClick={remove}><Trash2 className="w-4 h-4" />Delete draft</button>
        </>}
      />

      <div className="c-tabs mb-4" role="tablist">
        {steps.map(([k, l]) => <button key={k} role="tab" aria-selected={step === k} className="c-tab" onClick={async () => { await flush(); setStep(k); }}>{l}</button>)}
      </div>

      {step === "setup" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className="c-panel p-4 space-y-4">
            <h3 className="c-panel-title">The email</h3>
            <Labelled label="Internal name (only the team sees this)"><input className="c-input w-full" value={c.name ?? ""} onChange={(e) => change({ name: e.target.value })} /></Labelled>
            <Labelled label="Subject line">
              <input className="c-input w-full" value={c.subject} maxLength={255} onChange={(e) => change({ subject: e.target.value })} />
              <span className="block text-[12px] text-ink-muted mt-1">{c.subject.length} characters. Under 50 reads fully on phones. Use {"{name}"} for the company name.</span>
            </Labelled>
            <Labelled label="Preview line (shown after the subject in the inbox)"><input className="c-input w-full" value={c.preheader ?? ""} maxLength={200} onChange={(e) => change({ preheader: e.target.value })} /></Labelled>
            <Labelled label="Product">
              <select className="c-select" value={c.product ?? ""} onChange={(e) => change({ product: e.target.value || null })}>
                <option value="">Any</option>{PRODUCTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Labelled>
          </section>

          <section className="c-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="c-panel-title">Send to these markets</h3>
              <Link href="/admin/marketing/markets" className="text-[13px] text-gold-ink hover:underline">Manage markets</Link>
            </div>
            {markets.length === 0 ? (
              <p className="text-[14px] text-ink-muted">No markets yet. <Link href="/admin/marketing/markets" className="text-gold-ink hover:underline">Create one</Link> and add contacts to it.</p>
            ) : (
              <ul className="divide-y divide-line border border-line rounded-md">
                {markets.map((m) => {
                  const on = (c.market_ids ?? []).includes(m.id);
                  return (
                    <li key={m.id}>
                      <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-paper-deep">
                        <input type="checkbox" checked={on} onChange={() => change({ market_ids: on ? (c.market_ids ?? []).filter((x) => x !== m.id) : [...(c.market_ids ?? []), m.id] })} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color ?? "#C7CCD3" }} />
                        <span className="flex-1 text-[14px] text-ink">{m.name}</span>
                        <span className="text-[13px] text-ink-muted">{m.emailable} of {m.members} reachable</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <label className="flex items-start gap-2 text-[14px] text-ink-soft pt-1">
              <input type="checkbox" className="mt-1" checked={c.skip_avoid} onChange={(e) => change({ skip_avoid: e.target.checked })} />
              <span>Skip leads the decision engine marks <strong>Avoid</strong> (said no, ignored several campaigns, or bad contact details). Unsubscribed contacts are always skipped.</span>
            </label>
            <div className="flex justify-end pt-2"><button className="c-btn c-btn-primary" onClick={async () => { await flush(); setStep("design"); }}>Next: design the email</button></div>
          </section>
        </div>
      )}

      {step === "design" && (
        <>
          <EmailDesigner value={c.design} onChange={(d) => change({ design: d })} subject={c.subject} preheader={c.preheader ?? undefined} />
          <div className="flex justify-end mt-4"><button className="c-btn c-btn-primary" onClick={async () => { await flush(); setStep("send"); }}>Next: test & send</button></div>
        </>
      )}

      {step === "send" && <TestAndSend c={c} onUpdated={(p) => setC((prev) => ({ ...prev, ...p }))} flush={flush} onSent={() => window.location.reload()} />}
    </div>
  );
}

function TestAndSend({ c, onUpdated, flush, onSent }: { c: Campaign; onUpdated: (p: Partial<Campaign>) => void; flush: () => Promise<void>; onSent: () => void }) {
  const [team, setTeam] = useState<{ email: string; name: string; me: boolean }[]>([]);
  const [also, setAlso] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "alert"; text: string } | null>(null);

  useEffect(() => {
    flush().then(() => apiAdmin<{ data: Audience }>(`/admin/marketing/campaigns/${c.id}/audience`).then((r) => setAudience(r.data)).catch(() => {}));
    apiAdmin<{ data: { email: string; name: string; me: boolean }[] }>("/admin/prospect-campaigns/test-recipients").then((r) => setTeam(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id]);

  const test = async () => {
    setBusy("test"); setMsg(null);
    try {
      await flush();
      const r = await apiAdmin<{ data: CampaignSummary; message: string }>(`/admin/marketing/campaigns/${c.id}/test`, { method: "POST", body: JSON.stringify({ also }) });
      onUpdated({ test_current: r.data.test_current, tested_at: r.data.tested_at });
      setMsg({ tone: "ok", text: r.message });
    } catch (e) { setMsg({ tone: "alert", text: e instanceof Error ? e.message : "Test failed" }); }
    finally { setBusy(null); }
  };

  const send = async () => {
    setBusy("send"); setMsg(null);
    try {
      await apiAdmin(`/admin/marketing/campaigns/${c.id}/send`, { method: "POST" });
      onSent();
    } catch (e) { setMsg({ tone: "alert", text: e instanceof Error ? e.message : "Could not send" }); setBusy(null); setConfirming(false); }
  };

  const canSend = c.test_current && (c.market_ids ?? []).length > 0 && (audience?.will_send ?? 0) > 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section className="c-panel p-4 space-y-3">
        <h3 className="c-panel-title flex items-center gap-2"><FlaskConical className="w-4 h-4" />Step 1: send a test</h3>
        <p className="text-[14px] text-ink-soft">A copy marked <strong>[TEST]</strong> goes to <strong>support</strong>. Open it in Outlook, on a phone too, and check the links before it goes out.</p>
        {team.length > 0 && (
          <div>
            <p className="text-[13px] text-ink-muted mb-1">Also send to</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {team.map((t) => (
                <label key={t.email} className="flex items-center gap-2 text-[14px] text-ink-soft">
                  <input type="checkbox" checked={also.includes(t.email)} onChange={() => setAlso((a) => a.includes(t.email) ? a.filter((x) => x !== t.email) : [...a, t.email])} />
                  {t.me ? "Me" : t.name}
                </label>
              ))}
            </div>
          </div>
        )}
        <button className="c-btn" onClick={test} disabled={busy !== null || !c.subject.trim()}>
          {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}Send test to support
        </button>
        <p className={`flex items-center gap-2 text-[14px] ${c.test_current ? "text-ok-ink" : "text-ink-muted"}`}>
          {c.test_current ? <><ShieldCheck className="w-4 h-4" />Tested {c.tested_at ? formatDate(c.tested_at) : ""}: this exact email may go out.</>
            : c.tested_at ? <><AlertTriangle className="w-4 h-4 text-alert-ink" />Changed since the last test. Test again before sending.</>
            : "Not tested yet."}
        </p>
      </section>

      <section className="c-panel p-4 space-y-3">
        <h3 className="c-panel-title flex items-center gap-2"><Send className="w-4 h-4" />Step 2: send to your markets</h3>
        <p className="text-[14px] text-ink-soft">Markets: <strong>{c.markets.join(", ") || "none chosen"}</strong></p>
        {audience && (
          <div className="rounded-md border border-line p-3 text-[14px] space-y-1">
            <p className="text-ink"><strong className="text-[18px]">{audience.will_send}</strong> will receive it (each address once).</p>
            <p className="text-ink-muted">Skipped: {audience.skipped.no_email} without an email · {audience.skipped.unsubscribed} unsubscribed · {audience.skipped.avoid} marked Avoid · {audience.skipped.duplicate} duplicates</p>
          </div>
        )}
        {!confirming ? (
          <button className="c-btn c-btn-primary" disabled={!canSend || busy !== null} onClick={() => setConfirming(true)}>
            <Send className="w-4 h-4" />Send to {audience?.will_send ?? 0} contacts
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] text-ink">Send now? This cannot be undone.</span>
            <button className="c-btn c-btn-primary" onClick={send} disabled={busy !== null}>{busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Yes, send it</button>
            <button className="c-btn" onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        )}
        {!c.test_current && <p className="text-[13px] text-ink-muted">Sending unlocks once the current version has been tested.</p>}
      </section>

      {msg && <p className={`xl:col-span-2 text-[14px] ${msg.tone === "ok" ? "text-ok-ink" : "text-alert-ink"}`}>{msg.text}</p>}
    </div>
  );
}

/* ── Sending / sent: the scorer ───────────────────────────────────────────── */

function Sent({ campaign, onRefresh }: { campaign: Campaign; onRefresh: () => void }) {
  const [r, setR] = useState<Report | null>(null);
  const load = useCallback(async () => {
    setR((await apiAdmin<{ data: Report }>(`/admin/marketing/campaigns/${campaign.id}/report`)).data);
  }, [campaign.id]);
  useEffect(() => { load(); }, [load]);

  // While sending, push the next batch from here too (the cron also does).
  useEffect(() => {
    if (campaign.status !== "sending") return;
    const t = setInterval(async () => {
      try { await apiAdmin(`/admin/prospect-campaigns/${campaign.id}/run`, { method: "POST", body: JSON.stringify({ limit: 8 }) }); } catch { /* keep polling */ }
      onRefresh(); load();
    }, 4000);
    return () => clearInterval(t);
  }, [campaign.status, campaign.id, load, onRefresh]);

  const st = r?.stats;
  const num = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="pb-12 space-y-4">
      <PageHeader title={campaign.name || campaign.subject} subtitle={`“${campaign.subject}” · ${campaign.markets.join(", ") || "no market"} · started ${campaign.started_at ? formatDate(campaign.started_at) : "—"}`}
        actions={<StatusBadge status={campaign.status} />} />

      {campaign.status === "sending" && (
        <div className="c-panel p-4">
          <p className="text-[14px] text-ink flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Sending… {campaign.sent_count} of {campaign.total}</p>
          <div className="h-2 mt-2 rounded-full bg-paper-deep overflow-hidden"><div className="h-full" style={{ width: `${campaign.total ? (campaign.sent_count / campaign.total) * 100 : 0}%`, background: "var(--o-series-1)" }} /></div>
          <p className="text-[13px] text-ink-muted mt-2">It keeps going if you close this page.</p>
        </div>
      )}

      {!r ? <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading the report…</p> : (<>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <ScoreTile stats={st} />
          <KpiTile label="Delivered" value={num(st?.delivered ?? 0)} sub={st?.failed ? `${st.failed} failed` : pct(st?.delivery_rate)} />
          <KpiTile label="Opened" value={pct(st?.open_rate)} sub={`${num(st?.opened ?? 0)} people`} />
          <KpiTile label="Clicked" value={pct(st?.click_rate)} sub={`${num(st?.clicked ?? 0)} people`} />
          <KpiTile label="Clicked after opening" value={pct(st?.click_to_open)} sub="How convincing the email was" />
          <KpiTile label="Unsubscribed" value={num(st?.unsubscribed ?? 0)} sub={pct(st?.unsubscribe_rate)} />
        </div>
        <p className="text-[13px] text-ink-muted">Opens are indicative: Apple Mail loads images automatically and some clients block them. Clicks are the reliable signal; clicks made by mail security scanners are left out.</p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GraphView title="From inbox to click" types={["bar"]}
            rows={[{ label: "Delivered", values: { n: st?.delivered ?? 0 } }, { label: "Opened", values: { n: st?.opened ?? 0 } }, { label: "Clicked", values: { n: st?.clicked ?? 0 } }]}
            measures={[{ key: "n", label: "People", format: num }]} />
          <GraphView title="By market" types={["bar"]}
            rows={r.by_market.map((m) => ({ label: m.market, values: { sent: m.sent, opened: m.opened, clicked: m.clicked } }))}
            series={[{ key: "sent", label: "Delivered" }, { key: "opened", label: "Opened" }, { key: "clicked", label: "Clicked" }]} format={num} />
        </div>

        <section className="c-panel overflow-x-auto">
          <div className="c-panel-head"><h3 className="c-panel-title flex items-center gap-2"><MousePointerClick className="w-4 h-4" />Links clicked</h3></div>
          {r.links.length === 0 ? <p className="px-4 py-5 text-[14px] text-ink-muted">No clicks yet.</p> : (
            <table className="c-table"><thead><tr><th>Link</th><th className="text-right">People</th><th className="text-right">Clicks</th></tr></thead>
              <tbody>{r.links.map((l) => <tr key={l.url}><td className="max-w-[40rem] truncate"><a href={l.url} target="_blank" rel="noreferrer" className="text-ink hover:underline">{l.url}</a></td><td className="text-right">{l.people}</td><td className="text-right">{l.clicks}</td></tr>)}</tbody>
            </table>
          )}
        </section>

        <section className="c-panel overflow-x-auto">
          <div className="c-panel-head">
            <h3 className="c-panel-title flex items-center gap-2"><Users className="w-4 h-4" />Who engaged</h3>
            <Link href="/admin/marketing/priorities" className="text-[13px] text-gold-ink hover:underline">See lead priorities</Link>
          </div>
          <table className="c-table min-w-[720px]">
            <thead><tr><th>Contact</th><th>Delivery</th><th>Opened</th><th>Clicked</th></tr></thead>
            <tbody>
              {r.people.map((p) => (
                <tr key={p.id}>
                  <td><span className="block text-ink font-medium">{p.name ?? p.email}</span><span className="block text-[13px] text-ink-muted">{p.email}</span></td>
                  <td>{p.unsubscribed_at ? <span className="c-chip" data-tone="muted">Unsubscribed</span> : <StatusBadge status={p.status} />}{p.error && <span className="block text-[12px] text-alert-ink truncate max-w-[16rem]" title={p.error}>{p.error}</span>}</td>
                  <td>{p.opened_at ? <span className="inline-flex items-center gap-1 text-ink"><MailOpen className="w-4 h-4 text-ink-muted" />{p.open_count}×</span> : <span className="text-ink-muted">—</span>}</td>
                  <td>{p.clicked_at ? <span className="c-chip" data-tone="ok">{p.click_count} click{p.click_count === 1 ? "" : "s"}</span> : <span className="text-ink-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>)}
    </div>
  );
}

function ScoreTile({ stats }: { stats: CampaignStats | null | undefined }) {
  const tone = { Excellent: "var(--o-success)", Good: "var(--o-info)", Fair: "var(--o-warning)", Poor: "var(--o-danger)" }[stats?.grade ?? ""] ?? "var(--o-muted)";
  return (
    <div className="o-kpi">
      <p className="o-kpi-label">Campaign score</p>
      <p className="o-kpi-value">{stats?.score ?? "—"}<span className="text-[15px] text-ink-muted font-normal"> / 100</span></p>
      <p className="o-kpi-sub font-semibold" style={{ color: tone }}>{stats?.grade ?? "Waiting for results"}</p>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[13px] text-ink-muted mb-1">{label}</span>{children}</label>;
}
