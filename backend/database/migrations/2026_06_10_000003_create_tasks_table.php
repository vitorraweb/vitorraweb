<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('todo');     // todo | in_progress | blocked | done
            $table->string('priority')->default('normal');  // low | normal | high
            $table->date('due_date')->nullable();
            $table->string('department')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
