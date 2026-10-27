<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Review: {{ $post->title }}</title>
<style>
  :root { --ink:#1E1E1E; --body:#454545; --gold:#7A6020; --line:#E4DFD3; --paper:#FAFAF8; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--paper); color:var(--body); font:16px/1.65 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; }
  .bar { position:sticky; top:0; background:#fff; border-bottom:1px solid var(--line); padding:14px 16px; }
  .bar-in, main { max-width:720px; margin:0 auto; }
  .bar-in { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
  .state { font-size:14px; }
  .state b { color:var(--ink); font-weight:600; }
  .btn { display:inline-flex; align-items:center; height:40px; box-sizing:border-box; border:1px solid transparent; border-radius:999px; padding:0 20px; font-family:inherit; font-size:14px; font-weight:600; line-height:1; cursor:pointer; text-decoration:none; vertical-align:middle; }
  .btn-gold { background:#C5B27A; color:var(--ink); }
  .btn-line { background:#fff; color:var(--ink); border-color:var(--line); }
  main { padding:32px 16px 64px; }
  .label { color:var(--gold); font-size:12px; letter-spacing:.12em; text-transform:uppercase; }
  h1 { color:var(--ink); font:400 34px/1.2 Georgia, serif; margin:8px 0 12px; }
  h2 { color:var(--ink); font:400 22px/1.3 Georgia, serif; margin:32px 0 8px; }
  .lead { font-size:18px; }
  img.cover { width:100%; border-radius:12px; margin:16px 0; }
  /* Charts and photos inside the article fit the column, as on the public blog. */
  main img { display:block; max-width:100%; height:auto; border-radius:12px; margin:28px 0; }
  main ul, main ol { padding-left:1.25em; }
  main li { margin:4px 0; }
  a { color:var(--gold); }
  .ok { background:#EEF6EC; border:1px solid #BFD9B8; color:#24502A; padding:12px 16px; border-radius:10px; margin-bottom:24px; }
</style>
</head>
<body>
<div class="bar"><div class="bar-in">
  @if($post->status === 'published')
    <span class="state"><b>Live on the website.</b></span>
    <span><a class="btn btn-line" href="{{ $liveUrl }}">View on the site</a></span>
  @else
    <span class="state"><b>Draft</b> — not on the website yet.</span>
    <span style="display:flex; gap:8px; flex-wrap:wrap">
      <a class="btn btn-line" href="{{ $editUrl }}">Edit in console</a>
      <form method="post" action="{{ $action }}" style="display:inline-flex; margin:0">
        <button class="btn btn-gold" type="submit">Publish now</button>
      </form>
    </span>
  @endif
</div></div>
<main>
  @if($published)
    <div class="ok">Published. It can take a minute or two to appear on the blog.</div>
  @endif
  <div class="label">Vitorra blog · review copy</div>
  <h1>{{ $post->title }}</h1>
  <p class="lead">{{ $post->excerpt }}</p>
  @if($post->cover_image)
    <img class="cover" src="{{ rtrim((string) config('services.frontend.url'), '/') }}{{ $post->cover_image }}" alt="">
  @endif
  {!! $post->content_html !!}
</main>
</body>
</html>
