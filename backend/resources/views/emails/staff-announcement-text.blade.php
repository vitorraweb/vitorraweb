Hello {{ $firstName }},

{{ $announcement->title }}

{{ $announcement->body }}

Open it in the portal: {{ $portalUrl }}

@if($author){{ $author }}, @endif Vitorra Holdings
