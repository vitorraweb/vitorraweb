@extends('documents._layout', ['docTitle' => 'Fuel Trial Report'])

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="label">Client</td><td>{{ $trial->client_company }}</td>
            <td class="label">Reference</td><td>{{ $trial->reference }}</td>
        </tr>
        <tr>
            <td class="label">Vehicle</td>
            <td>{{ collect([$trial->registration, $trial->vehicle_make, $trial->vehicle_type])->filter()->implode(' · ') ?: '—' }}</td>
            <td class="label">Device fitted</td><td>{{ $trial->installed_on?->format('d M Y') ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">Trips recorded</td>
            <td>{{ $analysis['counts']['baseline_measurable'] }} before · {{ $analysis['counts']['trial_measurable'] }} after</td>
            <td class="label">Report date</td><td>{{ now()->format('d M Y') }}</td>
        </tr>
    </table>

    {{--
        The verdict block. `verdict` is only ever present when the analysis says
        the evidence carries it — so this report physically cannot show a saving
        figure the data does not support. Everything else here explains it.
    --}}
    @if ($analysis['verdict'])
        <div style="padding: 18px 20px; background: #FAFAF8; border-left: 4px solid #C5B27A; margin-bottom: 22px;">
            <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #7A6020; margin-bottom: 8px;">Result</div>
            <div style="font-size: 15px; line-height: 1.5; color: #1E1E1E;">{{ $analysis['verdict']['statement'] }}</div>
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th>Measured over</th>
                    <th class="amount">Expected fuel</th>
                    <th class="amount">Fuel used</th>
                    <th class="amount">Difference</th>
                    @if ($analysis['headline']['cost_saved'] !== null)
                        <th class="amount">Value</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        {{ number_format($analysis['headline']['distance_km']) }} km ·
                        {{ $analysis['headline']['matched_trial_trips'] }} comparable trips
                    </td>
                    <td class="amount">{{ number_format($analysis['headline']['expected_litres'], 1) }} L</td>
                    <td class="amount">{{ number_format($analysis['headline']['actual_litres'], 1) }} L</td>
                    <td class="amount" style="font-weight: bold;">
                        {{ $analysis['headline']['litres_saved'] > 0 ? '−' : '+' }}{{ number_format(abs($analysis['headline']['litres_saved']), 1) }} L
                        ({{ abs($analysis['headline']['saving_pct']) }}%)
                    </td>
                    @if ($analysis['headline']['cost_saved'] !== null)
                        <td class="amount">{{ $trial->currency }} {{ number_format($analysis['headline']['cost_saved']) }}</td>
                    @endif
                </tr>
            </tbody>
        </table>
    @else
        <div style="padding: 18px 20px; background: #FAFAF8; border-left: 4px solid #8A5A18; margin-bottom: 22px;">
            <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A18; margin-bottom: 8px;">
                No conclusion available yet
            </div>
            <div style="font-size: 14px; line-height: 1.5; color: #1E1E1E; margin-bottom: 10px;">
                This trial does not yet carry a result &mdash; in either direction.
            </div>
            @if (! empty($analysis['confidence']['shortfall']))
                <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #454545; line-height: 1.7;">
                    @foreach ($analysis['confidence']['shortfall'] as $line)
                        <li>{{ $line }}</li>
                    @endforeach
                </ul>
            @endif
        </div>
    @endif

    {{-- How the comparison was made, route by route. This is what makes the
         headline (or its absence) defensible when a client questions it. --}}
    <div style="font-size: 11px; font-weight: bold; color: #7A6020; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 26px;">
        Route by route
    </div>
    <div style="font-size: 10px; color: #777; margin-top: 4px; line-height: 1.5;">
        Fuel use varies far more between destinations than any device changes it, so every comparison is made within a
        single route and only then added together. A route needs at least {{ $trial->minBaselineTripsPerRoute() }}
        trips from before the device was fitted before it can anchor a comparison.
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Destination</th>
                <th class="amount">Before (L/100km)</th>
                <th class="amount">After (L/100km)</th>
                <th class="amount">Change</th>
                <th>Counted?</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($analysis['routes'] as $route)
                <tr>
                    <td>{{ $route['route_label'] }}</td>
                    <td class="amount">
                        {{ $route['baseline'] ? $route['baseline']['l_per_100'] : '—' }}
                        @if ($route['baseline'])
                            <span style="color: #999; font-size: 10px;">({{ $route['baseline']['trips'] }})</span>
                        @endif
                    </td>
                    <td class="amount">
                        {{ $route['trial'] ? $route['trial']['l_per_100'] : '—' }}
                        @if ($route['trial'])
                            <span style="color: #999; font-size: 10px;">({{ $route['trial']['trips'] }})</span>
                        @endif
                    </td>
                    <td class="amount">
                        @if ($route['matched'] && $route['change_pct'] !== null)
                            <span style="font-weight: bold; color: {{ $route['change_pct'] > 0 ? '#3F6147' : '#9E3B33' }};">
                                {{ $route['change_pct'] > 0 ? '−' : '+' }}{{ abs($route['change_pct']) }}%
                            </span>
                        @else
                            —
                        @endif
                    </td>
                    <td style="font-size: 10px; color: {{ $route['matched'] ? '#3F6147' : '#999' }};">
                        {{ $route['matched'] ? 'Yes' : ($reasons[$route['unmatched_reason']] ?? 'Not comparable') }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if (! empty($analysis['unmatched_trial_trips']))
        <div style="font-size: 11px; font-weight: bold; color: #7A6020; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 26px;">
            Trips not counted
        </div>
        <table class="items">
            <tbody>
                @foreach ($analysis['unmatched_trial_trips'] as $u)
                    <tr>
                        <td style="width: 130px;"><strong>{{ $u['route_label'] }}</strong></td>
                        <td style="font-size: 11px; color: #454545;">{{ $u['explanation'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    {{-- Excluded trips are named with their reason. A report that quietly
         dropped an inconvenient journey would not survive scrutiny. --}}
    @if ($excluded->isNotEmpty())
        <div style="font-size: 11px; font-weight: bold; color: #7A6020; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 26px;">
            Trips left out, and why
        </div>
        <table class="items">
            <tbody>
                @foreach ($excluded as $trip)
                    <tr>
                        <td style="width: 130px;">
                            <strong>{{ $trip->route_label }}</strong>
                            <span style="color: #999; font-size: 10px;">{{ $trip->trip_date?->format('d M Y') }}</span>
                        </td>
                        <td style="font-size: 11px; color: #454545;">{{ $trip->exclusion_reason ?: 'Held for review.' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="notice">
        <strong>How this was measured.</strong>
        Figures come from {{ $trial->client_company }}&rsquo;s own trip records. Fuel use is worked out by distance
        &mdash; total litres over total kilometres &mdash; and never by averaging each trip&rsquo;s figure, which would let
        a short journey count as much as a long one. Comparisons are made within a single destination and load profile,
        so the result reflects the device rather than the road.
        @if ($analysis['verdict'])
            Fuel Eco Tech is independently certified at {{ $analysis['verified_pct'] }}% (CTI GmbH, Germany).
            The figures above are this vehicle&rsquo;s own measured performance, not a guarantee of future results.
        @endif
    </div>

@endsection
