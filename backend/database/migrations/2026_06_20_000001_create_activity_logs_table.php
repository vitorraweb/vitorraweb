<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Immutable audit trail of sensitive actions — who downloaded a contract /
     * medical note / CV, who viewed supplier bank details, who approved or
     * voided money, who changed a role or reset a password. Write-only from the
     * app; read by admins in the Activity log screen.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // the actor
            $table->string('action')->index();          // e.g. sick_note.download
            $table->string('subject_type')->nullable(); // model class of the affected record
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('description', 1000)->nullable();
            $table->string('ip', 45)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
