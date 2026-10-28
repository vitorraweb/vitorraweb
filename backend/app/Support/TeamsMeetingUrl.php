<?php

namespace App\Support;

/**
 * Is this a genuine Microsoft Teams meeting join link?
 *
 * Checked by parsing, never by "contains" or "starts with": the scheme must
 * be https, the host must be exactly one of Microsoft's Teams meeting hosts
 * (so teams.microsoft.com.evil.example, evilteams.microsoft.com and
 * https://teams.microsoft.com@evil.example all fail), no credentials or
 * non-standard port, and the path must be a meeting path.
 */
final class TeamsMeetingUrl
{
    /** host => allowed path prefixes */
    private const HOSTS = [
        'teams.microsoft.com'      => ['/l/meetup-join/', '/meet/'],
        'teams.cloud.microsoft'    => ['/l/meetup-join/', '/meet/'],
        'gov.teams.microsoft.us'   => ['/l/meetup-join/', '/meet/'],
        'dod.teams.microsoft.us'   => ['/l/meetup-join/', '/meet/'],
        'teams.live.com'           => ['/meet/', '/l/meetup-join/'],
    ];

    public static function isValid(?string $url): bool
    {
        if (! is_string($url) || $url === '' || strlen($url) > 2048 || preg_match('/[\s\x00-\x1F\\\\]/', $url)) {
            return false;
        }
        $p = parse_url($url);
        if ($p === false || strtolower($p['scheme'] ?? '') !== 'https' || isset($p['user']) || isset($p['pass'])) {
            return false;
        }
        if (isset($p['port']) && (int) $p['port'] !== 443) {
            return false;
        }
        $host = strtolower(rtrim($p['host'] ?? '', '.'));
        $path = $p['path'] ?? '';
        if (! isset(self::HOSTS[$host])) {
            return false;
        }
        foreach (self::HOSTS[$host] as $prefix) {
            if (str_starts_with($path, $prefix) && strlen($path) > strlen($prefix)) {
                return true;
            }
        }

        return false;
    }

    /** Validation rule closure for Laravel's validator. */
    public static function rule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) {
            if (! self::isValid(is_string($value) ? trim($value) : null)) {
                $fail('Paste the "Join the meeting" link from the Teams or Outlook invitation (https://teams.microsoft.com/…).');
            }
        };
    }
}
