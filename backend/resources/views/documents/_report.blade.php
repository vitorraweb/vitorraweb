<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    {{-- Internal report layout (Finance / Operations sheets): the real Vitorra
         logo, a running header and footer on every page, KPI tiles, dark-headed
         tables and a sign-off block. Views pass $docTitle, optional
         $docSubtitle and $docRef, and fill the "content" section. --}}
    @php $art = resource_path('document-art'); @endphp
    <style>
        @font-face { font-family: 'Open Sans'; font-weight: normal; src: url('{{ $art }}/fonts/OpenSans-Regular.ttf') format('truetype'); }
        @font-face { font-family: 'Open Sans'; font-weight: bold; src: url('{{ $art }}/fonts/OpenSans-Bold.ttf') format('truetype'); }
        @page { margin: 128px 42px 64px 42px; }
        body { font-family: 'Open Sans', DejaVu Sans, sans-serif; color: #1E1E1E; font-size: 10.5px; line-height: 1.4; }

        .page-head { position: fixed; top: -108px; left: 0; right: 0; height: 96px; }
        .page-head table { width: 100%; border-collapse: collapse; }
        .page-head td { vertical-align: middle; padding: 0; }
        .page-head .logo { width: 92px; }
        .page-head .logo img { width: 80px; height: auto; }
        .page-head .address { font-size: 8px; color: #7d7d7d; line-height: 1.5; padding-left: 4px; border-left: 0.6px solid #d9d4c5; padding-left: 10px; }
        .page-head .title { text-align: right; }
        .page-head .title .t { font-size: 19px; font-weight: bold; color: #1E1E1E; letter-spacing: 0.01em; }
        .page-head .title .s { font-size: 8.5px; color: #7A6020; text-transform: uppercase; letter-spacing: 0.16em; font-weight: bold; margin-top: 3px; }
        .page-head .rule { margin-top: 6px; height: 2.5px; background: #C5B27A; }
        .page-head .rule2 { height: 0.6px; background: #1E1E1E; margin-top: 2px; }

        .page-foot { position: fixed; bottom: -44px; left: 0; right: 0; height: 28px; border-top: 0.6px solid #d9d4c5; padding-top: 7px; font-size: 7.5px; color: #8d8d8d; }
        .page-foot table { width: 100%; border-collapse: collapse; }
        .page-foot .pg:after { content: "Page " counter(page); }

        .meta { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .meta td { padding: 0 18px 0 0; vertical-align: top; }
        .meta .k { font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.14em; color: #8d8d8d; font-weight: bold; }
        .meta .v { font-size: 10.5px; color: #1E1E1E; margin-top: 2px; }

        .kpis { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin: 0 -8px 20px -8px; }
        .kpis td { background: #FAF7EF; border-left: 3px solid #C5B27A; padding: 10px 12px; vertical-align: top; }
        .kpis .k { font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.14em; color: #7A6020; font-weight: bold; }
        .kpis .v { font-size: 22px; font-weight: bold; color: #1E1E1E; line-height: 1.1; margin-top: 4px; }
        .kpis .n { font-size: 8px; color: #7d7d7d; margin-top: 2px; }
        .kpis td.dark { background: #1E1E1E; border-left-color: #C5B27A; }
        .kpis td.dark .v { color: #FFFFFF; }
        .kpis td.dark .k { color: #D4C49A; }
        .kpis td.dark .n { color: #BDBDBD; }

        h3 { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A6020; font-weight: bold; margin: 22px 0 7px 0; padding-bottom: 5px; border-bottom: 0.6px solid #d9d4c5; }

        table.report { width: 100%; border-collapse: collapse; }
        table.report thead { display: table-header-group; }
        table.report th { white-space: nowrap; background: #1E1E1E; color: #FFFFFF; text-align: left; padding: 7px 8px; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; }
        table.report td { padding: 7px 8px; border-bottom: 0.6px solid #ebe7dc; font-size: 9.5px; vertical-align: top; }
        table.report tr.alt td { background: #FAFAF8; }
        table.report .num { text-align: right; }
        table.report .nw { white-space: nowrap; }
        table.report tr.total td { background: #F3EEDF; font-weight: bold; border-top: 1.5px solid #C5B27A; border-bottom: none; }
        table.report tr.main td { background: #FBF8F0; }
        table.report .dim { color: #9a9a9a; }
        table.report .neg { color: #B00020; font-weight: bold; }
        .tag { display: inline-block; font-size: 6.5px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; padding: 1.5px 5px; border-radius: 2px; }
        .tag.gold { background: #C5B27A; color: #1E1E1E; }
        .tag.grey { background: #ECECEC; color: #555; }
        .empty { color: #9a9a9a; padding: 14px 8px !important; font-style: italic; }
        .note { margin-top: 12px; padding: 9px 12px; background: #FDF1F2; border-left: 3px solid #B00020; font-size: 8.5px; color: #6b0013; }

        .signoff { width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 34px -12px 0 -12px; page-break-inside: avoid; }
        .signoff td { width: 33%; border: 0.6px solid #d9d4c5; padding: 10px 12px; vertical-align: top; }
        .signoff .role { font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.14em; color: #7A6020; font-weight: bold; }
        .signoff .line { border-bottom: 0.6px solid #1E1E1E; height: 26px; }
        .signoff .lbl { font-size: 7px; color: #8d8d8d; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.1em; }
    </style>
</head>
<body>
    <div class="page-head">
        <table>
            <tr>
                <td class="logo"><img src="{{ $art }}/logo.png" alt="Vitorra"></td>
                <td>
                    <div class="address">Padre Pio House, Plot 32<br>Lumumba Avenue, Kampala, Uganda<br>vitorra.org</div>
                </td>
                <td class="title">
                    <div class="t">{{ $docTitle }}</div>
                    @isset($docSubtitle)<div class="s">{{ $docSubtitle }}</div>@endisset
                </td>
            </tr>
        </table>
        <div class="rule"></div><div class="rule2"></div>
    </div>

    <div class="page-foot">
        <table>
            <tr>
                <td>Internal record &middot; Confidential &middot; {{ $docRef ?? '' }} &middot; Generated {{ now()->format('j M Y, H:i') }} (EAT)</td>
                <td style="text-align: right;"><span class="pg"></span></td>
            </tr>
        </table>
    </div>

    @yield('content')
</body>
</html>
