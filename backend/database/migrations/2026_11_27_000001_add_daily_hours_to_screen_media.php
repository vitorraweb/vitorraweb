<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Optional daily hours for one of Vitorra's own videos or designs, by
        // Kampala's clock, as "HH:MM": shown only from `daily_from` until
        // `daily_until` each day (a window may run past midnight, 20:00 to 02:00).
        // Either may be blank: from a time to the end of the day, or until one.
        Schema::table('screen_media', function (Blueprint $t) {
            $t->string('daily_from', 5)->nullable()->after('ends_on');
            $t->string('daily_until', 5)->nullable()->after('daily_from');
        });
    }

    public function down(): void
    {
        Schema::table('screen_media', fn (Blueprint $t) => $t->dropColumn(['daily_from', 'daily_until']));
    }
};
