"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Send, Upload } from "lucide-react";
import { uploadPresigned } from "@vercel/blob/client";
import { apiAdmin, auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { DEFAULT_LOGO, LOGO_DRAFT_KEY, type ScreenLogo } from "@/components/display/scenes";
import { IMAGE_TYPES, readImage } from "@/lib/screen-ads";

/* ─── Screen editor: the logo ─────────────────────────────────────────────────
   The logo appears twice on the screens: small in the top corner of every
   scene, and large on the opening "VITORRA" scene. Operations can make either
   bigger or smaller, or swap in a different logo image. The preview shows
   unsaved changes; Publish sends them, and the screens pick them up within
   about a minute.                                                            */

const MIN = 50;
const MAX = 250;

function SizeControl({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[12.5px] mb-1">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <span className="tabular-nums font-medium">{value}%</span>
          {value !== 100 && <button type="button" className="underline text-[12px]" onClick={() => onChange(100)}>Standard size</button>}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="c-btn !px-2.5" aria-label={`Smaller ${label.toLowerCase()}`} disabled={value <= MIN} onClick={() => onChange(Math.max(MIN, value - 10))}>−</button>
        <input type="range" min={MIN} max={MAX} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" aria-label={label} />
        <button type="button" className="c-btn !px-2.5" aria-label={`Bigger ${label.toLowerCase()}`} disabled={value >= MAX} onClick={() => onChange(Math.min(MAX, value + 10))}>+</button>
      </div>
      <p className="text-[12px] mt-1" style={{ color: "var(--o-muted)" }}>{hint}</p>
    </div>
  );
}

export function ScreenLogoEditor({ tabs }: { tabs: React.ReactNode }) {
  const [saved, setSaved] = useState<ScreenLogo>(DEFAULT_LOGO);
  const [logo, setLogo] = useState<ScreenLogo>(DEFAULT_LOGO);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<"ident" | "proof">("ident");
  const [screen, setScreen] = useState("mode=street");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiAdmin<{ data: { logo?: ScreenLogo } }>("/admin/display")
      .then((r) => { const l = { ...DEFAULT_LOGO, ...(r.data.logo ?? {}) }; setSaved(l); setLogo(l); })
      .catch((e) => setNote(e instanceof Error ? e.message : "Could not load the logo settings."))
      .finally(() => setLoading(false));
  }, []);

  // The preview reads unsaved changes from this browser. Leaving the tab
  // clears them, so other previews show what is published.
  useEffect(() => { localStorage.setItem(LOGO_DRAFT_KEY, JSON.stringify(logo)); }, [logo]);
  useEffect(() => () => localStorage.removeItem(LOGO_DRAFT_KEY), []);

  const dirty = JSON.stringify(logo) !== JSON.stringify(saved);
  const set = (patch: Partial<ScreenLogo>) => { setNote(""); setLogo((l) => ({ ...l, ...patch })); };

  const upload = async (f: File) => {
    setNote("");
    if (!IMAGE_TYPES[f.type]) { setNote("Use a PNG (best, with a transparent background), WebP or JPG image."); return; }
    if (f.size > 5 * 1024 * 1024) { setNote("Keep the logo image under 5 MB."); return; }
    const m = await readImage(f);
    if (!m || m.width < 200) { setNote("This image is too small to stay sharp on a big screen. Use one at least 500 pixels wide."); return; }
    setBusy("upload");
    try {
      const blob = await uploadPresigned(`screen-media/${crypto.randomUUID()}.${IMAGE_TYPES[f.type]}`, f, {
        access: "public", contentType: f.type, handleUploadUrl: "/api/screen-ads/upload",
        headers: { Authorization: `Bearer ${auth.getToken() ?? ""}` },
      });
      set({ url: blob.url });
      setNote(f.type === "image/jpeg" ? "Uploaded. A JPG has no transparent background, so it shows as a box: a PNG usually looks better." : "Uploaded. Check the preview, then Publish.");
    } catch (e) { setNote(e instanceof Error ? e.message : "The upload didn't finish. Please try again."); } finally { setBusy(""); if (file.current) file.current.value = ""; }
  };

  const publish = async () => {
    setBusy("publish"); setNote("");
    try {
      const r = await apiAdmin<{ data: { logo: ScreenLogo } }>("/admin/display/logo", { method: "PUT", body: JSON.stringify(logo) });
      setSaved(r.data.logo); setLogo(r.data.logo);
      setNote("Published. The screens update within about a minute.");
    } catch (e) { setNote(e instanceof Error ? e.message : "Publishing failed."); } finally { setBusy(""); }
  };

  const src = `/display?${screen}&scene=${preview}&draft=1`;

  return (
    <div>
      <PageHeader title="Screen editor" subtitle="Resize the logo on the screens, or swap in a different logo image." actions={<>
        {dirty && <button type="button" className="c-btn" onClick={() => setLogo(saved)}><RotateCcw aria-hidden="true" className="w-4 h-4" />Discard changes</button>}
        <button type="button" className="c-btn c-btn-primary" disabled={!dirty || !!busy} onClick={() => void publish()}>{busy === "publish" ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Send aria-hidden="true" className="w-4 h-4" />}Publish</button>
      </>} />
      {tabs}
      {note && <p role="status" className="text-[13px] mb-3">{note}</p>}

      {loading ? <Loader2 aria-label="Loading" className="w-5 h-5 animate-spin" /> : (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
          <div className="space-y-4 min-w-0">
            <section className="c-panel">
              <div className="c-panel-head c-panel-title">Logo image</div>
              <div className="p-4 flex items-center gap-4 flex-wrap">
                <div className="w-24 h-24 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#0b0b0d" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- the logo as the screens show it */}
                  <img src={logo.url ?? "/logo.png"} alt="Current screen logo" className="max-w-[80%] max-h-[80%] object-contain" />
                </div>
                <div className="space-y-2 min-w-0">
                  <p className="text-[12.5px]">{logo.url ? "A replacement logo you uploaded." : "The standard Vitorra Holdings logo."}</p>
                  <div className="flex flex-wrap gap-2">
                    <input ref={file} type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
                    <button type="button" className="c-btn" disabled={!!busy} onClick={() => file.current?.click()}>{busy === "upload" ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Upload aria-hidden="true" className="w-4 h-4" />}Upload a different logo</button>
                    {logo.url && <button type="button" className="c-btn" onClick={() => set({ url: null })}>Use the standard logo</button>}
                  </div>
                  <p className="text-[12px]" style={{ color: "var(--o-muted)" }}>PNG with a transparent background works best, at least 500 pixels wide. The screens are dark, so a light or gold logo reads best.</p>
                </div>
              </div>
            </section>

            <section className="c-panel">
              <div className="c-panel-head c-panel-title">Size</div>
              <div className="p-4 space-y-5">
                <div onFocus={() => setPreview("proof")} onPointerDown={() => setPreview("proof")}>
                  <SizeControl label="Corner logo" hint="Top left of every scene." value={logo.corner} onChange={(v) => set({ corner: v })} />
                </div>
                <div onFocus={() => setPreview("ident")} onPointerDown={() => setPreview("ident")}>
                  <SizeControl label="Opening logo" hint="Above VITORRA on the opening scene." value={logo.opening} onChange={(v) => set({ opening: v })} />
                </div>
              </div>
            </section>
          </div>

          <div className="xl:sticky xl:top-20 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <p className="text-[13px]">Preview{dirty ? " (not published yet)" : ""}</p>
              <div className="flex gap-2">
                <select aria-label="Which scene" value={preview} onChange={(e) => setPreview(e.target.value as "ident" | "proof")} className="c-select">
                  <option value="ident">Opening scene</option>
                  <option value="proof">A scene with the corner logo</option>
                </select>
                <select aria-label="Which screen" value={screen} onChange={(e) => setScreen(e.target.value)} className="c-select">
                  <option value="mode=street">Street screen</option>
                  <option value="mode=tv">Reception TV</option>
                  <option value="mode=projector">Projector</option>
                </select>
              </div>
            </div>
            <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: "16 / 9" }}>
              <iframe key={src} src={src} title="Screen preview" className="absolute inset-0 w-full h-full border-0" />
            </div>
            <p className="text-[12.5px] mt-2">Sizes run from 50% to 250% of the standard size.</p>
          </div>
        </div>
      )}
    </div>
  );
}
