<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * People/HR fields: who a staff member reports to, their job description,
     * and their annual leave entitlement (Uganda statutory default is 21
     * working days). Supports the new employee self-service portal.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('supervisor_id')->nullable()->after('department')
                ->constrained('users')->nullOnDelete();
            $table->text('job_description')->nullable()->after('job_title');
            $table->unsignedSmallInteger('leave_entitlement_days')->default(21)->after('staff_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supervisor_id');
            $table->dropColumn(['job_description', 'leave_entitlement_days']);
        });
    }
};
