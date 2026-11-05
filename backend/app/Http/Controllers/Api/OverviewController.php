<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Models\FetInstallation;
use App\Models\FetStockMovement;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\LeaveRequest;
use App\Models\Meeting;
use App\Models\Order;
use App\Models\PaymentReceipt;
use App\Models\ScreenAdBooking;
use App\Models\ScreenDowntime;
use App\Models\ScreenPlay;
use App\Models\Setting;
use App\Models\Task;
use App\Models\User;
use App\Services\ScreenAds\Inventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Console → Overview: what is happening across the company today, for the
 * person looking. Each block is only included when they hold that module, so
 * the Overview never shows a number someone could not open.
 */
class OverviewController extends Controller
{
    private const TZ = 'Africa/Kampala';

    public function operations(Request $request, Inventory $inventory): JsonResponse
    {
        /** @var User $u */
        $u = $request->user();
        $today = now(self::TZ)->startOfDay()->utc();
        $out = [];

        if ($u->canModule('enquiries')) {
            $out['today'] = [
                'enquiries' => Enquiry::where('created_at', '>=', $today)->count(),
                'enquiries_yesterday' => Enquiry::whereBetween('created_at', [$today->copy()->subDay(), $today])->count(),
                'orders' => $u->canModule('orders') ? Order::where('created_at', '>=', $today)->count() : null,
            ];
        }

        if ($u->canModule('screen_ads')) {
            $out['screen'] = $this->screen($inventory, $today);
        }

        if ($u->canModule('accounting')) {
            $onHand = FetStockMovement::selectRaw('model, SUM(quantity) q')->groupBy('model')->pluck('q', 'model');
            $out['stock'] = collect(FetStockMovement::MODELS)->map(fn (array $m, string $code) => [
                'label' => $m['label'], 'on_hand' => (int) ($onHand[$code] ?? 0),
            ])->values();

            $drafts = FinanceTransaction::where('status', 'draft')->where('type', 'income')->get(['currency', 'amount']);
            $out['finance'] = [
                'awaiting_approval' => $drafts->count(),
                'awaiting_by_currency' => $drafts->groupBy('currency')->map->sum('amount'),
                'receipts_this_month' => PaymentReceipt::where('status', 'issued')->where('paid_on', '>=', now(self::TZ)->startOfMonth()->toDateString())->count(),
                'received_this_month' => PaymentReceipt::where('status', 'issued')->where('paid_on', '>=', now(self::TZ)->startOfMonth()->toDateString())
                    ->get(['currency', 'amount'])->groupBy('currency')->map->sum('amount'),
                'invoices_overdue' => Invoice::whereIn('status', ['sent', 'partial'])->whereDate('due_date', '<', now(self::TZ)->toDateString())->count(),
            ];
        }

        if ($u->canModule('fet')) {
            $month = now(self::TZ)->startOfMonth();
            $out['installations'] = [
                'this_month' => FetInstallation::where('installed_on', '>=', $month->toDateString())->count(),
                'last_month' => FetInstallation::whereBetween('installed_on', [$month->copy()->subMonth()->toDateString(), $month->copy()->subDay()->toDateString()])->count(),
                'total' => FetInstallation::whereNotNull('installed_on')->count(),
            ];
        }

        if ($u->canModule('tasks')) {
            $mine = Task::where('status', '!=', 'done')->when(! $u->isAdmin(), fn ($q) => $q->where(fn ($w) => $w
                ->where('assigned_to', $u->id)->orWhere('created_by', $u->id)
                ->when($u->department, fn ($d) => $d->orWhere('department', $u->department))));
            $day = now(self::TZ)->toDateString();
            $out['tasks'] = [
                'open' => (clone $mine)->count(),
                'overdue' => (clone $mine)->whereNotNull('due_date')->whereDate('due_date', '<', $day)->count(),
                'due_today' => (clone $mine)->whereDate('due_date', $day)->count(),
            ];
        }

        if ($u->canModule('people')) {
            $out['people'] = ['leave_pending' => LeaveRequest::where('status', 'pending')->count()];
        }

        // Today's meetings, as the Meetings screen shows them.
        $out['meetings_today'] = Meeting::visibleTo($u)->whereBetween('starts_at', [$today, $today->copy()->addDay()])
            ->orderBy('starts_at')->get(['id', 'title', 'starts_at'])
            ->map(fn (Meeting $m) => ['id' => $m->id, 'title' => $m->title, 'starts_at' => $m->starts_at->toIso8601String()]);

        return response()->json(['data' => $out]);
    }

    /** The street screen: is it on, what is on air, and are paid adverts being delivered. */
    private function screen(Inventory $inventory, Carbon $today): array
    {
        $seen = (string) Setting::get('display_last_seen', '');
        $lastSeen = $seen !== '' ? Carbon::parse($seen) : null;
        $now = now();
        $hour = now(self::TZ)->hour;
        $onAirHours = $hour >= (int) config('screen_ads.on_air.from', 6) && $hour < (int) config('screen_ads.on_air.to', 22);

        $running = ScreenAdBooking::where('status', ScreenAdBooking::APPROVED)
            ->whereDate('start_date', '<=', now(self::TZ)->toDateString())->whereDate('end_date', '>=', now(self::TZ)->toDateString())->get();
        $expected = 0;
        $delivered = 0;
        foreach ($running as $b) {
            $d = $inventory->delivery($b);
            $expected += $d['expected'];
            $delivered += $d['delivered'];
        }

        $downtime = ScreenDowntime::where(fn ($q) => $q->where('started_at', '>=', $today)->orWhereNull('ended_at'))->get()
            ->sum(fn (ScreenDowntime $d) => max(0, ($d->ended_at ?? $now)->diffInMinutes($d->started_at->max($today), true)));

        return [
            'online' => $lastSeen !== null && $lastSeen->gt($now->copy()->subMinutes(3)),
            'last_seen' => $lastSeen?->toIso8601String(),
            'scene' => (string) Setting::get('display_last_scene', ''),
            'on_air_hours' => $onAirHours,
            'adverts_running' => $running->count(),
            'adverts_on_air_now' => $running->filter(fn (ScreenAdBooking $b) => $b->isOnAirAt($now))->count(),
            'plays_today' => ScreenPlay::where('played_at', '>=', $today)->where('completed', true)->count(),
            'delivery' => $expected > 0 ? round($delivered / $expected * 100) : null,
            'downtime_minutes_today' => (int) round($downtime),
        ];
    }
}
