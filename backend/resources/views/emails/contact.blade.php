New contact message received on vitorra.org
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:     {{ $contact->name }}
Email:    {{ $contact->email }}
Subject:  {{ $contact->subject ?: '—' }}

Message:
{{ $contact->message }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply directly to this email to respond to {{ $contact->name }}.
Received: {{ $contact->created_at->format('d M Y, H:i') }} (EAT)
