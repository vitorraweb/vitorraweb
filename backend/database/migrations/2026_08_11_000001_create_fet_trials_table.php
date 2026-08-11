<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A supervised FET trial on one of a prospect's vehicles — the sales
     * instrument that turns "13.9% in a German lab" into "x% on your truck,
     * on your routes".
     *
     * Deliberately separate from `fet_installations`: that table measures a
     * paying customer's savings brim-to-brim from fill-up readings keyed on an
     * odometer. Trial clients (Hariss being the first) run fleet systems that
     * record trips instead — tracker distance, fuel issued against tank stock,
     * weighbridge loads — and never read an odometer at all. Same product, a
     * structurally different measurement. On a won trial the two are linked via
     * `fet_installation_id` so the proven-savings loop continues after the sale.
     *
     * The number plate is PII → encrypted at rest (see App\Models\FetTrial).
     */
    public function up(): void
    {
        Schema::create('fet_trials', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();              // TRIAL-YYYY-####

            // Who the trial is for. Guest-friendly, like enquiries/orders.
            $table->string('client_company');
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();

            // CRM links — a trial is a sales motion, not an isolated record.
            $table->foreignId('enquiry_id')->nullable()->constrained('enquiries')->nullOnDelete();
            $table->foreignId('prospect_id')->nullable()->constrained('prospects')->nullOnDelete();
            $table->foreignId('fet_installation_id')->nullable()->constrained('fet_installations')->nullOnDelete();

            // Vehicle under trial.
            $table->text('registration')->nullable();           // number plate — PII, encrypted at rest
            $table->string('vehicle_make')->nullable();         // e.g. Faw
            $table->string('vehicle_type')->nullable();         // e.g. Trailer / heavy goods
            $table->unsignedInteger('rated_capacity_kg')->nullable();
            $table->unsignedInteger('tare_kg')->nullable();     // normal empty weight; blank = inferred from readings

            // Device + installation. `installed_on` splits baseline from trial.
            $table->string('device_serial')->nullable();
            $table->string('device_model')->nullable();         // FET-PRO-FI …
            $table->date('installed_on')->nullable();
            $table->foreignId('installed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('trial_start')->nullable();
            $table->date('trial_end')->nullable();

            // Money. Kept per trial — never summed across currencies.
            $table->decimal('fuel_price', 12, 2)->nullable();   // price per litre, in `currency`
            $table->string('currency', 3)->default('UGX');

            /*
             * How the "before" figure is established, best first:
             *   measured  — real pre-installation trips on the same routes
             *   declared  — a figure the client states for this vehicle
             *   fleet     — the client's own standard for the vehicle class
             *               (Hariss carry 2.2 km/L for a Faw; a planning
             *               figure, not a measurement — never a headline basis)
             */
            $table->string('baseline_method')->default('measured');
            $table->decimal('declared_baseline_l_per_100', 6, 2)->nullable();
            $table->decimal('fleet_standard_km_per_l', 6, 3)->nullable();

            // Evidence thresholds. Null → the config default (config/fet_trials.php).
            $table->unsignedTinyInteger('required_matched_trips')->nullable();
            $table->unsignedTinyInteger('min_baseline_trips_per_route')->nullable();

            // draft | baseline | installed | active | review | report_ready
            //       | presented | won | lost
            $table->string('status')->default('draft');

            // Read-only client link. No login: clients keep sending their export.
            $table->string('share_token')->nullable()->unique();
            $table->timestamp('share_expires_at')->nullable();
            $table->boolean('share_includes_driver')->default(false); // driver identity is PII — off by default

            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('client_company');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fet_trials');
    }
};
