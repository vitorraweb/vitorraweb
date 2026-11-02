"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Download, Loader2, RotateCcw, X } from "lucide-react";
import { apiAdmin, auth, canAccess, downloadFile } from "@/lib/auth";
import { Empty, PageHeader, StatusBadge } from "@/components/admin/admin-ui";

/* ─── Operations → Street screen bookings ─────────────────────────────────────
   Paid first, reviewed second. Finance confirms the money, the screen's owners
   watch the video and approve or refuse it, and a refused advert stays on this
   list until Finance records the refund. Only approved adverts reach the screen. */

type Booking = {
  id: number; reference: string; status: string; company: string; contact_name: string; email: string; phone: string | null; notes: string | null;
  duration_seconds: number; visibility: string; plays_per_hour: number; days: string[]; periods: string[]; start_date: string; end_date: string;
  monthly_ugx: number; video_url: string; video_seconds: number; video_width: number | null; video_height: number | null; proof_name: string | null; review_note: string | null; created_at: string;
};

const ugx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;
const day = (d: string) => d.slice(0, 10);

export default function ScreenAdsPage() {
  const [list, setList] = useState<Booking[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
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
      {loading ? <Loader2 aria-label="Loading" className="w-5 h-5 animate-spin" /> : list.length === 0 ? <Empty label="No bookings yet." /> : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table w-full">
            <thead><tr><th>Reference</th><th>Advertiser</th><th>Campaign</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {list.flatMap((b) => {
                const rows = [
                  <tr key={b.id} className="cursor-pointer" onClick={() => setOpen(open === b.id ? null : b.id)}>
                    <td>{b.reference}</td><td>{b.company}</td>
                    <td>{day(b.start_date)} to {day(b.end_date)}</td>
                    <td className="tabular-nums">{ugx(b.monthly_ugx)}</td><td><StatusBadge status={b.status} /></td>
                  </tr>,
                ];
                if (open === b.id) rows.push(
                  <tr key={`${b.id}-detail`}><td colSpan={5}>
                    <div className="grid md:grid-cols-2 gap-5 py-3">
                      {/* Review this: it must play here, or it will not play on the street screen. */}
                      <video src={b.video_url} controls muted playsInline className="w-full bg-black" />
                      <div className="text-[14px] space-y-1.5">
                        <p>{b.contact_name} · {b.email}{b.phone ? ` · ${b.phone}` : ""}</p>
                        <p>{b.duration_seconds}-second video ({Math.round(b.video_seconds)}s, {b.video_width} × {b.video_height})</p>
                        <p className="capitalize">{b.visibility}: {b.plays_per_hour} plays an hour</p>
                        <p className="capitalize">{b.days.join(", ")} · {b.periods.join(", ")}</p>
                        {b.notes && <p>Note: {b.notes}</p>}
                        {b.review_note && <p>Refused: {b.review_note}</p>}
                        <div className="flex flex-wrap gap-2 pt-3">
                          {b.proof_name && <button type="button" className="c-btn" onClick={() => void downloadFile(`/admin/screen-ads/${b.id}/proof`, b.proof_name!)}><Download aria-hidden="true" className="w-4 h-4" />Payment proof</button>}
                          {finance && b.status === "payment_submitted" && <button type="button" className="c-btn c-btn-primary" onClick={() => void act(b, "confirm-payment")}><Check aria-hidden="true" className="w-4 h-4" />Money received</button>}
                          {owner && b.status === "payment_confirmed" && <button type="button" className="c-btn c-btn-primary" onClick={() => void act(b, "approve")}><Check aria-hidden="true" className="w-4 h-4" />Approve advert</button>}
                          {owner && (b.status === "payment_confirmed" || b.status === "approved") && <button type="button" className="c-btn" onClick={() => refuse(b)}><X aria-hidden="true" className="w-4 h-4" />Refuse advert</button>}
                          {finance && b.status === "rejected" && <button type="button" className="c-btn c-btn-primary" onClick={() => void act(b, "refunded")}><RotateCcw aria-hidden="true" className="w-4 h-4" />Refund sent</button>}
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
