<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Uganda public holidays. `recurring` ones repeat on the same month/day
     * every year (e.g. Independence Day); non-recurring ones (e.g. Eid, Good
     * Friday — lunar/movable) are set per year. Used to (a) exclude days from
     * leave working-day counts and (b) drive automated staff reminders.
     */
    public function up(): void
    {
        Schema::create('public_holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('date');
            $table->boolean('recurring')->default(false);
            $table->string('source')->nullable();
            $table->timestamps();
            $table->unique(['name', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_holidays');
    }
};
