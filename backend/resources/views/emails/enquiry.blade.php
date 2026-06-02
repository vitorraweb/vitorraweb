New enquiry received on vitorra.org
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product:  {{ $enquiry->product_category ?: 'General enquiry' }}
Name:     {{ $enquiry->name }}
Email:    {{ $enquiry->email }}
Phone:    {{ $enquiry->phone ?: '—' }}
Company:  {{ $enquiry->company ?: '—' }}
Country:  {{ $enquiry->country }}

Message:
{{ $enquiry->message }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply directly to this email to respond to {{ $enquiry->name }}.
Received: {{ $enquiry->created_at->format('d M Y, H:i') }} (EAT)
