<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Order header. Line items live in `order_items` (one order, many items).
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();              // e.g. VIT-7Q3K8M2A
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Customer contact (guest checkout supported — user_id may be null)
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();

            // Money. Totals are stored in the order currency's smallest practical
            // unit: UGX as whole shillings, USD as cents — matching the admin UI.
            $table->string('currency', 3)->default('UGX');      // UGX | USD
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('total');

            $table->string('status')->default('pending');       // pending | processing | shipped | delivered | complete | cancelled
            $table->string('payment_method')->nullable();       // flutterwave | paypal | stripe | manual
            $table->string('payment_status')->default('pending'); // pending | partial | paid
            $table->string('payment_reference')->nullable();

            $table->json('shipping_address');
            $table->string('tracking_number')->nullable();
            $table->text('notes')->nullable();
            $table->string('invoice_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
