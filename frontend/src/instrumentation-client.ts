// Next.js client-side instrumentation (runs before hydration).
// Initialises Sentry in the browser and reports client navigation transitions.
// No-op when NEXT_PUBLIC_SENTRY_DSN is unset. See:
//   node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_VERCEL_ENV,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  // Session Replay is opt-in via env (off by default to keep the bundle lean).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR ?? 0),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});

// Lets Sentry instrument App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
