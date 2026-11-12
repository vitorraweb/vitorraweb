<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A video or 1080 design of Vitorra's own, added to the screens from the console. */
class ScreenMedia extends Model
{
    public const SCREENS = ['street', 'reception', 'projector'];

    /** Which business an upload belongs to: its tag and colour on screen, as the built-in scenes. */
    public const BUSINESSES = ['fet', 'seal', 'coffee', 'logistics', 'vitorra'];

    protected $table = 'screen_media';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['screens' => 'array', 'captions' => 'array', 'starts_on' => 'date', 'ends_on' => 'date', 'optimised' => 'boolean'];
    }

    /** In its dates today, by Kampala's calendar. */
    public function isLive(): bool
    {
        $today = now('Africa/Kampala')->toDateString();

        return (! $this->starts_on || $this->starts_on->toDateString() <= $today)
            && (! $this->ends_on || $this->ends_on->toDateString() >= $today);
    }

    /** Most further headlines on one item: one every few seconds is already busy. */
    public const MAX_CAPTIONS = 5;

    /** Further headlines in the order they are listed, each inside the item's
     *  own length. A set with no words is dropped. One without a second comes
     *  an even gap after the one before; none starts before the one above it. */
    public function captionsFor(): array
    {
        $sets = array_values(array_filter(
            array_map(fn ($c) => [
                'line1' => trim((string) ($c['line1'] ?? '')) ?: null,
                'line2' => trim((string) ($c['line2'] ?? '')) ?: null,
                'small' => trim((string) ($c['small'] ?? '')) ?: null,
                'at'    => isset($c['at']) && is_numeric($c['at']) ? (int) $c['at'] : null,
            ], is_array($this->captions) ? $this->captions : []),
            fn ($c) => $c['line1'] || $c['line2'] || $c['small'],
        ));
        $gap = max(1, (int) round($this->seconds / (count($sets) + 1)));
        $last = $this->seconds - 1;
        $prev = 0;
        $out = [];
        foreach ($sets as $c) {
            $at = max($prev + 1, $c['at'] ?? $prev + $gap);
            if ($at > $last) {
                break; // no room left in the video
            }
            $out[] = ['at' => $at] + $c;
            $prev = $at;
        }

        return $out;
    }

    public function forScreen(): array
    {
        return [
            'id' => "media-{$this->id}", 'kind' => $this->kind, 'url' => $this->url, 'seconds' => $this->seconds,
            'line1' => $this->line1, 'line2' => $this->line2, 'small' => $this->small, 'business' => $this->business,
            'captions' => $this->captionsFor(), 'screens' => $this->screens,
        ];
    }
}
