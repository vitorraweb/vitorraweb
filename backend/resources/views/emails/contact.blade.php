New contact message received on vitorra.org
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:     {{ $message->name }}
Email:    {{ $message->email }}
Subject:  {{ $message->subject ?: '—' }}

Message:
{{ $message->message }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply directly to this email to respond to {{ $message->name }}.
Received: {{ $message->created_at->format('d M Y, H:i') }} (EAT)
