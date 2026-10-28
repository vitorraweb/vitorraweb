"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY, type CookieConsent } from "@/lib/cookies";
import { GOOGLE_ADS_ID, applyConsent, consentState, isTrackedPath, trackConversion } from "@/lib/google-ads";

/**
 * The Google Ads tag (gtag.js), with Consent Mode v2 — see lib/google-ads.ts.
 *
 * The bootstrap runs before gtag.js processes its queue, so the "denied"
 * default is in place before Google sees anything. A returning visitor who
 * already accepted is upgraded in the same script, before the first hit.
 *
 * Page views are sent by hand on each route change (config has
 * send_page_view off): the App Router changes pages without a reload, and
 * staff screens must never be reported as ad traffic.
 *
 * Calls and WhatsApp taps are the conversion most Ugandan buyers actually
 * make, so one listener reports any tel: or WhatsApp link, wherever it is.
 */
export function GoogleTag() {
  const pathname = usePathname();
  const tracked = isTrackedPath(pathname);
  // The bootstrap script reports the page it loads on; this hook reports the
  // ones after it. Without the flag the first page would race to count twice.
  const firstViewSent = useRef(false);

  useEffect(() => {
    const onConsent = (e: Event) => applyConsent((e as CustomEvent<CookieConsent>).detail === "accepted");
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!tracked) return;
    if (!firstViewSent.current) {
      firstViewSent.current = true;
      return;
    }
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("event", "page_view", { send_to: GOOGLE_ADS_ID, page_path: pathname, page_location: window.location.href });
  }, [pathname, tracked]);

  useEffect(() => {
    if (!tracked) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href") ?? "";
      if (/^tel:/i.test(href) || /(wa\.me|api\.whatsapp\.com|whatsapp:)/i.test(href)) {
        trackConversion("call");
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [tracked]);

  if (!GOOGLE_ADS_ID || !tracked) return null;

  const denied = JSON.stringify(consentState(false));
  const granted = JSON.stringify(consentState(true));

  return (
    <>
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', Object.assign(${denied}, { wait_for_update: 500 }));
          var accepted = false;
          try { accepted = localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_KEY)}) === 'accepted'; } catch (e) {}
          if (accepted) { gtag('consent', 'update', ${granted}); }
          gtag('set', 'ads_data_redaction', !accepted);
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(GOOGLE_ADS_ID)}, { send_page_view: false, allow_enhanced_conversions: true });
          gtag('event', 'page_view', { send_to: ${JSON.stringify(GOOGLE_ADS_ID)} });
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
    </>
  );
}
