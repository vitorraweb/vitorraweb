<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('status')->default('subscribed'); // subscribed | unsubscribed
            $table->string('token', 64)->unique();           // for one-click unsubscribe links
            $table->string('source')->nullable();            // e.g. footer
            $table->string('locale', 8)->nullable();         // language to send in later
            $table->string('consent_ip')->nullable();        // proof-of-consent (GDPR)
            $table->timestamp('consent_at')->nullable();     // when they opted in
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
    }
};
