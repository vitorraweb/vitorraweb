<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Internal notes attached to a customer/contact (keyed by email). Customers
     * themselves are aggregated on the fly from enquiries, orders, and contact
     * messages — there is no registered-account table yet — so notes live here.
     */
    public function up(): void
    {
        Schema::create('customer_notes', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();   // stored lower-cased
            $table->text('note')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_notes');
    }
};
