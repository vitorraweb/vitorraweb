/* Minimal client-side auth helpers — token stored in localStorage.
   Replace with HttpOnly cookies + Sanctum CSRF for production hardening. */

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
  save: (token: string, user: AdminUser, expiresAt?: string | null): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
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
  const token = auth.getToken();
  const base  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res   = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type":  "application/json",
      Accept:          "application/json",
      Authorization:   token ? `Bearer ${token}` : "",
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 401) { auth.clear(); window.location.href = "/admin/login?expired=1"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/** Fetch a CSV from an admin endpoint and trigger a browser file download. */
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const token = auth.getToken();
  const base  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res   = await fetch(`${base}${path}`, {
    headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "text/csv" },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Download a file from an authorized admin endpoint as a browser download. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = auth.getToken();
  const base  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res   = await fetch(`${base}${path}`, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* Multipart upload — lets the browser set the Content-Type boundary (don't set it). */
export async function uploadAdmin<T>(path: string, form: FormData): Promise<T> {
  const token = auth.getToken();
  const base  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const res   = await fetch(`${base}${path}`, {
    method: "POST",
    body: form,
    headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" },
  });
  if (res.status === 401) { auth.clear(); window.location.href = "/admin/login?expired=1"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}
