"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { COOKIE_SETTINGS_EVENT, readConsent, writeConsent, type CookieConsent } from "@/lib/cookies";

export function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  /* The choice already on record, so a returning visitor sees what they picked
     rather than a banner that looks like a first-time prompt. */
  const [current, setCurrent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const choice = readConsent();
    setCurrent(choice);
    if (!choice) setVisible(true);

    /* "Cookie settings" in the footer reopens this — the policy promises the
       preference can be changed at any time. */
    const reopen = () => {
      setCurrent(readConsent());
      setVisible(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  // Unattended reception kiosk — nobody is present to dismiss a consent banner.
  if (pathname?.startsWith("/display")) return null;

  const choose = (value: CookieConsent) => {
    writeConsent(value);
    setCurrent(value);
    setVisible(false);
  };
  const accept = () => choose("accepted");
  const decline = () => choose("declined");

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("ariaLabel")}
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 rounded-2xl p-4 md:p-5"
      style={{ backgroundColor: "#1E1E1E", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          {t("message")}{" "}
          <Link href="/legal/cookie-policy" className="underline hover:opacity-70 transition-opacity" style={{ color: "#C5B27A" }}>
            {t("policyLink")}
          </Link>
        </p>
        <button
          onClick={() => (current ? setVisible(false) : decline())}
          aria-label={t("dismiss")}
          className="shrink-0 hover:opacity-60 transition-opacity"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {current && (
        <p className="text-[11.5px] mb-2.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          {t(current === "accepted" ? "currentAccepted" : "currentDeclined")}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={decline} className="btn-ghost-dark text-xs px-4 py-2" style={{ borderRadius: "12px" }}>
          {t("decline")}
        </button>
        <button onClick={accept} className="btn-primary text-xs px-4 py-2 flex-1" style={{ borderRadius: "12px", justifyContent: "center" }}>
          {t("acceptAll")}
        </button>
      </div>
    </div>
  );
}
