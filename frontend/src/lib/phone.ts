import { isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/* Phone helpers (libphonenumber-js). Defaults to Uganda for locally-typed
   numbers but accepts any valid international number. The backend validates +
   normalises too — this is for instant feedback on the form. */

const DEFAULT_COUNTRY: CountryCode = "UG";

/** Valid phone number? Blank counts as valid (pair with a separate required check). */
export function isValidPhone(value: string, country: CountryCode = DEFAULT_COUNTRY): boolean {
  const v = value.trim();
  if (!v) return true;
  try {
    return isValidPhoneNumber(v, country);
  } catch {
    return false;
  }
}

/** Normalise to E.164 (e.g. +256772123456); returns the input if it can't be parsed. */
export function toE164(value: string, country: CountryCode = DEFAULT_COUNTRY): string {
  const v = value.trim();
  if (!v) return v;
  try {
    const parsed = parsePhoneNumberFromString(v, country);
    return parsed?.isValid() ? parsed.number : v;
  } catch {
    return v;
  }
}
