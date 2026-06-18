<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Monthly work reports: each staff member records what they did each month
     * as a checklist + summary; their supervisor reviews it. Gives supervisors
     * ongoing visibility and a paper trail for probation decisions.
     */
    public function up(): void
    {
        Schema::create('monthly_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('period', 7);                  // YYYY-MM
            $table->json('items')->nullable();            // [{label, done, note}]
            $table->text('summary')->nullable();
            $table->string('status')->default('draft');   // draft | submitted | reviewed
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('supervisor_comment')->nullable();
            $table->unsignedTinyInteger('rating')->nullable(); // 1–5
            $table->timestamps();
            $table->unique(['user_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_reports');
    }
};
