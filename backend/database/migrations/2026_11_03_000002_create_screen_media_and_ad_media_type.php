<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vitorra's own videos and 1080 designs, added from the console's Screen editor.
        Schema::create('screen_media', function (Blueprint $t) {
            $t->id();
            $t->string('kind');                       // video | image
            $t->string('url', 500);
            $t->string('title');                      // for staff
            $t->string('line1', 200)->nullable();     // optional caption on screen
            $t->string('line2', 200)->nullable();
            $t->unsignedSmallInteger('seconds');
            $t->json('screens');                      // street, reception, projector
            $t->date('starts_on')->nullable();
            $t->date('ends_on')->nullable();
            $t->unsignedInteger('width')->nullable();
            $t->unsignedInteger('height')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        // A customer's advert may be a 15-second video or a 1920 × 1080 design shown for 15 seconds.
        Schema::table('screen_ad_bookings', function (Blueprint $t) {
            $t->string('media_type')->default('video')->after('video_url');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screen_media');
        Schema::table('screen_ad_bookings', fn (Blueprint $t) => $t->dropColumn('media_type'));
    }
};
