<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Customer invoices (accounts receivable). Amounts are in the invoice's
     * currency unit (UGX shillings / USD-EUR cents). VAT is held per line item;
     * the header carries the rolled-up subtotal / VAT / total + amount paid.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('customer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->text('customer_address')->nullable();
            $table->string('currency', 3)->default('UGX');
            $table->string('sector')->nullable();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->bigInteger('subtotal')->default(0);   // excl VAT
            $table->bigInteger('vat_total')->default(0);
            $table->bigInteger('total')->default(0);
            $table->bigInteger('amount_paid')->default(0);
            $table->string('status')->default('draft');   // draft | sent | partial | paid | void
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->string('source')->default('manual');   // manual | enquiry | order
            $table->unsignedBigInteger('source_id')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('last_reminded_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('status');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
