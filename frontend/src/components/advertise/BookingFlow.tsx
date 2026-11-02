"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { ArrowRight, Check, Loader2, Upload } from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { API_BASE_URL as API } from "@/lib/constants";
import { DAYS, DAY_PRESETS, isH264, monthlyPrice, readVideo, type Pricing } from "@/lib/screen-ads";

/* The booking journey: what it costs first (length, visibility, days), when it
   runs second, then the video, the details and the bank transfer. The choices
   that change the price are kept apart from the ones that do not. */

const cls = "w-full min-h-12 rounded-edge px-3.5 t-body border border-line-strong bg-white text-ink outline-none focus:border-ink transition-colors";
const choice = (on: boolean) => `text-left rounded-edge border px-4 py-3 transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"}`;
const TITLES = ["Build your campaign", "Choose your times", "Upload your video", "Your details"];

type Video = { url: string; seconds: number; width: number; height: number; size: number; name: string };

export function BookingFlow({ preview, draft }: { preview: string; draft: boolean }) {
  const router = useRouter();
  const [opened] = useState(() => Date.now());
  const [p, setP] = useState<Pricing | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(15);
  const [visibility, setVisibility] = useState("standard");
  const [days, setDays] = useState<string[]>(DAY_PRESETS[0].days);
  const [periods, setPeriods] = useState<string[]>([]);
  const [start, setStart] = useState("");
  const [video, setVideo] = useState<Video | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [f, setF] = useState({ company: "", contact_name: "", email: "", phone: "", notes: "" });
  const [terms, setTerms] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);

  const headers = useMemo(() => ({ Accept: "application/json", "Content-Type": "application/json", "X-Screen-Ads-Preview": preview }), [preview]);

  useEffect(() => {
    fetch(`${API}/screen-ads/pricing`, { headers }).then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => setP(j.data)).catch(() => setFailed(true));
  }, [headers]);

  if (failed) return <p className="t-lead text-ink-soft">Booking is not available right now. Please try again shortly.</p>;
  if (!p) return <Loader2 aria-label="Loading" className="w-6 h-6 animate-spin text-ink-muted" />;

  const price = monthlyPrice(p, seconds, visibility, days.length);
  const level = p.visibility.find((v) => v.id === visibility);
  const earliest = new Date(opened + p.lead_days * 86_400_000).toISOString().slice(0, 10);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(""); setVideo(null);
    if (file.size > p.video.max_mb * 1024 * 1024) { setError(`Please keep your video under ${p.video.max_mb} MB.`); return; }
    const meta = await readVideo(file);
    if (!meta || !(await isH264(file))) { setError("Please export your video as MP4 (H.264) and try again: the screen cannot play this format."); return; }
    if (Math.abs(meta.seconds - seconds) > p.video.tolerance_seconds) { setError(`This video runs ${Math.round(meta.seconds)} seconds. You chose ${seconds} seconds.`); return; }
    if (meta.width <= meta.height) { setError("Please upload a landscape video: the screen is 1920 × 1080."); return; }
    if (meta.width < p.video.min_width) { setError(`This video is too small for the screen. Please use 1920 × 1080.`); return; }
    setProgress(0);
    try {
      const name = `screen-ads/${crypto.randomUUID()}.mp4`;
      const blob = await upload(name, file, {
        access: "public", contentType: "video/mp4", handleUploadUrl: "/api/screen-ads/upload", clientPayload: preview, multipart: true,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      setVideo({ url: blob.url, seconds: meta.seconds, width: meta.width, height: meta.height, size: file.size, name: file.name });
    } catch { setError("The upload didn't finish. Please try again."); } finally { setProgress(null); }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;
    setBusy(true); setError("");
    try {
      const r = await fetch(`${API}/screen-ads/bookings`, {
        method: "POST", headers,
        body: JSON.stringify({
          ...f, duration: seconds, visibility, days, periods, start_date: start, terms_accepted: terms, turnstile_token: token,
          video_url: video.url, video_seconds: video.seconds, video_width: video.width, video_height: video.height, video_size: video.size,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "We couldn't confirm your booking.");
      router.push(`/advertise/booking/${j.data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't confirm your booking.");
      turnstile.current?.reset(); setToken("");
    } finally { setBusy(false); }
  };

  const next = [price !== null, periods.length > 0 && !!start && start >= earliest, !!video][step];
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div className="grid lg:grid-cols-[1fr_20rem] gap-12 items-start">
      <div className="min-w-0">
        {draft && <p className="t-small bg-paper-deep border border-line rounded-edge px-4 py-3 mb-8">Preview only. Apart from the UGX 450,000 starting package, these prices are examples awaiting approval from Finance.</p>}
        <p className="t-label text-gold-ink">Step {step + 1} of {TITLES.length}</p>
        <h1 className="t-h2 mt-3 mb-10">{TITLES[step]}</h1>

        {step === 0 && (
          <div className="space-y-10">
            <section>
              <h2 className="t-h4 mb-3">Video length</h2>
              <div className="grid grid-cols-3 gap-3">
                {p.durations.map((d) => <button key={d.seconds} type="button" aria-pressed={seconds === d.seconds} onClick={() => { setSeconds(d.seconds); setVideo(null); }} className={choice(seconds === d.seconds)}>{d.seconds} sec</button>)}
              </div>
              <p className="t-small text-ink-muted mt-3">Need 45 to 60 seconds? <Link className="q-link" href="/enquire?message=I%20would%20like%20a%20quote%20for%20a%2045%20to%2060%20second%20advert%20on%20the%20street%20screen.">Ask us for a quote</Link>.</p>
            </section>
            <section>
              <h2 className="t-h4 mb-3">How often should your advert appear?</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {p.visibility.map((v) => (
                  <button key={v.id} type="button" aria-pressed={visibility === v.id} onClick={() => setVisibility(v.id)} className={choice(visibility === v.id)}>
                    <span className="block font-semibold">{v.label}</span>
                    <span className="block t-small opacity-80 mt-1">{v.blurb}</span>
                    <span className="block t-small opacity-80 mt-1">Approx. {v.plays_per_hour} appearances per hour</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="t-h4 mb-3">Choose your days</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {DAY_PRESETS.map((d) => <button key={d.label} type="button" aria-pressed={same(days, d.days)} onClick={() => setDays(d.days)} className={choice(same(days, d.days))}>{d.label}</button>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((d) => <button key={d.id} type="button" aria-pressed={days.includes(d.id)} onClick={() => setDays(toggle(days, d.id))} className={`${choice(days.includes(d.id))} !px-1 text-center`}>{d.short}</button>)}
              </div>
            </section>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-10">
            <section>
              <h2 className="t-h4 mb-3">When should it run?</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {p.periods.map((x) => (
                  <button key={x.id} type="button" aria-pressed={periods.includes(x.id)} onClick={() => setPeriods(toggle(periods, x.id))} className={choice(periods.includes(x.id))}>
                    <span className="block font-semibold">{x.label}</span><span className="block t-small opacity-80 mt-1">{x.hours}</span>
                  </button>
                ))}
              </div>
              <p className="t-small text-ink-muted mt-3">Times do not change your price.</p>
            </section>
            <section>
              <label className="block"><span className="t-h4 block mb-3">Start date</span>
                <input type="date" min={earliest} value={start} onChange={(e) => setStart(e.target.value)} className={`${cls} max-w-[16rem]`} />
              </label>
              <p className="t-small text-ink-muted mt-3">Your campaign runs for {p.campaign_days} days from this date.</p>
            </section>
          </div>
        )}

        {step === 2 && (
          <section>
            <p className="t-body text-ink-soft mb-6">Upload one {seconds}-second video, MP4 (H.264), 1920 × 1080, up to {p.video.max_mb} MB. The screen plays it without sound.</p>
            <label className="flex items-center gap-3 rounded-edge px-4 min-h-16 border border-dashed border-line-strong bg-paper-deep cursor-pointer">
              {progress !== null ? <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" /> : video ? <Check aria-hidden="true" className="w-5 h-5 text-ok-ink" /> : <Upload aria-hidden="true" className="w-5 h-5 text-gold-ink" />}
              <span className="t-body">{progress !== null ? `Uploading ${progress}%` : video ? `${video.name} uploaded` : "Choose your video"}</span>
              <input type="file" accept="video/mp4,.mp4" className="hidden" disabled={progress !== null} onChange={(e) => void pick(e.target.files?.[0])} />
            </label>
          </section>
        )}

        {step === 3 && (
          <form onSubmit={confirm} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block"><span className="t-small block mb-1.5">Company</span><input required value={f.company} onChange={(e) => set("company", e.target.value)} className={cls} autoComplete="organization" /></label>
              <label className="block"><span className="t-small block mb-1.5">Your name</span><input required value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={cls} autoComplete="name" /></label>
              <label className="block"><span className="t-small block mb-1.5">Email</span><input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={cls} autoComplete="email" /></label>
              <label className="block"><span className="t-small block mb-1.5">Phone</span><input required type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={cls} autoComplete="tel" /></label>
            </div>
            <label className="block"><span className="t-small block mb-1.5">Anything we should know? (optional)</span><textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} className={`${cls} py-3`} /></label>
            <label className="flex gap-3 items-start t-small">
              <input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1" />
              <span>I own or have the rights to this video. I understand Vitorra reviews every advert after payment, may refuse one, and will refund it if so.</span>
            </label>
            <Turnstile ref={turnstile} action="screen_ad" onVerify={setToken} onExpire={() => setToken("")} />
            <button disabled={busy} className="q-btn bg-ink text-paper hover:bg-black">{busy ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : null}Confirm booking</button>
          </form>
        )}

        {error && <p role="alert" className="t-small text-alert-ink mt-5">{error}</p>}
        <div className="flex gap-4 mt-10">
          {step > 0 && <button type="button" onClick={() => { setError(""); setStep(step - 1); }} className="q-link t-small">Back</button>}
          {step < 3 && <button type="button" disabled={!next} onClick={() => { setError(""); setStep(step + 1); }} className="q-btn bg-ink text-paper hover:bg-black disabled:opacity-40">{["Continue to schedule", "Continue to upload", "Continue to your details"][step]}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 border border-line rounded-edge p-6 bg-paper-deep">
        <h2 className="t-label text-ink-muted">Your monthly campaign</h2>
        <p className="font-display text-[2.5rem] leading-none mt-4 tabular-nums" aria-live="polite">{price === null ? "Choose a day" : `UGX ${price.toLocaleString("en-US")}`}</p>
        <p className="t-small text-ink-muted mt-3">Price updates automatically as you customise your campaign.</p>
        <ul className="t-small mt-5 space-y-1.5">
          <li>{seconds}-second video</li>
          <li>{level?.label}: approx. {level?.plays_per_hour} appearances per hour</li>
          <li>{days.length} {days.length === 1 ? "day" : "days"} a week for {p.campaign_days} days</li>
        </ul>
      </aside>
    </div>
  );
}
