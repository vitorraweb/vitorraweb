export const SITE_NAME = "Vitorra Holdings Limited";
export const SITE_URL = "https://vitorra.org";
export const CONTACT_EMAIL = "support@vitorra.org";
/* Primary line — the one that reaches us reliably; used site-wide for tel:/WhatsApp. */
export const CONTACT_PHONE = "+256 740 026 294";
/* Secondary line — shown alongside the primary on Contact + Footer. */
export const CONTACT_PHONE_ALT = "+256 740 026 118";
export const CONTACT_ADDRESS = ["Padre Pio House, Plot 32", "Lumumba Avenue", "Kampala, Uganda"];
export const COMPANY_REG_NO = "80034340923220";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/* Plausible Analytics — cookieless, so no cookie-consent gating needed.
   Set NEXT_PUBLIC_ENABLE_ANALYTICS=true on the production Vercel env only,
   so preview/local builds don't send traffic into the live dashboard. */
export const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
export const PLAUSIBLE_DOMAIN = "vitorra.org";

export const PRODUCTS = {
  FET: "fuel-eco-tech",
  SEAL: "seal-wound-spray",
  COFFEE: "coffee",
  LOGISTICS: "logistics",
} as const;

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  {
    label: "Products",
    href: "#",
    children: [
      { label: "Fuel Eco Tech", href: "/products/fuel-eco-tech" },
      { label: "SEAL Wound Spray", href: "/products/seal-wound-spray" },
      { label: "Vitorra Coffee", href: "/products/coffee" },
      { label: "Logistics Services", href: "/products/logistics" },
    ],
  },
  { label: "Coffee Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const CURRENCIES = {
  UGX: "UGX",
  USD: "USD",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  COMPLETE: "complete",
  CANCELLED: "cancelled",
} as const;

export const ENQUIRY_STATUS = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  QUOTED: "quoted",
  CONVERTED: "converted",
  CLOSED: "closed",
} as const;
