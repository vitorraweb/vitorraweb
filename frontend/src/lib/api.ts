import { API_BASE_URL } from "./constants";
import type {
  ApiResponse,
  BlogPost,
  Enquiry,
  EnquiryFormData,
  Order,
  PaginatedResponse,
  Product,
} from "@/types";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }

  return res.json();
}

/* ─── Products ─────────────────────────────────────────────────────────── */

export async function getProducts(): Promise<Product[]> {
  const res = await request<ApiResponse<Product[]>>("/products", {
    next: { revalidate: 3600 },
  });
  return res.data;
}

export async function getProduct(slug: string): Promise<Product> {
  const res = await request<ApiResponse<Product>>(`/products/${slug}`, {
    next: { revalidate: 3600 },
  });
  return res.data;
}

export async function getCoffeeProducts(): Promise<Product[]> {
  const res = await request<ApiResponse<Product[]>>("/coffee/products", {
    next: { revalidate: 600 },
  });
  return res.data;
}

/* ─── Exchange Rate ─────────────────────────────────────────────────────── */

export async function getExchangeRate(): Promise<number> {
  const res = await request<ApiResponse<{ ugx_per_usd: number }>>(
    "/exchange-rate",
    { next: { revalidate: 3600 } }
  );
  return res.data.ugx_per_usd;
}

/* ─── Blog ─────────────────────────────────────────────────────────────── */

export async function getBlogPosts(page = 1): Promise<PaginatedResponse<BlogPost>> {
  return request<PaginatedResponse<BlogPost>>(`/blog/posts?page=${page}`, {
    next: { revalidate: 1800 },
  });
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
  const res = await request<ApiResponse<BlogPost>>(`/blog/posts/${slug}`, {
    next: { revalidate: 1800 },
  });
  return res.data;
}

/* ─── Enquiries ─────────────────────────────────────────────────────────── */

export async function submitEnquiry(data: EnquiryFormData): Promise<Enquiry> {
  const res = await request<ApiResponse<Enquiry>>("/enquiries", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

/* ─── Orders (Customer Portal — requires auth) ──────────────────────────── */

export async function getMyOrders(token: string): Promise<Order[]> {
  const res = await request<ApiResponse<Order[]>>("/account/orders", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return res.data;
}

export async function getMyEnquiries(token: string): Promise<Enquiry[]> {
  const res = await request<ApiResponse<Enquiry[]>>("/account/enquiries", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return res.data;
}
