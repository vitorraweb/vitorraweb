"use client";

// Top-level error boundary. Replaces the root layout when an unrecoverable
// render error occurs, reports it to Sentry, and shows a branded fallback.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2F2F2",
          color: "#1E1E1E",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <p
            style={{
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontSize: 12,
              color: "#7A6020",
              margin: "0 0 16px",
            }}
          >
            Vitorra Holdings
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#454545", lineHeight: 1.6, margin: "0 0 28px" }}>
            We hit an unexpected problem. Our team has been notified. Please try
            again — if it keeps happening, contact us and we&apos;ll help.
          </p>
          <button
            onClick={() => reset()}
            style={{
              border: "none",
              cursor: "pointer",
              background: "#C5B27A",
              color: "#1E1E1E",
              fontWeight: 600,
              padding: "12px 28px",
              borderRadius: 999,
              fontSize: 15,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
