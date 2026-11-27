"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { COOKIE_CONSENT_EVENT, type CookieConsent } from "@/lib/cookies";
import { isTrackedPath } from "@/lib/google-ads";
import { META_PIXEL_ID, applyMetaConsent, metaPageView, startMetaPixel } from "@/lib/meta-pixel";

/**
 * The Meta Pixel, loaded only after the visitor accepts cookies and only on
 * public pages (see lib/meta-pixel.ts). Renders nothing; does nothing at all
 * while NEXT_PUBLIC_META_PIXEL_ID is unset.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const tracked = isTrackedPath(pathname);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!META_PIXEL_ID || !tracked) return;
    // The first page view is sent when the pixel starts; later ones on navigation.
    if (startMetaPixel()) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current !== null && lastPath.current !== pathname) metaPageView();
    lastPath.current = pathname;
  }, [pathname, tracked]);

  useEffect(() => {
    if (!META_PIXEL_ID || !tracked) return;
    const onConsent = (e: Event) => {
      const accepted = (e as CustomEvent<CookieConsent>).detail === "accepted";
      applyMetaConsent(accepted);
      if (accepted) lastPath.current = window.location.pathname;
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, [tracked]);

  return null;
}
