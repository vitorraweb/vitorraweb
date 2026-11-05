<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Uploaded screen content reads like the built-in scenes: it belongs to a
        // business (its tag and colour) and can have a small line under the
        // headline. `optimised` marks a video already made light for the street box.
        Schema::table('screen_media', function (Blueprint $t) {
            $t->string('business', 12)->nullable()->after('title');
            $t->string('small', 200)->nullable()->after('line2');
            $t->boolean('optimised')->default(false)->after('height');
        });
        Schema::table('screen_ad_bookings', function (Blueprint $t) {
            $t->boolean('video_optimised')->default(false)->after('video_url');
        });
    }

    public function down(): void
    {
        Schema::table('screen_media', fn (Blueprint $t) => $t->dropColumn(['business', 'small', 'optimised']));
        Schema::table('screen_ad_bookings', fn (Blueprint $t) => $t->dropColumn('video_optimised'));
    }
};
