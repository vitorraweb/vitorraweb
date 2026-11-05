<?php

namespace App\Support;

/**
 * Money written out in words, as on a receipt or voucher:
 * "Uganda Shillings One Million Five Hundred Thousand Only",
 * "US Dollars One Hundred Twenty and Fifty Cents Only".
 * Amounts are in the system's units: whole shillings for UGX, cents for USD and EUR.
 * Written out here rather than with PHP's intl extension, which a shared host may lack.
 */
class AmountInWords
{
    private const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    private const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    private const SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    private const CURRENCIES = [
        'UGX' => ['Uganda Shillings', null],
        'USD' => ['US Dollars', 'Cents'],
        'EUR' => ['Euros', 'Cents'],
    ];

    public static function format(int $amount, string $currency = 'UGX'): string
    {
        [$name, $minorName] = self::CURRENCIES[$currency] ?? [$currency, 'Cents'];
        $amount = abs($amount);

        if ($minorName === null) {
            return trim($name.' '.self::words($amount)).' Only';
        }

        $major = intdiv($amount, 100);
        $minor = $amount % 100;
        $text = $name.' '.self::words($major);
        if ($minor > 0) {
            $text .= ' and '.self::words($minor).' '.$minorName;
        }

        return trim($text).' Only';
    }

    /** 0 → "Zero", 1500000 → "One Million Five Hundred Thousand". */
    public static function words(int $n): string
    {
        if ($n === 0) {
            return 'Zero';
        }
        $parts = [];
        $scale = 0;
        while ($n > 0 && $scale < count(self::SCALES)) {
            $chunk = $n % 1000;
            if ($chunk > 0) {
                array_unshift($parts, trim(self::hundreds($chunk).' '.self::SCALES[$scale]));
            }
            $n = intdiv($n, 1000);
            $scale++;
        }

        return implode(' ', $parts);
    }

    private static function hundreds(int $n): string
    {
        $out = [];
        if ($n >= 100) {
            $out[] = self::ONES[intdiv($n, 100)].' Hundred';
            $n %= 100;
        }
        if ($n >= 20) {
            $out[] = trim(self::TENS[intdiv($n, 10)].' '.self::ONES[$n % 10]);
        } elseif ($n > 0) {
            $out[] = self::ONES[$n];
        }

        return implode(' ', $out);
    }
}
