<?php

namespace App\Support;

use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberUtil;

/**
 * Phone-number helpers (libphonenumber). We default to Uganda for locally-typed
 * numbers (e.g. "0772 123456" or "+256…") but accept any valid international
 * number — important now that mobile-money payments and SMS depend on a correct,
 * normalised number.
 */
class Phone
{
    public const DEFAULT_REGION = 'UG';

    /** True if the value is a valid phone number (blank passes — use with `nullable`). */
    public static function isValid(?string $value, string $region = self::DEFAULT_REGION): bool
    {
        if (blank($value)) {
            return true;
        }

        try {
            $util = PhoneNumberUtil::getInstance();

            return $util->isValidNumber($util->parse($value, $region));
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Normalise to E.164 (e.g. "+256772123456"). Returns the original input
     * untouched if it can't be parsed/validated, so we never lose what the user
     * typed.
     */
    public static function e164(?string $value, string $region = self::DEFAULT_REGION): ?string
    {
        if (blank($value)) {
            return null;
        }

        try {
            $util = PhoneNumberUtil::getInstance();
            $proto = $util->parse($value, $region);

            return $util->isValidNumber($proto)
                ? $util->format($proto, PhoneNumberFormat::E164)
                : $value;
        } catch (\Throwable) {
            return $value;
        }
    }
}
