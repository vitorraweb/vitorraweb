<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Google Ads in the console
|--------------------------------------------------------------------------
| Marketing pays for Google Ads and Plausible is gone, so the question "what
| did the ad money produce?" needs Google's side of the numbers (spend,
| clicks, search terms) next to ours (enquiries, won deals).
|
|   google_ads_accounts     The one connected account. Refresh token is
|                           encrypted (model cast). A table, not Settings,
|                           because Settings::resolved() is served whole to
|                           the settings screen and a token must never be.
|
|   google_ads_campaign_days  Per campaign per day, synced hourly. Google
|                           restates recent days as conversions arrive, so
|                           rows are upserted, never appended.
|
|   google_ads_search_terms What people actually typed, per campaign per day.
|
|   enquiries / contact_messages
|                           The campaign, ad group and keyword a Google click
|                           came from, resolved from its gclid. Auto-tagged
|                           clicks carry no utm_campaign, so without this most
|                           Ads enquiries could not be tied to a campaign.
|                           Enquiries also record the offline-conversion
|                           upload, so a won deal is reported to Google once.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_ads_accounts', function (Blueprint $table) {
            $table->id();
            $table->text('refresh_token');                 // encrypted cast
            $table->string('connected_email')->nullable();
            $table->foreignId('connected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_id', 20)->nullable();        // digits only
            $table->string('login_customer_id', 20)->nullable();  // manager account, if any
            $table->string('descriptive_name')->nullable();
            $table->string('currency_code', 3)->nullable();
            $table->string('time_zone', 64)->nullable();
            $table->string('conversion_action_id', 20)->nullable(); // for won-deal uploads
            $table->string('conversion_action_name')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('last_error_at')->nullable();
            $table->timestamps();
        });

        Schema::create('google_ads_campaign_days', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('campaign_id', 20);
            $table->string('campaign_name');
            $table->string('campaign_status', 20)->nullable();
            $table->string('channel_type', 40)->nullable();
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('cost_micros')->default(0);
            $table->decimal('conversions', 12, 2)->default(0);
            $table->decimal('conversions_value', 16, 2)->default(0);
            $table->string('currency_code', 3)->nullable();
            $table->timestamps();

            $table->unique(['date', 'campaign_id']);
            $table->index('campaign_id');
        });

        Schema::create('google_ads_search_terms', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('campaign_id', 20);
            $table->string('search_term', 255);
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('cost_micros')->default(0);
            $table->decimal('conversions', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['date', 'campaign_id', 'search_term'], 'gads_terms_unique');
        });

        foreach (['enquiries', 'contact_messages'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('ads_campaign_id', 20)->nullable()->index();
                $table->string('ads_campaign_name')->nullable();
                $table->string('ads_ad_group')->nullable();
                $table->string('ads_keyword')->nullable();
                // Set whether or not the click was found, so a gclid Google
                // does not recognise is looked up once, not every hour forever.
                $table->timestamp('ads_click_checked_at')->nullable();
            });
        }

        Schema::table('enquiries', function (Blueprint $table) {
            $table->timestamp('ads_conversion_uploaded_at')->nullable();
            $table->string('ads_conversion_error')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropColumn(['ads_conversion_uploaded_at', 'ads_conversion_error']);
        });
        foreach (['enquiries', 'contact_messages'] as $name) {
            Schema::table($name, function (Blueprint $table) use ($name) {
                $table->dropIndex("{$name}_ads_campaign_id_index");
                $table->dropColumn(['ads_campaign_id', 'ads_campaign_name', 'ads_ad_group', 'ads_keyword', 'ads_click_checked_at']);
            });
        }
        Schema::dropIfExists('google_ads_search_terms');
        Schema::dropIfExists('google_ads_campaign_days');
        Schema::dropIfExists('google_ads_accounts');
    }
};
