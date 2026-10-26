<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Finance's FET stock overview: every device that arrives, leaves or is
 * corrected after a count is one row, so any week's opening and closing stock
 * per model can be rebuilt from the movements rather than typed in by hand.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fet_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('model', 8);             // FI | FII | FIII | FIV
            $table->string('type', 16);             // received | sold | returned | adjustment
            $table->integer('quantity');            // signed: + into stock, − out of stock
            $table->date('moved_on');
            $table->string('reference')->nullable(); // delivery note, invoice number, customer
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['model', 'moved_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fet_stock_movements');
    }
};
