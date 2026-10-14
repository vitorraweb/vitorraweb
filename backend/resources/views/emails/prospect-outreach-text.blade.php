@unless($ownGreeting)Dear {{ $prospectName }},

@endunless
{!! $bodyText !!}

@unless($ownSignOff)Kind regards,
@unless($signatureText)The Vitorra team
@endunless
@endunless
@if($signatureText){!! $signatureText !!}
@endif

@if(count($attachmentNames))Attached: {{ implode(', ', $attachmentNames) }}

@endif
Request a quote: {{ $ctaUrl }}
Or simply reply to this email. It reaches our whole team.

--
Vitorra Holdings Limited
Padre Pio House, Plot 32, Lumumba Avenue, Kampala, Uganda
+256 740 026 294 · {{ $replyAddress }} · {{ $siteUrl }}

To stop receiving these emails, reply with "unsubscribe".
