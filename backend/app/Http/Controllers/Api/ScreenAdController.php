<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ScreenAdNotice;
use App\Models\ScreenAdBooking;
use App\Models\Setting;
use App\Rules\PhoneNumber;
use App\Support\Phone;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Public side of advertising on the street screen: price, book, pay by bank
 * transfer, upload the proof, follow the booking. Hidden until Finance approves
 * the prices: everything but an existing booking's own link answers 404 unless
 * SCREEN_ADS_ENABLED is on or the preview key is sent.
 */
class ScreenAdController extends Controller
{
    /** Vercel Blob only: a booking can never point the screen at another host. */
    private const VIDEO_URL = '#^https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/screen-ads/[A-Za-z0-9._\-/%]+\.(mp4|png|jpe?g|webp)$#';

    public function pricing(Request $request): JsonResponse
    {
        $this->guard($request);
        $c = config('screen_ads');

        return response()->json(['data' => [
            // Airtime a day: one unit is a 15-second play every 4 minutes for the on-air day.
            'packages'  => collect($c['packages'])->map(fn ($p, $id) => ['id' => $id] + $p + ['minutes_per_day' => (int) round($p['units'] * ($c['on_air']['to'] - $c['on_air']['from']) * 3600 / $c['programme']['cycle_seconds'] * $c['programme']['unit_seconds'] / 60)])->values(),
            'slots'     => collect($c['slots'])->map(fn ($s, $id) => ['id' => $id, 'label' => $s['label'], 'hours' => $s['hours'], 'length' => $s['to'] - $s['from']])->values(),
            'lead_days' => $c['lead_days'],
            'programme' => $c['programme'],
            'on_air'    => $c['on_air']['label'],
            'video'     => $c['video'],
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->guard($request);
        $c = config('screen_ads');

        $data = $request->validate([
            'company'        => ['required', 'string', 'max:255'],
            'contact_name'   => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'max:255'],
            'phone'          => ['required', 'string', 'max:50', new PhoneNumber()],
            'notes'          => ['nullable', 'string', 'max:1000'],
            'package'        => ['required', Rule::in(array_keys($c['packages']))],
            'slots'          => ['nullable', 'array'],
            'slots.*'        => ['distinct', Rule::in(array_keys($c['slots']))],
            'start_date'     => ['required', 'date_format:Y-m-d', 'after_or_equal:'.now('Africa/Kampala')->addDays($c['lead_days'])->toDateString()],
            'media_type'     => ['nullable', Rule::in(['video', 'image'])],
            'video_url'      => ['required', 'string', 'max:500', 'regex:'.self::VIDEO_URL],
            'video_seconds'  => ['required_unless:media_type,image', 'nullable', 'numeric', 'min:1', 'max:120'],
            'video_width'    => ['required', 'integer', 'min:'.$c['video']['min_width']],
            'video_height'   => ['required', 'integer', 'min:1'],
            'video_size'     => ['required', 'integer', 'min:1', 'max:'.($c['video']['max_mb'] * 1024 * 1024)],
            'terms_accepted' => ['required', 'accepted'],
        ]);

        $seconds = $c['video']['seconds'];
        $image = ($data['media_type'] ?? 'video') === 'image';
        if ($image !== (bool) preg_match('/\.(png|jpe?g|webp)$/i', $data['video_url'])) {
            return response()->json(['message' => 'The file does not match its type.'], 422);
        }
        if ($image) {
            $data['video_seconds'] = $seconds; // A design is shown for the full 15 seconds.
            if (abs($data['video_width'] / max(1, $data['video_height']) - 16 / 9) > 0.03) {
                return response()->json(['message' => 'Your design must be 16:9, ideally 1920 × 1080.', 'errors' => ['video_width' => ['Your design must be 16:9, ideally 1920 × 1080.']]], 422);
            }
        }
        if (abs($data['video_seconds'] - $seconds) > $c['video']['tolerance_seconds']) {
            return response()->json(['message' => "Your video must be {$seconds} seconds long.", 'errors' => ['video_seconds' => ["Your video must be {$seconds} seconds long."]]], 422);
        }
        if ($data['video_width'] <= $data['video_height']) {
            return response()->json(['message' => 'Your video must be landscape.', 'errors' => ['video_width' => ['Your video must be landscape.']]], 422);
        }

        $package = $c['packages'][$data['package']];
        // All three slots is the same as all day; store it as all day.
        $slots = array_values(array_intersect(array_keys($c['slots']), $data['slots'] ?? []));
        if (count($slots) === count($c['slots'])) $slots = [];
        $probe = new ScreenAdBooking(['units' => $package['units'], 'slots' => $slots ?: null]);
        $first = \Illuminate\Support\Carbon::parse($data['start_date']);
        $free = app(\App\Services\ScreenAds\Inventory::class)->freeUnits($first, $first->copy()->addDays($package['days'] - 1), $slots ?: null);
        if ($free + 0.001 < $probe->unitsInSlot()) {
            $left = (int) floor($free + 0.001);
            $message = $slots
                ? 'Those times are fully booked on some of those days. Try other times, all day, a smaller package or a later start date.'
                : ($left > 0
                    ? "Only {$left} of the screen's units are free on some of those days. Try a smaller package, fewer times of day or a later start date."
                    : 'The screen is fully booked on some of those days. Please try a later start date.');
            return response()->json(['message' => $message, 'errors' => ['start_date' => [$message]]], 422);
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
            'package'           => $data['package'],
            'price_ugx'         => $package['price_ugx'],
            'plays_per_hour'    => $package['plays_per_hour'],
            'units'             => $package['units'],
            'slots'             => $slots ?: null,
            'start_date'        => $start,
            'end_date'          => $start->copy()->addDays($package['days'] - 1),
            'video_url'         => $data['video_url'],
            'media_type'        => $image ? 'image' : 'video',
            'video_seconds'     => $data['video_seconds'],
            'video_width'       => $data['video_width'],
            'video_height'      => $data['video_height'],
            'video_size'        => $data['video_size'],
        ]);

        $this->notify($booking->email, new ScreenAdNotice(
            "Your screen booking {$booking->reference}",
            [
                'Thank you. Your campaign is reserved, and we need your bank transfer to continue.',
                'Amount: UGX '.number_format($booking->price_ugx),
                'Use your reference '.$booking->reference.' on the transfer, then upload your proof of payment using the link below.',
                'Your advert goes on screen after we confirm payment and review your video. If we cannot run it, we will refund you in full within '.config('screen_ads.refund_working_days').' working days.',
            ],
            $this->link($token), 'View your booking',
        ));
        $this->notify(config('mail.team_address'), new ScreenAdNotice("New screen booking {$booking->reference}", [
            "{$booking->company}: {$package['label']} package, UGX ".number_format($booking->price_ugx).'. Awaiting payment.',
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
            "{$booking->company} uploaded proof of UGX ".number_format($booking->price_ugx).'. Finance to check the bank and confirm.',
        ]));

        return response()->json(['data' => $this->present($booking->fresh())]);
    }

    /** What may be on the street screen right now. */
    public function onAir(): JsonResponse
    {
        $now = now();
        $ads = ScreenAdBooking::where('status', ScreenAdBooking::APPROVED)->get()
            ->filter(fn (ScreenAdBooking $b) => $b->isOnAirAt($now))
            ->map(fn (ScreenAdBooking $b) => ['id' => $b->id, 'url' => $b->video_url, 'seconds' => (int) config('screen_ads.video.seconds'), 'plays_per_hour' => $b->playsPerHourOnAir(), 'units' => round($b->unitsInSlot(), 3), 'kind' => $b->media_type])
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
            'package'     => config("screen_ads.packages.{$b->package}.label", $b->package),
            'plays_per_hour' => $b->playsPerHourOnAir(),
            'on_air'      => $b->slots ? collect($b->slots)->map(fn ($k) => config("screen_ads.slots.$k.label").' ('.config("screen_ads.slots.$k.hours").')')->implode(', ') : 'All day, '.config('screen_ads.on_air.label'),
            'start_date'  => $b->start_date->toDateString(),
            'end_date'    => $b->end_date->toDateString(),
            'price_ugx'   => $b->price_ugx,
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
