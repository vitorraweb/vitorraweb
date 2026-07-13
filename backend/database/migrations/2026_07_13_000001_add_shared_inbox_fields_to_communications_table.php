<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('communications', function (Blueprint $table) {
            // Existing rows are all staff replies sent by email — safe defaults.
            $table->string('direction')->default('outbound')->after('email'); // 'outbound' | 'inbound'
            $table->string('channel')->default('email')->after('direction'); // 'email' | 'portal'
            $table->json('cc')->nullable()->after('body');
            $table->json('attachments')->nullable()->after('cc'); // [{name, path, size, mime}]
            $table->string('message_id')->nullable()->after('attachments');
            $table->string('in_reply_to')->nullable()->after('message_id');
            $table->timestamp('staff_read_at')->nullable()->after('in_reply_to');
            $table->timestamp('customer_read_at')->nullable()->after('staff_read_at');
            $table->index('in_reply_to');
        });
    }

    public function down(): void
    {
        Schema::table('communications', function (Blueprint $table) {
            $table->dropIndex(['in_reply_to']);
            $table->dropColumn([
                'direction', 'channel', 'cc', 'attachments',
                'message_id', 'in_reply_to', 'staff_read_at', 'customer_read_at',
            ]);
        });
    }
};
