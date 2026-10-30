<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Spotlights: short, dated messages Marketing puts at the top of the homepage
 * and the FET page ("This month", an assessment drive, a new article), so the
 * site always carries something current without a code change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spotlights', function (Blueprint $table) {
            $table->id();
            $table->string('eyebrow', 60)->nullable();   // "This month", "New", "Fleet season"
            $table->string('title', 140);
            $table->string('body', 280)->nullable();
            $table->string('title_sw', 140)->nullable();
            $table->string('body_sw', 280)->nullable();
            $table->string('cta_label', 40)->nullable();
            $table->string('cta_label_sw', 40)->nullable();
            $table->string('cta_url', 500)->nullable();
            $table->json('pages');                         // ["home","fet"]
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('priority')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'starts_on', 'ends_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spotlights');
    }
};
