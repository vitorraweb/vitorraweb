<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Response-time SLA bookkeeping
|--------------------------------------------------------------------------
| `replied_at` already records when an enquiry was first actioned, but only so
| the dashboards can average it after the fact. Nothing ever chased an enquiry
| that was going unanswered — which is how the 9 July enquiry (a live buyer,
| naming his vehicle) sat with no reply until the CEO found it in a meeting.
|
| These two timestamps exist purely so the chaser is not a nag: each stage is
| sent once and then recorded, so running the command hourly cannot email the
| same person about the same enquiry twelve times a day. Nullable, so every
| existing enquiry starts un-notified.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->timestamp('sla_notified_at')->nullable()->after('replied_at');
            $table->timestamp('sla_escalated_at')->nullable()->after('sla_notified_at');
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropColumn(['sla_notified_at', 'sla_escalated_at']);
        });
    }
};
