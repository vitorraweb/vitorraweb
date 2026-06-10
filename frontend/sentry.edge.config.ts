// Sentry initialisation for the Edge runtime (middleware, edge routes).
// Imported by src/instrumentation.ts during register().
// No-op when NEXT_PUBLIC_SENTRY_DSN is unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
