<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Uploaded media (images, PDFs, videos) for use across the site. */
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('filename');        // stored name on disk
            $table->string('original_name');   // name as uploaded
            $table->string('path');            // relative path on the public disk
            $table->string('url');             // full public URL
            $table->string('type');            // image | pdf | video
            $table->string('mime')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->string('uploaded_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
