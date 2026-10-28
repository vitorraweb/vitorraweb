<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Where Display ads showed, and what Performance Max matched
|--------------------------------------------------------------------------
| Vitorra's campaigns are Display and Performance Max, neither of which
| fills the ordinary search-terms report. Two reports answer the same
| question for them:
|
|   placement      group_placement_view — the sites, apps and YouTube
|                  channels a Display ad appeared on, with cost and clicks.
|   search_theme   campaign_search_term_insight — the grouped search
|                  categories a Performance Max campaign matched.
|
| Neither is reliably available per day, so each row is a snapshot over a
| rolling window (window_from → window_to) that the sync replaces whole.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_ads_insights', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 20);                  // placement | search_theme
            $table->string('campaign_id', 20)->nullable();
            $table->string('label', 255);                // placement name / search category
            $table->string('detail', 255)->nullable();   // placement type
            $table->string('url', 500)->nullable();      // placement target
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('cost_micros')->nullable(); // not reported for search themes
            $table->decimal('conversions', 12, 2)->default(0);
            $table->date('window_from');
            $table->date('window_to');
            $table->timestamps();

            $table->index(['kind', 'cost_micros']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_ads_insights');
    }
};
