<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A quotation the customer has agreed to goes back to them as an order
 * confirmation: same record, same lines, printed under that title instead of
 * "Quotation" and without the validity / non-binding wording.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->string('heading', 30)->default('quotation')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn('heading');
        });
    }
};
