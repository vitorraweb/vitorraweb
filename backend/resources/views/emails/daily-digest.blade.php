Good morning {{ $user->name }},

Here is what needs your attention today:
@if($overdueTasks->isNotEmpty())

Overdue tasks ({{ $overdueTasks->count() }}):
@foreach($overdueTasks as $t)
- {{ $t->title }} (due {{ $t->due_date->format('d M') }})
@endforeach
@endif
@if($dueTodayTasks->isNotEmpty())

Due today ({{ $dueTodayTasks->count() }}):
@foreach($dueTodayTasks as $t)
- {{ $t->title }}
@endforeach
@endif
@if(count($staleContacts))

Leads going cold ({{ count($staleContacts) }}):
@foreach($staleContacts as $c)
- {{ $c['name'] ?: $c['email'] }} ({{ $c['days_idle'] }} days since last activity)
@endforeach
@endif

— Vitorra Admin
