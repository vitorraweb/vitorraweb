<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A video or 1080 design of Vitorra's own, added to the screens from the console. */
class ScreenMedia extends Model
{
    public const SCREENS = ['street', 'reception', 'projector'];

    protected $table = 'screen_media';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['screens' => 'array', 'starts_on' => 'date', 'ends_on' => 'date'];
    }

    /** In its dates today, by Kampala's calendar. */
    public function isLive(): bool
    {
        $today = now('Africa/Kampala')->toDateString();

        return (! $this->starts_on || $this->starts_on->toDateString() <= $today)
            && (! $this->ends_on || $this->ends_on->toDateString() >= $today);
    }

    public function forScreen(): array
    {
        return [
            'id' => "media-{$this->id}", 'kind' => $this->kind, 'url' => $this->url, 'seconds' => $this->seconds,
            'line1' => $this->line1, 'line2' => $this->line2, 'screens' => $this->screens,
        ];
    }
}
