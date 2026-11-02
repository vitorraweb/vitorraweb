<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f0e6;font-family:Arial,Helvetica,sans-serif;color:#1e1e1e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;padding:28px">
  <tr><td style="font-size:20px;font-weight:bold;padding-bottom:14px">{{ $heading }}</td></tr>
  @foreach ($lines as $line)
    <tr><td style="font-size:15px;line-height:1.5;padding-bottom:10px">{{ $line }}</td></tr>
  @endforeach
  @if ($link)
    <tr><td style="padding-top:8px"><a href="{{ $link }}" style="background:#1e1e1e;color:#ffffff;padding:11px 18px;text-decoration:none;font-size:15px;display:inline-block">{{ $linkLabel ?? 'Open' }}</a></td></tr>
  @endif
  <tr><td style="font-size:13px;color:#555;padding-top:22px">Vitorra Holdings Limited · Padre Pio House, Lumumba Avenue, Kampala</td></tr>
</table></td></tr></table>
</body></html>
