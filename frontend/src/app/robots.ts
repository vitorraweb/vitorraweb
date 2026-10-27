import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const PRIVATE = ["/admin", "/staff", "/account", "/shop/cart", "/shop/checkout", "/display", "/trial", "/contract", "/invoice", "/order", "/pay", "/api"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      /* Search engines and the AI assistants that answer from the web are
         named and welcome: being read is how Vitorra gets cited. Same
         private paths closed for all of them. */
      ...["Googlebot", "Bingbot", "Google-Extended", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Applebot-Extended", "DuckDuckBot"].map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE,
      })),
      {
      userAgent: "*",
      allow: "/",
      // /api is the same-origin proxy to the backend (see next.config.ts) — it
      // returns JSON, never pages, so keep crawlers out of it.
      // /trial/* are private, token-gated links sent to individual clients —
      // they carry that client's own operating data and must never be indexed.
      disallow: PRIVATE,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
