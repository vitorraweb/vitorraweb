<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Leave taken before the system (agreed on paper) is entered by Operations so
 * balances are right. `recorded_by` marks those entries and who made them;
 * null means the employee applied in the system and it went through the two
 * signatures.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->foreignId('recorded_by')->nullable()->after('reviewed_by')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recorded_by');
        });
    }
};
