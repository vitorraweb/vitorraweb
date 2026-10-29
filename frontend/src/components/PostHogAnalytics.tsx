"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { COOKIE_CONSENT_EVENT, type CookieConsent } from "@/lib/cookies";
import { applyPostHogConsent, followRoute, startPostHog } from "@/lib/posthog";

/** Starts PostHog on public pages and keeps it in step with the cookie choice (lib/posthog.ts). */
export function PostHogAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    startPostHog().then(followRoute);
  }, [pathname]);

  useEffect(() => {
    const onConsent = (e: Event) => applyPostHogConsent((e as CustomEvent<CookieConsent>).detail === "accepted");
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, []);

  return null;
}
