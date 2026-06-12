<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 36px 40px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1E1E1E; font-size: 12px; }
        .header { border-bottom: 3px solid #C5B27A; padding-bottom: 14px; margin-bottom: 24px; display: table; width: 100%; }
        .header .brand { font-size: 22px; font-weight: bold; letter-spacing: 0.04em; color: #1E1E1E; }
        .header .brand span { color: #C5B27A; }
        .header .doc-title { text-align: right; font-size: 16px; font-weight: bold; color: #7A6020; text-transform: uppercase; letter-spacing: 0.08em; }
        .header .col { display: table-cell; vertical-align: middle; width: 50%; }
        .meta { margin-bottom: 18px; }
        .meta td { padding: 2px 0; font-size: 11px; color: #454545; }
        .meta td.label { color: #999; width: 140px; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9px; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 12px; }
        table.items th { background: #F2F2F2; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #7A6020; }
        table.items td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
        table.items td.amount, table.items th.amount { text-align: right; }
        .totals { width: 100%; margin-top: 4px; }
        .totals td { padding: 6px 10px; font-size: 12px; }
        .totals tr.grand td { font-size: 14px; font-weight: bold; border-top: 2px solid #1E1E1E; }
        .notice { margin-top: 26px; padding: 14px 16px; background: #FAFAF8; border-left: 4px solid #C5B27A; font-size: 11px; color: #454545; }
        .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #eee; font-size: 9px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="col">
            <div class="brand">VITORRA <span>HOLDINGS</span></div>
            <div style="font-size: 9px; color: #999; margin-top: 2px;">vitorra.org</div>
        </div>
        <div class="col doc-title">{{ $docTitle }}</div>
    </div>

    @yield('content')

    <div class="footer">
        Vitorra Holdings Limited &middot; vitorra.org &middot; Generated {{ now()->format('d M Y, H:i') }} (EAT)
    </div>
</body>
</html>
