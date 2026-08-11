<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * How a trial ended, and what it was worth.
     *
     * A trial is a sales motion, so it has to close somewhere. Recording the
     * outcome against the trial keeps the evidence and the decision in one
     * place: six months on, "why did Hariss say no?" has an answer sitting
     * beside the figures they were shown.
     */
    public function up(): void
    {
        Schema::table('fet_trials', function (Blueprint $table) {
            $table->date('decided_on')->nullable()->after('status');
            $table->text('outcome_note')->nullable()->after('decided_on');
            $table->unsignedInteger('units_sold')->nullable()->after('outcome_note');
            $table->decimal('deal_value', 14, 2)->nullable()->after('units_sold'); // in the trial's currency
        });
    }

    public function down(): void
    {
        Schema::table('fet_trials', function (Blueprint $table) {
            $table->dropColumn(['decided_on', 'outcome_note', 'units_sold', 'deal_value']);
        });
    }
};
