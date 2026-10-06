"use client";

import { useTranslations } from "next-intl";
import { COOKIE_SETTINGS_EVENT } from "@/lib/cookies";

/* ─── "Cookie settings" — the control the cookie policy promises ──────────────
   The published cookie policy tells visitors they can "update your preference
   at any time by clicking 'Cookie settings' in the footer". Until now no such
   control existed: once a visitor accepted or declined, the banner never came
   back and the stated preference could not be changed. That is a promise the
   policy makes on our behalf, so it has to be real.

   Reopens the consent banner via a window event, so the banner stays the single
   place consent is read and written.                                           */

export function CookieSettingsButton({ className, style }: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const t = useTranslations("cookieBanner");

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
      className={className}
      style={style}
    >
      {t("settings")}
    </button>
  );
}
