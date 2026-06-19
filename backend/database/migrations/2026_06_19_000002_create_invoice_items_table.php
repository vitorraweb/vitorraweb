<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->bigInteger('unit_price');             // currency unit
            $table->unsignedSmallInteger('vat_rate')->default(0); // percent
            $table->bigInteger('line_subtotal')->default(0);     // qty * unit_price
            $table->bigInteger('vat_amount')->default(0);
            $table->bigInteger('line_total')->default(0);        // subtotal + vat
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
