<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The parts of the day a campaign plays in (morning, lunchtime, evening); null means all day.
        Schema::table('screen_ad_bookings', function (Blueprint $t) {
            $t->json('slots')->nullable()->after('units');
        });
    }

    public function down(): void
    {
        Schema::table('screen_ad_bookings', fn (Blueprint $t) => $t->dropColumn('slots'));
    }
};
