<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Newsletter sign-ups were the one lead form that forgot where the visitor came
| from: the enquiry, contact, Buyer's Pack and website-preview forms all record
| it (2026_09_01 migration). Same shape as there, so the same reports apply.
| Existing subscribers keep NULL, read as "unknown".
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('lead_source')->nullable()->index();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->json('attribution')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->dropIndex(['lead_source']);
            $table->dropColumn(['lead_source', 'utm_source', 'utm_medium', 'utm_campaign', 'attribution']);
        });
    }
};
