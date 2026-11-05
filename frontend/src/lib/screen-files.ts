import { auth } from "@/lib/auth";

/* Console helpers for screen files (the Screen editor's uploads and paid
   adverts): make a video light for the street screen's TV box, and delete a
   file from storage once nothing uses it. Both send the console's sign-in:
   a Bearer token when there is one, otherwise the session cookie.           */

export type Optimised = { url: string; optimised: boolean; kbps?: number | null; before_kbps?: number | null; error?: string };

/** Re-encode an uploaded video on the server to the street screen's light format (about 5 Mbit/s). */
export async function optimiseVideo(url: string): Promise<Optimised> {
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
export const mbps = (kbps?: number | null) => (kbps ? `${(kbps / 1000).toFixed(1)} Mbit/s` : "");

/** Delete an uploaded file from storage once nothing uses it. Best effort: the screens never play it again either way. */
export async function deleteFile(url: string): Promise<void> {
  const token = auth.getToken();
  await fetch("/api/screen-media/file", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ url }),
  }).catch(() => {});
}
