Hi {{ $leave->user->name }},

Your {{ ucfirst($leave->type) }} leave request has been {{ $leave->status }}.

Dates: {{ $leave->start_date->format('D, j M Y') }} – {{ $leave->end_date->format('D, j M Y') }}
Working days: {{ $leave->working_days }}
@if($leave->reviewer)
Reviewed by: {{ $leave->reviewer->name }}
@endif
@if($leave->review_comment)
Note: {{ $leave->review_comment }}
@endif

View your leave: https://vitorra.org/staff/leave

— Vitorra Holdings
