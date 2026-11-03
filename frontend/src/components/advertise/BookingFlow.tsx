"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadPresigned } from "@vercel/blob/client";
import { ArrowRight, Check, Loader2, Upload } from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { API_BASE_URL as API } from "@/lib/constants";
import { IMAGE_TYPES, isH264, readImage, readVideo, type Pricing } from "@/lib/screen-ads";

/* The booking journey: pick a package, a start date, upload the video, leave
   your details, then pay by bank transfer. */

const cls = "w-full min-h-12 rounded-edge px-3.5 t-body border border-line-strong bg-white text-ink outline-none focus:border-ink transition-colors";
const choice = (on: boolean) => `text-left rounded-edge border px-4 py-3 transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"}`;
const TITLES = ["Choose your package", "Choose your start date", "Upload your advert", "Your details"];

type Video = { url: string; seconds: number | null; width: number; height: number; size: number; name: string; kind: "video" | "image" };

export function BookingFlow({ preview, draft }: { preview: string; draft: boolean }) {
  const router = useRouter();
  const [opened] = useState(() => Date.now());
  const [p, setP] = useState<Pricing | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [packageId, setPackageId] = useState("standard");
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

  const chosen = p.packages.find((x) => x.id === packageId) ?? p.packages[0];
  const seconds = p.video.seconds;
  const earliest = new Date(opened + p.lead_days * 86_400_000).toISOString().slice(0, 10);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(""); setVideo(null);
    if (IMAGE_TYPES[file.type]) { await pickDesign(file); return; }
    if (file.size > p.video.max_mb * 1024 * 1024) { setError(`Please keep your video under ${p.video.max_mb} MB.`); return; }
    const meta = await readVideo(file);
    if (!meta || !(await isH264(file))) { setError("Please export your video as MP4 (H.264) and try again: the screen cannot play this format."); return; }
    if (Math.abs(meta.seconds - seconds) > p.video.tolerance_seconds) { setError(`This video runs ${Math.round(meta.seconds)} seconds. Every package uses a ${seconds}-second video.`); return; }
    if (meta.width <= meta.height) { setError("Please upload a landscape video: the screen is 1920 × 1080."); return; }
    if (meta.width < p.video.min_width) { setError(`This video is too small for the screen. Please use 1920 × 1080.`); return; }
    setProgress(0);
    try {
      const name = `screen-ads/${crypto.randomUUID()}.mp4`;
      const blob = await uploadPresigned(name, file, {
        access: "public", contentType: "video/mp4", handleUploadUrl: "/api/screen-ads/upload", clientPayload: preview, multipart: true,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      setVideo({ url: blob.url, seconds: meta.seconds, width: meta.width, height: meta.height, size: file.size, name: file.name, kind: "video" });
    } catch (err) {
      console.error("Video upload failed", err);
      setError("The upload didn't finish. Please try again.");
    } finally { setProgress(null); }
  };

  /* A design instead of a video: one 1920 × 1080 image, shown for the same 15 seconds. */
  const pickDesign = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { setError("Please keep your design under 20 MB."); return; }
    const meta = await readImage(file);
    if (!meta) { setError("We couldn't read this image. Please save it as PNG or JPG and try again."); return; }
    if (meta.width < p.video.min_width || Math.abs(meta.width / meta.height - 16 / 9) > 0.03) {
      setError(`This design is ${meta.width} × ${meta.height}. The screen needs a landscape 16:9 design, ideally 1920 × 1080.`); return;
    }
    setProgress(0);
    try {
      const blob = await uploadPresigned(`screen-ads/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`, file, {
        access: "public", contentType: file.type, handleUploadUrl: "/api/screen-ads/upload", clientPayload: preview,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      setVideo({ url: blob.url, seconds: null, width: meta.width, height: meta.height, size: file.size, name: file.name, kind: "image" });
    } catch (err) {
      console.error("Design upload failed", err);
      setError("The upload didn't finish. Please try again.");
    } finally { setProgress(null); }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;
    setBusy(true); setError("");
    try {
      const r = await fetch(`${API}/screen-ads/bookings`, {
        method: "POST", headers,
        body: JSON.stringify({
          ...f, package: chosen.id, start_date: start, terms_accepted: terms, turnstile_token: token,
          media_type: video.kind, video_url: video.url, video_seconds: video.seconds, video_width: video.width, video_height: video.height, video_size: video.size,
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

  const next = [true, !!start && start >= earliest, !!video][step];
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div className="grid lg:grid-cols-[1fr_20rem] gap-12 items-start">
      <div className="min-w-0">
        {draft && <p className="t-small bg-paper-deep border border-line rounded-edge px-4 py-3 mb-8">Preview only. This page is not open to customers yet.</p>}
        <p className="t-label text-gold-ink">Step {step + 1} of {TITLES.length}</p>
        <h1 className="t-h2 mt-3 mb-10">{TITLES[step]}</h1>

        {step === 0 && (
          <section>
            <div className="grid sm:grid-cols-2 gap-3">
              {p.packages.map((x) => (
                <button key={x.id} type="button" aria-pressed={packageId === x.id} onClick={() => setPackageId(x.id)} className={choice(packageId === x.id)}>
                  <span className="block font-semibold">{x.label}</span>
                  <span className="block font-display text-[1.75rem] leading-tight mt-2 tabular-nums">UGX {x.price_ugx.toLocaleString("en-US")}</span>
                  <span className="block t-small opacity-80 mt-2">{x.days} days · approx. {x.plays_per_hour} appearances per hour</span>
                </button>
              ))}
            </div>
            <p className="t-small text-ink-muted mt-4">The price shown is the full amount you pay. Every package is for a {seconds}-second video or a 1920 × 1080 design, on screen every day, {p.on_air}. Need a longer video? <Link className="q-link" href="/enquire?message=I%20would%20like%20a%20quote%20for%20a%20longer%20advert%20on%20the%20street%20screen.">Ask us for a quote</Link>.</p>
          </section>
        )}

        {step === 1 && (
          <section>
            <label className="block"><span className="t-h4 block mb-3">Start date</span>
              <input type="date" min={earliest} value={start} onChange={(e) => setStart(e.target.value)} className={`${cls} max-w-[16rem]`} />
            </label>
            <p className="t-small text-ink-muted mt-3">Your campaign runs for {chosen.days} days from this date.</p>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="t-body text-ink-soft mb-3">Upload one {seconds}-second video (MP4, H.264, 1920 × 1080, up to {p.video.max_mb} MB), or one design (PNG, JPG or WebP, 1920 × 1080, up to 20 MB) that is shown for {seconds} seconds. The screen plays it without sound.</p>
            <p className="t-small text-ink-muted mb-6">We can&apos;t run adverts that are illegal, false or misleading, or that show sexual, violent or hateful content. We also don&apos;t run political or religious campaigning, or adverts for betting, alcohol or tobacco. The screen faces a public road, so nothing should distract drivers, including flashing images.</p>
            <label className="flex items-center gap-3 rounded-edge px-4 min-h-16 border border-dashed border-line-strong bg-paper-deep cursor-pointer">
              {progress !== null ? <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" /> : video ? <Check aria-hidden="true" className="w-5 h-5 text-ok-ink" /> : <Upload aria-hidden="true" className="w-5 h-5 text-gold-ink" />}
              <span className="t-body">{progress !== null ? `Uploading ${progress}%` : video ? `${video.name} uploaded` : "Choose your video or design"}</span>
              <input type="file" accept="video/mp4,.mp4,image/png,image/jpeg,image/webp" className="hidden" disabled={progress !== null} onChange={(e) => void pick(e.target.files?.[0])} />
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
              <span>I own or have the rights to this video, and I agree to the <a className="q-link" href={`/advertise/terms${preview ? `?preview=${encodeURIComponent(preview)}` : ""}`} target="_blank" rel="noreferrer">advertising terms</a>: payment before review, a full refund if it is refused before it starts, cancellation for a full refund until it starts, and missed airtime made up or refunded.</span>
            </label>
            <Turnstile ref={turnstile} action="screen_ad" onVerify={setToken} onExpire={() => setToken("")} />
            <button disabled={busy} className="q-btn bg-ink text-paper hover:bg-black">{busy ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : null}Confirm booking</button>
          </form>
        )}

        {error && <p role="alert" className="t-small text-alert-ink mt-5">{error}</p>}
        <div className="flex gap-4 mt-10">
          {step > 0 && <button type="button" onClick={() => { setError(""); setStep(step - 1); }} className="q-link t-small">Back</button>}
          {step < 3 && <button type="button" disabled={!next} onClick={() => { setError(""); setStep(step + 1); }} className="q-btn bg-ink text-paper hover:bg-black disabled:opacity-40">{["Continue to start date", "Continue to upload", "Continue to your details"][step]}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 border border-line rounded-edge p-6 bg-paper-deep">
        <h2 className="t-label text-ink-muted">Your campaign</h2>
        <p className="font-display text-[2.5rem] leading-none mt-4 tabular-nums" aria-live="polite">UGX {chosen.price_ugx.toLocaleString("en-US")}</p>
        <ul className="t-small mt-5 space-y-1.5">
          <li>{chosen.label} package</li>
          <li>{chosen.days} days, every day, {p.on_air}</li>
          <li>{seconds}-second video</li>
          <li>Approx. {chosen.plays_per_hour} appearances per hour</li>
        </ul>
      </aside>
    </div>
  );
}
