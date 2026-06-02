<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_price_ugx');
            $table->unsignedInteger('unit_price_usd_cents');
            $table->string('currency', 3)->default('UGX'); // UGX | USD
            $table->unsignedBigInteger('total');            // in chosen currency
            $table->string('status')->default('pending');   // pending | processing | shipped | delivered | complete | cancelled
            $table->string('payment_method')->nullable();   // flutterwave | paypal | eft
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
