<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ScreenAdNotice;
use App\Models\ScreenAdBooking;
use App\Models\Setting;
use App\Rules\PhoneNumber;
use App\Services\ScreenAds\Pricing;
use App\Support\Phone;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

/**
 * Public side of advertising on the street screen: price, book, pay by bank
 * transfer, upload the proof, follow the booking. Hidden until Finance approves
 * the prices: everything but an existing booking's own link answers 404 unless
 * SCREEN_ADS_ENABLED is on or the preview key is sent.
 */
class ScreenAdController extends Controller
{
    /** Vercel Blob only: a booking can never point the screen at another host. */
    private const VIDEO_URL = '#^https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/screen-ads/[A-Za-z0-9._\-/%]+\.mp4$#';

    public function pricing(Request $request, Pricing $pricing): JsonResponse
    {
        $this->guard($request);

        return response()->json(['data' => $pricing->forWebsite()]);
    }

    public function store(Request $request, Pricing $pricing): JsonResponse
    {
        $this->guard($request);
        $c = config('screen_ads');

        $data = $request->validate([
            'company'        => ['required', 'string', 'max:255'],
            'contact_name'   => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'max:255'],
            'phone'          => ['required', 'string', 'max:50', new PhoneNumber()],
            'notes'          => ['nullable', 'string', 'max:1000'],
            'duration'       => ['required', 'integer', Rule::in(array_keys($c['durations']))],
            'visibility'     => ['required', Rule::in(array_keys($c['visibility']))],
            'days'           => ['required', 'array', 'min:1', 'max:7'],
            'days.*'         => ['required', Rule::in(ScreenAdBooking::DAYS), 'distinct'],
            'periods'        => ['required', 'array', 'min:1'],
            'periods.*'      => ['required', Rule::in(array_keys($c['periods'])), 'distinct'],
            'start_date'     => ['required', 'date_format:Y-m-d', 'after_or_equal:'.now('Africa/Kampala')->addDays($c['lead_days'])->toDateString()],
            'video_url'      => ['required', 'string', 'max:500', 'regex:'.self::VIDEO_URL],
            'video_seconds'  => ['required', 'numeric', 'min:1', 'max:120'],
            'video_width'    => ['required', 'integer', 'min:'.$c['video']['min_width']],
            'video_height'   => ['required', 'integer', 'min:1'],
            'video_size'     => ['required', 'integer', 'min:1', 'max:'.($c['video']['max_mb'] * 1024 * 1024)],
            'terms_accepted' => ['required', 'accepted'],
        ]);

        if (abs($data['video_seconds'] - $data['duration']) > $c['video']['tolerance_seconds']) {
            return response()->json(['message' => "Your video must be {$data['duration']} seconds long.", 'errors' => ['video_seconds' => ["Your video must be {$data['duration']} seconds long."]]], 422);
        }
        if ($data['video_width'] <= $data['video_height']) {
            return response()->json(['message' => 'Your video must be landscape.', 'errors' => ['video_width' => ['Your video must be landscape.']]], 422);
        }

        try {
            $quote = $pricing->quote((int) $data['duration'], $data['visibility'], count($data['days']));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $token = Str::random(48);
        $start = \Illuminate\Support\Carbon::parse($data['start_date']);
        $booking = ScreenAdBooking::create([
            'reference'         => ScreenAdBooking::nextReference(),
            'access_token_hash' => hash('sha256', $token),
            'status'            => ScreenAdBooking::AWAITING_PAYMENT,
            'company'           => $data['company'],
            'contact_name'      => $data['contact_name'],
            'email'             => $data['email'],
            'phone'             => Phone::e164($data['phone']),
            'notes'             => $data['notes'] ?? null,
            'duration_seconds'  => $data['duration'],
            'visibility'        => $data['visibility'],
            'plays_per_hour'    => $quote['plays_per_hour'],
            'days'              => array_values(array_intersect(ScreenAdBooking::DAYS, $data['days'])),
            'periods'           => array_values($data['periods']),
            'start_date'        => $start,
            'end_date'          => $start->copy()->addDays($c['campaign_days'] - 1),
            'monthly_ugx'       => $quote['monthly_ugx'],
            'pricing_snapshot'  => $quote,
            'video_url'         => $data['video_url'],
            'video_seconds'     => $data['video_seconds'],
            'video_width'       => $data['video_width'],
            'video_height'      => $data['video_height'],
            'video_size'        => $data['video_size'],
        ]);

        $this->notify($booking->email, new ScreenAdNotice(
            "Your screen booking {$booking->reference}",
            [
                'Thank you. Your campaign is reserved, and we need your bank transfer to continue.',
                'Amount: UGX '.number_format($booking->monthly_ugx),
                'Use your reference '.$booking->reference.' on the transfer, then upload your proof of payment using the link below.',
                'Your advert goes on screen after we confirm payment and review your video. If we cannot run it, we will contact you about a refund.',
            ],
            $this->link($token), 'View your booking',
        ));
        $this->notify(config('mail.team_address'), new ScreenAdNotice("New screen booking {$booking->reference}", [
            "{$booking->company}: {$booking->duration_seconds}-second advert, UGX ".number_format($booking->monthly_ugx).'. Awaiting payment.',
        ]));

        return response()->json(['data' => $this->present($booking) + ['token' => $token]], 201);
    }

    public function show(string $token): JsonResponse
    {
        $booking = ScreenAdBooking::findByToken($token);
        abort_unless($booking, 404);

        return response()->json(['data' => $this->present($booking)]);
    }

    public function proof(Request $request, string $token): JsonResponse
    {
        $booking = ScreenAdBooking::findByToken($token);
        abort_unless($booking, 404);
        if (! in_array($booking->status, [ScreenAdBooking::AWAITING_PAYMENT, ScreenAdBooking::PAYMENT_SUBMITTED], true)) {
            return response()->json(['message' => 'This booking is past the payment step.'], 422);
        }

        // Kept small: this travels through the website, which caps upload size.
        $request->validate(['proof' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:4096']]);
        $file = $request->file('proof');

        $booking->update([
            'proof_path' => SecureFile::storeUpload($file, 'screen-ads/proofs'),
            'proof_name' => substr($file->getClientOriginalName(), 0, 200),
            'proof_at'   => now(),
            'status'     => ScreenAdBooking::PAYMENT_SUBMITTED,
        ]);

        $this->notify(config('mail.team_address'), new ScreenAdNotice("Payment proof for {$booking->reference}", [
            "{$booking->company} uploaded proof of UGX ".number_format($booking->monthly_ugx).'. Finance to check the bank and confirm.',
        ]));

        return response()->json(['data' => $this->present($booking->fresh())]);
    }

    /** What may be on the street screen right now. */
    public function onAir(): JsonResponse
    {
        $now = now();
        $ads = ScreenAdBooking::where('status', ScreenAdBooking::APPROVED)->get()
            ->filter(fn (ScreenAdBooking $b) => $b->isOnAirAt($now))
            ->map(fn (ScreenAdBooking $b) => ['id' => $b->id, 'url' => $b->video_url, 'seconds' => $b->duration_seconds, 'plays_per_hour' => $b->plays_per_hour])
            ->values();

        return response()->json(['data' => $ads])->header('Cache-Control', 'public, max-age=60');
    }

    private function guard(Request $request): void
    {
        $key = (string) config('screen_ads.preview_key');
        $preview = $key !== '' && hash_equals($key, (string) $request->header('X-Screen-Ads-Preview'));
        abort_unless(config('screen_ads.enabled') || $preview, 404);
    }

    private function present(ScreenAdBooking $b): array
    {
        return [
            'reference'   => $b->reference,
            'status'      => $b->status,
            'company'     => $b->company,
            'duration'    => $b->duration_seconds,
            'visibility'  => config("screen_ads.visibility.{$b->visibility}.label", $b->visibility),
            'plays_per_hour' => $b->plays_per_hour,
            'days'        => $b->days,
            'periods'     => collect($b->periods)->map(fn ($p) => config("screen_ads.periods.$p.label", $p))->values(),
            'start_date'  => $b->start_date->toDateString(),
            'end_date'    => $b->end_date->toDateString(),
            'monthly_ugx' => $b->monthly_ugx,
            'proof_received' => (bool) $b->proof_at,
            'review_note' => $b->status === ScreenAdBooking::REJECTED ? $b->review_note : null,
            // Only while there is something to pay.
            'bank' => in_array($b->status, [ScreenAdBooking::AWAITING_PAYMENT, ScreenAdBooking::PAYMENT_SUBMITTED], true) ? [
                'bank' => Setting::get('bank_name'), 'account_name' => Setting::get('bank_account_name'),
                'branch' => Setting::get('bank_branch'), 'account_number' => Setting::get('bank_account_ugx'),
                'swift' => Setting::get('bank_swift'),
            ] : null,
        ];
    }

    private function link(string $token): string
    {
        return rtrim((string) config('screen_ads.site_url'), '/').'/advertise/booking/'.$token;
    }

    /** A failed email must never lose a booking the customer has already made. */
    private function notify(string $to, ScreenAdNotice $mail): void
    {
        try { Mail::to($to)->send($mail); }
        catch (\Throwable $e) { Log::warning('Screen ad email failed', ['to' => $to, 'error' => $e->getMessage()]); }
    }
}
