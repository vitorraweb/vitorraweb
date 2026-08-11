import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api is the same-origin proxy to the backend (see next.config.ts) — it
      // returns JSON, never pages, so keep crawlers out of it.
      // /trial/* are private, token-gated links sent to individual clients —
      // they carry that client's own operating data and must never be indexed.
      disallow: ["/admin", "/account", "/shop/cart", "/shop/checkout", "/display", "/trial", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
