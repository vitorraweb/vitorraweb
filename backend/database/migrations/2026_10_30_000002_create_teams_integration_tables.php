<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Microsoft Teams integration
|--------------------------------------------------------------------------
|   users.microsoft_email  The person's Microsoft 365 / Teams address when it
|                          differs from their console login (e.g. someone who
|                          signs in with a Gmail address). Used for "Chat in
|                          Teams" and to match Teams sign-in.
|   users.microsoft_oid    Their Entra object id, recorded on the first
|                          successful Teams sign-in; afterwards a token must
|                          carry the same id (an email alone is not enough).
|   meetings               Teams meetings created in Teams/Outlook whose join
|                          link staff add here. department NULL = all staff.
|   teams_notifications    Outbox for the Teams Workflows webhook: one row per
|                          message (dedupe_key unique), so a message is posted
|                          once, retried a bounded number of times, and its
|                          delivery state is visible to admins.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('microsoft_email')->nullable();
            $table->string('microsoft_oid', 64)->nullable()->unique();
        });

        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->dateTime('starts_at')->index();
            $table->dateTime('ends_at')->nullable();
            $table->text('join_url');
            $table->text('notes')->nullable();
            $table->string('department', 40)->nullable();   // null = everyone on staff
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('teams_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('event', 40)->index();
            $table->string('dedupe_key', 191)->unique();
            $table->string('title');
            $table->json('payload');
            $table->string('status', 12)->default('pending')->index(); // pending | sent | failed
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->string('last_error', 500)->nullable();
            $table->timestamp('next_attempt_at')->nullable()->index();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams_notifications');
        Schema::dropIfExists('meetings');
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['microsoft_oid']);
            $table->dropColumn(['microsoft_email', 'microsoft_oid']);
        });
    }
};
