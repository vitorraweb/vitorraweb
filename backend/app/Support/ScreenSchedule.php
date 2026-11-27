<?php

namespace App\Support;

/**
 * When one item of the screens' running order may show, set in the Screen
 * editor: optional first and last day, and optional daily hours, all by
 * Kampala's clock. The same four fields on Vitorra's own videos and designs
 * (columns on screen_media) and on the built-in scenes (display_programme →
 * schedule). The screens apply it themselves, to the minute
 * (frontend display/schedule.ts), so a morning-only item leaves at 10:00 even
 * between two reads of GET /display.
 *
 * This is house content only: paid adverts keep their own clock and units.
 */
class ScreenSchedule
{
    public const FIELDS = ['starts_on', 'ends_on', 'daily_from', 'daily_until'];

    /** 00:00 to 23:59. */
    public const TIME = '/^([01]\d|2[0-3]):[0-5]\d$/';

    /** Validation rules for the four fields, under `$prefix` ("" for top level, "schedule.*." for a map). */
    public static function rules(string $prefix = ''): array
    {
        return [
            "{$prefix}starts_on"   => ['nullable', 'date_format:Y-m-d'],
            "{$prefix}ends_on"     => ['nullable', 'date_format:Y-m-d', "after_or_equal:{$prefix}starts_on"],
            "{$prefix}daily_from"  => ['nullable', 'string', 'regex:'.self::TIME],
            // The same time twice would be a window of nothing (or of everything): refuse it.
            "{$prefix}daily_until" => ['nullable', 'string', 'regex:'.self::TIME, "different:{$prefix}daily_from"],
        ];
    }

    /** The four fields with blanks as null; null when nothing is set. */
    public static function clean(array $s): ?array
    {
        $out = [];
        foreach (self::FIELDS as $f) {
            $v = isset($s[$f]) ? trim((string) $s[$f]) : '';
            $out[$f] = $v === '' ? null : $v;
        }

        return array_filter($out) ? $out : null;
    }

    /** Within its first and last day today, by Kampala's calendar. Daily hours are left to the screen. */
    public static function inDates(?string $startsOn, ?string $endsOn, ?\DateTimeInterface $at = null): bool
    {
        $today = \Illuminate\Support\Carbon::instance(\DateTime::createFromInterface($at ?? now()))->setTimezone('Africa/Kampala')->toDateString();

        return (! $startsOn || substr($startsOn, 0, 10) <= $today) && (! $endsOn || substr($endsOn, 0, 10) >= $today);
    }
}
