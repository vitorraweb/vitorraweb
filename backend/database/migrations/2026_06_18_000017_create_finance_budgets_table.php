<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Monthly spending cap per expense category (for actual-vs-budget). */
    public function up(): void
    {
        Schema::create('finance_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finance_category_id')->constrained()->cascadeOnDelete();
            $table->string('period', 7);          // YYYY-MM
            $table->string('currency', 3)->default('UGX');
            $table->bigInteger('amount');
            $table->timestamps();
            $table->unique(['finance_category_id', 'period', 'currency']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_budgets');
    }
};
