# Outlook-Style Email Feature — Spec & Build Guide

A portable spec for replicating the "compose and reply like Outlook, inside our
own system" feature on a different platform (not this codebase). It covers
what the feature actually is, the data model, and — the genuinely hard part —
how to accept a pasted-from-Outlook signature/email body safely.

A working reference implementation lives in this repo if you want to see real
code: `backend/app/Support/SignatureHtml.php` (sanitizer + image extraction),
`frontend/src/components/EmailSignaturePanel.tsx` (the paste-preserving
editor), `backend/app/Http/Controllers/Api/CustomerController.php` +
`AccountController.php` (compose/reply endpoints), `backend/app/Models/
Communication.php` (the message log). Everything below is written stack-
agnostic; those files are just one instance of it in Laravel + Next.js.

---

## 1. What "do everything they do in Outlook" actually means

Break the vague ask into concrete, buildable pieces:

1. **Compose/reply with rich formatting** — bold, colors, links, tables —
   and when someone *pastes* content copied from Outlook (or Word, or another
   webpage), it should look the same in the composer as it did at the source.
2. **A saved signature**, set up once, pasted in exactly like it appears in
   Outlook (including an inline logo image), and appended automatically to
   every outgoing message from then on — the person never re-types or
   re-pastes it.
3. **Attachments** — multiple files, with sane type/size limits.
4. **CC / additional recipients**, picked from teammates or typed freely.
5. **Correct sender identity** — the system knows who's sending because
   they're logged in; the "From" name and signature are theirs automatically,
   not something they have to select.
6. **Two-way visibility** — when the *other side* replies, it lands back
   inside the system (not just in someone's personal inbox), so nothing gets
   lost when the person who sent the first message is out sick or leaves.
7. **Unread indicators / read receipts** so staff can see what's new without
   re-reading every thread.
8. **Threading** — replies stay attached to the right conversation/customer
   record (subject line + `Message-Id`/`In-Reply-To` headers, or a portal-side
   thread ID if you're not doing real email threading).

Everything below is about building #1 and #2 correctly, since they're the
part that's easy to get wrong (either by producing broken-looking emails, or
by opening an XSS hole). #3–#8 are comparatively standard CRUD + a mail send.

---

## 2. Data model

Minimum viable schema — one `messages`/`communications` table, one signature
column on the user record:

```
communications
  id
  contact_email          -- who the thread is with
  direction               enum('inbound','outbound')
  channel                 enum('email','portal')   -- portal = the other side replied from their own account, not email
  subject
  body                     text/html
  cc                       json array of emails
  attachments              json array of {name, path, mime, size}
  sent_by                  user id (nullable — null for inbound)
  message_id               -- this message's own Message-Id header, for threading
  in_reply_to              -- the Message-Id it's replying to
  staff_read_at
  customer_read_at
  created_at

users
  email_signature          text/longtext, nullable   -- sanitized HTML, see §4
```

Use `LONGTEXT`/equivalent for `email_signature`, not a capped `TEXT`/`VARCHAR`
— a plain-text signature is a few hundred bytes, but one with an inline logo
(even after the image itself is extracted out, see §5) plus Outlook's verbose
inline-style markup can run past a 64KB `TEXT` column's limit before you've
done anything unusual.

---

## 3. The composer: let the browser do the pasting, don't fight it

The instinct is to intercept `paste`, strip formatting, and rebuild it
yourself. Don't — a `contenteditable` element *already* reproduces pasted
rich content faithfully, including inline images that arrive as
`data:image/...;base64,...` straight in the HTML. Intercepting and
rebuilding it yourself only loses fidelity for no benefit; the sanitizer in
§5 is what keeps this safe, not the editor.

```html
<div contenteditable
     data-placeholder="Paste your signature here…"
     onpaste="handlePaste(event)">
</div>
```

```js
function handlePaste(e) {
  // HTML on the clipboard (Outlook, Word, a browser tab) — let the browser
  // paste it natively. This is the whole trick: do nothing.
  if (e.clipboardData.getData('text/html')) return;

  // No HTML on the clipboard — e.g. a bare copied screenshot. Some browsers
  // won't drop a raw image file into a contenteditable on their own, so
  // handle that one case manually.
  const imageItem = [...e.clipboardData.items]
    .find(item => item.kind === 'file' && item.type.startsWith('image/'));
  if (!imageItem) return; // plain text — default paste already handles this

  e.preventDefault();
  const reader = new FileReader();
  reader.onload = () => document.execCommand('insertImage', false, reader.result);
  reader.readAsDataURL(imageItem.getAsFile());
}
```

Notes:
- `document.execCommand` is deprecated but still the simplest cross-browser
  way to insert at the cursor inside a `contenteditable`; there's no
  standardized replacement yet. Fine for this narrow use.
- Keep the editor **uncontrolled** — don't bind its `innerHTML` to a React/Vue
  state value that re-renders on every keystroke, or you'll clobber the
  cursor position mid-type. Set the initial content once (on mount / when
  loaded from the server), then read `el.innerHTML` only at save time.
- On save, POST the raw `innerHTML` to the server as-is. Do not trust it,
  do not pre-clean it client-side as a security measure — that's decoration,
  not defense. The sanitizer in §5 is the actual boundary.

---

## 4. Why you can't skip server-side sanitization

The pasted HTML is going to be:
- Stored, then
- Re-rendered inside your own admin UI (so a stored `<script>` becomes
  stored XSS against your own staff), and
- Re-embedded into outgoing HTML emails (so a malformed paste can break the
  rendered email, or — if you're sloppy — carry something malicious to the
  recipient's mail client too).

So: sanitize once, on write, with a strict allow-list. Don't sanitize on
read/render — that's more places for someone to forget it.

**Algorithm** (implementation-agnostic; the reference implementation does
this with PHP's `DOMDocument`, but the same steps work with any DOM parser —
`jsdom` in Node, `lxml`/`BeautifulSoup` in Python, etc.):

1. **Strip Word/Outlook namespace tags before parsing.** Outlook's HTML
   export wraps content in tags like `<o:p>`, `<w:sdt>`, `<v:shape>`. Regular
   HTML parsers don't understand namespaces and will mangle these (e.g.
   `<o:p>` silently becomes a bare `<p>`, which then looks like ordinary,
   legitimate content to your sanitizer). Strip any `<prefix:tag ...>` /
   `</prefix:tag>` pattern with a regex *before* handing the string to an
   HTML parser, keeping whatever text was inside.
2. **Parse into a DOM**, not string regex, for everything else — attribute
   stripping on nested/malformed markup is not reliably regex-safe.
3. **Walk the tree.** For each element:
   - If its tag is on a small deny-list (`script`, `style`, `iframe`,
     `object`, `embed`, `form`, `input`, `button`, `textarea`, `link`,
     `meta`) — remove the element and its contents entirely.
   - If its tag is **not** on your allow-list (`a`, `b`/`strong`, `i`/`em`,
     `u`, `span`, `div`, `p`, `br`, `hr`, `img`, `table`/`tbody`/`thead`/
     `tr`/`td`/`th`, `ul`/`ol`/`li`, `font`, `small`, `sub`, `sup` is a
     reasonable starting set for a *signature*) — **unwrap** it: keep its
     children, drop just the tag. This is what makes unknown/junk wrapper
     tags disappear without deleting real content.
   - For every remaining element, strip every attribute except a small
     allow-list (`href`, `src`, `alt`, `title`, `width`, `height`, `style`,
     `colspan`, `rowspan`, `align`, `target`, `rel`, `face`, `size`,
     `color`). Anything starting with `on` (`onclick`, `onerror`, …) is
     always removed.
   - On `href`/`src`, remove the attribute outright if its value starts with
     `javascript:` (after trimming whitespace).
   - On `style`, drop the whole attribute if it contains `javascript:` or
     `expression(` (old IE CSS-expression vector).
4. **Serialize back to a string** and store that — never the original input.

This is a genuinely small amount of code (~150 lines) and doesn't need a
third-party library, though reaching for one is fine too if your stack has a
well-maintained option (`HTMLPurifier` for PHP, `DOMPurify` — usable
server-side under `jsdom` — for Node, `bleach` for Python, `sanitize` gem for
Ruby). The point isn't which tool; it's that this step must exist and must
run server-side, unconditionally, before the value is ever persisted.

---

## 5. Inline images: extract, don't store inline

A pasted signature logo arrives as `<img src="data:image/png;base64,AAAA...">`
— the full image, base64-inflated by ~33%, sitting inline in the HTML. Left
as-is:

- It bloats the database row every time the signature is saved.
- It gets **re-embedded in full** in every single outgoing email from then
  on, multiplying storage/bandwidth for something that never changes.

Instead, at save time (after sanitization), regex-match
`data:image/(png|jpe?g|gif|webp);base64,...` inside any `<img src="...">`,
`base64_decode` the payload, write it to a real file on public object storage
(S3, GCS, or a public disk behind your CDN), and rewrite the `src` to that
file's public URL. If the base64 payload fails to decode, drop the `<img>`
tag entirely rather than storing a broken data URI.

```
signatures/{user_id}/{random}.{png|jpg|gif|webp}
```

For the outgoing **email itself**, use the same public URL, not the data
URI and not a mail attachment with a `cid:` reference — a plain
`https://...` `<img src>` is simplest, works in effectively every modern mail
client, and doesn't inflate the email payload. (Downside: some corporate
mail clients block remote images by default until the user clicks "show
images" — acceptable tradeoff for a *signature* logo; most people already
tolerate that for every marketing email they get.)

---

## 6. Sending

- Append the sender's `email_signature` HTML **at send time**, reading it
  fresh from their user record — don't bake a copy of it into the draft, so
  a signature update takes effect on the next email without anyone doing
  anything.
- Render the signature as raw HTML in the outgoing template (`{!! !!}` in
  Blade, `dangerouslySetInnerHTML` if you're previewing it in a React admin
  UI, `| safe` in Jinja2, etc.) — *only* because it was already sanitized on
  the way in. Never mark unsanitized user input as "safe" to render raw.
- If there's no signature set, fall back to something plain: `— {name}\n
  {company}`.
- Set the reply-to header to the sender's own address (or a shared inbox
  address, if you're doing inbound-email capture — see #6 in §1) so a
  reply from the recipient's side routes to the right place.

---

## 7. Checklist to build this on a new platform

- [ ] `communications`/`messages` table + `email_signature` column (as `LONGTEXT`)
- [ ] Compose/reply endpoint: validate `cc[]` (cap it, e.g. max 5, each a
      valid email), validate attachments (mime allow-list, size cap per file
      and total), store the message row
- [ ] Signature endpoint: `PUT /me/signature` — auth-gated to staff/internal
      users only, generous length cap (~200KB of raw HTML is plenty), runs
      the sanitizer (§4) + image extractor (§5) before saving
- [ ] Sanitizer function/class, unit-tested against: script tags, `on*`
      handlers, `javascript:` URLs, CSS `expression()`, unknown tags
      (content kept), Word namespace tags (`<o:p>` etc.), a real embedded
      image (extracted to a file, URL rewritten), a corrupt base64 payload
      (dropped, not stored broken)
- [ ] `contenteditable` composer + signature editor (§3) — paste-through,
      uncontrolled, one manual fallback path for bare image-file pastes
- [ ] Signature preview wherever a draft is composed, rendered as HTML
      (post-sanitization, so this is safe)
- [ ] Outgoing mail template renders the signature as raw HTML, falls back
      to a plain default when unset
- [ ] (If doing two-way inbound capture) a webhook endpoint from your
      transactional-email provider (Resend, Postmark, SendGrid inbound
      parse, etc.) that creates an *inbound* message row from a reply — this
      is materially more infrastructure (a receiving subdomain + MX record +
      webhook signature verification) than everything above; scope it as a
      separate phase, and it's completely optional if "reply lands back in
      the system" only needs to work for replies sent *through the platform's
      own portal* rather than through the recipient's personal email client.

---

## 8. Pitfalls worth knowing up front

- **Don't sanitize on read.** Sanitize once, at write time, and store the
  clean result. Re-sanitizing on every render is wasted work and, worse,
  tempts you into skipping it in some code path that renders the same field.
- **Don't trust the browser's paste as your only defense.** contenteditable
  paste is for fidelity, not safety — the server-side allow-list sanitizer is
  the actual security boundary.
- **Watch your DB column type.** A capped `TEXT`/`VARCHAR` will silently
  truncate a real-world Outlook signature with an image before you've done
  anything wrong on the code side.
- **If your mail system sends via a "Notification" abstraction** (Laravel
  Notifications, similar patterns elsewhere) that lets you return a fully
  custom Mailable/message object instead of the framework's own simple
  message builder — check whether that path still auto-addresses the
  message. Several frameworks' "advanced" mail-object escape hatches quietly
  drop the auto-`to()` the simple path gives you for free; you end up having
  to call `.to(recipient)` explicitly. Easy to miss, easy to test: send it in
  a test and assert an actual recipient was set, not just that "a mail was
  queued."
