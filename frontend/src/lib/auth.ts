/* Client-side auth helpers. Supports two transports (see lib/http.ts):
   token mode (Bearer in localStorage, default) and cookie mode (Sanctum SPA
   HttpOnly session). Switch with NEXT_PUBLIC_AUTH_MODE=cookie. */

import { authFetch } from "./http";

const TOKEN_KEY  = "vitorra_admin_token";
const USER_KEY   = "vitorra_admin_user";
const EXPIRY_KEY = "vitorra_admin_expiry";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  job_title?: string | null;
  staff_status?: string | null;
  /** Operational modules this user may access (admins get all). */
  permissions?: string[];
};

/** Whether a user may access a nav entry / module. Admins see everything. */
export function canAccess(user: AdminUser | null, opts: { adminOnly?: boolean; module?: string }): boolean {
  if (!user) return false;
  const isAdmin = user.role?.toLowerCase() === "admin";
  if (opts.adminOnly) return isAdmin;
  if (opts.module) return isAdmin || (user.permissions ?? []).includes(opts.module);
  return true;
}

export const auth = {
  getToken: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  getUser: (): AdminUser | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  save: (token: string | null, user: AdminUser, expiresAt?: string | null): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token ?? ""); // empty in cookie mode — auth rides the HttpOnly cookie
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (expiresAt) localStorage.setItem(EXPIRY_KEY, expiresAt);
      else localStorage.removeItem(EXPIRY_KEY);
    } catch { /* */ }
  },
  /** ISO timestamp at which this session expires, or null if open-ended. */
  getExpiry: (): string | null => {
    try { return localStorage.getItem(EXPIRY_KEY); } catch { return null; }
  },
  /** True once the stored session-expiry time has passed. */
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

export async function apiAdmin<T>(path: string, options?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res  = await authFetch(base, path, auth.getToken(), options ?? {});
  if (res.status === 401) { auth.clear(); window.location.href = "/admin/login?expired=1"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/** Pull the server-supplied filename out of a Content-Disposition header. */
function filenameFromResponse(res: Response, fallback: string): string {
  const cd = res.headers.get("Content-Disposition");
  if (cd) {
    // Prefer RFC 5987 filename* (handles UTF-8), then plain filename="…".
    const star = /filename\*=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
    const plain = /filename=["']?([^"';]+)/i.exec(cd);
    const raw = star?.[1] ?? plain?.[1];
    if (raw) { try { return decodeURIComponent(raw); } catch { return raw; } }
  }
  return fallback;
}

/** Save a blob response to disk, using the server's filename when available. */
async function saveBlob(res: Response, fallback: string): Promise<void> {
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filenameFromResponse(res, fallback); a.click();
  URL.revokeObjectURL(url);
}

/** Fetch a CSV from an admin endpoint and trigger a browser file download. */
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res  = await authFetch(base, path, auth.getToken(), { headers: { Accept: "text/csv" } }, false);
  if (!res.ok) throw new Error("Export failed");
  await saveBlob(res, filename);
}

/** Download a file from an authorized admin endpoint as a browser download. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res  = await authFetch(base, path, auth.getToken(), {}, false);
  if (!res.ok) throw new Error("Download failed");
  await saveBlob(res, filename);
}

/* Multipart upload — lets the browser set the Content-Type boundary (don't set it). */
export async function uploadAdmin<T>(path: string, form: FormData): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res  = await authFetch(base, path, auth.getToken(), { method: "POST", body: form }, false);
  if (res.status === 401) { auth.clear(); window.location.href = "/admin/login?expired=1"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}
