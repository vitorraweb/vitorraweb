@if($sender)
{{ $sender->name }} has written a blog article and would like you to check it. It is NOT on the website yet.
@else
A new blog article has been drafted and is waiting for you. It is NOT on the website yet.
@endif

@if($topic)
Topic: {{ $topic }}
@endif
Title: {{ $post->title }}

{{ $post->excerpt }}

Read it and publish with one click:
{{ $reviewLink }}

Or open it in the console to edit first:
{{ $editLink }}

Before publishing, check the facts and figures, and that nothing it says about Vitorra goes beyond what we can stand behind. Nothing goes live until someone presses Publish.
@if($sender)

Reply to this email to answer {{ $sender->name }} directly.
@endif
