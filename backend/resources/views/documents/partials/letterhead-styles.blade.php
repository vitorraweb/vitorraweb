{{-- Shared look for the formal Finance documents (receipt, petty cash voucher):
     a quiet letterhead, one gold rule, black type, generous white space. A4 at 96 dpi. --}}
@font-face { font-family: 'Open Sans'; font-weight: normal; src: url('{{ $art }}/fonts/OpenSans-Regular.ttf') format('truetype'); }
@font-face { font-family: 'Open Sans'; font-weight: bold; src: url('{{ $art }}/fonts/OpenSans-Bold.ttf') format('truetype'); }
@page { margin: 38px 46px 70px 46px; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Open Sans', DejaVu Sans, sans-serif; color: #1c1c1c; font-size: 12px; line-height: 1.45; }
table { border-collapse: collapse; }
.gold { color: #9c6416; }
.muted { color: #6b6b6b; }
.lh td { vertical-align: top; padding: 0; }
.lh .co { text-align: right; font-size: 10.5px; line-height: 1.55; color: #3a3a3a; }
.lh .co b { font-size: 13px; color: #111; letter-spacing: .02em; }
.rule { height: 3px; background: #b8862b; margin: 12px 0 0; }
.rule-thin { height: 1px; background: #d8d2c4; margin-top: 2px; }
.title { font-size: 25px; font-weight: bold; letter-spacing: .14em; color: #111; margin: 0; }
.sub { font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: #9c6416; margin-top: 2px; }
.meta td { padding: 3px 0 3px 12px; font-size: 11.5px; }
.meta td.k { color: #6b6b6b; text-align: right; }
.meta td.v { font-weight: bold; text-align: right; white-space: nowrap; }
.label { font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: #6b6b6b; margin-bottom: 3px; }
.line { border-bottom: 1px solid #9a9a9a; height: 26px; }
.foot { position: fixed; left: 0; right: 0; bottom: -48px; text-align: center; font-size: 9px; color: #6b6b6b; border-top: 1px solid #d8d2c4; padding-top: 7px; }
.void-mark { position: fixed; top: 380px; left: 90px; font-size: 140px; font-weight: bold; color: rgba(180, 35, 24, .12); transform: rotate(-28deg); letter-spacing: .1em; }
