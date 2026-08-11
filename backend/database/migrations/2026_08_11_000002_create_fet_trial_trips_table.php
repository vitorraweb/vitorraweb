<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One journey, normalised. Clients send wildly different shapes — tracker
     * mileage or odometer readings, tank dips or fuel issued, kilogrammes or
     * tonnes — so every source is mapped into this one canonical row and all
     * arithmetic happens downstream of it. Raw facts in, calculation central.
     *
     * Both fuel measurements are kept side by side where the client has them
     * (Hariss record a manual figure and a tracker figure that disagree by up
     * to 40 litres a trip). We never silently pick one: the difference is
     * surfaced as a data-quality flag for a human to settle.
     */
    public function up(): void
    {
        Schema::create('fet_trial_trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fet_trial_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sequence')->default(0);     // display order within the trial

            // When.
            $table->date('trip_date')->nullable();               // departure date
            $table->date('return_date')->nullable();
            $table->timestamp('departed_at')->nullable();
            $table->timestamp('returned_at')->nullable();

            // Where. `route_key` is the normalised form comparisons group on.
            $table->string('route_label')->nullable();           // as written by the client, e.g. "Mpondwe"
            $table->string('route_key')->nullable();             // normalised, e.g. "MPONDWE"
            $table->string('region')->nullable();

            // Distance. Source matters: planned mileage is not measured mileage
            // (Hariss's planned figures differ from tracker actuals by up to 10%).
            $table->decimal('distance_km', 10, 2)->nullable();
            $table->string('distance_source')->default('tracker'); // tracker | odometer | planned
            $table->unsignedBigInteger('odo_out_km')->nullable();
            $table->unsignedBigInteger('odo_in_km')->nullable();

            // Fuel, as the client records it.
            $table->decimal('fuel_opening_l', 10, 2)->nullable(); // tank stock at departure
            $table->decimal('fuel_issued_l', 10, 2)->nullable();  // drawn from the depot for this trip
            $table->decimal('fuel_topup_l', 10, 2)->nullable();   // bought en route
            $table->decimal('fuel_closing_l', 10, 2)->nullable(); // tank stock on return
            $table->decimal('fuel_used_l', 10, 2)->nullable();    // derived, persisted so a figure is always traceable
            $table->string('fuel_method')->default('tank_dip');   // tank_dip | odometer | issued_only
            $table->decimal('fuel_used_ivms_l', 10, 2)->nullable(); // the client's tracker figure, if they hold one

            // Load. Stored in kilogrammes always — clients label columns
            // "tonnes" and then enter 29,600, so the unit is decided on import.
            $table->unsignedInteger('load_out_kg')->nullable();
            $table->unsignedInteger('load_in_kg')->nullable();
            $table->boolean('return_loaded')->default(false);     // came back carrying freight — not comparable

            // Conditions that move fuel use independently of the device.
            $table->decimal('avg_speed_kmh', 6, 2)->nullable();
            $table->string('driver_name')->nullable();            // PII — withheld from the client share link
            $table->json('conditions')->nullable();               // idle, AC, weather, tyres, faults, maintenance

            // baseline (before the device) | trial (after). Derived from the
            // installation date; `phase_override` records a deliberate human call.
            $table->string('phase')->default('baseline');
            $table->string('phase_override')->nullable();
            $table->text('phase_override_reason')->nullable();

            // valid | review | excluded. Only `valid` trips reach the headline.
            $table->string('status')->default('valid');
            $table->text('exclusion_reason')->nullable();

            // Provenance — every figure traces back to a source row.
            $table->string('source')->default('manual');          // import | manual | paste
            $table->foreignId('fet_trial_import_id')->nullable();
            $table->string('source_row_ref')->nullable();         // e.g. "Data_Sheet!A12"
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['fet_trial_id', 'phase', 'status']);
            $table->index(['fet_trial_id', 'route_key']);
            $table->index('trip_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fet_trial_trips');
    }
};
