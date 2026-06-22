<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A Fuel Eco Tech device fitted to a customer's vehicle — the record that
     * lets us prove real, measured fuel savings after the sale. Customer fields
     * are guest-friendly (keyed by email, like orders/enquiries) and optionally
     * linked to a registered account. The number-plate is PII → encrypted at
     * rest (see App\Models\FetInstallation).
     */
    public function up(): void
    {
        Schema::create('fet_installations', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();           // FET-INST-YYYY-####
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('enquiry_id')->nullable()->constrained('enquiries')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            // Customer (guest-friendly — matched to a portal account by email).
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('company')->nullable();

            // Vehicle + device.
            $table->string('tier');                          // car | suv | lighttruck | heavytruck
            $table->string('device_model')->nullable();      // FET-PRO-FI …
            $table->string('vehicle')->nullable();           // make / model (free text)
            $table->text('registration')->nullable();        // number plate — PII, encrypted at rest
            $table->string('fuel_type')->default('diesel');  // diesel | petrol
            $table->string('currency', 3)->default('UGX');

            // Baseline fuel use the savings are measured against.
            $table->decimal('baseline_l_per_100', 6, 2)->nullable();
            $table->string('baseline_source')->default('segment'); // measured | declared | segment

            $table->date('installed_on')->nullable();
            $table->foreignId('installed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('active');     // active | paused | removed
            $table->boolean('consent_to_publish')->default(false); // case-study consent
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('customer_email');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fet_installations');
    }
};
