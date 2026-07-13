Hi {{ $toName }},

{{ $body }}

@if(!empty($signature))
{!! $signature !!}
@else
— {{ $sender->name }}
Vitorra Holdings
@endif
