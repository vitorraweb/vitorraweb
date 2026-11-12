<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Further headlines on one video or design, each shown from its own
        // second (`at`): [{line1, line2, small, at}]. The first headline stays
        // in line1/line2/small; a blank field keeps the wording before it.
        Schema::table('screen_media', function (Blueprint $t) {
            $t->json('captions')->nullable()->after('small');
        });
    }

    public function down(): void
    {
        Schema::table('screen_media', fn (Blueprint $t) => $t->dropColumn('captions'));
    }
};
