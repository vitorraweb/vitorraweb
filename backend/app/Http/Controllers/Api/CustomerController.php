<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\CustomerNote;
use App\Models\Enquiry;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $contacts = array_values($contacts);
        usort($contacts, fn ($a, $b) => strcmp($b['last_activity'], $a['last_activity']));

        $page  = max(1, (int) $request->get('page', 1));
        $per   = 25;
        $total = count($contacts);

        return response()->json([
            'data'         => array_slice($contacts, ($page - 1) * $per, $per),
            'current_page' => $page,
            'last_page'    => max(1, (int) ceil($total / $per)),
            'per_page'     => $per,
            'total'        => $total,
        ]);
    }

    /** A single contact's enquiries, orders, messages, and internal note. */
    public function detail(Request $request): JsonResponse
    {
        $email = (string) $request->query('email', '');
        if ($email === '') {
            return response()->json(['message' => 'An email is required.'], 422);
        }
        $key = mb_strtolower(trim($email));

        return response()->json(['data' => [
            'email'     => $email,
            'enquiries' => Enquiry::whereRaw('lower(email) = ?', [$key])->latest()
                ->get(['id', 'product_category', 'message', 'status', 'assigned_to', 'created_at']),
            'orders'    => Order::whereRaw('lower(customer_email) = ?', [$key])->latest()
                ->get(['id', 'reference', 'currency', 'total', 'status', 'payment_status', 'created_at']),
            'messages'  => ContactMessage::whereRaw('lower(email) = ?', [$key])->latest()
                ->get(['id', 'subject', 'message', 'status', 'created_at']),
            'note'      => optional(CustomerNote::where('email', $key)->first())->note,
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

    /* ── Aggregation ──────────────────────────────────────────────────────── */

    private function aggregate(): array
    {
        $records = [];

        foreach (Enquiry::get(['email', 'name', 'company', 'phone', 'country', 'created_at']) as $e) {
            $records[] = ['email' => $e->email, 'name' => $e->name, 'company' => $e->company,
                'phone' => $e->phone, 'country' => $e->country, 'ts' => (string) $e->created_at, 'src' => 'enquiries'];
        }
        foreach (Order::get(['customer_email', 'customer_name', 'customer_phone', 'shipping_address', 'created_at']) as $o) {
            $country = is_array($o->shipping_address) ? ($o->shipping_address['country'] ?? null) : null;
            $records[] = ['email' => $o->customer_email, 'name' => $o->customer_name, 'company' => null,
                'phone' => $o->customer_phone, 'country' => $country, 'ts' => (string) $o->created_at, 'src' => 'orders'];
        }
        foreach (ContactMessage::get(['email', 'name', 'created_at']) as $m) {
            $records[] = ['email' => $m->email, 'name' => $m->name, 'company' => null,
                'phone' => null, 'country' => null, 'ts' => (string) $m->created_at, 'src' => 'messages'];
        }

        $records = array_filter($records, fn ($r) => ! empty($r['email']));
        usort($records, fn ($a, $b) => strcmp($a['ts'], $b['ts'])); // ascending — most recent wins

        $notes = CustomerNote::pluck('note', 'email'); // keyed by stored (lower-cased) email

        $map = [];
        foreach ($records as $rec) {
            $key = mb_strtolower(trim($rec['email']));
            if (! isset($map[$key])) {
                $map[$key] = [
                    'email' => $rec['email'], 'name' => $rec['name'] ?? '', 'company' => null, 'phone' => null, 'country' => null,
                    'enquiries' => 0, 'orders' => 0, 'messages' => 0,
                    'first_seen' => $rec['ts'], 'last_activity' => $rec['ts'], 'has_note' => false,
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
            $map[$key]['has_note'] = isset($notes[$key]) && trim((string) $notes[$key]) !== '';
        }

        return array_values($map);
    }
}
