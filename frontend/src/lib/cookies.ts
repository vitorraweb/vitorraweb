/** Set a browser cookie (client-side). Kept in a plain module so callers in
 *  components/hooks don't trip the react-hooks immutability rule on `document`. */
export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${value};path=/;max-age=${maxAgeSeconds};samesite=lax`;
}

/** Consent choice, stored under COOKIE_CONSENT_KEY. */
export type CookieConsent = "accepted" | "declined";

/** localStorage key holding the visitor's consent choice. */
export const COOKIE_CONSENT_KEY = "vitorra_cookie_consent";

/** Window event that reopens the consent banner, so a visitor can change their
 *  mind — the "Cookie settings" control the published cookie policy promises. */
export const COOKIE_SETTINGS_EVENT = "vitorra:cookie-settings";

/** The stored choice, or null when the visitor has not chosen yet (or storage
 *  is unavailable, e.g. private browsing). Never throws. */
export function readConsent(): CookieConsent | null {
  try {
    const v = localStorage.getItem(COOKIE_CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

/** Persist the visitor's choice. Never throws. */
export function writeConsent(value: CookieConsent): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* private browsing — the banner still closes for this session */
  }
}
