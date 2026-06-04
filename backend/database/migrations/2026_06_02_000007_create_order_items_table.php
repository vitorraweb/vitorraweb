<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // Keep the line even if the product is later removed from the catalogue.
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();

            // Snapshot of the product at purchase time (name/slug can change later).
            $table->string('product_name');
            $table->string('product_slug');
            // Variant choices that don't affect price, e.g. {"grind":"Whole bean","weight":"250g"}.
            $table->json('options')->nullable();

            $table->unsignedSmallInteger('quantity')->default(1);
            // Unit prices captured in both currencies (mirrors products table).
            $table->unsignedBigInteger('unit_price_ugx');
            $table->unsignedInteger('unit_price_usd_cents');
            // Line total in the order's currency unit (UGX shillings / USD cents).
            $table->unsignedBigInteger('line_total');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
