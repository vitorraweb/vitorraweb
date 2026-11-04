<?php

use App\Models\FinanceTransaction;
use App\Services\Payments\PaymentReceipts;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // How the customer paid, captured when Finance records the payment and
        // printed on the receipt once it is approved.
        Schema::table('finance_transactions', function (Blueprint $t) {
            $t->string('payment_method', 30)->nullable()->after('reference');
            $t->string('payment_reference', 120)->nullable()->after('payment_method');
        });

        // One receipt per approved payment against an invoice, part or full.
        Schema::create('payment_receipts', function (Blueprint $t) {
            $t->id();
            $t->string('number', 40)->unique();
            $t->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $t->foreignId('finance_transaction_id')->nullable()->unique()->constrained()->nullOnDelete();
            $t->string('currency', 3);
            $t->unsignedBigInteger('amount');
            $t->unsignedBigInteger('paid_before');   // paid on the invoice before this payment
            $t->unsignedBigInteger('balance_after'); // still owing after this payment
            $t->string('payment_method', 30)->nullable();
            $t->string('payment_reference', 120)->nullable();
            $t->date('paid_on');
            $t->string('status', 10)->default('issued'); // issued | void
            $t->timestamp('emailed_at')->nullable();
            $t->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->index(['paid_on', 'status']);
        });

        // Payments approved before receipts existed get theirs now, in order.
        FinanceTransaction::where('source', 'invoice')->where('status', 'approved')
            ->whereNotNull('source_id')->orderBy('occurred_on')->orderBy('id')
            ->get()->each(fn (FinanceTransaction $tx) => app(PaymentReceipts::class)->issueFor($tx, backfill: true));
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_receipts');
        Schema::table('finance_transactions', fn (Blueprint $t) => $t->dropColumn(['payment_method', 'payment_reference']));
    }
};
