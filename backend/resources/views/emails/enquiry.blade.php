New enquiry received on vitorra.org
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product:  {{ $enquiry->product_category ?: 'General enquiry' }}
Routed to: {{ $enquiry->assigned_to ?: '—' }}
Name:     {{ $enquiry->name }}
Email:    {{ $enquiry->email }}
Phone:    {{ $enquiry->phone ?: '—' }}
Company:  {{ $enquiry->company ?: '—' }}
Country:  {{ $enquiry->country }}
@if(!empty($enquiry->requirements))

Requirements (captured on the form):
@foreach($enquiry->requirements as $field)
• {{ $field['label'] }}: {{ $field['value'] }}
@endforeach
@endif
@if($enquiry->message)

Message:
{{ $enquiry->message }}
@endif

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply directly to this email to respond to {{ $enquiry->name }}.
Received: {{ $enquiry->created_at->format('d M Y, H:i') }} (EAT)
