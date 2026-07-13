<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\StaffReply;
use App\Models\Communication;
use App\Models\ContactMessage;
use App\Models\CustomerNote;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Prospect;
use App\Models\Task;
use App\Models\User;
use App\Notifications\PipelineContactAssigned;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

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
            'assignees'    => User::whereIn('role', ['admin', 'ops'])->orderBy('name')->get(['id', 'name', 'email', 'department']),
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

        // Opening a contact's thread clears its "unread reply" indicator.
        Communication::whereRaw('lower(email) = ?', [$key])
            ->where('direction', 'inbound')->whereNull('staff_read_at')
            ->update(['staff_read_at' => now()]);

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
            'communications' => Communication::with('sender:id,name')->whereRaw('lower(email) = ?', [$key])->latest()
                ->get(['id', 'email', 'direction', 'channel', 'subject', 'body', 'cc', 'attachments', 'sent_by', 'created_at'])
                ->map(fn (Communication $c) => [
                    'id' => $c->id, 'email' => $c->email, 'direction' => $c->direction, 'channel' => $c->channel,
                    'subject' => $c->subject, 'body' => $c->body, 'cc' => $c->cc, 'sender' => $c->sender,
                    'attachments' => collect($c->attachments ?? [])->map(fn ($a, $i) => ['index' => $i, 'name' => $a['name'], 'size' => $a['size']])->values(),
                    'created_at' => $c->created_at,
                ]),
            'note'             => optional($note)->note,
            'pipeline_stage'   => optional($note)->pipeline_stage,
            'owner'            => optional($note)->owner,
            'override_name'    => optional($note)->override_name,
            'override_phone'   => optional($note)->override_phone,
            'override_company' => optional($note)->override_company,
            'override_country' => optional($note)->override_country,
            'tags'             => optional($note)->tags ?? [],
        ]]);
    }

    /**
     * Correct the canonical display info for a contact (name, phone, company,
     * country). These override values take priority over whatever arrived from
     * enquiries/orders/messages in the aggregate.
     */
    public function updateInfo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'            => ['required', 'email'],
            'override_name'    => ['nullable', 'string', 'max:255'],
            'override_phone'   => ['nullable', 'string', 'max:50'],
            'override_company' => ['nullable', 'string', 'max:255'],
            'override_country' => ['nullable', 'string', 'max:100'],
        ]);

        $email = mb_strtolower(trim($data['email']));

        CustomerNote::updateOrCreate(
            ['email' => $email],
            [
                'override_name'    => $data['override_name'] ?? null,
                'override_phone'   => $data['override_phone'] ?? null,
                'override_company' => $data['override_company'] ?? null,
                'override_country' => $data['override_country'] ?? null,
                'updated_by'       => $request->user()->name ?? null,
            ]
        );

        return response()->json(['message' => 'Contact info updated.']);
    }

    /** Update the label tags for a contact (full replacement). */
    public function updateTags(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'  => ['required', 'email'],
            'tags'   => ['required', 'array'],
            'tags.*' => ['string', 'max:50'],
        ]);

        $email = mb_strtolower(trim($data['email']));
        $tags  = array_values(array_unique(array_filter(array_map('trim', $data['tags']))));

        CustomerNote::updateOrCreate(
            ['email' => $email],
            ['tags' => $tags ?: null, 'updated_by' => $request->user()->name ?? null]
        );

        return response()->json(['tags' => $tags]);
    }

    /** Stream all contacts as a CSV download. */
    public function export(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $contacts = $this->aggregate();

        return response()->stream(function () use ($contacts) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Email', 'Name', 'Company', 'Phone', 'Country', 'Tags', 'Stage', 'Enquiries', 'Orders', 'Messages', 'First Seen', 'Last Activity']);
            foreach ($contacts as $c) {
                fputcsv($out, [
                    $c['email'],
                    $c['name'] ?? '',
                    $c['company'] ?? '',
                    $c['phone'] ?? '',
                    $c['country'] ?? '',
                    implode(', ', $c['tags'] ?? []),
                    $c['stage'] ?? '',
                    $c['enquiries'],
                    $c['orders'],
                    $c['messages'],
                    $c['first_seen'],
                    $c['last_activity'],
                ]);
            }
            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="customers-' . now()->format('Y-m-d') . '.csv"',
            'Cache-Control'       => 'no-cache, no-store',
        ]);
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

    /**
     * Send a reply to a contact from within the admin — records it on the
     * contact's conversation thread and emails them, with reply-to set to
     * the sending staff member's own inbox.
     */
    public function sendReply(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'          => ['required', 'email'],
            'name'           => ['nullable', 'string', 'max:255'],
            'subject'        => ['nullable', 'string', 'max:255'],
            'body'           => ['required', 'string', 'max:5000'],
            'related_type'   => ['nullable', 'in:enquiry,message'],
            'related_id'     => ['nullable', 'integer'],
            'cc'             => ['nullable', 'array', 'max:5'],
            'cc.*'           => ['email'],
            'attachments.*'  => ['file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:8192'],
        ]);

        $email   = mb_strtolower(trim($data['email']));
        $subject = $data['subject'] ?? 'Re: your message to Vitorra';
        $toName  = $data['name'] ?? $email;
        $cc      = array_values(array_unique(array_map('mb_strtolower', $data['cc'] ?? [])));

        $files = $request->file('attachments', []);
        $dir   = 'communications/'.sha1($email);
        $attachments = collect($files)->map(fn ($file) => [
            'name' => $file->getClientOriginalName(),
            'path' => SecureFile::storeUpload($file, $dir),
            'size' => $file->getSize(),
            'mime' => $file->getClientMimeType(),
        ])->values()->all();

        $communication = Communication::create([
            'email'        => $email,
            'direction'    => 'outbound',
            'channel'      => 'email',
            'subject'      => $subject,
            'body'         => $data['body'],
            'cc'           => $cc ?: null,
            'attachments'  => $attachments ?: null,
            'sent_by'      => $request->user()->id,
            'related_type' => $data['related_type'] ?? null,
            'related_id'   => $data['related_id'] ?? null,
        ]);

        Mail::to($email)->send(new StaffReply($toName, $subject, $data['body'], $request->user(), $cc, $attachments));

        if (($data['related_type'] ?? null) === 'enquiry' && ! empty($data['related_id'])) {
            Enquiry::where('id', $data['related_id'])->whereNull('replied_at')->update(['replied_at' => now()]);
        }

        return response()->json(['data' => $communication->load('sender:id,name')]);
    }

    /** Download an attachment on a reply (admin/ops only, no per-contact ownership check needed). */
    public function downloadCommunicationAttachment(Communication $communication, int $index): HttpResponse
    {
        $attachment = ($communication->attachments ?? [])[$index] ?? null;
        abort_if($attachment === null, 404);

        return SecureFile::download($attachment['path'], $attachment['name']);
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
        $previousOwnerId = CustomerNote::where('email', $email)->value('owner_id');

        CustomerNote::updateOrCreate(
            ['email' => $email],
            [
                'owner_id'       => $data['owner_id'] ?? null,
                'pipeline_stage' => $data['pipeline_stage'] ?? null,
                'updated_by'     => $request->user()->name ?? null,
            ]
        );

        // Notify only on an actual new assignment to someone — not a no-op
        // reassignment to the same owner, and not on unassigning.
        if (
            ! empty($data['owner_id'])
            && $data['owner_id'] !== $previousOwnerId
        ) {
            User::find($data['owner_id'])?->notify(new PipelineContactAssigned(
                $data['name'] ?? $email,
                $email,
                $data['pipeline_stage'] ?? null,
            ));
        }

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

        $notes = CustomerNote::with('owner:id,name')->get()->keyBy('email');

        $unreadEmails = Communication::where('direction', 'inbound')->whereNull('staff_read_at')
            ->pluck('email')->map(fn ($e) => mb_strtolower(trim($e)))->unique();

        foreach ($map as $key => &$contact) {
            $contact['has_unread'] = $unreadEmails->contains($key);
            // Staff overrides win over any source-record values.
            $note = $notes->get($key);
            if ($note) {
                foreach (['name' => 'override_name', 'phone' => 'override_phone', 'company' => 'override_company', 'country' => 'override_country'] as $field => $col) {
                    if (! empty($note->$col)) {
                        $contact[$field] = $note->$col;
                    }
                }
            }
            $derived = CustomerNote::deriveStage($contact['_order_statuses'], $contact['_enquiry_statuses'], $contact['_prospect_statuses']);

            $contact['has_note'] = $note !== null && trim((string) $note->note) !== '';
            $contact['tags']          = $note?->tags ?? [];
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
