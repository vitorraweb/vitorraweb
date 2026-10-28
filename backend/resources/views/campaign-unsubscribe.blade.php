<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Unsubscribe · Vitorra Holdings</title>
<style>
  body{margin:0;background:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1F2328;}
  main{max-width:460px;margin:12vh auto;background:#fff;border:1px solid #E1E4E8;border-radius:8px;padding:32px;text-align:center;}
  h1{font-size:20px;margin:16px 0 8px;} p{font-size:15px;line-height:1.6;color:#3D434B;margin:0 0 20px;}
  button{font:inherit;font-weight:600;background:#1E1E1E;color:#fff;border:0;border-radius:6px;padding:12px 22px;cursor:pointer;}
  a{color:#7A6020;}
</style>
</head>
<body>
<main>
  <img src="https://vitorra.org/logo.png" width="64" height="64" alt="Vitorra Holdings">
  @if(! $found)
    <h1>This link is not valid</h1>
    <p>To stop receiving our emails, reply to any of them with “unsubscribe”.</p>
  @elseif($done)
    <h1>You are unsubscribed</h1>
    <p>{{ $email }} will not receive Vitorra marketing emails again. Replies you send us still reach our team.</p>
  @else
    <h1>Stop receiving our emails?</h1>
    <p>{{ $email }} will be removed from all Vitorra Holdings marketing emails.</p>
    <form method="POST" action="">
      <button type="submit">Unsubscribe</button>
    </form>
  @endif
  <p style="margin:24px 0 0;font-size:13px;"><a href="https://vitorra.org">vitorra.org</a></p>
</main>
</body>
</html>
