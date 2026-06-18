<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suppliers onboarded to Vitorra. Bank fields are stored encrypted (the
     * model casts them with `encrypted`), so the columns hold ciphertext and
     * are typed `text`. Ops/Finance review and approve.
     */
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('contact_name')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('country')->nullable();
            $table->string('address')->nullable();
            $table->string('category')->nullable();          // what they supply
            $table->text('description')->nullable();

            // Bank details — encrypted at rest (ciphertext is longer than plain).
            $table->text('bank_name')->nullable();
            $table->text('bank_account_name')->nullable();
            $table->text('bank_account_number')->nullable();
            $table->text('bank_branch')->nullable();
            $table->text('bank_swift')->nullable();

            $table->string('status')->default('pending');     // pending | approved | rejected | info_requested
            $table->text('review_note')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
