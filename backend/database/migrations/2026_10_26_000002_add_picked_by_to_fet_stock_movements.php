<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Finance wants to know who physically collected devices from stock — the
 * person who signs for them, not the person who typed the entry.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fet_stock_movements', function (Blueprint $table) {
            $table->string('picked_by')->nullable()->after('reference');
        });
    }

    public function down(): void
    {
        Schema::table('fet_stock_movements', function (Blueprint $table) {
            $table->dropColumn('picked_by');
        });
    }
};
