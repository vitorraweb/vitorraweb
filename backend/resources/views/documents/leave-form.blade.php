{{--
    Leave application form (App\Http\Controllers\Api\LeaveFormController). One A4
    page: who is applying, the leave asked for, handover, the employee's and
    the immediate supervisor's signatures, and an office-use block for the two
    console signatures (Operations + Finance). Blank fields print as lines to
    write on; a form made from a request arrives filled in.
--}}
@php
    $u = $d['user']; $l = $d['leave']; $b = $d['balance'];
    $v = fn ($x) => $x !== null && $x !== '' ? e($x) : '&nbsp;';
    $date = fn ($c) => $c ? $c->format('d M Y') : null;
@endphp
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @include('documents.partials.letterhead-styles', ['art' => $d['art']])
    @page { margin: 30px 42px 58px 42px; }
    body { font-size: 11px; }
    .sec { margin-top: 12px; }
    .sec-h { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; font-weight: bold; color: #fff; background: #1c1c1c; padding: 5px 8px; }
    .sec-h span { color: #d8b56a; margin-right: 6px; }
    table.f { width: 100%; }
    table.f td { padding: 5px 6px 0 0; vertical-align: bottom; }
    .k { font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase; color: #6b6b6b; white-space: nowrap; }
    .w { border-bottom: 1px solid #9a9a9a; min-height: 16px; font-size: 11.5px; padding: 0 2px 1px; }
    .box { display: inline-block; width: 10px; height: 10px; border: 1px solid #444; margin-right: 4px; vertical-align: -1px; text-align: center; font-family: 'DejaVu Sans'; font-size: 9px; line-height: 10px; font-weight: bold; }
    .opt { display: inline-block; margin-right: 13px; font-size: 11px; }
    .note { font-size: 9.5px; color: #6b6b6b; margin-top: 4px; }
    .area { border: 1px solid #c9c3b5; min-height: 34px; padding: 4px 6px; font-size: 11px; margin-top: 5px; }
    .sig td { width: 50%; vertical-align: top; padding: 0 14px 0 0; }
    .sig .card { border: 1px solid #d8d2c4; padding: 8px 10px 10px; }
    .sig .role { font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: #9c6416; font-weight: bold; border-bottom: 2px solid #b8862b; padding-bottom: 3px; }
    .sig .r { margin-top: 9px; }
    .sig .r .k { display: block; }
    .sig .r .w { min-height: 18px; }
    .office { border: 1px dashed #9a9a9a; padding: 4px 8px 8px; margin-top: 6px; background: #faf7f0; }
    .office td { width: 33.33%; vertical-align: top; padding: 4px 10px 0 0; }
    .stamp { font-size: 9px; color: #1f7a3a; font-weight: bold; }
</style>
</head>
<body>

<div class="foot">
    {{ $d['company']['name'] }} · {{ implode(' ', $d['company']['address']) }} · {{ $d['company']['phone'] }}<br>
    Apply in the Vitorra console as well (My leave in the staff portal, or My work → Leave): leave is granted only once Operations and Finance have both signed.
</div>

@include('documents.partials.letterhead', ['art' => $d['art'], 'company' => $d['company']])

<table style="width:100%; margin-top:14px;">
    <tr>
        <td style="vertical-align:top;">
            <p class="title" style="font-size:22px;">LEAVE APPLICATION FORM</p>
            <div class="sub">People &amp; Operations</div>
        </td>
        <td style="vertical-align:top; text-align:right;">
            <table class="meta" style="margin-left:auto;">
                <tr><td class="k">Form No.</td><td class="v" style="color:#b42318;">{!! $d['ref'] ? e($d['ref']) : '________' !!}</td></tr>
                <tr><td class="k">Date of application</td><td class="v">{!! $l ? e($date($l->created_at)) : '____ / ____ / ______' !!}</td></tr>
                @if($d['status'])<tr><td class="k">Status in console</td><td class="v">{{ ucfirst($d['status']) }}</td></tr>@endif
            </table>
        </td>
    </tr>
</table>

{{-- A. Employee --}}
<div class="sec">
    <div class="sec-h"><span>A</span>Employee details</div>
    <table class="f">
        <tr>
            <td style="width:13%;" class="k">Full name</td><td style="width:37%;"><div class="w">{!! $v($u?->name) !!}</div></td>
            <td style="width:13%;" class="k">Job title</td><td style="width:37%;"><div class="w">{!! $v($u?->job_title) !!}</div></td>
        </tr>
        <tr>
            <td class="k">Department</td><td><div class="w">{!! $v($d['dept']) !!}</div></td>
            <td class="k">Supervisor</td><td><div class="w">{!! $v($u?->supervisor?->name) !!}</div></td>
        </tr>
        <tr>
            <td class="k">Phone</td><td><div class="w">{!! $v($u?->phone) !!}</div></td>
            <td class="k">Email</td><td><div class="w">{!! $v($u?->email) !!}</div></td>
        </tr>
    </table>
</div>

{{-- B. Leave requested --}}
<div class="sec">
    <div class="sec-h"><span>B</span>Leave requested</div>
    <div style="margin-top:7px;">
        <span class="k" style="margin-right:8px;">Type of leave</span>
        @foreach($d['types'] as $key => $label)
            <span class="opt"><span class="box">{{ $l && $l->type === $key ? '✓' : '' }}</span>{{ $label }}</span>
        @endforeach
        @if(!$l)<span class="w" style="display:inline-block; width:90px;">&nbsp;</span>@endif
    </div>
    <table class="f">
        <tr>
            <td style="width:13%;" class="k">First day</td><td style="width:20%;"><div class="w">{!! $v($date($l?->start_date)) !!}</div></td>
            <td style="width:13%;" class="k">Last day</td><td style="width:20%;"><div class="w">{!! $v($date($l?->end_date)) !!}</div></td>
            <td style="width:14%;" class="k">Working days</td><td style="width:20%;"><div class="w">{!! $v($l?->working_days) !!}</div></td>
        </tr>
        <tr>
            <td class="k">Back at work</td><td><div class="w">{!! $v($d['return']) !!}</div></td>
            <td class="k">Contact while away</td><td colspan="3"><div class="w">{!! $v($u?->phone) !!}</div></td>
        </tr>
    </table>
    <div class="k" style="margin-top:8px;">Reason / details</div>
    <div class="area">{!! $l && $l->reason ? nl2br(e($l->reason)) : '&nbsp;' !!}</div>
    <div class="note">Working days exclude weekends and Uganda public holidays. Sick leave needs a medical note, attached here and uploaded in the console.</div>
</div>

{{-- C. Handover --}}
<div class="sec">
    <div class="sec-h"><span>C</span>Handover while away</div>
    <table class="f">
        <tr>
            <td style="width:22%;" class="k">Duties handed over to</td><td style="width:40%;"><div class="w">&nbsp;</div></td>
            <td style="width:12%;" class="k">Signature</td><td style="width:26%;"><div class="w">&nbsp;</div></td>
        </tr>
        <tr>
            <td class="k">Urgent work / notes</td><td colspan="3"><div class="w">&nbsp;</div></td>
        </tr>
    </table>
</div>

{{-- D. Signatures --}}
<div class="sec">
    <div class="sec-h"><span>D</span>Signatures</div>
    <table class="sig" style="width:100%; margin-top:8px;">
        <tr>
            <td>
                <div class="card">
                    <div class="role">Employee</div>
                    <div class="note" style="margin-top:5px;">I confirm the details above are correct and I have arranged a handover of my work.</div>
                    <div class="r"><span class="k">Name</span><div class="w">{!! $v($u?->name) !!}</div></div>
                    <table style="width:100%;"><tr>
                        <td style="width:62%; padding:0 10px 0 0;"><div class="r"><span class="k">Signature</span><div class="w">&nbsp;</div></div></td>
                        <td style="width:38%; padding:0;"><div class="r"><span class="k">Date</span><div class="w">&nbsp;</div></div></td>
                    </tr></table>
                </div>
            </td>
            <td style="padding-right:0;">
                <div class="card">
                    <div class="role">Immediate supervisor</div>
                    <div style="margin-top:6px; font-size:10.5px;">
                        <span class="opt"><span class="box"></span>Recommended</span>
                        <span class="opt"><span class="box"></span>Not recommended</span>
                    </div>
                    <div class="r"><span class="k">Name</span><div class="w">{!! $v($u?->supervisor?->name) !!}</div></div>
                    <table style="width:100%;"><tr>
                        <td style="width:62%; padding:0 10px 0 0;"><div class="r"><span class="k">Signature</span><div class="w">&nbsp;</div></div></td>
                        <td style="width:38%; padding:0;"><div class="r"><span class="k">Date</span><div class="w">&nbsp;</div></div></td>
                    </tr></table>
                </div>
            </td>
        </tr>
    </table>
</div>

{{-- E. Office use --}}
<div class="sec">
    <div class="sec-h"><span>E</span>For office use: approval and balance</div>
    <div class="office">
        <table style="width:100%;">
            <tr>
                @foreach($d['stages'] as $stage)
                    <td>
                        <span class="k">{{ $stage['label'] }} approval</span>
                        @if($stage['signed'])
                            <div class="w"><span class="stamp">{{ strtoupper($stage['signed']['decision']) }}</span> · {{ $stage['signed']['by'] }}</div>
                            <div class="note">Signed in the console, {{ $stage['signed']['date'] }}</div>
                        @else
                            <div class="w">&nbsp;</div>
                            <div class="note">Name, signature and date</div>
                        @endif
                    </td>
                @endforeach
                <td>
                    <span class="k">Annual leave {{ $b['year'] ?? '' }}</span>
                    <div class="w">
                        @if($b)Entitled {{ $b['entitlement'] }} · used {{ $b['used'] }} · left {{ $b['left'] }}@else&nbsp;@endif
                    </div>
                    <div class="note">Days, before this request</div>
                </td>
            </tr>
            <tr>
                <td colspan="2"><span class="k">Comments</span><div class="w">{!! $l && $l->review_comment ? e($l->review_comment) : '&nbsp;' !!}</div></td>
                <td><span class="k">Recorded in console by</span><div class="w">&nbsp;</div></td>
            </tr>
        </table>
    </div>
</div>

</body>
</html>
