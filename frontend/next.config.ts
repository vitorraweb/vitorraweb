import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

// Wires next-intl into the build (server-component message resolution).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
