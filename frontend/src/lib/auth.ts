/* Minimal client-side auth helpers — token stored in localStorage.
   Replace with HttpOnly cookies + Sanctum CSRF for production hardening. */

const TOKEN_KEY = "vitorra_admin_token";
const USER_KEY  = "vitorra_admin_user";

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
  save: (token: string, user: AdminUser): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch { /* */ }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
  if (res.status === 401) { auth.clear(); window.location.href = "/admin/login"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
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
  if (res.status === 401) { auth.clear(); window.location.href = "/admin/login"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}
