<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Private HR files for a staff member (employment contract, ID, NSSF, etc.).
     * Files live on the private `local` disk; the `path` is streamed to the
     * owner / HR through an authorized controller — never a public URL.
     */
    public function up(): void
    {
        Schema::create('staff_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('other'); // contract | id | certificate | other
            $table->string('title');
            $table->string('path');                    // relative path on the private disk
            $table->string('original_name')->nullable();
            $table->unsignedInteger('size')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_documents');
    }
};
