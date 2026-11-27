// The parts of the Sentry browser SDK the site uses, as named imports so the
// bundler can leave the rest out. Loaded on demand (dynamic import) by
// instrumentation-client.ts and app/global-error.tsx, never up front.
import { init, captureException, captureRouterTransitionStart } from "@sentry/nextjs";

export function start(dsn: string) {
  init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_VERCEL_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
    // Session Replay is opt-in via env (off by default to keep the bundle lean).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR ?? 0),
  });
}

export { captureException, captureRouterTransitionStart };
