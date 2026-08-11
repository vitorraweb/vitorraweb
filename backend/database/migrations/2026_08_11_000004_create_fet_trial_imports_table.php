<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Import provenance and reusable column mappings.
     *
     * `fet_trial_imports` records each run — which file, which sheet, which
     * mapping, how many rows landed in each bucket, and who pressed the button
     * — so any figure on the dashboard traces back to a source row, and a bad
     * import can be identified and rolled back rather than argued about.
     *
     * `fet_trial_import_templates` remembers a client's layout. Hariss's export
     * is mapped once; every later upload from them is recognised automatically.
     */
    public function up(): void
    {
        Schema::create('fet_trial_import_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('client_key')->nullable();   // normalised company name — matches future uploads
            $table->string('sheet_hint')->nullable();   // e.g. "Data_Sheet"
            $table->json('mapping');                    // canonical field => source column
            $table->json('unit_hints')->nullable();     // e.g. {"load":"kg","distance":"km"}
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('client_key');
        });

        Schema::create('fet_trial_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fet_trial_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fet_trial_import_template_id')->nullable()
                ->constrained('fet_trial_import_templates')->nullOnDelete();

            $table->string('filename');
            // The client's original file, kept encrypted at rest (SecureFile) so
            // any figure can be traced back to the document it arrived in.
            $table->string('source_path')->nullable();
            $table->string('sheet')->nullable();
            $table->json('mapping')->nullable();        // the mapping actually used
            $table->unsignedInteger('rows_total')->default(0);
            $table->unsignedInteger('rows_imported')->default(0);
            $table->unsignedInteger('rows_flagged')->default(0);
            $table->unsignedInteger('rows_rejected')->default(0);
            $table->json('rejections')->nullable();     // row ref => why, so nothing vanishes quietly

            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('fet_trial_id');
        });

        // Deferred in the trips migration: the FK exists only now.
        Schema::table('fet_trial_trips', function (Blueprint $table) {
            $table->foreign('fet_trial_import_id')->references('id')->on('fet_trial_imports')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('fet_trial_trips', function (Blueprint $table) {
            $table->dropForeign(['fet_trial_import_id']);
        });
        Schema::dropIfExists('fet_trial_imports');
        Schema::dropIfExists('fet_trial_import_templates');
    }
};
