"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { API_BASE_URL as API } from "@/lib/constants";
import type { BookingView } from "@/lib/screen-ads";

const STAGE: Record<string, { title: string; body: string }> = {
  awaiting_payment: { title: "Awaiting your bank transfer", body: "Your campaign is reserved. Pay by bank transfer, then upload your proof of payment here." },
  payment_submitted: { title: "We're checking your payment", body: "Thank you. We'll email you as soon as your transfer is confirmed." },
  payment_confirmed: { title: "Payment received", body: "We're reviewing your video and will confirm your campaign shortly." },
  approved: { title: "Your advert is approved", body: "It will run on the Vitorra street screen on the dates below." },
  rejected: { title: "We can't run this advert", body: "Our team will contact you about your refund." },
  refunded: { title: "Refund sent", body: "Your refund has been sent." },
  cancelled: { title: "This booking was cancelled", body: "Talk to us if you would like to book again." },
};

const date = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [b, setB] = useState<BookingView | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`${API}/screen-ads/bookings/${token}`, { headers: { Accept: "application/json" } });
    if (!r.ok) { setMissing(true); return; }
    setB((await r.json()).data);
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  const send = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (file.size > 4 * 1024 * 1024) { setError("Please upload a file under 4 MB."); return; }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("proof", file);
      const r = await fetch(`${API}/screen-ads/bookings/${token}/proof`, { method: "POST", body: form, headers: { Accept: "application/json" } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "Upload failed.");
      setB(j.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); }
  };

  if (missing) return <p className="t-lead text-ink-soft">We could not find this booking. Please check your link.</p>;
  if (!b) return <Loader2 aria-label="Loading" className="w-6 h-6 animate-spin text-ink-muted" />;
  const stage = STAGE[b.status];

  return (
    <div className="max-w-[44rem]">
      <p className="t-label text-gold-ink">Booking {b.reference}</p>
      <h1 className="t-h2 mt-3">{stage?.title ?? b.status}</h1>
      <p className="t-lead text-ink-soft mt-4">{stage?.body}</p>
      {b.review_note && <p className="t-body mt-4">Reason: {b.review_note}</p>}

      {b.bank && (
        <section className="mt-10 border border-line rounded-edge p-6">
          <h2 className="t-label text-ink-muted">Pay by bank transfer</h2>
          <p className="font-display text-[2.25rem] leading-none mt-4 tabular-nums">UGX {b.monthly_ugx.toLocaleString("en-US")}</p>
          <dl className="mt-6 grid grid-cols-[9rem_1fr] gap-y-2 t-body">
            <dt className="text-ink-muted">Bank</dt><dd>{b.bank.bank}, {b.bank.branch}</dd>
            <dt className="text-ink-muted">Account name</dt><dd>{b.bank.account_name}</dd>
            <dt className="text-ink-muted">Account number</dt><dd className="tabular-nums">{b.bank.account_number}</dd>
            <dt className="text-ink-muted">SWIFT</dt><dd>{b.bank.swift}</dd>
            <dt className="text-ink-muted">Payment reference</dt><dd className="font-semibold">{b.reference}</dd>
          </dl>
          <label className="mt-7 flex items-center gap-3 rounded-edge px-4 min-h-14 border border-dashed border-line-strong bg-paper-deep cursor-pointer">
            {busy ? <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" /> : b.proof_received ? <Check aria-hidden="true" className="w-5 h-5 text-ok-ink" /> : <Upload aria-hidden="true" className="w-5 h-5 text-gold-ink" />}
            <span className="t-body">{b.proof_received ? "Proof received. Upload a different file" : "Upload proof of payment (PDF or photo)"}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={busy} onChange={(e) => void send(e.target.files?.[0])} />
          </label>
          {error && <p role="alert" className="t-small text-alert-ink mt-3">{error}</p>}
        </section>
      )}

      <dl className="mt-10 grid grid-cols-[9rem_1fr] gap-y-2 t-body">
        <dt className="text-ink-muted">Advertiser</dt><dd>{b.company}</dd>
        <dt className="text-ink-muted">Video</dt><dd>{b.duration} seconds</dd>
        <dt className="text-ink-muted">Visibility</dt><dd>{b.visibility}, about {b.plays_per_hour} appearances an hour</dd>
        <dt className="text-ink-muted">Days</dt><dd className="capitalize">{b.days.join(", ")}</dd>
        <dt className="text-ink-muted">Times</dt><dd>{b.periods.join(", ")}</dd>
        <dt className="text-ink-muted">Campaign</dt><dd>{date(b.start_date)} to {date(b.end_date)}</dd>
      </dl>
    </div>
  );
}
