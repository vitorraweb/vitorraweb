<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Job applications. CVs live on the private disk; `extracted` holds the
     * AI-parsed fields used to pre-fill and screen. Records + CV files are
     * purged after 6 months (see ApplicationsPurge command) per the stated
     * candidate-data retention policy.
     */
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_opening_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('location')->nullable();
            $table->string('cv_path')->nullable();   // private disk
            $table->text('cover_note')->nullable();
            $table->json('extracted')->nullable();    // AI-parsed CV fields
            $table->string('status')->default('new'); // new | review | shortlist | rejected | hired
            $table->text('admin_note')->nullable();
            $table->timestamps();
            $table->index(['status']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
