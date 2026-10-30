<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your FET Buyer's Pack</title>
<style>
  body { margin: 0; padding: 0; background: #F2F2F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
  .wrap { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
  .header { background: #1E1E1E; padding: 32px 40px; }
  .header-title { color: #C5B27A; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin: 0; }
  .header-sub { color: rgba(255,255,255,0.6); font-size: 13px; margin: 4px 0 0; }
  .body { padding: 36px 40px; }
  .body p { color: #454545; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .body p.lead { font-size: 17px; color: #1E1E1E; font-weight: 600; margin-bottom: 8px; }
  .item { display: block; border: 1px solid #E3DFD5; border-radius: 10px; padding: 14px 16px; margin: 0 0 10px; text-decoration: none; }
  .item b { display: block; color: #1E1E1E; font-size: 15px; }
  .item span { color: #6B6B6B; font-size: 13px; }
  .cta { display: inline-block; background: #1E1E1E; color: #ffffff !important; text-decoration: none; padding: 13px 22px; border-radius: 6px; font-size: 14px; font-weight: 600; }
  table.prices { width: 100%; border-collapse: collapse; margin: 6px 0 20px; }
  table.prices td { padding: 8px 0; border-bottom: 1px solid #F2F2F2; font-size: 14px; color: #1E1E1E; }
  table.prices td.p { text-align: right; font-weight: 600; white-space: nowrap; }
  .divider { border: none; border-top: 1px solid #F2F2F2; margin: 28px 0; }
  .footer { padding: 0 40px 32px; }
  .footer p { font-size: 12px; color: #999; line-height: 1.5; margin: 0 0 4px; }
  .footer a { color: #7A6020; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p class="header-title">Fuel Eco Tech · Buyer's Pack</p>
    <p class="header-sub">Vitorra Holdings · Kampala</p>
  </div>
  <div class="body">
    <p class="lead">Hello {{ $name }},</p>
    <p>Thank you for your interest in Fuel Eco Tech. Here is everything you asked for, so you can compare the devices in your own time.</p>

    @if (count($prices))
    <p style="margin-bottom:8px; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#7A6020; font-weight:700;">Prices, installation included (UGX)</p>
    <table class="prices">
      @foreach ($prices as $p)
      <tr><td>{{ $p['label'] }} · {{ $p['fits'] }}</td><td class="p">{{ number_format($p['price_ugx']) }}</td></tr>
      @endforeach
    </table>
    @endif

    <a class="item" href="https://vitorra.org/products/fuel-eco-tech/catalogue?utm_source=buyers_pack&amp;utm_medium=email"><b>The FET catalogue</b><span>All four devices side by side, with today's stock in Kampala</span></a>
    <a class="item" href="https://vitorra.org/downloads/vitorra-fet-application-guide.pdf"><b>Which device fits your vehicle (PDF)</b><span>The manufacturer's application guide, by engine size</span></a>
    <a class="item" href="https://vitorra.org/downloads/vitorra-fet-datasheet.pdf"><b>Product datasheet (PDF)</b><span>How the device works and what it is certified for</span></a>
    <a class="item" href="https://vitorra.org/products/fuel-eco-tech?utm_source=buyers_pack&amp;utm_medium=email#fet-calculator"><b>Estimate your own savings</b><span>Enter your vehicles, distance and fuel price</span></a>

    <hr class="divider">
    <p class="lead">The next step costs nothing</p>
    <p>Before anyone buys, we offer a free fuel assessment of your vehicles, so the recommendation is based on your fleet rather than an average. In an independent field test by CTI GmbH (Germany, 2025), a VW T5 used 13.9% less fuel with the device fitted.</p>
    <p><a class="cta" href="https://vitorra.org/enquire?sector=FET&amp;utm_source=buyers_pack&amp;utm_medium=email">Book a free fuel assessment</a></p>
    <p style="font-size:14px;">Prefer to talk? Call or WhatsApp us on <a href="https://wa.me/256740026294" style="color:#7A6020;">+256 740 026 294</a>, or simply reply to this email.</p>
  </div>
  <div class="footer">
    <p>You received this because you asked for the FET Buyer's Pack at vitorra.org.</p>
    <p>Vitorra Holdings Limited · Padre Pio House, Plot 32, Lumumba Avenue, Kampala</p>
  </div>
</div>
</body>
</html>
