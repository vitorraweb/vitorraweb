<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The money ledger. Junior finance records (draft); senior finance approves.
     * Only `approved` rows affect account balances and the P&L. Amounts are in
     * the account's own currency unit (UGX shillings / USD-EUR cents).
     */
    public function up(): void
    {
        Schema::create('finance_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('type');                       // income | expense | transfer
            $table->foreignId('finance_account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transfer_to_account_id')->nullable()->constrained('finance_accounts')->nullOnDelete();
            $table->foreignId('finance_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sector')->nullable();         // FET | SEAL | COFFEE | LOGISTICS | GENERAL
            $table->string('currency', 3);
            $table->bigInteger('amount');                 // positive; direction implied by type
            $table->date('occurred_on');
            $table->string('description')->nullable();
            $table->string('reference')->nullable();
            $table->string('status')->default('draft');   // draft | approved | void
            $table->string('source')->default('manual');  // manual | bill
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('receipt_path')->nullable();   // private disk
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'occurred_on']);
            $table->index(['finance_account_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_transactions');
    }
};
