// Next.js client-side instrumentation (runs before hydration).
// Initialises Sentry in the browser and reports client navigation transitions.
// No-op when NEXT_PUBLIC_SENTRY_DSN is unset. See:
//   node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md
//
// The Sentry browser SDK is about 150 KB compressed, the largest script on
// every page. It used to be imported here directly, so every visitor
// downloaded and ran it before the page became usable, and it was bundled
// even when no DSN is set. It now loads once the browser is idle (and not at
// all without a DSN). Errors that happen before it arrives are kept and sent
// when it does, so nothing is lost but the wait.
type SentryModule = typeof import("@/lib/sentry-client");

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let sentry: SentryModule | null = null;

if (dsn && typeof window !== "undefined") {
  const early: unknown[] = [];
  const onError = (e: ErrorEvent) => early.push(e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => early.push(e.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  const load = () =>
    import("@/lib/sentry-client")
      .then((S) => {
        S.start(dsn);
        sentry = S;
        window.removeEventListener("error", onError);
        window.removeEventListener("unhandledrejection", onRejection);
        for (const err of early) S.captureException(err);
      })
      .catch(() => {
        /* Monitoring must never break the page. */
      });

  if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 5000 });
  else setTimeout(load, 3000);
}

// Lets Sentry instrument App Router client-side navigations (once loaded).
export function onRouterTransitionStart(url: string, navigationType: "push" | "replace" | "traverse") {
  sentry?.captureRouterTransitionStart(url, navigationType);
}
