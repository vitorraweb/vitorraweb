<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 | Leave now needs two signatures — Operations and Finance — so a single row on
 | leave_requests can no longer record "who reviewed it". Each signature is its
 | own row here; leave_requests.reviewed_by/reviewed_at still hold the final
 | decision so existing screens and emails keep working unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('stage');    // operations | finance
            $table->string('decision'); // approved | declined
            $table->text('comment')->nullable();
            $table->timestamps();

            // One signature per stage, and one signature per person — together
            // these stop the same account providing both approvals.
            $table->unique(['leave_request_id', 'stage']);
            $table->unique(['leave_request_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_approvals');
    }
};
