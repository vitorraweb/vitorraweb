/* Shared auth transport for all three portals.

   Two modes, chosen by NEXT_PUBLIC_AUTH_MODE (default "token"):
   - "token"  — current behaviour: Bearer token in the Authorization header.
   - "cookie" — Sanctum SPA: HttpOnly session cookie + XSRF header, no token in
                JS (XSS-hardened). Requires the API on a sibling/parent domain
                and SANCTUM_STATEFUL_DOMAINS set on the backend.

   The default keeps everything byte-for-byte as before, so flipping the flag is
   the only thing that activates cookie auth. */

export const AUTH_MODE = (process.env.NEXT_PUBLIC_AUTH_MODE === "cookie" ? "cookie" : "token") as
  | "token"
  | "cookie";
export const cookieMode = AUTH_MODE === "cookie";

/** Read a non-HttpOnly cookie (used for the XSRF-TOKEN Sanctum sets). */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/** The app origin that serves /sanctum/csrf-cookie (API base minus the /api suffix). */
function appOrigin(base: string): string {
  return base.replace(/\/api\/?$/, "");
}

let csrfReady = false;
/** Prime the CSRF cookie once before the first state-changing cookie request. */
export async function ensureCsrf(base: string): Promise<void> {
  if (!cookieMode || csrfReady) return;
  await fetch(`${appOrigin(base)}/sanctum/csrf-cookie`, { credentials: "include" }).catch(() => {});
  csrfReady = true;
}

/**
 * One fetch used by every portal's API helper. In token mode it sets the
 * Authorization header (exactly as before); in cookie mode it sends the session
 * cookie + X-XSRF-TOKEN and no token.
 */
export async function authFetch(
  base: string,
  path: string,
  token: string | null,
  options: RequestInit = {},
  json = true,
): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  if (cookieMode && method !== "GET") await ensureCsrf(base);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (cookieMode) {
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${base}${path}`, {
    ...options,
    headers,
    ...(cookieMode ? { credentials: "include" as RequestCredentials } : {}),
  });
}
