/* Server only. The booking journey stays hidden until Finance approves the
   prices: SCREEN_ADS_ENABLED=true opens it, and until then only someone holding
   SCREEN_ADS_PREVIEW_KEY can see it. With neither set, it does not exist. */
export function screenAdsOpen(preview?: string | null): boolean {
  if (process.env.SCREEN_ADS_ENABLED === "true") return true;
  const key = process.env.SCREEN_ADS_PREVIEW_KEY;
  return !!key && preview === key;
}
