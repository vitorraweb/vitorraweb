<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reply_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');           // "FET pricing follow-up"
            $table->string('subject');        // email subject line
            $table->text('body');             // plain text / Markdown body
            $table->string('category')->nullable(); // FET | SEAL | Coffee | Logistics | General
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reply_templates');
    }
};
