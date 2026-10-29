<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Staff management, round two: fuller employee records (employment type,
 * contract end, birthday, emergency contact) and company announcements
 * shown to staff in the portal and the console.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employment_type', 20)->nullable()->after('staff_status'); // permanent | contract | intern | casual
            $table->date('contract_end_date')->nullable()->after('employment_type');
            $table->date('date_of_birth')->nullable()->after('contract_end_date');
            $table->string('emergency_contact_name', 120)->nullable()->after('date_of_birth');
            $table->string('emergency_contact_phone', 40)->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_relation', 60)->nullable()->after('emergency_contact_phone');
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('body');
            $table->string('department', 40)->nullable(); // null = everyone
            $table->boolean('pinned')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['expires_at', 'pinned']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['employment_type', 'contract_end_date', 'date_of_birth', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation']);
        });
    }
};
