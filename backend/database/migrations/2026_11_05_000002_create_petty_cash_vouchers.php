<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Finance's petty cash vouchers: filled in the console, numbered, printed and signed.
        Schema::create('petty_cash_vouchers', function (Blueprint $t) {
            $t->id();
            $t->string('number', 30)->unique();
            $t->date('voucher_date');
            $t->string('paid_to', 120);
            $t->string('department', 60)->nullable();
            $t->string('currency', 3)->default('UGX');
            $t->json('items');                       // [{description, department, amount}]
            $t->unsignedBigInteger('total');
            $t->string('purpose', 500)->nullable();
            $t->string('prepared_by', 120)->nullable();
            $t->string('approved_by', 120)->nullable();
            $t->string('received_by', 120)->nullable();
            $t->string('status', 10)->default('issued'); // issued | void
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->index(['voucher_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_vouchers');
    }
};
