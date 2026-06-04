<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sales prospect / lead database (FET outreach to start). Sourced from the
     * marketing team's industry-segmented lists; worked through the admin panel.
     */
    public function up(): void
    {
        Schema::create('prospects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->index();          // industry vertical (CARGO, SCHOOL, …)
            $table->string('product')->default('FET');     // which product this list targets
            $table->string('location')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            // outreach pipeline: not_contacted | contacted | delivered | bounced
            //                    | responded | qualified | converted | not_interested
            $table->string('outreach_status')->default('not_contacted')->index();
            $table->text('feedback')->nullable();
            $table->string('follow_up')->nullable();
            $table->string('assigned_to')->nullable();
            $table->json('flags')->nullable();             // data-hygiene flags: bad_email, no_contact
            $table->string('source')->nullable();          // e.g. "marketing import 2026-06"
            $table->timestamps();

            // Natural key — keeps re-imports idempotent and blocks obvious duplicates.
            $table->unique(['name', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospects');
    }
};
