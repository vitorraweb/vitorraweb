<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletter_broadcasts', function (Blueprint $table) {
            $table->id();
            $table->string('subject');
            $table->text('body_markdown');
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('recipient_count')->default(0);
            $table->timestamps(); // created_at doubles as sent_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_broadcasts');
    }
};
