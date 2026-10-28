<?php

namespace App\Services\Marketing;

use App\Models\ProspectCampaignRecipient;
use Illuminate\Support\Str;

/**
 * Turns a designed campaign into one recipient's copy: personalised, every
 * link routed through a signed click redirect, an open pixel, and their own
 * unsubscribe link.
 *
 * Click links carry an HMAC of (token, url), so the redirect can never be
 * used to send someone to an address we did not write into the email.
 *
 * Honest limits, shown on the report: opens are indicative (Apple Mail
 * pre-loads images; some clients block them), and mail scanners click links
 * seconds after delivery — those clicks are flagged and left out of scores.
 */
class CampaignTracking
{
    public static function newToken(): string
    {
        return Str::random(32);
    }

    public static function personalise(string $text, string $name): string
    {
        return str_replace(['{name}', '{company}'], e($name), $text);
    }

    /** One recipient's HTML: personalised, links tracked, pixel and unsubscribe in place. */
    public static function forRecipient(string $html, ProspectCampaignRecipient $r): string
    {
        $html = self::personalise($html, $r->name ?: 'there');
        $html = str_replace(EmailDesigner::UNSUBSCRIBE_PLACEHOLDER, e(self::unsubscribeUrl($r->token)), $html);

        $html = preg_replace_callback('/<a\s([^>]*?)href="([^"]+)"/i', function ($m) use ($r) {
            $url = html_entity_decode($m[2]);
            // Leave phone/mail links and our own unsubscribe link alone.
            if (! preg_match('#^https?://#i', $url) || str_contains($url, '/t/u/')) {
                return $m[0];
            }

            return '<a '.$m[1].'href="'.e(self::clickUrl($r->token, $url)).'"';
        }, $html);

        $pixel = '<img src="'.e(self::base()."/t/o/{$r->token}.gif").'" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">';

        return str_contains($html, '</body>') ? str_replace('</body>', $pixel.'</body>', $html) : $html.$pixel;
    }

    public static function clickUrl(string $token, string $url): string
    {
        return self::base()."/t/c/{$token}?u=".rtrim(strtr(base64_encode($url), '+/', '-_'), '=').'&s='.self::sign($token, $url);
    }

    public static function unsubscribeUrl(string $token): string
    {
        return self::base()."/t/u/{$token}";
    }

    /** The target of a signed click link, or null if it was tampered with. */
    public static function verifiedTarget(string $token, string $u, string $sig): ?string
    {
        $url = base64_decode(strtr($u, '-_', '+/'), true);
        if ($url === false || ! preg_match('#^https?://#i', $url)) {
            return null;
        }

        return hash_equals(self::sign($token, $url), $sig) ? $url : null;
    }

    /** Scanner heuristic: a known security agent, or a "click" within 20s of delivery. */
    public static function looksLikeBot(?string $userAgent, ProspectCampaignRecipient $r): bool
    {
        if ($userAgent && preg_match('/bot|crawl|spider|preview|scan|safelinks|proofpoint|mimecast|barracuda|urldefense|python|curl|wget/i', $userAgent)) {
            return true;
        }

        return $r->sent_at && $r->sent_at->diffInSeconds(now()) < 20;
    }

    private static function sign(string $token, string $url): string
    {
        return substr(hash_hmac('sha256', $token.'|'.$url, (string) config('app.key')), 0, 24);
    }

    /** Public API base the inbox can reach (through the site's /api proxy). */
    private static function base(): string
    {
        return EmailDesigner::siteUrl('/api');
    }
}
