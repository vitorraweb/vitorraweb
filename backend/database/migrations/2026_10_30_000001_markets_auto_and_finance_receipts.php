<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Markets built from the prospect lists; finance receipt inbox
|--------------------------------------------------------------------------
|   markets.auto_key    "FET|CARGO" for a market built automatically from a
|                       product's industry list, so a rebuild finds it even if
|                       the team renamed it.
|   finance_receipts    Every receipt scanned or uploaded, kept (encrypted)
|                       whether or not it has been booked yet; the AI-read
|                       fields fill the expense when Finance records it.
|   receipt_scan_links  A short-lived link (QR code) that lets a phone upload
|                       receipts without signing in. Only the hash is stored.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('markets', function (Blueprint $table) {
            $table->string('auto_key', 60)->nullable()->unique();
        });

        Schema::create('finance_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('path');                              // private disk, SecureFile-encrypted
            $table->string('original_name')->nullable();
            $table->string('mime', 60);
            $table->unsignedInteger('size')->default(0);
            $table->string('source', 10)->default('upload');     // phone | upload
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 12)->default('new')->index(); // new | recorded | archived
            $table->string('vendor')->nullable();
            $table->date('receipt_date')->nullable();
            $table->string('currency', 3)->nullable();
            $table->unsignedBigInteger('amount_minor')->nullable();
            $table->unsignedTinyInteger('vat_rate')->nullable();
            $table->string('description', 500)->nullable();
            $table->string('note', 500)->nullable();
            $table->timestamp('read_at')->nullable();             // AI read attempted
            $table->unsignedTinyInteger('read_attempts')->default(0);
            $table->foreignId('finance_transaction_id')->nullable()->constrained('finance_transactions')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('receipt_scan_links', function (Blueprint $table) {
            $table->id();
            $table->string('token_hash', 64)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('expires_at');
            $table->unsignedInteger('uploads')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_scan_links');
        Schema::dropIfExists('finance_receipts');
        Schema::table('markets', function (Blueprint $table) {
            $table->dropUnique(['auto_key']);
            $table->dropColumn('auto_key');
        });
    }
};
