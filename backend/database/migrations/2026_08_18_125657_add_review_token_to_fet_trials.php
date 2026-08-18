<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A second, separate token for the INTERNAL review link — the full staff view
 * of a trial, shared outside staff sign-in (built for the CEO's review). Kept
 * apart from share_token so revoking one never disturbs the other, and so the
 * client link can never be widened by accident.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fet_trials', function (Blueprint $table) {
            $table->string('review_token', 64)->nullable()->unique()->after('share_includes_driver');
            $table->timestamp('review_expires_at')->nullable()->after('review_token');
        });
    }

    public function down(): void
    {
        Schema::table('fet_trials', function (Blueprint $table) {
            $table->dropColumn(['review_token', 'review_expires_at']);
        });
    }
};
