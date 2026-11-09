<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#F2F2F2; font-family:'Segoe UI',Helvetica,Arial,sans-serif; color:#1E1E1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F2; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid rgba(0,0,0,0.06);">
        <tr><td style="background:#1E1E1E; padding:24px 32px;">
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:21px; font-weight:700; color:#FFFFFF;">Vitorra<span style="color:#C5B27A;"> Holdings</span></div>
          <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.55); margin-top:4px;">Staff announcement</div>
        </td></tr>
        <tr><td style="padding:30px 32px 8px;">
          <p style="font-size:15px; margin:0 0 14px;">Hello {{ $firstName }},</p>
          <h1 style="font-size:20px; line-height:1.3; margin:0 0 16px; color:#1E1E1E;">{{ $announcement->title }}</h1>
          <div style="font-size:15px; line-height:1.65; color:#454545;">{!! $bodyHtml !!}</div>
        </td></tr>
        <tr><td style="padding:12px 32px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px; background:#1E1E1E;">
            <a href="{{ $portalUrl }}" style="display:inline-block; padding:12px 26px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:999px;">Open the staff portal &rarr;</a>
          </td></tr></table>
          @if($author)<p style="font-size:13px; color:#777; margin:18px 0 0;">From {{ $author }}</p>@endif
        </td></tr>
        <tr><td style="padding:18px 32px; border-top:1px solid rgba(0,0,0,0.06); background:#FCFCFB;">
          <p style="font-size:12px; color:#999; margin:0;">Vitorra Holdings Limited · Sent to staff from People → Announcements. The same notice is on your home page in the staff portal.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
