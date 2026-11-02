<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ScreenAdNotice;
use App\Models\ScreenAdBooking as Booking;
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
        Audit::log('screen_ad.payment_confirmed', "Confirmed UGX {$booking->monthly_ugx} for {$booking->reference}");
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
        $booking->update(['status' => Booking::REJECTED, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'review_note' => $data['reason']]);
        Audit::log('screen_ad.rejected', "Refused {$booking->reference}: {$data['reason']}");
        $this->tell($booking, "We cannot run your advert: {$booking->reference}", [
            "We are sorry, we are unable to run this advert. Reason: {$data['reason']}",
            'Our team will contact you about your refund.',
        ]);

        return response()->json(['data' => $booking->fresh()]);
    }

    public function refunded(Request $request, Booking $booking): JsonResponse
    {
        $this->from($booking, [Booking::REJECTED]);
        $booking->update(['status' => Booking::REFUNDED, 'refunded_by' => $request->user()->id, 'refunded_at' => now()]);
        Audit::log('screen_ad.refunded', "Recorded refund of UGX {$booking->monthly_ugx} for {$booking->reference}");
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
