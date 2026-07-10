<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Alongside the existing `assigned_to` display label (team name or
        // person's name, unchanged) — set only when assigned to a specific
        // person, so we have a real account to email + notify.
        Schema::table('enquiries', function (Blueprint $table) {
            $table->foreignId('assigned_user_id')->nullable()->after('assigned_to')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_user_id');
        });
    }
};
