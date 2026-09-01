@if($stage === 'escalate')
These enquiries have now gone {{ $hours }} hours with no reply. They were already
flagged to the team and are still unanswered.
@else
The following {{ $enquiries->count() === 1 ? 'enquiry has' : 'enquiries have' }} had no reply in over {{ $hours }} hours:
@endif

@foreach($enquiries as $e)
- {{ $e->name }}{{ $e->company ? ' (' . $e->company . ')' : '' }} — {{ $e->product_category ?: 'General' }}
  Received {{ $e->created_at->diffForHumans() }} ({{ $e->created_at->format('D d M, H:i') }})
  {{ $e->email }}{{ $e->phone ? ' · ' . $e->phone : '' }}
  @if($e->lead_source)Came from: {{ $e->lead_source }}
  @endif
@endforeach

Open them here: {{ $adminUrl }}

An enquiry stops appearing in this list as soon as it is moved out of "new" —
so actioning it is what clears it, not replying to this email.

— Vitorra Admin
