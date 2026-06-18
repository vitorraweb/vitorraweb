Hi {{ $recipientName }},

{{ $leave->user->name }} has submitted a leave request and needs your review.

Type: {{ ucfirst($leave->type) }} leave
Dates: {{ $leave->start_date->format('D, j M Y') }} – {{ $leave->end_date->format('D, j M Y') }}
Working days: {{ $leave->working_days }}
@if($leave->reason)
Reason: {{ $leave->reason }}
@endif

Review it here: https://vitorra.org/staff/leave

— Vitorra Holdings
