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

  /* Quiet Authority: one slim paper strip along the bottom edge, on every
     screen. It used to take about a fifth of a phone screen, and as a desktop
     card it sat on top of the page's main call to action. */
  return (
    <div
      role="dialog"
      aria-label={t("ariaLabel")}
      aria-live="polite"
      className="q-scope fixed z-50 inset-x-0 bottom-0 border-t border-line bg-paper shadow-[0_-8px_24px_rgba(30,30,30,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="q-container py-4 md:flex md:items-center md:gap-8">
        <div className="flex items-start justify-between gap-4 md:flex-1 md:items-center">
          <p className="t-small text-ink-soft">
            {t("message")}{" "}
            <Link href="/legal/cookie-policy" className="text-ink underline underline-offset-2 hover:text-gold-ink">
              {t("policyLink")}
            </Link>
          </p>
          <button
            onClick={() => (current ? setVisible(false) : decline())}
            aria-label={t("dismiss")}
            className="shrink-0 -mr-1 -mt-0.5 p-1 text-ink-muted hover:text-ink transition-colors"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {current && (
          <p className="t-small text-ink-muted mt-2">
            {t(current === "accepted" ? "currentAccepted" : "currentDeclined")}
          </p>
        )}
        <div className="mt-3.5 md:mt-0 flex gap-2 md:shrink-0 md:w-[280px]">
          <button onClick={decline} className="q-btn flex-1 min-h-10 border border-line-strong text-ink hover:border-ink">
            {t("decline")}
          </button>
          <button onClick={accept} className="q-btn flex-1 min-h-10 bg-ink text-paper hover:bg-black">
            {t("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
