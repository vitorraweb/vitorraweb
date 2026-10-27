<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            // manual = written in the console; auto = drafted by blog:draft for review.
            $table->string('origin')->default('manual')->after('status');
            $table->string('topic')->nullable()->after('origin');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn(['origin', 'topic']);
        });
    }
};
