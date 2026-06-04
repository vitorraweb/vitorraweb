/* ─── Product ──────────────────────────────────────────────────────────── */

export type ProductCategory = "FET" | "SEAL" | "COFFEE" | "LOGISTICS";

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  price_ugx: number | null;
  price_usd: number | null;
  stock_quantity: number | null;
  is_published: boolean;
  images: MediaFile[];
  /** Arbitrary product-specific fields (coffee: tagline, badge, weight, roast…) */
  meta?: Record<string, string> | null;
  created_at: string;
}

/* ─── Order ────────────────────────────────────────────────────────────── */

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "complete"
  | "cancelled";

export type PaymentMethod = "flutterwave" | "paypal" | "stripe" | "manual" | "eft";
export type PaymentStatus = "pending" | "partial" | "paid";
export type Currency = "UGX" | "USD";

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_slug: string;
  options: { grind?: string; weight?: string } | null;
  quantity: number;
  unit_price_ugx: number;
  unit_price_usd_cents: number;
  /** Line total in the order's currency unit (UGX shillings / USD cents). */
  line_total: number;
}

export interface Order {
  id: number;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  currency: Currency;
  /** Stored in the order currency unit: UGX whole shillings, USD cents. */
  subtotal: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  shipping_address: Address;
  tracking_number: string | null;
  notes: string | null;
  invoice_url: string | null;
  items: OrderItem[];
  created_at: string;
}

/* ─── Enquiry ──────────────────────────────────────────────────────────── */

export type EnquiryStatus =
  | "new"
  | "in_progress"
  | "quoted"
  | "converted"
  | "closed";

/** One structured, quote-ready answer captured by the product-aware enquiry form.
    `value` is already display-formatted (multi-selects joined, units appended). */
export interface EnquiryRequirement {
  key: string;
  label: string;
  value: string;
}

export interface Enquiry {
  id: number;
  product_category: ProductCategory;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  country: string;
  message: string;
  requirements: EnquiryRequirement[] | null;
  status: EnquiryStatus;
  created_at: string;
}

export interface EnquiryFormData {
  product_category: ProductCategory | "";
  name: string;
  email: string;
  company: string;
  phone: string;
  country: string;
  message: string;
  requirements?: EnquiryRequirement[];
}

/* ─── Blog ─────────────────────────────────────────────────────────────── */

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  /** Sanitised HTML rendered server-side from the markdown `content` (safe to render). */
  content_html?: string;
  author: string;
  status: "draft" | "published";
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image: string | null;
}

/* ─── Shared ────────────────────────────────────────────────────────────── */

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  country: string;
  postcode?: string;
}

export interface MediaFile {
  id: number;
  url: string;
  alt: string;
  type: "image" | "video" | "pdf";
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
