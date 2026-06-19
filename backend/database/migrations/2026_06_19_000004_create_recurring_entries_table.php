<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Templates that auto-generate a draft transaction each month (rent,
     * salaries, subscriptions). The scheduled `finance:recurring` command
     * creates the draft on/after `day_of_month`; senior finance approves it.
     */
    public function up(): void
    {
        Schema::create('recurring_entries', function (Blueprint $table) {
            $table->id();
            $table->string('type');                       // income | expense
            $table->foreignId('finance_account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('finance_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sector')->nullable();
            $table->string('currency', 3);
            $table->bigInteger('amount');
            $table->unsignedSmallInteger('vat_rate')->default(0);
            $table->string('description')->nullable();
            $table->unsignedTinyInteger('day_of_month')->default(1); // 1–28
            $table->boolean('is_active')->default(true);
            $table->string('last_run_period', 7)->nullable();        // YYYY-MM
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_entries');
    }
};
