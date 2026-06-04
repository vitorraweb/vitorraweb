/* Customer (portal) auth — kept separate from the admin session so the two
   never collide. Token in localStorage under a customer-specific key. */

const TOKEN_KEY = "vitorra_customer_token";
const USER_KEY  = "vitorra_customer_user";

export type CustomerUser = { id: number; name: string; email: string; role: string };

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const customerAuth = {
  getToken: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  getUser: (): CustomerUser | null => {
    try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  },
  save: (token: string, user: CustomerUser): void => {
    try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* */ }
  },
  clear: (): void => {
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch { /* */ }
  },
};

/** Authenticated fetch for the customer portal. */
export async function apiCustomer<T>(path: string, options?: RequestInit): Promise<T> {
  const token = customerAuth.getToken();
  const res = await fetch(`${base()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 401) { customerAuth.clear(); window.location.href = "/account/login"; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/** Public register/login — returns the issued token + user (no auth needed). */
async function postAuth(path: string, body: Record<string, unknown>): Promise<{ data: { user: CustomerUser; token: string } }> {
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

export async function loginCustomer(email: string, password: string) {
  const { data } = await postAuth("/auth/login", { email, password });
  customerAuth.save(data.token, data.user);
  return data.user;
}

export async function registerCustomer(payload: Record<string, unknown>) {
  const { data } = await postAuth("/auth/register", payload);
  customerAuth.save(data.token, data.user);
  return data.user;
}
