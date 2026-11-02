/* Advertising on the street screen. Prices come from the API (config/screen_ads.php
   in the backend), so this file only does the sum. The server repeats it on every
   booking and its answer is the one that counts. */

export type Pricing = {
  base_ugx: number;
  campaign_days: number;
  lead_days: number;
  durations: { seconds: number; factor: number }[];
  visibility: { id: string; label: string; blurb: string; factor: number; plays_per_hour: number }[];
  day_factors: Record<string, number>;
  periods: { id: string; label: string; hours: string }[];
  video: { max_mb: number; min_width: number; tolerance_seconds: number };
};

export const DAYS = [
  { id: "mon", short: "Mon" }, { id: "tue", short: "Tue" }, { id: "wed", short: "Wed" }, { id: "thu", short: "Thu" },
  { id: "fri", short: "Fri" }, { id: "sat", short: "Sat" }, { id: "sun", short: "Sun" },
];

export const DAY_PRESETS = [
  { label: "Weekdays", days: ["mon", "tue", "wed", "thu", "fri"] },
  { label: "Weekend", days: ["sat", "sun"] },
  { label: "Every day", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
];

export function monthlyPrice(p: Pricing, seconds: number, visibility: string, days: number): number | null {
  const d = p.durations.find((x) => x.seconds === seconds)?.factor;
  const v = p.visibility.find((x) => x.id === visibility)?.factor;
  const n = p.day_factors[String(days)];
  if (d === undefined || v === undefined || n === undefined) return null;
  return Math.round((p.base_ugx * d * v * n) / 1000) * 1000;
}

export type BookingView = {
  reference: string;
  status: string;
  company: string;
  duration: number;
  visibility: string;
  plays_per_hour: number;
  days: string[];
  periods: string[];
  start_date: string;
  end_date: string;
  monthly_ugx: number;
  proof_received: boolean;
  review_note: string | null;
  bank: { bank: string; account_name: string; branch: string; account_number: string; swift: string } | null;
  token?: string;
};

/** H.264 is named in the file's header, at the start or the end. A browser that plays a
 *  file proves little: a Mac plays HEVC happily, and the street player may show black. */
export async function isH264(file: File): Promise<boolean> {
  const span = 4 * 1024 * 1024;
  const read = async (b: Blob) => new TextDecoder("latin1").decode(await b.arrayBuffer());
  return (await read(file.slice(0, span))).includes("avc1") || (await read(file.slice(-span))).includes("avc1");
}

/** Reads a chosen file the way the screen will: if the browser cannot decode it, neither can the player. */
export function readVideo(file: File): Promise<{ seconds: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    const done = (r: { seconds: number; width: number; height: number } | null) => { URL.revokeObjectURL(url); resolve(r); };
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => done(v.videoWidth > 0 ? { seconds: v.duration, width: v.videoWidth, height: v.videoHeight } : null);
    v.onerror = () => done(null);
    v.src = url;
  });
}
