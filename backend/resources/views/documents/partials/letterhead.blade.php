{{-- Letterhead: the logo on the left, the company on the right, a gold rule under both. --}}
<table class="lh" style="width:100%;">
    <tr>
        <td style="width:30%;"><img src="{{ $art }}/logo.png" style="width:118px; height:auto;"></td>
        <td class="co">
            <b>{{ strtoupper($company['name']) }}</b><br>
            {{ implode(' ', $company['address']) }}<br>
            Tel: {{ $company['phone'] }} &nbsp;·&nbsp; {{ $company['email'] }}<br>
            @if(!empty($company['tin']))TIN: {{ $company['tin'] }} &nbsp;·&nbsp; @endif vitorra.org
        </td>
    </tr>
</table>
<div class="rule"></div>
<div class="rule-thin"></div>
