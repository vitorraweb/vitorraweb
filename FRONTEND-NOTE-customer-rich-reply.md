# Frontend TODO — rich paste in the customer portal's Messages tab

Backend is done and deployed-ready. This is what's left, and it's entirely in
`frontend/src/app/[locale]/account/messages/page.tsx`.

## What changed on the backend (already shipped)

`POST /account/communications` (customer's own reply) now runs the pasted
`body` through the same sanitizer used for staff email signatures
(`App\Support\SignatureHtml::process($body, $user->id, 'communications')`)
before storing it. That means:

- The API now accepts (and expects) rich HTML in `body`, not plain text —
  cap raised from 5,000 to 50,000 chars server-side.
- Anything unsafe (`<script>`, `on*` handlers, `javascript:` URLs) is
  stripped before it's ever saved — you don't need to sanitize on the way in,
  the endpoint already refuses to store it.
- A pasted image (e.g. a screenshot) is extracted to a real file under
  `storage/communications/{user_id}/...` and the `<img src>` is rewritten to
  its public URL — the raw base64 never touches the database.
- `GET /account/communications` now returns `body` as sanitized HTML for any
  row the customer themselves sent (`direction: "inbound", channel: "portal"`).
  Rows from staff (`direction: "outbound"`) are unaffected — still plain
  text, unchanged.
- If a paste sanitizes down to nothing (e.g. someone pastes only a
  `<script>` tag), the endpoint now returns `422` instead of saving an empty
  message.

Full write-up of *why* it's built this way (paste handling, sanitizer
algorithm, image extraction) is in `OUTLOOK-STYLE-EMAIL-SPEC.md` at the repo
root — §3–§5 specifically. The exact reference implementation for the editor
side is already live at `frontend/src/components/EmailSignaturePanel.tsx`
(used on `/admin/profile` and `/staff/profile`) — this task is the same
pattern, ported into the Messages tab's reply box.

## What to change here

### 1. Replace the reply `<textarea>` with a paste-preserving editor

Currently (`account/messages/page.tsx` lines ~24, 97–100):

```tsx
const [body, setBody] = useState("");
// ...
<textarea value={body} onChange={(e) => setBody(e.target.value)} ... />
```

Swap for a `contentEditable` div, uncontrolled (don't bind `innerHTML` to
React state on every keystroke — you'll fight the cursor). Mirror
`EmailSignaturePanel.tsx`'s approach exactly:

- A `ref` to the div, set via a callback ref that writes `el.innerHTML` once
  (there's no existing draft to restore here, so it just starts empty —
  simpler than the signature panel, which loads a saved value first).
- An `onPaste` handler: if `e.clipboardData.getData('text/html')` is
  non-empty, do nothing and let the browser paste natively. If it's empty
  but there's an image file on the clipboard, read it via `FileReader` and
  `document.execCommand('insertImage', false, dataUrl)`. Otherwise (plain
  text), do nothing — default paste already handles it.
- A CSS `:empty::before { content: attr(data-placeholder) }` rule for the
  placeholder, since a `contenteditable` div has no `placeholder` attribute.

### 2. Read `innerHTML` at send time, not `body` state

```tsx
const send = async () => {
  const html = editorRef.current?.innerHTML ?? "";
  if (!html.trim()) return;
  // ...append to FormData as "body", same as today...
  // then clear it: editorRef.current.innerHTML = "";
};
```

The send-disabled check (`disabled={sending || !body.trim()}`) needs to
become a small piece of state you update `onInput` (e.g. `hasContent`)
since you're no longer reading a controlled `body` value on every render —
or just re-check `editorRef.current?.textContent?.trim()` at click time and
skip the disabled-attribute reactivity if that's simpler.

### 3. Render inbound (customer's own) messages as HTML

Line 77 currently:

```tsx
<p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#454545" }}>{c.body}</p>
```

This renders every message in the thread the same way. Only the customer's
own messages (`c.direction === "inbound"`, i.e. the `mine` bubbles) will ever
contain HTML now — staff replies (`outbound`) are untouched, still plain
text. Branch it:

```tsx
{mine ? (
  <div className="text-sm leading-relaxed [&_img]:max-w-[220px] [&_img]:h-auto [&_p]:my-1"
    style={{ color: "#454545" }}
    dangerouslySetInnerHTML={{ __html: c.body }} />
) : (
  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#454545" }}>{c.body}</p>
)}
```

Safe to render raw here specifically *because* the backend already
sanitized it before storing (same trust boundary as the admin panel's
`ThreadBubble` in `admin/customers/page.tsx`, which got the equivalent fix
already).

### 4. Handle the new 422

If a paste sanitizes to nothing, the endpoint now returns `422` with a
`{"message": "Message cannot be empty."}` body — surface that instead of
silently swallowing the error in the `catch` block (currently `catch { /*
ignore */ }`). In practice this only fires if someone pastes something that
sanitizes to literally nothing (e.g. a bare `<script>` tag), which is an
edge case, but worth a toast/inline error rather than a silent no-op so it
doesn't look like the send button is broken.

### 5. i18n

This page is translated (`messages/en.json` / `messages/sw.json` under the
`account` key — `t("replyPlaceholder")` etc.). No new copy is strictly
required (the placeholder text works fine as-is), but if you add any new
UI text (e.g. an attach-image hint, or the 422 error message), it needs
entries in both locale files, matching the existing `account.*` keys.

## Not in scope for this pass

- Staff's own compose box in `/admin/customers` (`replyBody` textarea,
  posts to `CustomerController::sendReply`) is **not** getting rich paste in
  this change — its `body` validation is still a 5,000-char plain string.
  If that's wanted too, it's the same pattern, applied server-side to
  `CustomerController::sendReply` and client-side to the reply box in
  `admin/customers/page.tsx` — just flag it explicitly before starting, it's
  a separate, deliberate scope decision, not an oversight.
- Inbound *email* capture (a customer replying from their own Outlook/Gmail
  rather than the portal) is unrelated infrastructure (Phase B, already
  scaffolded, gated off) — this task is only about the portal reply box.
