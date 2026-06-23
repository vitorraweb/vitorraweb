<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Let customers pay an invoice online: a public link token + the provider tracking. */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('public_token', 64)->nullable()->unique()->after('number');
            $table->string('payment_method')->nullable()->after('status');     // pesapal | …
            $table->string('payment_reference')->nullable()->after('payment_method'); // provider tracking id
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['public_token', 'payment_method', 'payment_reference']);
        });
    }
};
