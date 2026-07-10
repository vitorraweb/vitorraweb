<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#F2F2F2; font-family:'Segoe UI',Helvetica,Arial,sans-serif; color:#1E1E1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F2; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border-radius:20px; overflow:hidden; border:1px solid rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background:#1E1E1E; padding:28px 32px;">
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:700; color:#FFFFFF; letter-spacing:-0.01em;">
            Vitorra<span style="color:#C5B27A;"> Holdings</span>
          </div>
          <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-top:4px;">Limited</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="font-size:16px; margin:0 0 16px;">Hello {{ $firstName }},</p>
          <p style="font-size:15px; line-height:1.65; color:#454545; margin:0 0 22px;">
            An enquiry has been assigned to you.
          </p>

          <!-- Enquiry summary -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8; border:1px solid rgba(197,178,122,0.3); border-radius:14px; margin:0 0 24px;">
            <tr><td style="padding:18px 20px;">
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#999; margin-bottom:4px;">From</div>
              <div style="font-size:15px; font-weight:600; margin-bottom:14px;">{{ $enquiry->name }} ({{ $enquiry->email }})</div>
              @if($enquiry->product_category)
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#999; margin-bottom:4px;">Product</div>
              <div style="font-size:14px; font-weight:600; margin-bottom:14px;">{{ $enquiry->product_category }}</div>
              @endif
              @if($enquiry->message)
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#999; margin-bottom:4px;">Message</div>
              <div style="font-size:14px; line-height:1.6; color:#454545;">{{ \Illuminate\Support\Str::limit($enquiry->message, 240) }}</div>
              @endif
            </td></tr>
          </table>

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:999px; background:#C5B27A;">
              <a href="{{ $enquiriesUrl }}" style="display:inline-block; padding:13px 30px; font-size:15px; font-weight:700; color:#1E1E1E; text-decoration:none; border-radius:999px;">View enquiry &rarr;</a>
            </td></tr>
          </table>

          <p style="font-size:13px; line-height:1.6; color:#999; margin:0;">
            If the button doesn't work, open this link:<br>
            <a href="{{ $enquiriesUrl }}" style="color:#7A6020;">{{ $enquiriesUrl }}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px; border-top:1px solid rgba(0,0,0,0.06); background:#FCFCFB;">
          <p style="font-size:12px; color:#aaa; margin:0;">Vitorra Holdings Limited · Internal notification.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
