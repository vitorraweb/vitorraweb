import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api is the same-origin proxy to the backend (see next.config.ts) — it
      // returns JSON, never pages, so keep crawlers out of it.
      disallow: ["/admin", "/account", "/shop/cart", "/shop/checkout", "/display", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
