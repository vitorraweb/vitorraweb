"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Film, Image as ImageIcon, Loader2, Plus, Replace, Trash2 } from "lucide-react";
import { uploadPresigned } from "@vercel/blob/client";
import { apiAdmin, auth } from "@/lib/auth";
import { BUILT_IN_SCENES } from "@/components/display/scenes";
import { IMAGE_TYPES, isH264, readImage, readVideo } from "@/lib/screen-ads";

/* ─── Screen editor: running order ───────────────────────────────────────────
   Everything Vitorra shows on its screens, in order: the built-in films and
   messages, and videos and 1080 designs added here. Switch any of it off, move
   it up or down, or add new content with an optional caption, the screens it
   shows on and the dates it runs. Click an item to preview it on its own, and
   replace it with another video or design: an added item swaps its file and
   keeps its settings; a built-in one is switched off (not deleted) and the new
   content takes its place in the order. Saved straight away; running screens
   follow within a minute. On the street screen all of this is the house
   content that fills the time paid adverts do not use.                       */

type Media = {
  id: number; kind: "video" | "image"; url: string; title: string; line1: string | null; line2: string | null;
  seconds: number; screens: string[]; starts_on: string | null; ends_on: string | null; width: number | null; height: number | null;
};
type Programme = { order: string[]; hidden: string[] };
type Item = { id: string; label: string; media?: Media };
type Upload = { kind: "video" | "image"; url: string; width: number; height: number; seconds: number; name: string; heavy: boolean };

/** Above this, a video is heavier than the street screen's TV box likes (the built-in films run at 1–5 Mbit/s). */
const HEAVY_MBPS = 8;

type Optimised = { url: string; optimised: boolean; kbps?: number | null; before_kbps?: number | null; error?: string };

/** Re-encode an uploaded video on the server to the street screen's light format (about 5 Mbit/s). */
async function optimiseVideo(url: string): Promise<Optimised> {
  const token = auth.getToken();
  const res = await fetch("/api/screen-media/optimise", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ url }),
  });
  const body = (await res.json().catch(() => ({}))) as Optimised;
  if (!res.ok) throw new Error(body.error ?? "Could not make the video lighter.");
  return body;
}
const mbps = (kbps?: number | null) => (kbps ? `${(kbps / 1000).toFixed(1)} Mbit/s` : "");

/** Delete an uploaded file from storage once nothing uses it. Best effort: the screens never play it again either way. */
async function deleteFile(url: string): Promise<void> {
  const token = auth.getToken();
  await fetch("/api/screen-media/file", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ url }),
  }).catch(() => {});
}

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
  const replaceFile = useRef<HTMLInputElement>(null);
  const lastOptimise = useRef("");
  const [replacing, setReplacing] = useState<Item | null>(null);

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

  /** Check a file against what the screens can play, then upload it. Null if refused. */
  const upload = async (f: File): Promise<Upload | null> => {
    setNote(""); lastOptimise.current = "";
    const image = !!IMAGE_TYPES[f.type];
    let width = 0, height = 0, seconds = 10, heavy = false;
    if (image) {
      const m = await readImage(f);
      if (!m || f.size > 20 * 1024 * 1024) { setNote("Use a PNG, JPG or WebP design under 20 MB."); return null; }
      if (m.width < 1280 || Math.abs(m.width / m.height - 16 / 9) > 0.03) { setNote(`This design is ${m.width} × ${m.height}. The screens need a landscape 16:9 design, ideally 1920 × 1080.`); return null; }
      ({ width, height } = m);
    } else {
      const m = await readVideo(f);
      if (!m || !(await isH264(f))) { setNote("Export the video as MP4 (H.264): the screens cannot play this format."); return null; }
      if (m.width <= m.height || m.width < 1280) { setNote("Use a landscape video, ideally 1920 × 1080."); return null; }
      if (m.seconds > 60 || f.size > 200 * 1024 * 1024) { setNote("Keep videos to 60 seconds and 200 MB."); return null; }
      ({ width, height } = m); seconds = Math.max(4, Math.round(m.seconds));
      heavy = (f.size * 8) / Math.max(1, m.seconds) / 1_000_000 > HEAVY_MBPS;
    }
    setBusy("Uploading 0%");
    const blob = await uploadPresigned(`screen-media/${crypto.randomUUID()}.${image ? IMAGE_TYPES[f.type] : "mp4"}`, f, {
      access: "public", contentType: image ? f.type : "video/mp4", handleUploadUrl: "/api/screen-ads/upload", multipart: !image,
      // Cookie mode has no token: the sign-in cookie goes with the request instead.
      headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      onUploadProgress: (e) => setBusy(`Uploading ${Math.round(e.percentage)}%`),
    });
    let url = blob.url;
    if (!image) {
      // Every video is made light for the street screen's TV box before it is used.
      setBusy("Making it light for the street screen…");
      try {
        const o = await optimiseVideo(url);
        url = o.url;
        heavy = false;
        if (o.optimised) lastOptimise.current = `Made lighter for the screens: ${mbps(o.before_kbps)} → ${mbps(o.kbps)}.`;
      } catch (e) {
        lastOptimise.current = `Couldn't make it lighter (${e instanceof Error ? e.message : "error"}); the original is used.`;
      }
    }
    return { kind: image ? "image" : "video", url, width, height, seconds, name: f.name.replace(/\.[^.]+$/, "").slice(0, 120), heavy };
  };

  const add = async (f: File | undefined) => {
    if (!f) return;
    try {
      const u = await upload(f);
      if (!u) return;
      const r = await apiAdmin<{ data: Media }>("/admin/screen-media", { method: "POST", body: JSON.stringify({
        kind: u.kind, url: u.url, title: u.name, seconds: u.seconds, screens: ["street", "reception", "projector"], width: u.width, height: u.height,
      }) });
      await load();
      setOpen(r.data.id); setPreview(`media-${r.data.id}`);
      setNote(u.heavy
        ? `Added at the end of the running order. This video is heavy (over ${HEAVY_MBPS} Mbit/s): the street screen plays it once it has downloaded it, which can take a while. For smoother play, export at 1920 × 1080, 30 fps, ${HEAVY_MBPS} Mbit/s or less, and use Replace.`
        : "Added at the end of the running order. Add a caption or change where it shows below.");
      if (lastOptimise.current) setNote((n) => `${n} ${lastOptimise.current}`);
    } catch (e) { setNote(e instanceof Error ? e.message : "The upload didn't finish. Please try again."); } finally { setBusy(""); if (file.current) file.current.value = ""; }
  };

  /** Swap the selected item for another video or design, in the same place in the order. */
  const replace = async (it: Item, f: File | undefined) => {
    if (!f) return;
    try {
      const u = await upload(f);
      if (!u) return;
      const m = it.media;
      if (m) {
        // An added item keeps its name, captions, screens and dates; only the file changes.
        await apiAdmin(`/admin/screen-media/${m.id}`, { method: "PATCH", body: JSON.stringify({
          kind: u.kind, url: u.url, width: u.width, height: u.height, seconds: u.kind === "video" ? u.seconds : m.kind === "image" ? m.seconds : 10,
        }) });
        await deleteFile(m.url); // the old file is no longer used
        await load();
        setPreview(it.id);
        setNote(`Replaced the file for "${m.title}". Screens follow within a minute. ${lastOptimise.current}`.trim());
      } else {
        // A built-in scene stays in the code: switch it off, and put the new content where it was.
        const r = await apiAdmin<{ data: Media }>("/admin/screen-media", { method: "POST", body: JSON.stringify({
          kind: u.kind, url: u.url, title: `${it.label} (replacement)`.slice(0, 120), seconds: u.seconds, screens: ["street", "reception", "projector"], width: u.width, height: u.height,
        }) });
        const newId = `media-${r.data.id}`;
        const ids = items.map((x) => x.id).filter((x) => x !== newId);
        ids.splice(ids.indexOf(it.id) + 1, 0, newId);
        const next = { order: ids, hidden: [...new Set([...programme.hidden, it.id])] };
        await apiAdmin("/admin/display/programme", { method: "PUT", body: JSON.stringify(next) });
        await load();
        setOpen(r.data.id); setPreview(newId);
        setNote(`"${it.label}" is replaced and switched off (not deleted): switch it back on with the eye button any time. ${lastOptimise.current}`.trim());
      }
    } catch (e) { setNote(e instanceof Error ? e.message : "The upload didn't finish. Please try again."); void load(); }
    finally { setBusy(""); setReplacing(null); if (replaceFile.current) replaceFile.current.value = ""; }
  };
  const pickReplacement = (it: Item) => { setReplacing(it); replaceFile.current?.click(); };

  const update = async (m: Media, patch: Partial<Media>) => {
    const next = { ...m, ...patch };
    setMedia((list) => list.map((x) => (x.id === m.id ? next : x)));
    try { await apiAdmin(`/admin/screen-media/${m.id}`, { method: "PATCH", body: JSON.stringify({ title: next.title, line1: next.line1 || null, line2: next.line2 || null, seconds: next.seconds, screens: next.screens, starts_on: next.starts_on || null, ends_on: next.ends_on || null }) }); setNote("Saved. Screens follow within a minute."); }
    catch (e) { setNote(e instanceof Error ? e.message : "Saving failed."); void load(); }
  };
  /** Re-encode a video that is already in the running order, keeping everything else about it. */
  const lighten = async (m: Media) => {
    setBusy("Making it light for the street screen…"); setNote("");
    try {
      const o = await optimiseVideo(m.url);
      if (!o.optimised) { setNote(`"${m.title}" is already light (${mbps(o.kbps)}): nothing to change.`); return; }
      await apiAdmin(`/admin/screen-media/${m.id}`, { method: "PATCH", body: JSON.stringify({ url: o.url }) });
      await load();
      setNote(`"${m.title}" made lighter: ${mbps(o.before_kbps)} → ${mbps(o.kbps)}. Screens follow within a minute.`);
    } catch (e) { setNote(e instanceof Error ? e.message : "Could not make the video lighter."); }
    finally { setBusy(""); }
  };

  /** Delete an uploaded video or design for good: off every screen, out of the order, and its file out of storage. */
  const remove = async (m: Media) => {
    if (!confirm(`Delete "${m.title}" for good? It stops playing on every screen within a minute and its file is deleted. To keep it for later, switch it off instead.`)) return;
    try {
      await apiAdmin(`/admin/screen-media/${m.id}`, { method: "DELETE" });
      await deleteFile(m.url);
      setOpen(null); if (preview === `media-${m.id}`) setPreview("ident");
      await load(); setNote(`Deleted "${m.title}".`);
    } catch (e) { setNote(e instanceof Error ? e.message : "Deleting failed."); }
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
          <input ref={replaceFile} type="file" accept="video/mp4,.mp4,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => replacing && void replace(replacing, e.target.files?.[0])} />
        </div>
        <ol className="c-panel divide-y" style={{ borderColor: "var(--o-line)" }}>
          {items.map((it, n) => {
            const off = programme.hidden.includes(it.id);
            const m = it.media;
            return (
              <li key={it.id} className="p-3" style={{ opacity: off ? 0.55 : 1, background: preview === it.id ? "var(--o-surface-2, rgba(0,0,0,0.04))" : undefined }}>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-[12px] w-6 text-right">{n + 1}</span>
                  {m ? (m.kind === "video" ? <Film aria-hidden="true" className="w-4 h-4 shrink-0" /> : <ImageIcon aria-hidden="true" className="w-4 h-4 shrink-0" />) : <span className="w-4" />}
                  <button type="button" aria-pressed={preview === it.id} className="text-left flex-1 min-w-0 text-[14px] truncate" onClick={() => { setPreview(it.id); setOpen(m && open !== m.id ? m.id : null); }}>
                    {it.label}{off ? " (off)" : ""}{m && (m.starts_on || m.ends_on) ? ` · ${day(m.starts_on) || "now"} to ${day(m.ends_on) || "open"}` : ""}
                  </button>
                  <button type="button" className="c-btn c-btn-ghost" aria-label="Move up" disabled={n === 0} onClick={() => move(n, -1)}><ArrowUp aria-hidden="true" className="w-4 h-4" /></button>
                  <button type="button" className="c-btn c-btn-ghost" aria-label="Move down" disabled={n === items.length - 1} onClick={() => move(n, 1)}><ArrowDown aria-hidden="true" className="w-4 h-4" /></button>
                  <button type="button" className="c-btn c-btn-ghost" aria-label={off ? "Switch on" : "Switch off"} title={off ? "Switch on" : "Switch off (keeps it for later)"} onClick={() => toggle(it.id)}>{off ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}</button>
                  {m && <button type="button" className="c-btn c-btn-ghost" aria-label={`Delete ${m.title}`} title="Delete for good" onClick={() => void remove(m)}><Trash2 aria-hidden="true" className="w-4 h-4" style={{ color: "var(--o-danger)" }} /></button>}
                </div>
                {!m && preview === it.id && (
                  <div className="flex items-center justify-between gap-2 flex-wrap mt-3 pl-12 text-[13px]">
                    <span style={{ color: "var(--o-muted)" }}>Built-in scene. Its words are in the Wording tab.</span>
                    <button type="button" className="c-btn" disabled={!!busy} onClick={() => pickReplacement(it)}><Replace aria-hidden="true" className="w-4 h-4" />Replace with a video or design</button>
                  </div>
                )}
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
                    <div className="sm:col-span-2 flex items-center justify-between gap-2 flex-wrap">
                      <span>{m.kind === "video" ? `Video, ${m.seconds} seconds` : "Design"}{m.width ? `, ${m.width} × ${m.height}` : ""}</span>
                      <span className="flex gap-2">
                        {m.kind === "video" && <button type="button" className="c-btn" disabled={!!busy} onClick={() => void lighten(m)} title="Re-encode to about 5 Mbit/s for the street screen">{busy.startsWith("Making") ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Film aria-hidden="true" className="w-4 h-4" />}Make lighter</button>}
                        <button type="button" className="c-btn" disabled={!!busy} onClick={() => pickReplacement(it)}><Replace aria-hidden="true" className="w-4 h-4" />Replace with another video or design</button>
                        <button type="button" className="c-btn" onClick={() => void remove(m)}><Trash2 aria-hidden="true" className="w-4 h-4" />Delete</button>
                      </span>
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
          <p className="text-[13px] min-w-0 truncate">Preview: <b>{items.find((i) => i.id === preview)?.label ?? "…"}</b>{programme.hidden.includes(preview) ? " (switched off)" : ""}, on its own and repeating.</p>
          <select aria-label="Which screen" value={screen} onChange={(e) => setScreen(e.target.value)} className="c-select">
            <option value="street">Street screen</option><option value="tv">Reception TV</option><option value="projector">Projector</option>
          </select>
        </div>
        <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: "16 / 9" }}>
          <iframe key={`${screen}-${preview}-${items.find((i) => i.id === preview)?.media?.url ?? ""}`} src={`/display?mode=${screen}&scene=${preview}&solo=1`} title="Screen preview" className="absolute inset-0 w-full h-full border-0" />
        </div>
      </div>
    </div>
  );
}
