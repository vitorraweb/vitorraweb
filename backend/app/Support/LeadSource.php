<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Works out which channel a lead arrived from.
 *
 * The browser sends whatever it captured on the landing page (UTM tags, a
 * Google/Meta click id, the referring page). This turns that into one
 * normalised label — "google / cpc", "facebook / referral", "direct" — that
 * every report can group by, and keeps the raw evidence alongside it.
 *
 * ── Why a label and not just the raw fields ──────────────────────────────────
 * The question being answered is a business one: "we spend on Google Ads — what
 * did it produce?" That needs paid Google to read as one thing whether it
 * arrived tagged (`utm_source=google&utm_medium=cpc`) or untagged but with a
 * `gclid` on the URL, which is what happens when auto-tagging is on and the
 * final URL has no UTMs. Both collapse to "google / cpc" here.
 *
 * ── On honesty ───────────────────────────────────────────────────────────────
 * Nothing is guessed. If there are no tags, no click id and no referrer, the
 * answer is "direct" — which genuinely includes someone typing the address,
 * clicking a link in WhatsApp or a PDF, or any browser that withholds the
 * referrer. It does NOT mean "found us on their own", and no report should
 * imply that it does.
 */
final class LeadSource
{
    /** Hosts we recognise, mapped to "<source> / <medium>". */
    private const KNOWN_HOSTS = [
        'google'      => 'google / organic',
        'bing'        => 'bing / organic',
        'duckduckgo'  => 'duckduckgo / organic',
        'yahoo'       => 'yahoo / organic',
        'facebook'    => 'facebook / referral',
        'fb'          => 'facebook / referral',
        'instagram'   => 'instagram / referral',
        'linkedin'    => 'linkedin / referral',
        'lnkd'        => 'linkedin / referral',
        'twitter'     => 'x / referral',
        'x'           => 'x / referral',
        't'           => 'x / referral',          // t.co
        'whatsapp'    => 'whatsapp / referral',
        'wa'          => 'whatsapp / referral',   // wa.me
        'youtube'     => 'youtube / referral',
        'tiktok'      => 'tiktok / referral',
        'telegram'    => 'telegram / referral',
    ];

    /**
     * @param  array<string,mixed>  $in  The `attribution` block posted by the browser.
     * @return array{lead_source:string,utm_source:?string,utm_medium:?string,utm_campaign:?string,attribution:?array}
     */
    public static function resolve(array $in): array
    {
        $clean = fn (?string $v, int $max = 255): ?string => filled($v)
            ? Str::limit(trim(strip_tags((string) $v)), $max, '')
            : null;

        $utmSource   = $clean(self::str($in, 'utm_source'));
        $utmMedium   = $clean(self::str($in, 'utm_medium'));
        $utmCampaign = $clean(self::str($in, 'utm_campaign'));
        $gclid       = $clean(self::str($in, 'gclid'));
        // iOS replaces the gclid with gbraid/wbraid on app and web-to-app clicks.
        $gbraid      = $clean(self::str($in, 'gbraid'));
        $wbraid      = $clean(self::str($in, 'wbraid'));
        $fbclid      = $clean(self::str($in, 'fbclid'));
        $referrer    = $clean(self::str($in, 'referrer'), 2000);
        $landing     = $clean(self::str($in, 'landing_page'), 2000);

        $attribution = array_filter([
            'utm_term'      => $clean(self::str($in, 'utm_term')),
            'utm_content'   => $clean(self::str($in, 'utm_content')),
            'gclid'         => $gclid,
            'gbraid'        => $gbraid,
            'wbraid'        => $wbraid,
            'fbclid'        => $fbclid,
            'referrer'      => $referrer,
            'landing_page'  => $landing,
            'first_seen_at' => $clean(self::str($in, 'first_seen_at'), 40),
        ], fn ($v) => $v !== null && $v !== '');

        return [
            'lead_source' => self::label($utmSource, $utmMedium, $gclid ?? $gbraid ?? $wbraid, $fbclid, $referrer),
            'utm_source'  => $utmSource,
            'utm_medium'  => $utmMedium,
            'utm_campaign' => $utmCampaign,
            'attribution' => $attribution ?: null,
        ];
    }

    /** Collapse the evidence into one groupable channel label. */
    private static function label(
        ?string $utmSource,
        ?string $utmMedium,
        ?string $gclid,
        ?string $fbclid,
        ?string $referrer,
    ): string {
        // 1. Explicit tagging always wins — it is what marketing set deliberately.
        if ($utmSource !== null) {
            $medium = $utmMedium ?? ($gclid !== null ? 'cpc' : 'referral');

            return Str::lower("{$utmSource} / {$medium}");
        }

        // 2. Untagged but carrying an ad-platform click id. This is the common
        //    case with Google auto-tagging, and reads as paid traffic.
        if ($gclid !== null) {
            return 'google / cpc';
        }

        // fbclid rides organic Facebook clicks as well as paid ones, so it is
        // only evidence of Facebook — not of spend.
        if ($fbclid !== null) {
            return 'facebook / referral';
        }

        // 3. Fall back to who linked to us.
        if ($referrer !== null && ($host = parse_url($referrer, PHP_URL_HOST))) {
            $host = Str::lower(Str::after((string) $host, 'www.'));

            // Our own pages are not a source; the landing capture already holds
            // the real origin for this session.
            if (str_contains($host, 'vitorra.org')) {
                return 'direct';
            }

            foreach (self::KNOWN_HOSTS as $needle => $labelled) {
                // Match on a whole dot-separated part so "xyz.com" never reads
                // as x.com and "notgoogle.com" never reads as Google.
                if (in_array($needle, explode('.', $host), true)) {
                    return $labelled;
                }
            }

            return Str::limit($host, 60, '') . ' / referral';
        }

        return 'direct';
    }

    /* ── Channels ──────────────────────────────────────────────────────────────
       A label is precise ("facebook / paid", "ig / paid_social") but Marketing
       asks broader questions: "how many website enquiries came from our Meta
       ads?". A channel groups the labels that answer the same question. It is
       worked out from the stored label alone, so it applies to every lead
       already recorded, with no extra column to keep in step.

       Meta's ad links name the platform in several ways: "facebook" when the
       link is typed by hand (the launch plan's tracking links), or fb / ig /
       msg / an / threads when the ad uses the {{site_source_name}} parameter.
       All of them are Meta. They count as Meta ADS only when the medium says
       the click was paid for: an untagged fbclid or a Facebook referrer is
       Meta, but not evidence of spend. */

    public const CHANNELS = [
        'google_ads'     => 'Google Ads',
        'meta_ads'       => 'Meta ads (Facebook / Instagram)',
        'meta'           => 'Facebook / Instagram (unpaid)',
        'organic_search' => 'Search (unpaid)',
        'whatsapp'       => 'WhatsApp',
        'email'          => 'Email',
        'other_social'   => 'Other social',
        'referral'       => 'Other websites and campaigns',
        'direct'         => 'Direct',
        'unknown'        => 'Unknown (before tracking)',
    ];

    private const META_SOURCES = ['facebook', 'fb', 'instagram', 'ig', 'meta', 'messenger', 'msg', 'an', 'threads'];

    private const SEARCH_SOURCES = ['google', 'bing', 'duckduckgo', 'yahoo'];

    private const SOCIAL_SOURCES = ['linkedin', 'x', 'twitter', 'youtube', 'tiktok', 'telegram'];

    private const PAID_MEDIUMS = [
        'cpc', 'ppc', 'paid', 'paid_social', 'paidsocial', 'paid-social', 'social_paid', 'paid_search',
        'ads', 'ad', 'cpm', 'display', 'sponsored',
    ];

    /** The channel a stored lead_source label belongs to (a key of CHANNELS). */
    public static function channel(?string $label): string
    {
        if ($label === null || trim($label) === '' || $label === 'unknown') {
            return 'unknown';
        }
        if ($label === 'direct') {
            return 'direct';
        }

        [$source, $medium] = array_pad(array_map('trim', explode('/', Str::lower($label), 2)), 2, '');
        $paid = in_array($medium, self::PAID_MEDIUMS, true);

        if (in_array($source, self::META_SOURCES, true)) {
            return $paid ? 'meta_ads' : 'meta';
        }
        if (in_array($source, self::SEARCH_SOURCES, true)) {
            if ($paid) {
                return $source === 'google' ? 'google_ads' : 'referral';
            }

            return 'organic_search';
        }
        if (in_array($source, ['whatsapp', 'wa'], true)) {
            return 'whatsapp';
        }
        if (in_array($medium, ['email', 'newsletter', 'e-mail'], true) || in_array($source, ['email', 'newsletter'], true)) {
            return 'email';
        }
        if (in_array($source, self::SOCIAL_SOURCES, true)) {
            return 'other_social';
        }

        return 'referral';
    }

    /**
     * Which of the given stored labels belong to a channel, for a whereIn().
     * Labels are few (one per source/medium pair), so this stays cheap.
     *
     * @param  iterable<string|null>  $labels
     * @return array<int,string>
     */
    public static function labelsFor(string $channel, iterable $labels): array
    {
        $out = [];
        foreach ($labels as $l) {
            if ($l !== null && $l !== '' && self::channel($l) === $channel) {
                $out[] = $l;
            }
        }

        return $out;
    }

    private static function str(array $in, string $key): ?string
    {
        $v = $in[$key] ?? null;

        return is_string($v) ? $v : null;
    }
}
