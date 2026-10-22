<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catalogue prices (the FET list) already include VAT. With this set, line
 * prices are entered as the customer pays them and the VAT inside them is
 * split out, so the total lands exactly on the catalogue figure.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['quotations', 'invoices'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->boolean('tax_inclusive')->default(false)->after('tax_rate');
            });
        }
    }

    public function down(): void
    {
        foreach (['quotations', 'invoices'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->dropColumn('tax_inclusive');
            });
        }
    }
};
