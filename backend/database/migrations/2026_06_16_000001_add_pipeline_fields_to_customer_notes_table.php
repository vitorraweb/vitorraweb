<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Unified pipeline: each contact (keyed by email, same as customer_notes)
     * can be assigned an owner and have its auto-derived pipeline stage
     * overridden manually.
     */
    public function up(): void
    {
        Schema::table('customer_notes', function (Blueprint $table) {
            $table->foreignId('owner_id')->nullable()->after('email')->constrained('users')->nullOnDelete();
            $table->string('pipeline_stage')->nullable()->after('owner_id'); // null = auto-derived
        });
    }

    public function down(): void
    {
        Schema::table('customer_notes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_id');
            $table->dropColumn('pipeline_stage');
        });
    }
};
