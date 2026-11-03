/* Advertising on the street screen. Packages come from the API
   (config/screen_ads.php in the backend), Finance's rate card. */

export type Package = { id: string; label: string; price_ugx: number; days: number; plays_per_hour: number };

export type Pricing = {
  packages: Package[];
  lead_days: number;
  on_air: string;
  video: { seconds: number; max_mb: number; min_width: number; tolerance_seconds: number };
};

export type BookingView = {
  reference: string;
  status: string;
  company: string;
  package: string;
  plays_per_hour: number;
  on_air: string;
  start_date: string;
  end_date: string;
  price_ugx: number;
  proof_received: boolean;
  review_note: string | null;
  bank: { bank: string; account_name: string; branch: string; account_number: string; swift: string } | null;
  token?: string;
};

/** A design's size in pixels, or null if the browser cannot read it. */
export function readImage(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/** The image types the screen shows, by extension. */
export const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

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
