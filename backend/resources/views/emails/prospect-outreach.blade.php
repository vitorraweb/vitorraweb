{{--
  Campaign email — Vitorra brand.

  Built the way email has to be built: nested tables and inline styles only.
  Outlook ignores <style> blocks, max-width, border-radius and white-space
  rules, which is why the previous version arrived as one run-on paragraph.
  The writer's text is formatted by App\Support\EmailBody, so a message typed
  from scratch in the composer looks as finished as one from a template.
--}}
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>{{ $subjectLine }}</title>
<!--[if mso]><style>table,td,p,a,li{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F2F2F2;-webkit-text-size-adjust:100%;">

{{-- Inbox preview line (hidden in the message itself). --}}
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#F2F2F2;">{{ $preheader }}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2F2F2;">
<tr><td align="center" style="padding:32px 12px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E6E2D6;">

    {{-- Masthead: logo, product line, gold rule --}}
    <tr><td align="center" style="padding:36px 40px 0;">
      <a href="{{ $siteUrl }}" style="text-decoration:none;">
        <img src="{{ $logoUrl }}" width="96" height="96" alt="Vitorra Holdings Limited" style="display:block;width:96px;height:96px;border:0;outline:none;">
      </a>
    </td></tr>
    <tr><td align="center" style="padding:14px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A6020;">
      {{ $productLabel }}
    </td></tr>
    <tr><td style="padding:22px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="border-top:1px solid #C5B27A;font-size:0;line-height:0;">&nbsp;</td>
      </tr></table>
    </td></tr>

    {{-- Message --}}
    <tr><td style="padding:32px 40px 8px;">
      @unless($ownGreeting)
        <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#454545;">Dear {{ $prospectName }},</p>
      @endunless

      {!! $bodyHtml !!}

      @unless($ownSignOff)
        <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#454545;">Kind regards,</p>
        <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.5;color:#1E1E1E;">The Vitorra team</p>
      @endunless
    </td></tr>

    {{-- Attachments, named so the reader knows what to open --}}
    @if(count($attachmentNames))
    <tr><td style="padding:16px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAF8;border-left:2px solid #C5B27A;">
        <tr><td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#454545;">
          <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#7A6020;">Attached</span><br>
          @foreach($attachmentNames as $name){{ $name }}@if(! $loop->last)<br>@endif @endforeach
        </td></tr>
      </table>
    </td></tr>
    @endif

    {{-- Call to action (bulletproof button: renders in Outlook too) --}}
    <tr><td align="left" style="padding:28px 40px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td bgcolor="#1E1E1E" style="background:#1E1E1E;">
          <a href="{{ $ctaUrl }}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.5px;color:#FFFFFF;text-decoration:none;">Request a quote &rarr;</a>
        </td>
      </tr></table>
      <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#777777;">Or simply reply to this email. It reaches our whole team.</p>
    </td></tr>

    <tr><td style="padding:32px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>

    {{-- Footer --}}
    <tr><td style="background:#1E1E1E;padding:28px 40px;">
      <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#C5B27A;">Vitorra Holdings Limited</p>
      <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#BDBDBD;">
        Padre Pio House, Plot 32, Lumumba Avenue, Kampala, Uganda<br>
        <a href="tel:+256740026294" style="color:#BDBDBD;text-decoration:none;">+256 740 026 294</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:{{ $replyAddress }}" style="color:#BDBDBD;text-decoration:none;">{{ $replyAddress }}</a>
        &nbsp;&middot;&nbsp;
        <a href="{{ $siteUrl }}" style="color:#C5B27A;text-decoration:none;">vitorra.org</a>
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#8A8A8A;">
        You received this because Vitorra Holdings identified your organisation as a possible fit for {{ $productLabel === 'Vitorra Holdings' ? 'our products' : $productLabel }}.
        To stop receiving these emails, reply with &ldquo;unsubscribe&rdquo; and we will remove you.
      </p>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>
