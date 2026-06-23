<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Provider tracking id for installments paid online (parallel to orders/invoices). */
    public function up(): void
    {
        Schema::table('installment_payments', function (Blueprint $table) {
            $table->string('payment_reference')->nullable()->after('reference'); // provider tracking id
        });
    }

    public function down(): void
    {
        Schema::table('installment_payments', function (Blueprint $table) {
            $table->dropColumn('payment_reference');
        });
    }
};
