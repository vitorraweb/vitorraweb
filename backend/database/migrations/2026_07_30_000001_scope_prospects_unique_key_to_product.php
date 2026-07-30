<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Prospect lists are now segmented per product (FET, SEAL, …). The old natural
 * key (name + category) silently dropped a company that appears on more than one
 * product's list — MANUFACTURING, for example, is a vertical on both the FET and
 * SEAL sheets. Scoping the key to the product keeps re-imports idempotent while
 * letting the same company be a prospect for two different products.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropUnique('prospects_name_category_unique');
            $table->unique(['name', 'category', 'product'], 'prospects_name_category_product_unique');
            $table->index('product');
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropIndex(['product']);
            $table->dropUnique('prospects_name_category_product_unique');
            $table->unique(['name', 'category'], 'prospects_name_category_unique');
        });
    }
};
