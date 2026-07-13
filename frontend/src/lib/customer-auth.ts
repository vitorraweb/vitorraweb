/* Customer (portal) auth — kept separate from the admin session so the two
   never collide. Token in localStorage under a customer-specific key. Supports
   cookie mode (see lib/http.ts). */

import { authFetch } from "./http";

const TOKEN_KEY  = "vitorra_customer_token";
const USER_KEY   = "vitorra_customer_user";
const EXPIRY_KEY = "vitorra_customer_expiry";

export type CustomerUser = { id: number; name: string; email: string; role: string };

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const customerAuth = {
  getToken: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  getUser: (): CustomerUser | null => {
    try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  },
  save: (token: string | null, user: CustomerUser, expiresAt?: string | null): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token ?? ""); // empty in cookie mode
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (expiresAt) localStorage.setItem(EXPIRY_KEY, expiresAt);
      else localStorage.removeItem(EXPIRY_KEY);
    } catch { /* */ }
  },
  clear: (): void => {
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(EXPIRY_KEY); } catch { /* */ }
  },
};

/** Authenticated fetch for the customer portal. */
export async function apiCustomer<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(base(), path, customerAuth.getToken(), options ?? {});
  if (res.status === 401) { customerAuth.clear(); window.location.href = "/account/login"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/* Multipart upload (e.g. a message attachment) — lets the browser set the Content-Type boundary. */
export async function uploadCustomer<T>(path: string, form: FormData): Promise<T> {
  const res = await authFetch(base(), path, customerAuth.getToken(), { method: "POST", body: form }, false);
  if (res.status === 401) { customerAuth.clear(); window.location.href = "/account/login"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}

/** Download a protected file (e.g. the FET savings certificate) as a browser download. */
export async function downloadCustomerFile(path: string, filename: string): Promise<void> {
  const res = await authFetch(base(), path, customerAuth.getToken(), {}, false);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Public register/login — returns the issued token (token mode) + user. */
async function postAuth(path: string, body: Record<string, unknown>): Promise<{ data: { user: CustomerUser; token: string | null; expires_at?: string | null } }> {
  const res = await authFetch(base(), path, null, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

export async function loginCustomer(email: string, password: string) {
  const { data } = await postAuth("/auth/login", { email, password, scope: "customer" });
  customerAuth.save(data.token, data.user, data.expires_at);
  return data.user;
}

export async function registerCustomer(payload: Record<string, unknown>) {
  const { data } = await postAuth("/auth/register", payload);
  customerAuth.save(data.token, data.user, data.expires_at);
  return data.user;
}

/** Change the signed-in customer's password (verifies the current one). */
export async function changeCustomerPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiCustomer("/auth/password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    }),
  });
}
