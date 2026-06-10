// Next.js server instrumentation (App Router).
// Loads the right Sentry init for the active runtime and forwards server-side
// request errors to Sentry. See:
//   node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captures errors thrown during server rendering / route handlers.
export const onRequestError = Sentry.captureRequestError;
