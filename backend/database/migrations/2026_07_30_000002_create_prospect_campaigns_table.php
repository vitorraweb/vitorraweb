<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bulk outreach campaigns to the prospect database. A campaign is written once
 * and then sent to its recipients in the background, so a 160-recipient SEAL
 * send neither times out the browser nor trips the mail provider's rate limit —
 * and there is a durable record of exactly who was emailed and who bounced.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prospect_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();          // internal label, e.g. "SEAL launch — hospitals"
            $table->string('subject');
            $table->text('body');
            $table->string('product')->nullable();       // FET | SEAL — which list it targeted
            $table->json('attachments')->nullable();     // [{path, name, size, mime}] on the private disk
            // draft | sending | sent | cancelled
            $table->string('status')->default('sending')->index();
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('prospect_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('prospect_campaigns')->cascadeOnDelete();
            $table->foreignId('prospect_id')->nullable()->constrained('prospects')->nullOnDelete();
            $table->string('email');
            $table->string('name')->nullable();
            $table->string('status')->default('pending')->index();   // pending | sent | failed
            $table->text('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            // One send per prospect per campaign — the drain can retry safely.
            $table->unique(['campaign_id', 'prospect_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospect_campaign_recipients');
        Schema::dropIfExists('prospect_campaigns');
    }
};
