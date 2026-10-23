<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sales contracts (FET Module Sales and Installation Agreement) filled in by
 * staff, sent to the client by a one-time signing link and signed online.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->string('type', 30)->default('fet_sales');
            $table->string('status', 20)->default('draft')->index(); // draft, sent, viewed, signed, declined, void
            $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();
            $table->date('agreement_date')->nullable();

            // Seller
            $table->string('seller_company')->nullable();
            $table->text('seller_address')->nullable();
            $table->string('seller_name')->nullable();
            $table->string('seller_title')->nullable();

            // Buyer
            $table->string('buyer_name');
            $table->string('buyer_registration')->nullable();
            $table->text('buyer_address')->nullable();
            $table->string('buyer_contact')->nullable();
            $table->string('buyer_phone', 64)->nullable();
            $table->string('buyer_email')->nullable();

            // Product, vehicle, installation
            $table->unsignedInteger('quantity')->default(1);
            $table->string('model_number')->nullable();
            $table->string('serial_number')->nullable();
            $table->text('vehicle_description')->nullable();
            $table->string('registration_numbers')->nullable();
            $table->string('chassis_numbers')->nullable();
            $table->string('engine_numbers')->nullable();
            $table->string('installation_location')->nullable();
            $table->date('installation_date')->nullable();

            // Price and payment (whole shillings for UGX, minor units otherwise)
            $table->string('currency', 3)->default('UGX');
            $table->unsignedBigInteger('unit_cost')->nullable();
            $table->unsignedBigInteger('total_amount')->nullable();
            $table->string('price_note')->nullable();
            $table->string('payment_option', 20)->default('advance'); // advance | instalment
            $table->unsignedBigInteger('instalment_amount')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('mobile_money')->nullable();

            $table->json('clauses');

            // Signing
            $table->string('sign_token_hash', 64)->nullable()->unique();
            $table->timestamp('sign_expires_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sent_to')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('signer_name')->nullable();
            $table->string('signer_position')->nullable();
            $table->string('signature_type', 10)->nullable(); // drawn | typed
            $table->longText('signature_data')->nullable();
            $table->string('signer_ip', 64)->nullable();
            $table->string('signer_agent', 500)->nullable();
            $table->string('signed_hash', 64)->nullable();
            $table->string('signed_pdf_path')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->text('decline_reason')->nullable();
            $table->timestamp('voided_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
