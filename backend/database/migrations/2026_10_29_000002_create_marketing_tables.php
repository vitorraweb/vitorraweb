<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Marketing: markets, designed campaigns, tracking, lead priorities
|--------------------------------------------------------------------------
|   markets / market_members   Named audiences Marketing sends to again and
|                              again ("Kampala fleets", "Hospitals"). A
|                              contact can sit in several; "move" is a
|                              remove + add.
|   email_designs              Saved campaign templates from the designer
|                              (block JSON, rendered server-side to email-safe
|                              HTML so preview, test and send are identical).
|   prospect_campaigns +       A designed campaign is a draft until a test
|                              has gone to support; editing after the test
|                              (test_hash) requires a new test.
|   recipients + clicks        Per-recipient token for the open pixel, the
|                              signed click redirect and one-click unsubscribe.
|   prospects +                Unsubscribe (never emailed again) and the
|                              decision engine's score, tier and reasons.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('markets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description', 500)->nullable();
            $table->string('product', 20)->nullable();
            $table->string('color', 7)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('market_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('market_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prospect_id')->constrained()->cascadeOnDelete();
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['market_id', 'prospect_id']);
        });

        Schema::create('email_designs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('product', 20)->nullable();
            $table->json('design');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('prospect_campaigns', function (Blueprint $table) {
            $table->string('preheader', 200)->nullable()->after('subject');
            $table->json('design')->nullable()->after('body');         // designed campaigns only
            $table->json('market_ids')->nullable()->after('product');
            $table->boolean('skip_avoid')->default(true)->after('market_ids');
            $table->timestamp('tested_at')->nullable();
            $table->foreignId('tested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('test_hash', 64)->nullable();
            $table->timestamp('started_at')->nullable();
        });

        Schema::table('prospect_campaign_recipients', function (Blueprint $table) {
            $table->string('token', 40)->nullable()->unique();
            $table->foreignId('market_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('opened_at')->nullable();
            $table->unsignedInteger('open_count')->default(0);
            $table->timestamp('clicked_at')->nullable();
            $table->unsignedInteger('click_count')->default(0);
            $table->timestamp('unsubscribed_at')->nullable();
        });

        Schema::create('campaign_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('prospect_campaigns')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('prospect_campaign_recipients')->cascadeOnDelete();
            $table->text('url');
            // Mail security scanners (Safe Links, Mimecast…) "click" every link
            // seconds after delivery. Kept for the record, left out of scores.
            $table->boolean('suspected_bot')->default(false);
            $table->timestamp('created_at')->nullable();
            $table->index(['campaign_id', 'suspected_bot']);
        });

        Schema::table('prospects', function (Blueprint $table) {
            $table->timestamp('unsubscribed_at')->nullable();
            $table->unsignedTinyInteger('lead_score')->nullable()->index();
            $table->string('lead_tier', 20)->nullable()->index();
            $table->json('lead_reasons')->nullable();
            $table->string('lead_action', 255)->nullable();
            $table->timestamp('lead_scored_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropIndex(['lead_score']);
            $table->dropIndex(['lead_tier']);
            $table->dropColumn(['unsubscribed_at', 'lead_score', 'lead_tier', 'lead_reasons', 'lead_action', 'lead_scored_at']);
        });
        Schema::dropIfExists('campaign_clicks');
        Schema::table('prospect_campaign_recipients', function (Blueprint $table) {
            $table->dropUnique(['token']);
            $table->dropConstrainedForeignId('market_id');
            $table->dropColumn(['token', 'opened_at', 'open_count', 'clicked_at', 'click_count', 'unsubscribed_at']);
        });
        Schema::table('prospect_campaigns', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tested_by');
            $table->dropColumn(['preheader', 'design', 'market_ids', 'skip_avoid', 'tested_at', 'test_hash', 'started_at']);
        });
        Schema::dropIfExists('email_designs');
        Schema::dropIfExists('market_members');
        Schema::dropIfExists('markets');
    }
};
