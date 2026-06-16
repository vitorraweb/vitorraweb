<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow staff to correct a customer's display name, phone, company, and
     * country without touching the original enquiry / order / message records.
     * These override fields take priority in the aggregate() resolver.
     */
    public function up(): void
    {
        Schema::table('customer_notes', function (Blueprint $table) {
            $table->string('override_name')->nullable()->after('note');
            $table->string('override_phone')->nullable()->after('override_name');
            $table->string('override_company')->nullable()->after('override_phone');
            $table->string('override_country')->nullable()->after('override_company');
        });
    }

    public function down(): void
    {
        Schema::table('customer_notes', function (Blueprint $table) {
            $table->dropColumn(['override_name', 'override_phone', 'override_company', 'override_country']);
        });
    }
};
