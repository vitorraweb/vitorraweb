<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('department')->nullable()->after('role');
            $table->string('job_title')->nullable()->after('department');
            $table->date('start_date')->nullable()->after('job_title');
            $table->string('staff_status')->default('active')->after('start_date'); // active | on_leave | left
            $table->json('permissions')->nullable()->after('staff_status');         // per-person module override
            $table->json('documents')->nullable()->after('permissions');            // [{label,url}] links
            $table->text('notes')->nullable()->after('documents');                  // internal HR notes
        });

        // Preserve current behaviour: existing ops accounts keep full access by
        // giving them an explicit all-modules override. Admins are unaffected
        // (they always have everything).
        $all = ['dashboard', 'enquiries', 'customers', 'prospects', 'products', 'blog', 'media', 'messages', 'orders', 'newsletter', 'tasks'];
        DB::table('users')
            ->where('role', 'ops')
            ->update(['department' => 'leadership', 'permissions' => json_encode($all)]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['department', 'job_title', 'start_date', 'staff_status', 'permissions', 'documents', 'notes']);
        });
    }
};
