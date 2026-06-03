/* Minimal client-side auth helpers — token stored in localStorage.
   Replace with HttpOnly cookies + Sanctum CSRF for production hardening. */

const TOKEN_KEY = "vitorra_admin_token";
const USER_KEY  = "vitorra_admin_user";

export type AdminUser = { id: number; name: string; email: string; role: string };

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
