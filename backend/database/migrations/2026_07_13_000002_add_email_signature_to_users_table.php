<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // longText, not text: a pasted-from-Outlook signature can carry an
            // embedded logo — MySQL's plain TEXT tops out at 64KB, which a
            // signature with even one small inline image can exceed before
            // App\Support\SignatureHtml extracts it out to a real file.
            $table->longText('email_signature')->nullable()->after('job_description');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email_signature');
        });
    }
};
