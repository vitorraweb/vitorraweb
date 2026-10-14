<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A follow-up needs a date, not just a note. "Call back next week" written in
 * a free-text box is never surfaced again; a date can be filtered on, counted
 * on the launcher and set automatically when a quotation is emailed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->date('follow_up_on')->nullable()->index()->after('follow_up');
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropIndex(['follow_up_on']);
            $table->dropColumn('follow_up_on');
        });
    }
};
