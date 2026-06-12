<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** FET reserve/installation fields + link orders back to the enquiry they were converted from. */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('enquiry_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->date('preferred_installation_date')->nullable()->after('shipping_address');
            $table->string('installation_location')->nullable()->after('preferred_installation_date');
            $table->timestamp('delivered_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('enquiry_id');
            $table->dropColumn(['preferred_installation_date', 'installation_location', 'delivered_at']);
        });
    }
};
