import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

// Wires next-intl into the build (server-component message resolution).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/* Absolute URL of the Laravel API, e.g. https://api.vitorra.org/api — the same
   value lib/constants.ts reads. Must stay absolute; it is the proxy target. */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
/* Host root of the API (API_ORIGIN minus the trailing /api) — serves
   /sanctum/csrf-cookie when cookie auth mode is switched on. */
const API_HOST = API_ORIGIN.replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "api.vitorra.org" }, // uploaded media / blog covers served by the API
    ],
  },
  /* Same-origin proxy to the API so the browser never makes a cross-origin
     request and therefore never sends a CORS preflight. The API host is behind
     a security proxy (Imunify360 WebShield) that answers OPTIONS with a 415
     before Laravel runs, so no Access-Control-Allow-Origin header is ever
     produced and every browser call fails. Proxying sidesteps CORS entirely.

     Returning an array gives these `afterFiles` semantics — they are checked
     *after* filesystem routes, so the local /api/revalidate route handler still
     wins and is not proxied. */
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_ORIGIN}/:path*` },
      // Only used when NEXT_PUBLIC_AUTH_MODE=cookie (Sanctum SPA mode).
      { source: "/sanctum/:path*", destination: `${API_HOST}/sanctum/:path*` },
    ];
  },
};

// Sentry build-time options. Source maps are only uploaded when a SENTRY_AUTH_TOKEN
// is present, so local/CI builds without it succeed (upload is simply skipped).
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Strip Sentry's internal logger from the client bundle.
  disableLogger: true,
  // Don't fail the build if source-map upload can't run.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
