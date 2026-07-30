<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $subjectLine }}</title>
<style>
  body { margin: 0; padding: 0; background: #F2F2F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
  .wrap { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
  .header { background: #1E1E1E; padding: 32px 40px; }
  .header-title { color: #C5B27A; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin: 0; }
  .header-sub { color: rgba(255,255,255,0.5); font-size: 13px; margin: 4px 0 0; }
  .body { padding: 36px 40px; }
  .body p { color: #454545; font-size: 15px; line-height: 1.7; margin: 0 0 16px; white-space: pre-line; }
  .divider { border: none; border-top: 1px solid #F2F2F2; margin: 28px 0; }
  .footer { padding: 0 40px 32px; }
  .footer p { font-size: 12px; color: #999; line-height: 1.5; margin: 0 0 4px; }
  .footer a { color: #C5B27A; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p class="header-title">Vitorra Holdings</p>
    <p class="header-sub">vitorra.org</p>
  </div>
  <div class="body">
    @unless($ownGreeting)
      <p>Hi {{ $prospectName }},</p>
    @endunless
    <p>{{ $body }}</p>
    <hr class="divider">
    <p style="font-size:13px; color:#777;">
      Reply directly to this email and one of our team will get back to you, or visit
      <a href="https://vitorra.org/enquire" style="color:#C5B27A;">vitorra.org/enquire</a>.
    </p>
  </div>
  <div class="footer">
    <p>You received this because Vitorra Holdings identified your organisation as a possible fit for this product.</p>
    <p>Reply with "unsubscribe" and we will remove you from this list. Vitorra Holdings Limited, Kampala, Uganda</p>
  </div>
</div>
</body>
</html>
