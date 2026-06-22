<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A single fill-up reading for an installation. Consumption is derived
     * brim-to-brim: litres added between two odometer readings ÷ distance.
     * `phase` separates a pre-install baseline period from post-install
     * readings so the two can be compared.
     */
    public function up(): void
    {
        Schema::create('fet_fuel_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fet_installation_id')->constrained()->cascadeOnDelete();
            $table->date('logged_on');
            $table->unsignedBigInteger('odometer_km')->nullable();
            $table->decimal('litres', 8, 2);
            $table->bigInteger('cost')->nullable();          // in the installation's currency unit (optional)
            $table->string('phase')->default('after');       // before | after
            $table->string('source')->default('customer');   // customer | staff | import
            $table->text('note')->nullable();
            $table->foreignId('logged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['fet_installation_id', 'logged_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fet_fuel_logs');
    }
};
