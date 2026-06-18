<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');               // annual | sick | unpaid | compassionate | maternity
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedSmallInteger('working_days'); // excludes weekends + public holidays
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // pending | approved | declined | cancelled
            $table->string('document_path')->nullable();  // sick note (private disk)
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_comment')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
