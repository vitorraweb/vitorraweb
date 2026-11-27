<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enquiry extends Model
{
    protected $fillable = [
        'product_category',
        'name',
        'email',
        'company',
        'phone',
        'country',
        'message',
        'requirements',
        'status',
        'assigned_to',
        'assigned_user_id',
        'replied_at',
        'lead_source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'attribution',
    ];

    protected $casts = [
        'requirements'     => 'array',
        'attribution'      => 'array',
        'replied_at'       => 'datetime',
        'sla_notified_at'  => 'datetime',
        'sla_escalated_at' => 'datetime',
        'ads_click_checked_at'       => 'datetime',
        'ads_conversion_uploaded_at' => 'datetime',
    ];

    /** The Google Ads click id (gclid) this lead arrived with, if any. */
    public function googleClickId(): ?string
    {
        return $this->attribution['gclid'] ?? null;
    }

    /** Minutes within which an identical submission counts as the same lead. */
    public const DUPLICATE_WINDOW_MINUTES = 10;

    /**
     * The lead this submission repeats, if the same person sent the same thing
     * for the same product a few minutes ago: a double tap on a slow phone
     * connection, or "it didn't seem to send, let me try again". Returning the
     * first one means the team is told once, the lead is counted once, and
     * the ad conversion (keyed on the lead's id) is reported once.
     *
     * A genuinely new message from the same person is a new enquiry.
     */
    public static function recentDuplicate(string $email, ?string $product, ?string $message, ?array $requirements = null): ?self
    {
        $candidates = self::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($email))])
            ->where('created_at', '>=', now()->subMinutes(self::DUPLICATE_WINDOW_MINUTES))
            ->when(filled($product), fn ($q) => $q->where('product_category', $product), fn ($q) => $q->where(fn ($w) => $w->whereNull('product_category')->orWhere('product_category', '')))
            ->latest('id')->take(5)->get();

        return $candidates->first(fn (self $e) => trim((string) $e->message) === trim((string) $message)
            && json_encode($e->requirements ?? []) === json_encode($requirements ?? []));
    }

    public function isNew(): bool
    {
        return $this->status === 'new';
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** The specific staff member this enquiry is assigned to, if any (vs. just a team). */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
