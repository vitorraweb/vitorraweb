Hi {{ $report->user->name }},

Your work report for {{ $report->period }} has been reviewed@if($report->reviewer) by {{ $report->reviewer->name }}@endif.
@if($report->rating)
Rating: {{ $report->rating }}/5
@endif
@if($report->supervisor_comment)
Comment: {{ $report->supervisor_comment }}
@endif

View it here: https://vitorra.org/staff/reports

— Vitorra Holdings
