<?php

namespace App\Support;

/**
 * Turns the plain text typed into the campaign composer into email-safe HTML.
 *
 * The old template dropped the whole message into one <p> and relied on CSS
 * `white-space: pre-line` to keep the line breaks. Outlook ignores that rule,
 * so a carefully paragraphed message arrived as one run-on block. Here the
 * structure is real markup, styled inline, which every client renders:
 *
 *   - a blank line starts a new paragraph; a single line break is kept;
 *   - lines starting "- ", "* " or "• " become a bulleted list,
 *     "1. " / "1) " a numbered one;
 *   - **bold** is bold;
 *   - web addresses and email addresses become links.
 *
 * Everything typed is escaped first — nothing the writer types can inject markup.
 */
class EmailBody
{
    private const P  = 'margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#454545;';
    private const LI = 'margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#454545;';
    private const A  = 'color:#7A6020;text-decoration:underline;';

    public static function toHtml(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", trim($text));
        if ($text === '') {
            return '';
        }

        $html = [];
        foreach (preg_split('/\n\s*\n/', $text) as $block) {
            $lines = array_values(array_filter(explode("\n", $block), fn ($l) => trim($l) !== ''));
            if (! $lines) {
                continue;
            }

            if (self::allMatch($lines, '/^\s*[-*•]\s+/')) {
                $html[] = self::list('ul', $lines, '/^\s*[-*•]\s+/');
            } elseif (self::allMatch($lines, '/^\s*\d{1,2}[.)]\s+/')) {
                $html[] = self::list('ol', $lines, '/^\s*\d{1,2}[.)]\s+/');
            } else {
                $html[] = '<p style="'.self::P.'">'.implode('<br>', array_map(fn ($l) => self::inline(trim($l)), $lines)).'</p>';
            }
        }

        return implode("\n", $html);
    }

    /** Does the message already end with a sign-off ("Kind regards, …")? */
    public static function hasSignOff(string $text): bool
    {
        $tail = mb_strtolower(mb_substr(trim($text), -160));

        return (bool) preg_match('/\b(regards|sincerely|best wishes|warm wishes|cheers|thank you|thanks|yours (truly|faithfully))\b/u', $tail);
    }

    /** Does the message open with its own greeting ("Dear …", "Hello …")? */
    public static function hasGreeting(string $text): bool
    {
        return (bool) preg_match('/^\s*(hi|hello|dear|greetings|good\s+(morning|afternoon|evening|day))\b/i', $text);
    }

    private static function allMatch(array $lines, string $re): bool
    {
        foreach ($lines as $l) {
            if (! preg_match($re, $l)) {
                return false;
            }
        }

        return true;
    }

    private static function list(string $tag, array $lines, string $marker): string
    {
        $items = array_map(
            fn ($l) => '<li style="'.self::LI.'">'.self::inline(trim(preg_replace($marker, '', $l))).'</li>',
            $lines
        );

        return "<{$tag} style=\"margin:0 0 18px;padding-left:22px;\">".implode('', $items)."</{$tag}>";
    }

    private static function inline(string $line): string
    {
        $s = e($line);

        // **bold**
        $s = preg_replace('/\*\*(.+?)\*\*/u', '<strong style="color:#1E1E1E;">$1</strong>', $s);

        // Links: full URLs, bare www. addresses, and email addresses.
        $s = preg_replace_callback(
            '~\b((https?://|www\.)[^\s<]+[^\s<.,;:!?)\]\'"])|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})~u',
            function ($m) {
                if (! empty($m[3])) {
                    return '<a href="mailto:'.$m[3].'" style="'.self::A.'">'.$m[3].'</a>';
                }
                $href = str_starts_with($m[1], 'www.') ? 'https://'.$m[1] : $m[1];

                return '<a href="'.$href.'" style="'.self::A.'">'.$m[1].'</a>';
            },
            $s
        );

        return $s;
    }
}
