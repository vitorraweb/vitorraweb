"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Film, Image as ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { uploadPresigned } from "@vercel/blob/client";
import { apiAdmin, auth } from "@/lib/auth";
import { BUILT_IN_SCENES } from "@/components/display/scenes";
import { IMAGE_TYPES, isH264, readImage, readVideo } from "@/lib/screen-ads";

/* ─── Screen editor: running order ───────────────────────────────────────────
   Everything Vitorra shows on its screens, in order: the built-in films and
   messages, and videos and 1080 designs added here. Switch any of it off, move
   it up or down, or add new content with an optional caption, the screens it
   shows on and the dates it runs. Saved straight away; running screens follow
   within a minute. On the street screen all of this is the house content that
   fills the time paid adverts do not use.                                    */

type Media = {
  id: number; kind: "video" | "image"; url: string; title: string; line1: string | null; line2: string | null;
  seconds: number; screens: string[]; starts_on: string | null; ends_on: string | null; width: number | null; height: number | null;
};
type Programme = { order: string[]; hidden: string[] };
type Item = { id: string; label: string; media?: Media };

const SCREENS = [{ id: "street", label: "Street" }, { id: "reception", label: "Reception TV" }, { id: "projector", label: "Projector" }];
const day = (d: string | null) => (d ? d.slice(0, 10) : "");

export function ScreenRunningOrder() {
  const [media, setMedia] = useState<Media[]>([]);
  const [programme, setProgramme] = useState<Programme>({ order: [], hidden: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [preview, setPreview] = useState("ident");
  const [screen, setScreen] = useState("street");
  const file = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await apiAdmin<{ data: { media: Media[]; programme: Programme } }>("/admin/screen-media");
      setMedia(r.data.media); setProgramme(r.data.programme);
    } catch (e) { setNote(e instanceof Error ? e.message : "Could not load the running order."); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Built-in scenes and added media, in the saved order; anything new goes to the end.
  const items = useMemo<Item[]>(() => {
    const all: Item[] = [...BUILT_IN_SCENES, ...media.map((m) => ({ id: `media-${m.id}`, label: m.title, media: m }))];
    const rank = (id: string) => { const n = programme.order.indexOf(id); return n < 0 ? Number.MAX_SAFE_INTEGER : n; };
    return programme.order.length ? [...all].sort((a, b) => rank(a.id) - rank(b.id)) : all;
  }, [media, programme.order]);

  const save = async (next: Programme) => {
    setProgramme(next); setNote("");
    try { await apiAdmin("/admin/display/programme", { method: "PUT", body: JSON.stringify(next) }); setNote("Saved. Screens follow within a minute."); }
    catch (e) { setNote(e instanceof Error ? e.message : "Saving failed."); void load(); }
  };
  const move = (n: number, by: number) => {
    const ids = items.map((i) => i.id);
    const to = n + by;
    if (to < 0 || to >= ids.length) return;
    [ids[n], ids[to]] = [ids[to], ids[n]];
    void save({ ...programme, order: ids });
  };
  const toggle = (id: string) => {
    const hidden = programme.hidden.includes(id) ? programme.hidden.filter((h) => h !== id) : [...programme.hidden, id];
    if (items.every((i) => hidden.includes(i.id))) { setNote("At least one scene has to stay on."); return; }
    void save({ order: items.map((i) => i.id), hidden });
  };

  const add = async (f: File | undefined) => {
    if (!f) return;
    setNote("");
    const image = !!IMAGE_TYPES[f.type];
    let width = 0, height = 0, seconds = 10;
    if (image) {
      const m = await readImage(f);
      if (!m || f.size > 20 * 1024 * 1024) { setNote("Use a PNG, JPG or WebP design under 20 MB."); return; }
      if (m.width < 1280 || Math.abs(m.width / m.height - 16 / 9) > 0.03) { setNote(`This design is ${m.width} × ${m.height}. The screens need a landscape 16:9 design, ideally 1920 × 1080.`); return; }
      ({ width, height } = m);
    } else {
      const m = await readVideo(f);
      if (!m || !(await isH264(f))) { setNote("Export the video as MP4 (H.264): the screens cannot play this format."); return; }
      if (m.width <= m.height || m.width < 1280) { setNote("Use a landscape video, ideally 1920 × 1080."); return; }
      if (m.seconds > 60 || f.size > 200 * 1024 * 1024) { setNote("Keep videos to 60 seconds and 200 MB."); return; }
      ({ width, height } = m); seconds = Math.max(4, Math.round(m.seconds));
    }
    setBusy("Uploading 0%");
    try {
      const blob = await uploadPresigned(`screen-media/${crypto.randomUUID()}.${image ? IMAGE_TYPES[f.type] : "mp4"}`, f, {
        access: "public", contentType: image ? f.type : "video/mp4", handleUploadUrl: "/api/screen-ads/upload", multipart: !image,
        headers: { Authorization: `Bearer ${auth.getToken() ?? ""}` },
        onUploadProgress: (e) => setBusy(`Uploading ${Math.round(e.percentage)}%`),
      });
      const r = await apiAdmin<{ data: Media }>("/admin/screen-media", { method: "POST", body: JSON.stringify({
        kind: image ? "image" : "video", url: blob.url, title: f.name.replace(/\.[^.]+$/, "").slice(0, 120), seconds, screens: ["street", "reception", "projector"], width, height,
      }) });
      await load();
      setOpen(r.data.id); setPreview(`media-${r.data.id}`);
      setNote("Added at the end of the running order. Add a caption or change where it shows below.");
    } catch (e) { setNote(e instanceof Error ? e.message : "The upload didn't finish. Please try again."); } finally { setBusy(""); if (file.current) file.current.value = ""; }
  };

  const update = async (m: Media, patch: Partial<Media>) => {
    const next = { ...m, ...patch };
    setMedia((list) => list.map((x) => (x.id === m.id ? next : x)));
    try { await apiAdmin(`/admin/screen-media/${m.id}`, { method: "PATCH", body: JSON.stringify({ title: next.title, line1: next.line1 || null, line2: next.line2 || null, seconds: next.seconds, screens: next.screens, starts_on: next.starts_on || null, ends_on: next.ends_on || null }) }); setNote("Saved. Screens follow within a minute."); }
    catch (e) { setNote(e instanceof Error ? e.message : "Saving failed."); void load(); }
  };
  const remove = async (m: Media) => {
    if (!confirm(`Remove "${m.title}" from the screens?`)) return;
    try { await apiAdmin(`/admin/screen-media/${m.id}`, { method: "DELETE" }); setOpen(null); await load(); setNote("Removed."); }
    catch (e) { setNote(e instanceof Error ? e.message : "Removing failed."); }
  };

  if (loading) return <Loader2 aria-label="Loading" className="w-5 h-5 animate-spin" />;

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[13px]">{note || "The order the screens play in. Switched-off scenes are skipped."}</p>
          <button type="button" className="c-btn c-btn-primary shrink-0" disabled={!!busy} onClick={() => file.current?.click()}>
            {busy ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Plus aria-hidden="true" className="w-4 h-4" />}{busy || "Add video or design"}
          </button>
          <input ref={file} type="file" accept="video/mp4,.mp4,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void add(e.target.files?.[0])} />
        </div>
        <ol className="c-panel divide-y" style={{ borderColor: "var(--o-line)" }}>
          {items.map((it, n) => {
            const off = programme.hidden.includes(it.id);
            const m = it.media;
            return (
              <li key={it.id} className="p-3" style={{ opacity: off ? 0.55 : 1 }}>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-[12px] w-6 text-right">{n + 1}</span>
                  {m ? (m.kind === "video" ? <Film aria-hidden="true" className="w-4 h-4 shrink-0" /> : <ImageIcon aria-hidden="true" className="w-4 h-4 shrink-0" />) : <span className="w-4" />}
                  <button type="button" className="text-left flex-1 min-w-0 text-[14px] truncate" onClick={() => { setPreview(it.id); setOpen(m && open !== m.id ? m.id : null); }}>
                    {it.label}{off ? " (off)" : ""}{m && (m.starts_on || m.ends_on) ? ` · ${day(m.starts_on) || "now"} to ${day(m.ends_on) || "open"}` : ""}
                  </button>
                  <button type="button" className="c-btn c-btn-ghost" aria-label="Move up" disabled={n === 0} onClick={() => move(n, -1)}><ArrowUp aria-hidden="true" className="w-4 h-4" /></button>
                  <button type="button" className="c-btn c-btn-ghost" aria-label="Move down" disabled={n === items.length - 1} onClick={() => move(n, 1)}><ArrowDown aria-hidden="true" className="w-4 h-4" /></button>
                  <button type="button" className="c-btn c-btn-ghost" aria-label={off ? "Switch on" : "Switch off"} onClick={() => toggle(it.id)}>{off ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}</button>
                </div>
                {m && open === m.id && (
                  <div className="grid sm:grid-cols-2 gap-3 mt-3 pl-12 text-[13px]">
                    <label className="block sm:col-span-2">Name (for staff)<input className="c-input w-full mt-1" defaultValue={m.title} maxLength={120} onBlur={(e) => e.target.value.trim() && e.target.value !== m.title && void update(m, { title: e.target.value.trim() })} /></label>
                    <label className="block">Caption, line 1 (optional)<input className="c-input w-full mt-1" defaultValue={m.line1 ?? ""} maxLength={200} onBlur={(e) => e.target.value !== (m.line1 ?? "") && void update(m, { line1: e.target.value })} /></label>
                    <label className="block">Caption, line 2 (optional)<input className="c-input w-full mt-1" defaultValue={m.line2 ?? ""} maxLength={200} onBlur={(e) => e.target.value !== (m.line2 ?? "") && void update(m, { line2: e.target.value })} /></label>
                    {m.kind === "image" && <label className="block">Seconds on screen<input type="number" min={4} max={60} className="c-input w-full mt-1" defaultValue={m.seconds} onBlur={(e) => { const v = Math.min(60, Math.max(4, Number(e.target.value) || m.seconds)); if (v !== m.seconds) void update(m, { seconds: v }); }} /></label>}
                    <fieldset className="block"><legend>Shows on</legend>
                      <div className="flex gap-3 mt-1">{SCREENS.map((s) => (
                        <label key={s.id} className="flex items-center gap-1"><input type="checkbox" checked={m.screens.includes(s.id)} onChange={(e) => {
                          const screens = e.target.checked ? [...m.screens, s.id] : m.screens.filter((x) => x !== s.id);
                          if (screens.length) void update(m, { screens });
                        }} />{s.label}</label>
                      ))}</div>
                    </fieldset>
                    <label className="block">From (optional)<input type="date" className="c-input w-full mt-1" defaultValue={day(m.starts_on)} onChange={(e) => void update(m, { starts_on: e.target.value || null })} /></label>
                    <label className="block">Until (optional)<input type="date" className="c-input w-full mt-1" defaultValue={day(m.ends_on)} onChange={(e) => void update(m, { ends_on: e.target.value || null })} /></label>
                    <div className="sm:col-span-2 flex items-center justify-between">
                      <span>{m.kind === "video" ? `Video, ${m.seconds} seconds` : "Design"}{m.width ? `, ${m.width} × ${m.height}` : ""}</span>
                      <button type="button" className="c-btn" onClick={() => void remove(m)}><Trash2 aria-hidden="true" className="w-4 h-4" />Remove</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-[12.5px] mt-2">Videos: MP4 (H.264), landscape, up to 60 seconds. Designs: PNG, JPG or WebP at 1920 × 1080, shown for the seconds you choose. On the street screen, this content fills the time paid adverts don&apos;t use.</p>
      </div>

      <div className="xl:sticky xl:top-20 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[13px]">Preview of the selected scene{programme.hidden.includes(preview) ? " (switched off, so the screen shows its normal loop)" : ""}.</p>
          <select aria-label="Which screen" value={screen} onChange={(e) => setScreen(e.target.value)} className="c-select">
            <option value="street">Street screen</option><option value="tv">Reception TV</option><option value="projector">Projector</option>
          </select>
        </div>
        <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: "16 / 9" }}>
          <iframe key={`${screen}-${preview}-${media.length}`} src={`/display?mode=${screen}&scene=${preview}`} title="Screen preview" className="absolute inset-0 w-full h-full border-0" />
        </div>
      </div>
    </div>
  );
}
