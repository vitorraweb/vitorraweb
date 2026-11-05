import { API_ORIGIN } from "@/lib/constants";

/* Server side only. Asks the API whether the person behind this request is
   signed-in staff with the screen permission, the same way the console is
   signed in: a Bearer token (token mode, the Teams tab) or the console's
   session cookie (cookie mode, the live site). An empty "Bearer " is never
   forwarded: the API would take it as the sign-in and ignore the cookie. */
export async function isScreenStaff(request: Request): Promise<boolean> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const auth = request.headers.get("authorization") ?? "";
  if (/^Bearer\s+\S+/i.test(auth)) headers.Authorization = auth;
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.Cookie = cookie;
    // The API only reads the session cookie for requests from the site itself.
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    headers.Origin = origin;
    headers.Referer = `${origin}/`;
  }
  if (!headers.Authorization && !headers.Cookie) return false;
  const r = await fetch(`${API_ORIGIN}/admin/screen-media`, { headers, cache: "no-store" });
  return r.ok;
}

/** Only files the Screen editor itself uploaded may be touched from the console. */
export const SCREEN_MEDIA_URL = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/screen-media\/[A-Za-z0-9._\-/%]+\.(mp4|png|jpe?g|webp)$/;
