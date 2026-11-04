<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Receipts can now be issued against an order confirmation (a deposit,
        // before any invoice exists). When the order is invoiced, its receipts
        // are linked to that invoice too, so what was paid carries across.
        Schema::table('payment_receipts', function (Blueprint $t) {
            $t->foreignId('invoice_id')->nullable()->change();
            $t->foreignId('quotation_id')->nullable()->after('invoice_id')->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payment_receipts', function (Blueprint $t) {
            $t->dropConstrainedForeignId('quotation_id');
        });
    }
};
