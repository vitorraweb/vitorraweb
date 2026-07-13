<?php

namespace App\Support;

use App\Models\Communication;
use App\Models\CustomerNote;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Who to notify when a contact replies (via the portal or by email). Tries
 * the pipeline owner first, then whoever last emailed this contact, and
 * falls back to the whole admin/ops team so a reply is never silently missed.
 */
class ContactOwner
{
    /** @return Collection<int, User> */
    public static function resolve(string $email): Collection
    {
        $key = mb_strtolower(trim($email));

        $owner = CustomerNote::where('email', $key)->value('owner_id');
        if ($owner) {
            $user = User::find($owner);
            if ($user) {
                return collect([$user]);
            }
        }

        $lastSenderId = Communication::whereRaw('lower(email) = ?', [$key])
            ->where('direction', 'outbound')
            ->whereNotNull('sent_by')
            ->latest()
            ->value('sent_by');
        if ($lastSenderId) {
            $user = User::find($lastSenderId);
            if ($user) {
                return collect([$user]);
            }
        }

        return User::whereIn('role', ['admin', 'ops'])->get();
    }
}
