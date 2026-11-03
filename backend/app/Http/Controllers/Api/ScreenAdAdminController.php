<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ScreenAdNotice;
use App\Models\ScreenAdBooking as Booking;
use App\Models\ScreenDowntime;
use App\Models\Setting;
use App\Services\ScreenAds\Inventory;
use App\Support\Audit;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Staff side of street-screen bookings. Finance confirms money in and out;
 * the screen's owners decide what runs. Nothing reaches the screen until it is
 * paid and approved, and each decision goes in the activity log.
 */
class ScreenAdAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => ['nullable', Rule::in(Booking::STATUSES)]]);

        return response()->json([
            'data' => Booking::query()->when($request->status, fn ($q, $s) => $q->where('status', $s))->latest()->limit(200)->get(),
            'statuses' => Booking::STATUSES,
        ]);
    }

    /** Units sold against the 12 and against break-even, and the screen's health. */
    public function inventory(Inventory $inventory): JsonResponse
    {
        $p = config('screen_ads.programme');
        $today = now('Africa/Kampala')->startOfDay();
        $paid = Booking::whereIn('status', [Booking::PAYMENT_CONFIRMED, Booking::APPROVED])->get();
        $last = Setting::get('display_last_seen');

        return response()->json(['data' => [
            'units' => $p['units'],
            'break_even' => $p['break_even_units'],
            'break_even_ugx' => $p['break_even_units'] * config('screen_ads.packages.standard.price_ugx'),
            'paid_today' => (int) $paid->filter(fn (Booking $b) => $b->start_date->lte($today) && $b->end_date->gte($today))->sum('units'),
            'held_by_day' => $inventory->soldByDay($today, $today->copy()->addDays(55)),
            'paid_by_day' => $inventory->soldByDay($today, $today->copy()->addDays(55), $paid),
            'screen' => [
                'connected' => (string) Setting::get('display_screen_key_hash', '') !== '',
                'last_seen' => $last,
                'scene' => Setting::get('display_last_scene'),
                'down' => ScreenDowntime::whereNull('ended_at')->exists(),
            ],
            'downtime' => ScreenDowntime::latest('started_at')->limit(30)->get()->map(fn (ScreenDowntime $d) => [
                'id' => $d->id, 'started_at' => $d->started_at, 'ended_at' => $d->ended_at, 'minutes' => $d->minutes(), 'reason' => $d->reason, 'source' => $d->source,
            ]),
        ]]);
    }

    public function report(Booking $booking, Inventory $inventory): JsonResponse
    {
        return response()->json(['data' => $inventory->delivery($booking)]);
    }

    /** The delivery report as a spreadsheet: evidence for the customer. */
    public function reportCsv(Booking $booking, Inventory $inventory): Response
    {
        $r = $inventory->delivery($booking);
        $lines = [
            ['Vitorra street screen: delivery report'],
            ['Booking', $booking->reference], ['Advertiser', $booking->company],
            ['Package', config("screen_ads.packages.{$booking->package}.label", $booking->package)],
            ['Campaign', $booking->start_date->toDateString().' to '.$booking->end_date->toDateString()],
            ['On air', 'Every day, '.config('screen_ads.on_air.label').', Kampala time'],
            [],
            ['Date', 'Plays booked', 'Plays delivered', 'Delivered %'],
        ];
        foreach ($r['days'] as $d) {
            $lines[] = [$d['date'], $d['expected'], $d['delivered'], $d['expected'] ? round(100 * $d['delivered'] / $d['expected']).'%' : ''];
        }
        $lines[] = ['Total to date', $r['expected'], $r['delivered'], $r['delivery'] !== null ? round(100 * $r['delivery']).'%' : ''];
        $out = fopen('php://temp', 'r+');
        foreach ($lines as $l) fputcsv($out, $l);
        rewind($out);
        Audit::log('screen_ad.report', "Downloaded the delivery report for {$booking->reference}");

        return response(stream_get_contents($out), 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$booking->reference.'-delivery.csv"',
        ]);
    }

    /** Missed airtime made good: the campaign runs this many days longer. */
    public function extend(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate(['days' => ['required', 'integer', 'min:1', 'max:30']]);
        $this->from($booking, [Booking::APPROVED]);
        $before = $booking->end_date->toDateString();
        $booking->update(['end_date' => $booking->end_date->copy()->addDays($data['days'])]);
        Audit::log('screen_ad.extended', "Extended {$booking->reference} by {$data['days']} days ({$before} to {$booking->end_date->toDateString()}) for missed airtime");
        $this->tell($booking, "Your campaign has been extended: {$booking->reference}", [
            "To make up airtime the screen missed, your advert now runs until {$booking->end_date->format('j F Y')}.",
        ]);

        return response()->json(['data' => $booking->fresh()]);
    }

    /** Connect the street screen: a key it uses to report plays and that it is alive. */
    public function screenKey(): JsonResponse
    {
        $key = \Illuminate\Support\Str::random(40);
        Setting::put(['display_screen_key_hash' => hash('sha256', $key)]);
        Audit::log('display.screen_key', 'Connected a street screen (any earlier screen key stops working)');

        return response()->json(['data' => ['key' => $key]]);
    }

    public function downtimeNote(Request $request, ScreenDowntime $downtime): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:300']]);
        $downtime->update(['reason' => $data['reason']]);
        Audit::log('display.downtime_note', "Downtime from {$downtime->started_at}: {$data['reason']}");

        return response()->json(['data' => $downtime]);
    }

    /** Downtime an operator records by hand, such as a planned power cut. */
    public function downtimeAdd(Request $request): JsonResponse
    {
        $data = $request->validate([
            'started_at' => ['required', 'date'], 'ended_at' => ['required', 'date', 'after:started_at'], 'reason' => ['required', 'string', 'max:300'],
        ]);
        $d = ScreenDowntime::create($data + ['source' => 'manual', 'alerted' => true]);
        Audit::log('display.downtime_added', "Logged downtime {$data['started_at']} to {$data['ended_at']}: {$data['reason']}");

        return response()->json(['data' => $d], 201);
    }

    public function proof(Booking $booking): Response
    {
        abort_unless($booking->proof_path, 404);
        Audit::log('screen_ad.proof_opened', "Opened payment proof for {$booking->reference}");

        return SecureFile::download($booking->proof_path, $booking->proof_name ?? "{$booking->reference}-proof");
    }

    public function confirmPayment(Request $request, Booking $booking): JsonResponse
    {
        $this->from($booking, [Booking::PAYMENT_SUBMITTED]);
        $booking->update(['status' => Booking::PAYMENT_CONFIRMED, 'payment_confirmed_by' => $request->user()->id, 'payment_confirmed_at' => now()]);
        Audit::log('screen_ad.payment_confirmed', "Confirmed UGX {$booking->price_ugx} for {$booking->reference}");
        $this->tell($booking, "Payment received: {$booking->reference}", ['We have your payment. We are now reviewing your video and will confirm your campaign shortly.']);

        return response()->json(['data' => $booking->fresh()]);
    }

    public function approve(Request $request, Booking $booking): JsonResponse
    {
        $this->from($booking, [Booking::PAYMENT_CONFIRMED]);
        $booking->update(['status' => Booking::APPROVED, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        Audit::log('screen_ad.approved', "Approved {$booking->reference} ({$booking->company})");
        $this->tell($booking, "Your advert is approved: {$booking->reference}", [
            "Your advert will run on the Vitorra street screen from {$booking->start_date->format('j F Y')} to {$booking->end_date->format('j F Y')}.",
        ]);

        return response()->json(['data' => $booking->fresh()]);
    }

    public function reject(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $this->from($booking, [Booking::PAYMENT_CONFIRMED, Booking::APPROVED]);
        // Taken off air mid-campaign: the days already shown are not refunded.
        $started = $booking->status === Booking::APPROVED && $booking->start_date->toDateString() <= now('Africa/Kampala')->toDateString();
        $booking->update(['status' => Booking::REJECTED, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'review_note' => $data['reason']]);
        Audit::log('screen_ad.rejected', "Refused {$booking->reference}: {$data['reason']}");
        $this->tell($booking, "We cannot run your advert: {$booking->reference}", [
            "We are sorry, we are unable to run this advert. Reason: {$data['reason']}",
            ($started ? 'We will refund the unused days of your campaign' : 'We will refund you in full').' within '.config('screen_ads.refund_working_days').' working days, to the account you paid from.',
        ]);

        return response()->json(['data' => $booking->fresh()]);
    }

    public function refunded(Request $request, Booking $booking): JsonResponse
    {
        $this->from($booking, [Booking::REJECTED]);
        $booking->update(['status' => Booking::REFUNDED, 'refunded_by' => $request->user()->id, 'refunded_at' => now()]);
        Audit::log('screen_ad.refunded', "Recorded refund of UGX {$booking->price_ugx} for {$booking->reference}");
        $this->tell($booking, "Refund sent: {$booking->reference}", ['Your refund has been sent.']);

        return response()->json(['data' => $booking->fresh()]);
    }

    /** For a booking nobody paid for. Paid bookings go through refusal and refund. */
    public function cancel(Booking $booking): JsonResponse
    {
        $this->from($booking, [Booking::AWAITING_PAYMENT]);
        $booking->update(['status' => Booking::CANCELLED]);
        Audit::log('screen_ad.cancelled', "Cancelled unpaid booking {$booking->reference}");

        return response()->json(['data' => $booking->fresh()]);
    }

    /** @param string[] $allowed */
    private function from(Booking $booking, array $allowed): void
    {
        abort_unless(in_array($booking->status, $allowed, true), 422, 'This booking is not at that step.');
    }

    /** @param string[] $lines */
    private function tell(Booking $booking, string $heading, array $lines): void
    {
        try { Mail::to($booking->email)->send(new ScreenAdNotice($heading, $lines)); }
        catch (\Throwable $e) { Log::warning('Screen ad email failed', ['booking' => $booking->id, 'error' => $e->getMessage()]); }
    }
}
