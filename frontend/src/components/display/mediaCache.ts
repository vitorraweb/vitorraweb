/* ─── Street screen: videos and designs kept on the player itself ─────────────
   The street screen runs on a small Android TV box. Streaming each advert and
   film from the internet every time it plays means a black pause before it
   starts, and stalls whenever the connection dips. So the screen downloads
   every file it will play — adverts first, they are paid for — into the
   browser's own storage (the Cache API, on the box's disk), one at a time in
   the background, and plays from there. Adverts and films not cached yet
   stream as before; the screen's own uploaded videos wait until they are on
   the box (see isLocal), because a heavy video streamed live is what freezes. */

const STORE = "vitorra-screen-media-v1";

/** url → a local object URL for the copy on disk, once it is downloaded. */
const ready = new Map<string, string>();
let warming: Promise<void> | null = null;
let wanted: string[] = [];

const listeners = new Set<() => void>();

/** Called whenever another file finishes downloading to the box. Returns an unsubscribe. */
export function onMediaReady(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Whether this file is already on the box's disk. */
export function isLocal(url: string): boolean {
  return ready.has(url);
}

/** The local copy if there is one, otherwise the original address. Never waits. */
export function localSrc(url: string): string {
  return ready.get(url) ?? url;
}

/**
 * Make sure every url is on disk, in order (put adverts first), and drop
 * what is no longer needed. Safe to call often: one download runs at a time.
 */
export function warm(urls: string[]): void {
  if (typeof window === "undefined" || !("caches" in window)) return;
  wanted = [...new Set(urls.filter(Boolean))];
  warming ??= run().finally(() => { warming = null; });
}

async function run(): Promise<void> {
  try {
    const cache = await caches.open(STORE);

    // Forget files that left the programme, so the box's disk does not fill.
    for (const req of await cache.keys()) {
      if (!wanted.includes(req.url) && !wanted.includes(new URL(req.url).pathname)) {
        await cache.delete(req);
        const key = [...ready.keys()].find((u) => req.url.endsWith(u));
        if (key) { URL.revokeObjectURL(ready.get(key)!); ready.delete(key); }
      }
    }

    for (const url of [...wanted]) {
      if (ready.has(url)) continue;
      let res = await cache.match(url);
      if (!res) {
        try {
          const fresh = await fetch(url, { mode: "cors", credentials: "omit" });
          // Only whole files: a partial or opaque answer would play as nothing.
          if (!fresh.ok || fresh.status !== 200 || fresh.type === "opaque") continue;
          await cache.put(url, fresh);
          // Read it back from disk, so a large video is not also held in memory.
          res = await cache.match(url);
          if (!res) continue;
        } catch { continue; } // offline or refused: it keeps streaming
      }
      const blob = await res.blob();
      if (blob.size > 0) {
        ready.set(url, URL.createObjectURL(blob));
        listeners.forEach((fn) => fn());
      }
    }
  } catch { /* storage unavailable: everything streams as before */ }
}

/** Free a video's decoder at once instead of waiting for the browser to tidy up. */
export function releaseVideo(v: HTMLVideoElement | null): void {
  if (!v) return;
  // Only once it has really left the page (React may re-attach the same element).
  setTimeout(() => {
    if (v.isConnected) return;
    try { v.pause(); v.removeAttribute("src"); v.load(); } catch { /* already gone */ }
  }, 0);
}
