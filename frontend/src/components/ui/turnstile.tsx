"use client";

/**
 * Cloudflare Turnstile widget — free, privacy-friendly bot protection for the
 * public forms (enquiry, contact, newsletter, supplier, careers).
 *
 * Default-off by design: when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset the
 * component renders nothing, so forms behave exactly as before. Switch it on by
 * setting that env var (plus TURNSTILE_SECRET_KEY on the backend).
 *
 * Tokens are single-use and expire (~5 min), so a parent re-validates after a
 * failed submit via the imperative `reset()` handle:
 *
 *   const widget = useRef<TurnstileHandle>(null);
 *   <Turnstile ref={widget} onVerify={setToken} />
 *   // on submit error: widget.current?.reset();
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { TURNSTILE_ENABLED, TURNSTILE_SITE_KEY } from "@/lib/config";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      action?: string;
      appearance?: "always" | "execute" | "interaction-only";
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onloadTurnstileCallback?: () => void;
  }
}

export interface TurnstileHandle {
  /** Clear the current token and request a fresh challenge. */
  reset: () => void;
}

interface TurnstileProps {
  /** Called with the verification token when the challenge is solved. */
  onVerify: (token: string) => void;
  /** Called when the token expires or a challenge errors (token now invalid). */
  onExpire?: () => void;
  /** Distinguishes the form in Cloudflare analytics (e.g. "enquiry"). */
  action?: string;
  className?: string;
}

/* Load the Turnstile script once, shared across every widget on the page. */
let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  function Turnstile({ onVerify, onExpire, action, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    // Keep the latest callbacks without re-rendering the widget.
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!TURNSTILE_ENABLED) return;
      let cancelled = false;

      loadTurnstile()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          // Guard against double-render in React strict mode.
          if (widgetIdRef.current) return;
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            action,
            theme: "auto",
            callback: (token) => onVerifyRef.current(token),
            "expired-callback": () => onExpireRef.current?.(),
            "error-callback": () => onExpireRef.current?.(),
          });
        })
        .catch(() => {
          /* Script blocked/unreachable — backend fails open, so do nothing. */
        });

      return () => {
        cancelled = true;
        if (window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* widget already gone */
          }
          widgetIdRef.current = null;
        }
      };
      // action is static per form; intentionally render the widget once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!TURNSTILE_ENABLED) return null;

    return <div ref={containerRef} className={className} />;
  }
);
