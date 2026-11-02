<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screen_ad_bookings', function (Blueprint $t) {
            $t->id();
            $t->string('reference')->unique();
            $t->string('access_token_hash', 64)->unique();
            $t->string('status')->default('awaiting_payment')->index();

            $t->string('company');
            $t->string('contact_name');
            $t->string('email');
            $t->string('phone')->nullable();
            $t->text('notes')->nullable();

            // The package as sold, so a later price change never rewrites a booking.
            $t->string('package');
            $t->unsignedBigInteger('price_ugx');
            $t->unsignedSmallInteger('plays_per_hour');
            $t->date('start_date');
            $t->date('end_date');

            $t->string('video_url', 500);
            $t->decimal('video_seconds', 6, 2);
            $t->unsignedInteger('video_width')->nullable();
            $t->unsignedInteger('video_height')->nullable();
            $t->unsignedBigInteger('video_size')->nullable();

            $t->string('proof_path')->nullable();
            $t->string('proof_name')->nullable();
            $t->timestamp('proof_at')->nullable();

            $t->foreignId('payment_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('payment_confirmed_at')->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('reviewed_at')->nullable();
            $t->text('review_note')->nullable();
            $t->foreignId('refunded_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('refunded_at')->nullable();

            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screen_ad_bookings');
    }
};
