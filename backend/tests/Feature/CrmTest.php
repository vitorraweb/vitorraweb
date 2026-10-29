<?php

namespace Tests\Feature;

use App\Models\CustomerNote;
use App\Models\Enquiry;
use App\Models\Prospect;
use App\Models\SalesActivity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmTest extends TestCase
{
    use RefreshDatabase;

    private function person(string $role = 'ops', ?string $dept = 'sales'): User
    {
        return User::create(['name' => 'Rep '.uniqid(), 'email' => uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => $role, 'department' => $dept]);
    }

    private function as(User $u): self
    {
        $this->app['auth']->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer '.$u->createToken('t', ['admin', 'staff'])->plainTextToken);
    }

    public function test_logging_a_call_moves_the_deal_forward_and_sets_the_next_step(): void
    {
        $rep = $this->person();
        Enquiry::create(['name' => 'Kampala Haulage', 'email' => 'Fleet@Haulage.ug', 'phone' => '+256700111222', 'product_category' => 'FET', 'message' => 'Price for 12 trucks?']);

        $this->as($rep)->postJson('/api/admin/crm/activities', [
            'email' => 'fleet@haulage.ug', 'kind' => 'call', 'outcome' => 'quote_requested',
            'summary' => 'Wants FIII for 12 trucks.', 'next_action' => 'Send quote', 'next_action_on' => today()->addDay()->toDateString(),
        ])->assertCreated()->assertJsonPath('data.title', 'Call — Wants a quote');

        $note = CustomerNote::where('email', 'fleet@haulage.ug')->first();
        $this->assertSame('qualified', $note->pipeline_stage);
        $this->assertSame('Send quote', $note->next_action);
        $this->assertSame($rep->id, $note->owner_id);

        // A later "no answer" never drags the deal backwards.
        $this->as($rep)->postJson('/api/admin/crm/activities', ['email' => 'fleet@haulage.ug', 'kind' => 'call', 'outcome' => 'no_answer'])->assertCreated();
        $this->assertSame('qualified', $note->fresh()->pipeline_stage);

        $today = $this->as($rep)->getJson('/api/admin/crm/today')->assertOk()->json('data');
        $this->assertSame('Kampala Haulage', $today['follow_ups'][0]['name']);
        $this->assertSame('+256700111222', $today['follow_ups'][0]['phone']);
        $this->assertSame(2, $today['this_week']['activities']);
    }

    public function test_activity_on_a_prospect_updates_its_outreach_status_and_follow_up(): void
    {
        $rep = $this->person();
        $p = Prospect::create(['name' => 'Gulu Schools', 'category' => 'SCHOOL', 'product' => 'SEAL', 'email' => 'head@gulu.ac.ug', 'outreach_status' => 'contacted']);

        $this->as($rep)->postJson('/api/admin/crm/activities', ['prospect_id' => $p->id, 'kind' => 'visit', 'outcome' => 'interested', 'summary' => 'Nurse keen.', 'next_action' => 'Demo', 'next_action_on' => today()->addDays(3)->toDateString()])->assertCreated();
        $p->refresh();
        $this->assertSame('responded', $p->outreach_status);
        $this->assertSame('Demo', $p->follow_up);
        $this->assertSame('Nurse keen.', $p->feedback);

        $this->as($rep)->postJson('/api/admin/crm/activities', ['prospect_id' => $p->id, 'kind' => 'call', 'outcome' => 'not_interested'])->assertCreated();
        $this->assertSame('not_interested', $p->fresh()->outreach_status);
    }

    public function test_timeline_gathers_everything_we_know_about_a_customer(): void
    {
        $rep = $this->person();
        Enquiry::create(['name' => 'A', 'email' => 'a@b.ug', 'product_category' => 'SEAL', 'message' => 'Hi']);
        SalesActivity::create(['email' => 'a@b.ug', 'kind' => 'whatsapp', 'outcome' => 'interested', 'user_id' => $rep->id, 'occurred_at' => now()]);

        $types = array_column($this->as($rep)->getJson('/api/admin/crm/timeline?email=A@B.ug')->assertOk()->json('data'), 'type');
        $this->assertEqualsCanonicalizing(['enquiry', 'activity'], $types);
    }

    public function test_forecast_weights_open_deals_by_stage(): void
    {
        $rep = $this->person();
        CustomerNote::create(['email' => 'x@y.ug', 'pipeline_stage' => 'quoted', 'deal_value' => 10_000_000, 'deal_currency' => 'UGX']);
        CustomerNote::create(['email' => 'z@y.ug', 'pipeline_stage' => 'won', 'deal_value' => 5_000_000, 'deal_currency' => 'UGX', 'stage_changed_at' => now()]);
        CustomerNote::create(['email' => 'l@y.ug', 'pipeline_stage' => 'lost', 'lost_reason' => 'price', 'deal_value' => 1_000, 'stage_changed_at' => now()]);

        $d = $this->as($rep)->getJson('/api/admin/crm/forecast')->assertOk()->json('data');
        $this->assertSame(10_000_000, $d['currencies']['UGX']['open']);
        $this->assertSame(6_000_000, $d['currencies']['UGX']['weighted']);
        $this->assertSame(5_000_000, $d['currencies']['UGX']['won_this_month']);
        $this->assertSame(50, $d['win_rate']);
        $this->assertSame(1, $d['lost_reasons']['price']);
    }

    public function test_deal_details_save_and_show_on_the_pipeline(): void
    {
        $rep = $this->person();
        Enquiry::create(['name' => 'Deal Co', 'email' => 'deal@co.ug', 'product_category' => 'FET', 'message' => 'x']);
        $this->as($rep)->putJson('/api/admin/customers/deal', ['email' => 'deal@co.ug', 'deal_value' => 3245000, 'deal_product' => 'FET', 'expected_close' => today()->addDays(10)->toDateString()])
            ->assertOk()->assertJsonPath('data.deal_value', 3245000);

        $row = collect($this->as($rep)->getJson('/api/admin/customers?per_page=500')->assertOk()->json('data'))->firstWhere('email', 'deal@co.ug');
        $this->assertSame(3245000, $row['deal_value']);
    }

    public function test_only_the_author_or_an_admin_can_remove_an_activity_and_outsiders_get_nothing(): void
    {
        $a = $this->person(); $b = $this->person();
        $id = $this->as($a)->postJson('/api/admin/crm/activities', ['email' => 'c@d.ug', 'kind' => 'note', 'summary' => 'x'])->json('data.id');
        $this->as($b)->deleteJson("/api/admin/crm/activities/{$id}")->assertForbidden();
        $this->as($a)->deleteJson("/api/admin/crm/activities/{$id}")->assertOk();

        $this->as($this->person('ops', 'it'))->getJson('/api/admin/crm/today')->assertForbidden();
    }

    public function test_today_flags_enquiries_asking_for_a_free_assessment(): void
    {
        $rep = $this->person();
        Enquiry::create(['name' => 'Fleet', 'email' => 'f@l.ug', 'product_category' => 'FET', 'message' => 'x', 'status' => 'new', 'requirements' => [
            ['key' => 'assessment', 'label' => 'Free assessment?', 'value' => 'Ndiyo, karibuni mtutembelee'],
            ['key' => 'assessment_where', 'label' => 'Where', 'value' => 'Namanve depot'],
            ['key' => 'contact_pref', 'label' => 'Contact', 'value' => 'WhatsApp'],
        ]]);

        $e = $this->as($rep)->getJson('/api/admin/crm/today')->assertOk()->json('data.new_enquiries.0');
        $this->assertTrue($e['wants_assessment']);
        $this->assertSame('Namanve depot', $e['assessment_where']);
        $this->assertSame('WhatsApp', $e['contact_pref']);
    }
}
