import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { del, put } from "@vercel/blob";
import ffmpegPath from "ffmpeg-static";
import { NextResponse } from "next/server";
import { isScreenStaff, SCREEN_MEDIA_URL } from "@/lib/screen-staff";

/* ─── Screen editor: make an uploaded video light enough for the street screen ──
   The street screen runs on a small Android TV box. Videos exported from phone
   editors often come out at 15 Mbit/s or more; the built-in films run at
   1–5 Mbit/s. This re-encodes an uploaded video to the same light format —
   1080p at most, 30 frames a second at most, H.264 High 4.0, about 5 Mbit/s,
   no sound, ready to start playing at once — puts the new file in storage,
   deletes the heavy one and returns the new address. A video that is already
   light is left as it is. Works for the Screen editor's uploads and for paid
   adverts alike. Staff with the screen permission only.                     */

export const runtime = "nodejs";
export const maxDuration = 300;

/** Already this light (and no larger than 1080p, 30 fps): nothing to do. */
const LIGHT_KBPS = 6000;

type Probe = { kbps: number | null; width: number | null; height: number | null; fps: number | null; seconds: number | null };

function run(args: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) { reject(new Error("The video encoder is not available on this server.")); return; }
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d: Buffer) => { stderr = (stderr + d.toString()).slice(-20_000); });
    p.on("error", reject);
    p.on("close", (code) => resolve({ code: code ?? 1, stderr }));
  });
}

/** What ffmpeg says about the input (it prints this and exits when given no output). */
async function probe(file: string): Promise<Probe> {
  const { stderr } = await run(["-hide_banner", "-i", file]);
  const dur = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  const rate = /bitrate: (\d+) kb\/s/.exec(stderr);
  const line = /Stream #[^\n]*Video:[^\n]*/.exec(stderr)?.[0] ?? "";
  const size = /\b(\d{2,5})x(\d{2,5})\b/.exec(line);
  const fps = /(\d+(?:\.\d+)?) fps/.exec(line);
  return {
    seconds: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : null,
    kbps: rate ? Number(rate[1]) : null,
    width: size ? Number(size[1]) : null,
    height: size ? Number(size[2]) : null,
    fps: fps ? Number(fps[1]) : null,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  if (!url || !SCREEN_MEDIA_URL.test(url) || !url.endsWith(".mp4")) return NextResponse.json({ error: "Not a screen video." }, { status: 422 });
  if (!(await isScreenStaff(request))) return NextResponse.json({ error: "Sign in to the console to change screen content." }, { status: 403 });

  const dir = await mkdtemp(join(tmpdir(), "screen-"));
  const input = join(dir, "in.mp4");
  const output = join(dir, "out.mp4");
  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) throw new Error("Could not read the uploaded video.");
    await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(input));

    const before = await probe(input);
    const light = before.kbps !== null && before.kbps <= LIGHT_KBPS && (before.height ?? 0) <= 1080 && (before.fps ?? 0) <= 30.5;
    if (light) return NextResponse.json({ url, optimised: false, kbps: before.kbps });

    const args = [
      "-hide_banner", "-y", "-i", input,
      "-map", "0:v:0", "-an", "-sn", "-dn",
      "-vf", "scale='min(1920,iw)':-2",
      ...((before.fps ?? 30) > 30.5 ? ["-r", "30"] : []),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-maxrate", "5M", "-bufsize", "10M",
      "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      output,
    ];
    const { code, stderr } = await run(args);
    if (code !== 0) throw new Error(`The video could not be re-encoded (${stderr.split("\n").filter(Boolean).pop()?.slice(0, 160) ?? "ffmpeg failed"}).`);

    const bytes = (await stat(output)).size;
    // An advert stays among the adverts, Vitorra's own content among its own.
    const folder = SCREEN_MEDIA_URL.exec(url)?.[1] ?? "screen-media";
    const blob = await put(`${folder}/${crypto.randomUUID()}.mp4`, createReadStream(output), {
      access: "public", contentType: "video/mp4", addRandomSuffix: true, multipart: true,
    });
    await del(url).catch(() => {}); // the heavy original is no longer needed

    const after = before.seconds ? Math.round((bytes * 8) / before.seconds / 1000) : null;
    return NextResponse.json({
      url: blob.url, optimised: true, bytes, kbps: after, before_kbps: before.kbps,
      width: Math.min(1920, before.width ?? 1920), seconds: before.seconds,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not make the video lighter." }, { status: 502 });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
