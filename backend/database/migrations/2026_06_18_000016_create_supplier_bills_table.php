<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Payables — money the business owes a supplier/vendor, with a due date. */
    public function up(): void
    {
        Schema::create('supplier_bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('vendor_name')->nullable();    // when not a registered supplier
            $table->foreignId('finance_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sector')->nullable();
            $table->string('currency', 3);
            $table->bigInteger('amount');
            $table->date('due_date')->nullable();
            $table->string('status')->default('unpaid');  // unpaid | paid | void
            $table->string('description')->nullable();
            $table->string('reference')->nullable();
            $table->foreignId('paid_transaction_id')->nullable()->constrained('finance_transactions')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_bills');
    }
};
