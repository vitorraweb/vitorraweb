<?php

namespace App\Support;

/**
 * Best-effort trim of the quoted history most mail clients append below a
 * reply ("On ... wrote:", Outlook's "From:/Sent:/To:/Subject:" block, or
 * leading ">" quote lines). Not perfect — if nothing matches, the original
 * text is returned untouched rather than risk losing content.
 */
class EmailQuoteStripper
{
    private const MARKERS = [
        '/^\s*On .{0,120} wrote:\s*$/mi',
        '/^-{2,}\s*Original Message\s*-{2,}\s*$/mi',
        '/^From:\s.+$/mi',
        '/^Sent from my /mi',
    ];

    public static function strip(string $text): string
    {
        $cut = mb_strlen($text);

        foreach (self::MARKERS as $pattern) {
            if (preg_match($pattern, $text, $match, PREG_OFFSET_CAPTURE)) {
                $cut = min($cut, $match[0][1]);
            }
        }

        $trimmed = trim(mb_substr($text, 0, $cut));

        // Also drop a trailing run of "> " quoted lines the markers above missed.
        $lines = preg_split('/\R/', $trimmed);
        while (! empty($lines) && str_starts_with(ltrim(end($lines)), '>')) {
            array_pop($lines);
        }
        $trimmed = trim(implode("\n", $lines));

        return $trimmed !== '' ? $trimmed : trim($text);
    }
}
