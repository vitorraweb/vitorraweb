<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A data-quality finding against a trial or one of its trips.
     *
     * The point of the module is that questionable evidence is *surfaced*, not
     * silently dropped and not silently used. Every flag carries a plain-English
     * message and a suggested action so a marketer — not an engineer — can act
     * on it, and resolving one is recorded (who, when, how) so a later "why was
     * this trip excluded?" always has an answer.
     *
     * An unresolved `error` blocks a verdict outright. `warn` degrades
     * confidence. `info` is context.
     */
    public function up(): void
    {
        Schema::create('fet_trial_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fet_trial_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fet_trial_trip_id')->nullable()->constrained('fet_trial_trips')->cascadeOnDelete();

            $table->string('code');                       // trip_before_install, return_loaded, …
            $table->string('severity')->default('warn');  // info | warn | error
            $table->string('field')->nullable();          // which column it concerns, where it applies
            $table->text('message');                      // plain English, written for marketing
            $table->text('suggested_action')->nullable();
            $table->json('context')->nullable();          // the numbers behind it, for the UI

            // accepted | corrected | excluded — null while outstanding.
            $table->string('resolution')->nullable();
            $table->text('resolution_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            $table->index(['fet_trial_id', 'severity']);
            $table->index(['fet_trial_id', 'code']);
            // Re-running validation must refresh a finding, never duplicate it.
            $table->unique(['fet_trial_id', 'fet_trial_trip_id', 'code', 'field'], 'fet_trial_flags_unique_finding');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fet_trial_flags');
    }
};
