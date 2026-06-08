<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-locale translations for blog posts. The base blog_posts row remains the
 * English (default-locale) source of truth; a row here holds the translated
 * fields for one locale. Any field left null falls back to the base post, so a
 * partial translation never blanks the page.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('blog_post_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_post_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('title')->nullable();
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->timestamps();
            $table->unique(['blog_post_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_translations');
    }
};
