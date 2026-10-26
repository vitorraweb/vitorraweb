<?php

namespace App\Support;

use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\Prospect;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Who a quotation or invoice may be emailed to. Sending used to be one click
 * straight to the customer, and drafts went out before they were finished.
 * Now the sender names every recipient, and each one is either:
 *
 *  - a member of the Vitorra team (active staff account) — gets a "for review"
 *    copy that says plainly the customer has NOT received it; or
 *  - a client already in the system (the document's own customer, or anyone
 *    on the prospect list, an enquiry, a contact message or a customer
 *    account) — gets the customer email.
 *
 * A typed address that is neither is refused, so a mistyped email cannot
 * carry a document to a stranger.
 */
class DocumentRecipients
{
    /** @return array{team: Collection<int, User>, clients: list<string>, note: ?string} */
    public static function fromRequest(Request $request, ?string $customerEmail): array
    {
        $data = $request->validate([
            'to'   => ['required', 'array', 'min:1', 'max:20'],
            'to.*' => ['required', 'email:rfc', 'max:255', 'distinct:ignore_case'],
            'note' => ['nullable', 'string', 'max:2000'],
        ], [
            'to.required' => 'Choose who to send it to.',
        ]);

        $emails = collect($data['to'])->map(fn ($e) => mb_strtolower(trim($e)))->unique()->values();

        $team = self::team()->filter(fn (User $u) => $emails->contains(mb_strtolower($u->email)))->values();
        $teamEmails = $team->map(fn (User $u) => mb_strtolower($u->email));

        $clients = $emails->reject(fn ($e) => $teamEmails->contains($e))->values();
        $unknown = $clients->reject(fn ($e) => ($customerEmail && $e === mb_strtolower(trim($customerEmail))) || self::isKnownClient($e));

        if ($unknown->isNotEmpty()) {
            throw ValidationException::withMessages([
                'to' => 'Not in the system: '.$unknown->implode(', ').'. Pick the client from the list, or put the address on the document as the customer email and save it first.',
            ]);
        }

        return ['team' => $team, 'clients' => $clients->all(), 'note' => $data['note'] ?? null];
    }

    /** Active Vitorra staff, for the team side of the picker. */
    public static function team(): Collection
    {
        return User::whereIn('role', ['admin', 'ops', 'employee'])
            ->where(fn ($q) => $q->whereNull('staff_status')->orWhere('staff_status', '!=', 'left'))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department', 'job_title']);
    }

    /**
     * Clients matching a search, from every place the system holds one —
     * de-duplicated by email, because the same buyer is often a prospect, an
     * enquiry and a customer account at once.
     *
     * @return list<array{email: string, name: string, company: ?string, phone: ?string, address: ?string, source: string}>
     */
    public static function searchClients(string $q, int $limit = 12): array
    {
        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $q).'%';
        $hits = collect();

        Prospect::whereNotNull('email')->where('email', '!=', '')
            ->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like))
            ->limit($limit)->get(['name', 'email', 'product', 'phone', 'location'])
            ->each(fn ($p) => $hits->push(['email' => $p->email, 'name' => $p->name, 'company' => null, 'phone' => $p->phone, 'address' => $p->location, 'source' => 'Prospect · '.$p->product]));

        User::where('role', 'customer')
            ->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('company', 'like', $like))
            ->limit($limit)->get(['name', 'email', 'company', 'phone', 'country'])
            ->each(fn ($u) => $hits->push(['email' => $u->email, 'name' => $u->name, 'company' => $u->company, 'phone' => $u->phone, 'address' => $u->country, 'source' => 'Customer account']));

        Enquiry::where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('company', 'like', $like))
            ->latest()->limit($limit)->get(['name', 'email', 'company', 'phone', 'country'])
            ->each(fn ($e) => $hits->push(['email' => $e->email, 'name' => $e->name, 'company' => $e->company, 'phone' => $e->phone, 'address' => $e->country, 'source' => 'Enquiry']));

        $staff = self::team()->map(fn (User $u) => mb_strtolower($u->email));

        return $hits
            ->filter(fn ($h) => filter_var($h['email'], FILTER_VALIDATE_EMAIL) && ! $staff->contains(mb_strtolower($h['email'])))
            ->unique(fn ($h) => mb_strtolower($h['email']))
            ->take($limit)->values()->all();
    }

    private static function isKnownClient(string $email): bool
    {
        $match = fn ($q) => $q->whereRaw('LOWER(email) = ?', [$email]);

        return $match(Prospect::query())->exists()
            || $match(User::where('role', 'customer'))->exists()
            || $match(Enquiry::query())->exists()
            || $match(ContactMessage::query())->exists();
    }
}
