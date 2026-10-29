<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CRM, round two: a value and close date on each deal (for a real forecast),
 * the next step agreed with the customer, and a log of the calls, WhatsApp
 * chats, visits and meetings the team has with customers and prospects.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_notes', function (Blueprint $table) {
            $table->unsignedBigInteger('deal_value')->nullable()->after('pipeline_stage'); // major units
            $table->string('deal_currency', 3)->default('UGX')->after('deal_value');
            $table->string('deal_product', 20)->nullable()->after('deal_currency');
            $table->date('expected_close')->nullable()->after('deal_product');
            $table->string('lost_reason', 60)->nullable()->after('expected_close');
            $table->string('next_action', 255)->nullable()->after('lost_reason');
            $table->date('next_action_on')->nullable()->index()->after('next_action');
            $table->timestamp('stage_changed_at')->nullable()->after('next_action_on');
        });

        Schema::create('sales_activities', function (Blueprint $table) {
            $table->id();
            $table->string('email')->nullable()->index();            // customer (lower-cased)
            $table->foreignId('prospect_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kind', 20);                               // call | whatsapp | meeting | visit | email | note
            $table->string('outcome', 30)->nullable();
            $table->text('summary')->nullable();
            $table->string('next_action', 255)->nullable();
            $table->date('next_action_on')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['user_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_activities');
        Schema::table('customer_notes', function (Blueprint $table) {
            $table->dropIndex(['next_action_on']);
            $table->dropColumn(['deal_value', 'deal_currency', 'deal_product', 'expected_close', 'lost_reason', 'next_action', 'next_action_on', 'stage_changed_at']);
        });
    }
};
