<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Where did this lead come from?
|--------------------------------------------------------------------------
| Until now nothing recorded the origin of an enquiry, so "how much are we
| spending on Google Ads and what did it produce?" had no answer anywhere in
| the system. Raised in the 27 August Q&A — see planning/14-aug27-qa-tech-actions.md.
|
| Two levels of detail, deliberately:
|
|   lead_source   A single normalised label ("google / cpc", "facebook /
|                 referral", "direct"). Indexed, and the thing every report
|                 groups by. One column so a channel breakdown is one GROUP BY
|                 rather than a pile of COALESCE.
|
|   utm_*         The three fields campaigns are actually named by, promoted to
|                 their own columns so marketing can filter on a campaign
|                 without reaching into JSON.
|
|   attribution   Everything else, kept raw and unparsed: utm_term/content,
|                 gclid/fbclid, referrer, landing page, first-seen timestamp.
|                 A JSON column because this is evidence we may want to
|                 re-interpret later, not something to query on.
|
| All nullable. Existing rows keep a NULL lead_source, which reports render as
| "unknown" rather than silently folding into "direct" — an enquiry from before
| tracking existed is genuinely unknown, and saying so is the honest reading.
*/
return new class extends Migration
{
    /** Both tables carry an identical shape; contact messages are leads too. */
    private array $tables = ['enquiries', 'contact_messages'];

    public function up(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('lead_source')->nullable()->index();
                $table->string('utm_source')->nullable();
                $table->string('utm_medium')->nullable();
                $table->string('utm_campaign')->nullable()->index();
                $table->json('attribution')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropColumn([
                    'lead_source',
                    'utm_source',
                    'utm_medium',
                    'utm_campaign',
                    'attribution',
                ]);
            });
        }
    }
};
