/* Staff (employee self-service) auth — kept separate from the admin and
   customer sessions so the three never collide. Token in localStorage under a
   staff-specific key. Internal portal: English only, mirrors the admin session
   model (including auto-expiry). Supports cookie mode (see lib/http.ts). */

import { authFetch } from "./http";

const TOKEN_KEY  = "vitorra_staff_token";
const USER_KEY   = "vitorra_staff_user";
const EXPIRY_KEY = "vitorra_staff_expiry";

export type StaffUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "ops" | "employee";
};

/** Roles allowed into the staff portal (everyone on the team, not customers). */
export const STAFF_ROLES = ["admin", "ops", "employee"];

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const staffAuth = {
  getToken: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  getUser: (): StaffUser | null => {
    try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  },
  save: (token: string | null, user: StaffUser, expiresAt?: string | null): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token ?? ""); // empty in cookie mode
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (expiresAt) localStorage.setItem(EXPIRY_KEY, expiresAt);
      else localStorage.removeItem(EXPIRY_KEY);
    } catch { /* */ }
  },
  getExpiry: (): string | null => {
    try { return localStorage.getItem(EXPIRY_KEY); } catch { return null; }
  },
  isExpired: (): boolean => {
    try {
      const exp = localStorage.getItem(EXPIRY_KEY);
      return !!exp && Date.now() >= new Date(exp).getTime();
    } catch { return false; }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    } catch { /* */ }
  },
};

/** Authenticated JSON fetch for the staff portal. */
export async function apiStaff<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(base(), path, staffAuth.getToken(), options ?? {});
  if (res.status === 401) { staffAuth.clear(); window.location.href = "/staff/login?expired=1"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/** Multipart upload for the staff portal (browser sets the boundary). */
export async function uploadStaff<T>(path: string, form: FormData): Promise<T> {
  const res = await authFetch(base(), path, staffAuth.getToken(), { method: "POST", body: form }, false);
  if (res.status === 401) { staffAuth.clear(); window.location.href = "/staff/login?expired=1"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}

/** Pull the server-supplied filename out of a Content-Disposition header. */
function filenameFromResponse(res: Response, fallback: string): string {
  const cd = res.headers.get("Content-Disposition");
  if (cd) {
    const star = /filename\*=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
    const plain = /filename=["']?([^"';]+)/i.exec(cd);
    const raw = star?.[1] ?? plain?.[1];
    if (raw) { try { return decodeURIComponent(raw); } catch { return raw; } }
  }
  return fallback;
}

/** Download a private file from an authorized endpoint as a browser download. */
export async function downloadStaffFile(path: string, filename: string): Promise<void> {
  const res = await authFetch(base(), path, staffAuth.getToken(), {}, false);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filenameFromResponse(res, filename); a.click();
  URL.revokeObjectURL(url);
}

/**
 * Log in to the staff portal; rejects non-staff (e.g. customer) accounts.
 * When the account has two-factor on, the first call (no code) resolves to
 * `{ twoFactorRequired: true }` — the caller then re-invokes with the code.
 */
export async function loginStaff(
  email: string,
  password: string,
  code?: string,
): Promise<{ twoFactorRequired: true } | { twoFactorRequired: false; user: StaffUser }> {
  const res = await authFetch(base(), "/auth/login", null, {
    method: "POST",
    body: JSON.stringify({ email, password, code: code || undefined, scope: "staff" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(err.message ?? "Login failed");
  }
  const { data } = (await res.json()) as {
    data: { two_factor_required?: boolean; token: string | null; expires_at: string | null; user: StaffUser };
  };
  if (data.two_factor_required) return { twoFactorRequired: true };
  if (!STAFF_ROLES.includes(data.user.role)) {
    // Revoke the session/token we just issued — this account isn't a staff account.
    authFetch(base(), "/auth/logout", data.token, { method: "POST" }).catch(() => { /* best-effort */ });
    throw new Error("This account doesn't have staff portal access.");
  }
  staffAuth.save(data.token, data.user, data.expires_at);
  return { twoFactorRequired: false, user: data.user };
}
