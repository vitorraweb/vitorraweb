// Sentry initialisation for the Node.js server runtime.
// Imported by src/instrumentation.ts during register().
// No-op when NEXT_PUBLIC_SENTRY_DSN is unset, so it is safe to ship before
// the DSN is configured in Vercel.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV,
  // Errors only by default; raise via env to sample performance traces.
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
