<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Structured, quote-ready answers captured by the product-aware enquiry form.
     * Stored as JSON: an ordered list of { key, label, value } display pairs so the
     * team gets a complete brief without going back and forth with the customer.
     */
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->json('requirements')->nullable()->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropColumn('requirements');
        });
    }
};
