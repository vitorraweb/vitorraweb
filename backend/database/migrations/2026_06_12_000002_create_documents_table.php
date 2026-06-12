<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Auto-generated PDFs (reservation confirmations, receipts, installation certificates). */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('enquiry_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');  // reservation_confirmation | payment_receipt | installation_certificate
            $table->string('title');
            $table->string('path');  // storage path on the public disk
            $table->string('url');   // full public URL
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->index(['order_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
