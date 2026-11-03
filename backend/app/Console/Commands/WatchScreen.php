<?php

namespace App\Console\Commands;

use App\Mail\ScreenAdNotice;
use App\Models\ScreenDowntime;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Opens a downtime entry when the street screen stops checking in during
 * on-air hours, and tells Operations once if it stays down. The screen closes
 * the entry itself when it comes back.
 */
class WatchScreen extends Command
{
    protected $signature = 'screen:watch';

    protected $description = 'Log street-screen downtime and alert Operations';

    public function handle(): int
    {
        $last = Setting::get('display_last_seen');
        if (! $last) return self::SUCCESS; // No screen connected yet.

        $now = now('Africa/Kampala');
        $onAir = $now->hour >= config('screen_ads.on_air.from') && $now->hour < config('screen_ads.on_air.to');
        $seen = Carbon::parse($last);
        $open = ScreenDowntime::whereNull('ended_at')->latest('started_at')->first();

        if ($onAir && ! $open && $seen->lt(now()->subMinutes((int) config('screen_ads.downtime_after_minutes')))) {
            $open = ScreenDowntime::create(['started_at' => $seen, 'source' => 'automatic']);
        }

        if ($open && ! $open->alerted && $open->started_at->lt(now()->subMinutes(15))) {
            $open->update(['alerted' => true]);
            try {
                Mail::to(config('mail.team_address'))->send(new ScreenAdNotice('The street screen is down', [
                    'The street screen has not checked in since '.$open->started_at->setTimezone('Africa/Kampala')->format('g:ia').' (Kampala time).',
                    'Paid adverts are not playing. Please check the power, the internet connection and the player.',
                ]));
            } catch (\Throwable $e) {
                Log::warning('Screen-down alert failed', ['error' => $e->getMessage()]);
            }
        }

        return self::SUCCESS;
    }
}
