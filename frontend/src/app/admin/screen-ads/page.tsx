"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, Loader2, MonitorCheck, MonitorX, Plus, RotateCcw, X } from "lucide-react";
import { apiAdmin, auth, canAccess, downloadCsv, downloadFile } from "@/lib/auth";
import { Empty, PageHeader, StatusBadge } from "@/components/admin/admin-ui";

/* ─── Operations → Street screen bookings ─────────────────────────────────────
   Paid first, reviewed second. Finance confirms the money, the screen's owners
   watch the video and approve or refuse it, and a refused advert stays on this
   list until Finance records the refund. Only approved adverts reach the screen. */

type Booking = {
  id: number; reference: string; status: string; company: string; contact_name: string; email: string; phone: string | null; notes: string | null;
  package: string; plays_per_hour: number; start_date: string; end_date: string;
  price_ugx: number; video_url: string; video_seconds: number; video_width: number | null; video_height: number | null; proof_name: string | null; review_note: string | null; created_at: string;
};

type Downtime = { id: number; started_at: string; ended_at: string | null; minutes: number; reason: string | null; source: string };
type Inventory = {
  units: number; break_even: number; break_even_ugx: number; paid_today: number;
  held_by_day: Record<string, number>; paid_by_day: Record<string, number>;
  screen: { connected: boolean; last_seen: string | null; scene: string | null; down: boolean };
  downtime: Downtime[];
};
type Delivery = { days: { date: string; expected: number; delivered: number }[]; expected: number; delivered: number; missed: number; delivery: number | null; owed: boolean; missed_value_ugx: number };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Kampala", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const ugx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;
const day = (d: string) => d.slice(0, 10);

export default function ScreenAdsPage() {
  const [list, setList] = useState<Booking[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [inv, setInv] = useState<Inventory | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);
  const [link, setLink] = useState("");
  const [delivery, setDelivery] = useState<Record<number, Delivery>>({});
  const user = auth.getUser();
  const finance = canAccess(user, { module: "accounting" });
  const owner = canAccess(user, { module: "screen_ads" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiAdmin<{ data: Booking[]; statuses: string[] }>(`/admin/screen-ads${status ? `?status=${status}` : ""}`);
      setList(r.data); setStatuses(r.statuses);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not load bookings."); } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  const loadInventory = useCallback(async () => {
    try { setInv((await apiAdmin<{ data: Inventory }>("/admin/screen-ads/inventory")).data); setCheckedAt(Date.now()); } catch { /* shown as missing */ }
  }, []);
  useEffect(() => { void loadInventory(); const t = setInterval(loadInventory, 60_000); return () => clearInterval(t); }, [loadInventory]);

  const openRow = async (b: Booking) => {
    const id = open === b.id ? null : b.id;
    setOpen(id);
    if (id && ["approved", "rejected", "refunded"].includes(b.status) && !delivery[b.id]) {
      try { const r = await apiAdmin<{ data: Delivery }>(`/admin/screen-ads/${b.id}/report`); setDelivery((d) => ({ ...d, [b.id]: r.data })); } catch { /* */ }
    }
  };
  const connect = async () => {
    if (inv?.screen.connected && !confirm("Connect a new street screen? The current screen stops reporting until it is opened with the new link.")) return;
    try {
      const r = await apiAdmin<{ data: { key: string } }>("/admin/screen-ads/screen-key", { method: "POST", body: "{}" });
      setLink(`${window.location.origin}/display/street?screen=${r.data.key}`);
      void loadInventory();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not connect a screen."); }
  };
  const note = async (d: Downtime) => {
    const reason = prompt("What caused this downtime?", d.reason ?? "");
    if (!reason?.trim()) return;
    try { await apiAdmin(`/admin/screen-ads/downtime/${d.id}`, { method: "PATCH", body: JSON.stringify({ reason: reason.trim() }) }); void loadInventory(); } catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };
  const addDowntime = async () => {
    const from = prompt("When did the screen go off? (e.g. 2026-11-03 14:00)");
    const to = from && prompt("When was it back on? (e.g. 2026-11-03 15:30)");
    const reason = to && prompt("What happened?");
    if (!from || !to || !reason) return;
    const iso = (v: string) => new Date(`${v.trim().replace(" ", "T")}:00+03:00`).toISOString();
    try { await apiAdmin("/admin/screen-ads/downtime", { method: "POST", body: JSON.stringify({ started_at: iso(from), ended_at: iso(to), reason }) }); void loadInventory(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Check the times and try again."); }
  };
  const extend = async (b: Booking) => {
    const days = Number(prompt("Extend this campaign by how many days, to make up missed airtime?", "1"));
    if (days > 0) await act(b, "extend", { days });
  };
  const days = inv ? Object.entries(inv.held_by_day) : [];
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const lastSeenMinutes = inv?.screen.last_seen ? Math.max(0, Math.round((checkedAt - new Date(inv.screen.last_seen).getTime()) / 60_000)) : null;

  const act = async (b: Booking, action: string, body?: object) => {
    setMsg("");
    try { await apiAdmin(`/admin/screen-ads/${b.id}/${action}`, { method: "POST", body: JSON.stringify(body ?? {}) }); await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "That didn't work."); }
  };
  const refuse = (b: Booking) => {
    const reason = prompt("Why can't we run this advert? The customer sees this.");
    if (reason?.trim()) void act(b, "reject", { reason: reason.trim() });
  };

  return (
    <div>
      <PageHeader title="Street screen bookings" subtitle="Paid adverts: confirm payment, review the video, approve or refuse" actions={
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="c-select">
          <option value="">All bookings</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      } />
      {msg && <p role="alert" className="text-[13px] mb-3" style={{ color: "var(--o-danger)" }}>{msg}</p>}

      {inv && (
        <div className="grid lg:grid-cols-3 gap-4 mb-5">
          <section className="c-panel p-4">
            <h2 className="c-panel-title">Paid units today</h2>
            <p className="text-[28px] font-semibold tabular-nums mt-1">{inv.paid_today} <span className="text-[15px] font-normal">of {inv.units}</span></p>
            <div className="relative h-2.5 mt-3 rounded-full overflow-hidden" style={{ background: "var(--o-line)" }} role="img" aria-label={`${inv.paid_today} of ${inv.units} units sold; break-even is ${inv.break_even}`}>
              <div className="absolute inset-y-0 left-0" style={{ width: `${(100 * inv.paid_today) / inv.units}%`, background: inv.paid_today >= inv.break_even ? "var(--o-success)" : "var(--o-accent)" }} />
              <div className="absolute inset-y-0 w-0.5" style={{ left: `${(100 * inv.break_even) / inv.units}%`, background: "var(--o-text)" }} />
            </div>
            <p className="text-[13px] mt-2">{inv.paid_today >= inv.break_even ? "Above break-even." : `${inv.break_even - inv.paid_today} more Standard units to break-even (${inv.break_even} units, ${ugx(inv.break_even_ugx)} a month).`}</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--o-text-muted)" }}>Counts paid and approved bookings. Unpaid ones hold their units for 72 hours.</p>
          </section>

          <section className="c-panel p-4">
            <h2 className="c-panel-title">Units booked, next 8 weeks</h2>
            <div className="mt-3 space-y-1">
              {weeks.map((w) => (
                <div key={w[0][0]} className="flex items-center gap-1">
                  <span className="text-[11px] w-12 shrink-0">{new Date(`${w[0][0]}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  {w.map(([d, n]) => <span key={d} title={`${d}: ${n} of ${inv.units} units booked (${inv.paid_by_day[d] ?? 0} paid)`} className="h-4 flex-1 rounded-sm" style={{ background: n >= inv.units ? "var(--o-danger)" : n >= inv.break_even ? "var(--o-success)" : n > 0 ? "var(--o-accent)" : "var(--o-line)", opacity: n ? 0.35 + (0.65 * n) / inv.units : 1 }} />)}
                </div>
              ))}
            </div>
            <p className="text-[12px] mt-2" style={{ color: "var(--o-text-muted)" }}>Hover a day for its count. Red is full, green is at or above break-even.</p>
          </section>

          <section className="c-panel p-4">
            <h2 className="c-panel-title flex items-center gap-2">{inv.screen.connected && !inv.screen.down && lastSeenMinutes !== null && lastSeenMinutes < 4 ? <MonitorCheck aria-hidden="true" className="w-4 h-4" style={{ color: "var(--o-success)" }} /> : <MonitorX aria-hidden="true" className="w-4 h-4" style={{ color: "var(--o-danger)" }} />}Street screen</h2>
            <p className="text-[13px] mt-2">{!inv.screen.connected ? "Not connected: plays and downtime are not being recorded." : lastSeenMinutes === null ? "Connected, waiting for the screen to check in." : lastSeenMinutes < 4 ? `On air, last checked in ${lastSeenMinutes < 1 ? "just now" : `${lastSeenMinutes} min ago`}.` : `Not heard from for ${lastSeenMinutes} min.`}</p>
            {owner && <button type="button" className="c-btn mt-3" onClick={() => void connect()}>{inv.screen.connected ? "Connect a new screen" : "Connect street screen"}</button>}
            {link && (
              <div className="mt-3 text-[12.5px]">
                <p>Open this link once in the street screen&apos;s browser. It is shown only now.</p>
                <div className="flex gap-2 mt-1"><input readOnly value={link} className="c-input flex-1" onFocus={(e) => e.target.select()} /><button type="button" className="c-btn" aria-label="Copy link" onClick={() => void navigator.clipboard.writeText(link)}><Copy aria-hidden="true" className="w-4 h-4" /></button></div>
              </div>
            )}
          </section>

          <section className="c-panel lg:col-span-3">
            <div className="c-panel-head"><h2 className="c-panel-title">Downtime log</h2>{owner && <button type="button" className="c-btn" onClick={() => void addDowntime()}><Plus aria-hidden="true" className="w-4 h-4" />Log downtime</button>}</div>
            {inv.downtime.length === 0 ? <p className="text-[13px] p-4">No downtime recorded.</p> : (
              <table className="c-table w-full"><thead><tr><th>From</th><th>To</th><th>Minutes</th><th>Reason</th><th>Recorded</th></tr></thead>
                <tbody>{inv.downtime.map((d) => (
                  <tr key={d.id}><td>{when(d.started_at)}</td><td>{d.ended_at ? when(d.ended_at) : <strong>Still down</strong>}</td><td className="tabular-nums">{d.minutes}</td>
                    <td>{d.reason ?? (owner ? <button type="button" className="underline" onClick={() => void note(d)}>Add reason</button> : "")}</td><td>{d.source === "manual" ? "By hand" : "Automatically"}</td></tr>
                ))}</tbody></table>
            )}
          </section>
        </div>
      )}
      {loading ? <Loader2 aria-label="Loading" className="w-5 h-5 animate-spin" /> : list.length === 0 ? <Empty label="No bookings yet." /> : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table w-full">
            <thead><tr><th>Reference</th><th>Advertiser</th><th>Campaign</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {list.flatMap((b) => {
                const rows = [
                  <tr key={b.id} className="cursor-pointer" onClick={() => void openRow(b)}>
                    <td>{b.reference}</td><td>{b.company}</td>
                    <td>{day(b.start_date)} to {day(b.end_date)}</td>
                    <td className="tabular-nums">{ugx(b.price_ugx)}</td><td><StatusBadge status={b.status} /></td>
                  </tr>,
                ];
                if (open === b.id) rows.push(
                  <tr key={`${b.id}-detail`}><td colSpan={5}>
                    <div className="grid md:grid-cols-2 gap-5 py-3">
                      {/* Review this: it must play here, or it will not play on the street screen. */}
                      <video src={b.video_url} controls muted playsInline className="w-full bg-black" />
                      <div className="text-[14px] space-y-1.5">
                        <p>{b.contact_name} · {b.email}{b.phone ? ` · ${b.phone}` : ""}</p>
                        <p>Video: {Math.round(b.video_seconds)}s, {b.video_width} × {b.video_height}</p>
                        <p className="capitalize">{b.package}: {b.plays_per_hour} plays an hour</p>
                        {b.notes && <p>Note: {b.notes}</p>}
                        {b.review_note && <p>Refused: {b.review_note}</p>}
                        {delivery[b.id] && (
                          <div className="mt-2 p-3 rounded" style={{ background: "var(--o-hover)" }}>
                            <p className="font-semibold">Delivery so far</p>
                            <p>{delivery[b.id].delivered.toLocaleString()} of {delivery[b.id].expected.toLocaleString()} booked plays delivered{delivery[b.id].delivery !== null ? ` (${Math.round(100 * (delivery[b.id].delivery ?? 0))}%)` : ""}.</p>
                            {delivery[b.id].owed && <p style={{ color: "var(--o-danger)" }}>Below 95%: {delivery[b.id].missed.toLocaleString()} plays missed, worth {ugx(delivery[b.id].missed_value_ugx)}. Extend the campaign to make them up, or refund that share.</p>}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-3">
                          {b.proof_name && <button type="button" className="c-btn" onClick={() => void downloadFile(`/admin/screen-ads/${b.id}/proof`, b.proof_name!)}><Download aria-hidden="true" className="w-4 h-4" />Payment proof</button>}
                          {finance && b.status === "payment_submitted" && <button type="button" className="c-btn c-btn-primary" onClick={() => void act(b, "confirm-payment")}><Check aria-hidden="true" className="w-4 h-4" />Money received</button>}
                          {owner && b.status === "payment_confirmed" && <button type="button" className="c-btn c-btn-primary" onClick={() => void act(b, "approve")}><Check aria-hidden="true" className="w-4 h-4" />Approve advert</button>}
                          {owner && (b.status === "payment_confirmed" || b.status === "approved") && <button type="button" className="c-btn" onClick={() => refuse(b)}><X aria-hidden="true" className="w-4 h-4" />Refuse advert</button>}
                          {finance && b.status === "rejected" && <button type="button" className="c-btn c-btn-primary" onClick={() => void act(b, "refunded")}><RotateCcw aria-hidden="true" className="w-4 h-4" />Refund sent</button>}
                          {delivery[b.id] && <button type="button" className="c-btn" onClick={() => void downloadCsv(`/admin/screen-ads/${b.id}/report.csv`, `${b.reference}-delivery.csv`)}><Download aria-hidden="true" className="w-4 h-4" />Delivery report</button>}
                          {owner && b.status === "approved" && <button type="button" className="c-btn" onClick={() => void extend(b)}><Plus aria-hidden="true" className="w-4 h-4" />Extend for missed airtime</button>}
                          <a className="c-btn" href={b.video_url} download target="_blank" rel="noreferrer"><Download aria-hidden="true" className="w-4 h-4" />Artwork</a>
                          {owner && b.status === "awaiting_payment" && <button type="button" className="c-btn" onClick={() => void act(b, "cancel")}><X aria-hidden="true" className="w-4 h-4" />Cancel unpaid booking</button>}
                        </div>
                      </div>
                    </div>
                  </td></tr>,
                );
                return rows;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
