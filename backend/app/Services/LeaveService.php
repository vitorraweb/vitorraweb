<?php

namespace App\Services;

use App\Models\CompanyEvent;
use App\Models\LeaveRequest;
use App\Models\PublicHoliday;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class LeaveService
{
    /**
     * Working days in an inclusive date range, excluding weekends and public
     * holidays (recurring holidays match by month/day in any year).
     */
    public function workingDays(Carbon $start, Carbon $end): int
    {
        if ($end->lt($start)) {
            return 0;
        }

        [$exact, $recurring] = $this->holidaySets();
        $count = 0;

        foreach (CarbonPeriod::create($start->copy()->startOfDay(), $end->copy()->startOfDay()) as $day) {
            if ($day->isWeekend()) {
                continue;
            }
            if (in_array($day->format('Y-m-d'), $exact, true) || in_array($day->format('m-d'), $recurring, true)) {
                continue;
            }
            $count++;
        }

        return $count;
    }

    /** A company blackout (blocks_leave) overlapping the range, or null. */
    public function blackoutClash(Carbon $start, Carbon $end): ?CompanyEvent
    {
        return CompanyEvent::where('blocks_leave', true)
            ->where('start_date', '<=', $end->format('Y-m-d'))
            ->where('end_date', '>=', $start->format('Y-m-d'))
            ->first();
    }

    /**
     * Another team member in the same department already on (approved/pending)
     * leave overlapping the range — returns that colleague's name, or null.
     */
    public function departmentClash(User $user, Carbon $start, Carbon $end, ?int $ignoreId = null): ?string
    {
        if (! $user->department) {
            return null;
        }

        $clash = LeaveRequest::query()
            ->whereIn('status', ['pending', 'approved'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where('start_date', '<=', $end->format('Y-m-d'))
            ->where('end_date', '>=', $start->format('Y-m-d'))
            ->whereHas('user', fn ($q) => $q->where('department', $user->department)->where('id', '!=', $user->id))
            ->with('user:id,name')
            ->first();

        return $clash?->user?->name;
    }

    /** Annual-leave working-days already booked (approved + pending) this year. */
    public function annualUsed(User $user, int $year, ?int $ignoreId = null): int
    {
        return (int) LeaveRequest::where('user_id', $user->id)
            ->whereIn('type', LeaveRequest::DEDUCTS_BALANCE)
            ->whereIn('status', ['pending', 'approved'])
            ->whereYear('start_date', $year)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->sum('working_days');
    }

    /**
     * Build the holiday lookup sets: exact 'Y-m-d' dates (non-recurring) and
     * 'm-d' month/day keys (recurring, match any year).
     *
     * @return array{0: array<int,string>, 1: array<int,string>}
     */
    private function holidaySets(): array
    {
        $exact = [];
        $recurring = [];
        foreach (PublicHoliday::get(['date', 'recurring']) as $h) {
            if ($h->recurring) {
                $recurring[] = $h->date->format('m-d');
            } else {
                $exact[] = $h->date->format('Y-m-d');
            }
        }

        return [$exact, $recurring];
    }
}
