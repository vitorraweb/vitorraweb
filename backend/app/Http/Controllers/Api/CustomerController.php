<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\CustomerNote;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Prospect;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Contact directory — everyone who has engaged with Vitorra, aggregated by
     * email across enquiries, orders, and contact messages. (No registered
     * accounts exist yet; this is the de-facto customer list.)
     */
    public function index(Request $request): JsonResponse
    {
        $contacts = $this->aggregate();

        if ($request->filled('q')) {
            $q = mb_strtolower($request->q);
            $contacts = array_filter($contacts, fn ($c) =>
                str_contains(mb_strtolower($c['name'] . ' ' . $c['email'] . ' ' . ($c['company'] ?? '')), $q));
        }

        if ($request->filled('stage')) {
            $contacts = array_filter($contacts, fn ($c) => $c['stage'] === $request->query('stage'));
        }

        if ($request->filled('owner')) {
            $owner = $request->query('owner');
            $contacts = $owner === 'none'
                ? array_filter($contacts, fn ($c) => $c['owner'] === null)
                : array_filter($contacts, fn ($c) => $c['owner'] !== null && (string) $c['owner']['id'] === (string) $owner);
        }

        $contacts = array_values($contacts);
        usort($contacts, fn ($a, $b) => strcmp($b['last_activity'], $a['last_activity']));

        $page  = max(1, (int) $request->get('page', 1));
        $per   = min(500, max(1, (int) $request->get('per_page', 25)));
        $total = count($contacts);

        return response()->json([
            'data'         => array_slice($contacts, ($page - 1) * $per, $per),
            'current_page' => $page,
            'last_page'    => max(1, (int) ceil($total / $per)),
            'per_page'     => $per,
            'total'        => $total,
            'assignees'    => User::whereIn('role', ['admin', 'ops'])->orderBy('name')->get(['id', 'name', 'department']),
            'stages'       => CustomerNote::STAGES,
            'stage_labels' => CustomerNote::STAGE_LABELS,
        ]);
    }

    /** A single contact's prospects, enquiries, orders, messages, and pipeline info. */
    public function detail(Request $request): JsonResponse
    {
        $email = (string) $request->query('email', '');
        if ($email === '') {
            return response()->json(['message' => 'An email is required.'], 422);
        }
        $key = mb_strtolower(trim($email));

        $note = CustomerNote::with('owner:id,name')->where('email', $key)->first();

        return response()->json(['data' => [
            'email'     => $email,
            'prospects' => Prospect::whereRaw('lower(email) = ?', [$key])->latest()
                ->get(['id', 'name', 'category', 'outreach_status', 'assigned_to', 'created_at']),
            'enquiries' => Enquiry::whereRaw('lower(email) = ?', [$key])->latest()
                ->get(['id', 'product_category', 'message', 'status', 'assigned_to', 'created_at']),
            'orders'    => Order::whereRaw('lower(customer_email) = ?', [$key])->latest()
                ->get(['id', 'reference', 'currency', 'total', 'status', 'payment_status', 'created_at']),
            'messages'  => ContactMessage::whereRaw('lower(email) = ?', [$key])->latest()
                ->get(['id', 'subject', 'message', 'status', 'created_at']),
            'note'           => optional($note)->note,
            'pipeline_stage' => optional($note)->pipeline_stage,
            'owner'          => optional($note)->owner,
        ]]);
    }

    /** Upsert the internal note for a contact. */
    public function saveNote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'note'  => ['nullable', 'string', 'max:5000'],
        ]);

        CustomerNote::updateOrCreate(
            ['email' => mb_strtolower(trim($data['email']))],
            ['note' => $data['note'] ?? null, 'updated_by' => $request->user()->name ?? null]
        );

        return response()->json(['message' => 'Note saved.']);
    }

    /** Set the pipeline owner and/or stage override for a contact. */
    public function updatePipeline(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'          => ['required', 'email'],
            'name'           => ['nullable', 'string', 'max:255'],
            'owner_id'       => ['nullable', 'integer', 'exists:users,id'],
            'pipeline_stage' => ['nullable', Rule::in(CustomerNote::STAGES)],
        ]);

        $email = mb_strtolower(trim($data['email']));

        CustomerNote::updateOrCreate(
            ['email' => $email],
            [
                'owner_id'       => $data['owner_id'] ?? null,
                'pipeline_stage' => $data['pipeline_stage'] ?? null,
                'updated_by'     => $request->user()->name ?? null,
            ]
        );

        // Moving a contact into a "follow-up" stage with an owner assigned
        // auto-creates a reminder task for that owner (deduped per contact).
        $followupStages = config('pipeline.auto_followup.stages', []);
        if (! empty($data['owner_id']) && in_array($data['pipeline_stage'] ?? null, $followupStages, true)) {
            $alreadyTracked = Task::where('contact_email', $email)->where('status', '!=', 'done')->exists();
            if (! $alreadyTracked) {
                Task::create([
                    'title'         => 'Follow up: '.($data['name'] ?? $email),
                    'contact_email' => $email,
                    'assigned_to'   => $data['owner_id'],
                    'created_by'    => $request->user()->id,
                    'status'        => 'todo',
                    'priority'      => 'normal',
                    'due_date'      => now()->addDays(config('pipeline.auto_followup.due_in_days', 3)),
                    'department'    => User::find($data['owner_id'])?->department,
                ]);
            }
        }

        return response()->json(['message' => 'Pipeline updated.']);
    }

    /**
     * Contacts in an active pipeline stage that have gone idle past the
     * configured threshold for that stage. Used by the dashboard alerts
     * endpoint and the daily digest email.
     */
    public function staleContacts(?int $ownerId = null, int $limit = 10): array
    {
        $stale = array_values(array_filter($this->aggregate(), fn ($c) =>
            $c['stale'] && ($ownerId === null || ($c['owner']['id'] ?? null) === $ownerId)));

        usort($stale, fn ($a, $b) => strcmp($a['last_activity'], $b['last_activity'])); // oldest first

        return [
            'count' => count($stale),
            'items' => array_map(fn ($c) => [
                'email'         => $c['email'],
                'name'          => $c['name'],
                'stage'         => $c['stage'],
                'owner'         => $c['owner'],
                'last_activity' => $c['last_activity'],
                'days_idle'     => (int) abs(now()->diffInDays($c['last_activity'])),
            ], array_slice($stale, 0, $limit)),
        ];
    }

    /* ── Aggregation ──────────────────────────────────────────────────────── */

    private function aggregate(): array
    {
        $records = [];

        foreach (Enquiry::get(['email', 'name', 'company', 'phone', 'country', 'status', 'created_at']) as $e) {
            $records[] = ['email' => $e->email, 'name' => $e->name, 'company' => $e->company,
                'phone' => $e->phone, 'country' => $e->country, 'ts' => (string) $e->created_at, 'src' => 'enquiries', 'status' => $e->status];
        }
        foreach (Order::get(['customer_email', 'customer_name', 'customer_phone', 'shipping_address', 'status', 'created_at']) as $o) {
            $country = is_array($o->shipping_address) ? ($o->shipping_address['country'] ?? null) : null;
            $records[] = ['email' => $o->customer_email, 'name' => $o->customer_name, 'company' => null,
                'phone' => $o->customer_phone, 'country' => $country, 'ts' => (string) $o->created_at, 'src' => 'orders', 'status' => $o->status];
        }
        foreach (ContactMessage::get(['email', 'name', 'created_at']) as $m) {
            $records[] = ['email' => $m->email, 'name' => $m->name, 'company' => null,
                'phone' => null, 'country' => null, 'ts' => (string) $m->created_at, 'src' => 'messages', 'status' => null];
        }
        foreach (Prospect::get(['email', 'name', 'phone', 'outreach_status', 'created_at']) as $p) {
            $records[] = ['email' => $p->email, 'name' => $p->name, 'company' => null,
                'phone' => $p->phone, 'country' => null, 'ts' => (string) $p->created_at, 'src' => 'prospects', 'status' => $p->outreach_status];
        }

        $records = array_filter($records, fn ($r) => ! empty($r['email']));
        usort($records, fn ($a, $b) => strcmp($a['ts'], $b['ts'])); // ascending — most recent wins

        $map = [];
        foreach ($records as $rec) {
            $key = mb_strtolower(trim($rec['email']));
            if (! isset($map[$key])) {
                $map[$key] = [
                    'email' => $rec['email'], 'name' => $rec['name'] ?? '', 'company' => null, 'phone' => null, 'country' => null,
                    'enquiries' => 0, 'orders' => 0, 'messages' => 0, 'prospects' => 0,
                    'first_seen' => $rec['ts'], 'last_activity' => $rec['ts'], 'has_note' => false,
                    '_order_statuses' => [], '_enquiry_statuses' => [], '_prospect_statuses' => [],
                ];
            }
            $map[$key][$rec['src']]++;
            foreach (['name', 'company', 'phone', 'country'] as $f) {
                if (! empty($rec[$f])) {
                    $map[$key][$f] = $rec[$f];
                }
            }
            if ($rec['ts'] > $map[$key]['last_activity']) {
                $map[$key]['last_activity'] = $rec['ts'];
            }
            if ($rec['ts'] < $map[$key]['first_seen']) {
                $map[$key]['first_seen'] = $rec['ts'];
            }
            if ($rec['status'] !== null) {
                match ($rec['src']) {
                    'orders'    => $map[$key]['_order_statuses'][] = $rec['status'],
                    'enquiries' => $map[$key]['_enquiry_statuses'][] = $rec['status'],
                    'prospects' => $map[$key]['_prospect_statuses'][] = $rec['status'],
                    default     => null,
                };
            }
        }

        $notes = CustomerNote::with('owner:id,name')->get()->keyBy('email'); // keyed by stored (lower-cased) email

        foreach ($map as $key => &$contact) {
            $derived = CustomerNote::deriveStage($contact['_order_statuses'], $contact['_enquiry_statuses'], $contact['_prospect_statuses']);
            $note = $notes->get($key);

            $contact['has_note'] = $note !== null && trim((string) $note->note) !== '';
            $contact['pipeline_stage'] = $note?->pipeline_stage;
            $contact['stage'] = $note?->pipeline_stage ?? $derived;
            $contact['owner'] = $note?->owner ? ['id' => $note->owner->id, 'name' => $note->owner->name] : null;

            $staleThresholds = config('pipeline.stale_days', []);
            $contact['stale'] = isset($staleThresholds[$contact['stage']])
                && abs(now()->diffInDays($contact['last_activity'])) >= $staleThresholds[$contact['stage']];

            unset($contact['_order_statuses'], $contact['_enquiry_statuses'], $contact['_prospect_statuses']);
        }
        unset($contact);

        return array_values($map);
    }
}
