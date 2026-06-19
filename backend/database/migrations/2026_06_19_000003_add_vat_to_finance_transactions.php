<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Input VAT carried within an expense (or output VAT on income), for the VAT report. */
    public function up(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->unsignedSmallInteger('vat_rate')->default(0)->after('amount');
            $table->bigInteger('vat_amount')->default(0)->after('vat_rate');
        });
    }

    public function down(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->dropColumn(['vat_rate', 'vat_amount']);
        });
    }
};
