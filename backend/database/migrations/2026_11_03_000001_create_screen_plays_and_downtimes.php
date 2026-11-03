<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('screen_ad_bookings', function (Blueprint $t) {
            $t->unsignedTinyInteger('units')->default(1)->after('plays_per_hour');
        });

        // Evidence of delivery: one row each time a paid advert plays on the street screen.
        Schema::create('screen_plays', function (Blueprint $t) {
            $t->id();
            $t->foreignId('screen_ad_booking_id')->constrained()->cascadeOnDelete();
            $t->timestamp('played_at')->index();
            $t->decimal('seconds', 5, 1);
            $t->boolean('completed');
            $t->timestamps();
        });

        // When the street screen was off or offline during on-air hours.
        Schema::create('screen_downtimes', function (Blueprint $t) {
            $t->id();
            $t->timestamp('started_at')->index();
            $t->timestamp('ended_at')->nullable();
            $t->string('reason', 300)->nullable();
            $t->string('source')->default('automatic');
            $t->boolean('alerted')->default(false);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screen_downtimes');
        Schema::dropIfExists('screen_plays');
        Schema::table('screen_ad_bookings', fn (Blueprint $t) => $t->dropColumn('units'));
    }
};
