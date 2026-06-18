<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** One scheduled part-payment. `paid_at` is set when the money is received. */
    public function up(): void
    {
        Schema::create('installment_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installment_plan_id')->constrained()->cascadeOnDelete();
            $table->string('label')->nullable();        // e.g. "Deposit", "Instalment 2"
            $table->unsignedBigInteger('amount');       // order currency unit
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('method')->nullable();        // cash | bank | mobile_money | other
            $table->string('reference')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_payments');
    }
};
