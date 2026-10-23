Hello {{ $contract->buyer_contact ?: $contract->buyer_name }},

Please find attached our Fuel Eco Tech (FET) Module Sales and Installation Agreement, contract {{ $contract->number }}.

You can read it and sign it online here:
{{ $url }}

This link is private to you. It works for one signature and expires on {{ $expires }} (Kampala time). If it runs out, reply to this email and we will send a new one.

On the page you can read the full agreement, download it, and sign by drawing your signature or typing your name. If anything needs changing, you can decline and tell us why, or simply reply to this email.

Kind regards,
{{ $sender?->name ?: 'The Vitorra team' }}
Vitorra Holdings Limited
