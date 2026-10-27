#!/usr/bin/env python3
"""Upload a /blog-post draft (and its images) to the Vitorra blog as a DRAFT.

    python3 scripts/push_blog_draft.py planning/blog/drafts/2026-10-27-some-post.md

The file uses the /blog-post layout (TITLE:, SLUG:, EXCERPT:, COVER IMAGE:,
SEO TITLE:, SEO DESCRIPTION:, optional TOPIC:, then `---` and the markdown).
Local images — `![alt](images/chart.png)` or a local COVER IMAGE path — are
uploaded with it and swapped for their web addresses on the server.

Key: the output of `php artisan blog:drafts-token` on the server, saved in
~/.config/vitorra/blog-drafts-token (chmod 600) or the VITORRA_BLOG_TOKEN env.
It can only create drafts. Sending the same file again refreshes the draft.
Standard library only.
"""
import json
import mimetypes
import os
import re
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

API = os.environ.get("VITORRA_API_URL", "https://api.vitorra.org/api").rstrip("/")
TOKEN_FILE = Path.home() / ".config" / "vitorra" / "blog-drafts-token"
HEADERS = {
    "TITLE": "title", "SLUG": "slug", "EXCERPT": "excerpt", "COVER IMAGE": "cover_image",
    "SEO TITLE": "seo_title", "SEO DESCRIPTION": "seo_description", "TOPIC": "topic",
}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}


def token() -> str:
    t = os.environ.get("VITORRA_BLOG_TOKEN") or (TOKEN_FILE.read_text().strip() if TOKEN_FILE.exists() else "")
    if not t:
        sys.exit(f"No key found. Save the output of `php artisan blog:drafts-token` to {TOKEN_FILE}")
    return t


def parse(md: Path) -> tuple[dict, list[Path]]:
    head, sep, body = md.read_text().partition("\n---\n")
    if not sep:
        sys.exit("The file needs a line with just --- between the fields and the article.")
    fields = {}
    for line in head.splitlines():
        key, _, value = line.partition(":")
        if key.strip().upper() in HEADERS and value.strip():
            # Drop the "(≤ 60 chars)"-style notes if a template line was left in.
            fields[HEADERS[key.strip().upper()]] = re.sub(r"\s{2,}\(.*\)$", "", value.strip())
    fields["content"] = body.strip() + "\n"

    images: list[Path] = []

    def local(ref: str) -> Path | None:
        if re.match(r"^(https?:)?/", ref):
            return None
        p = (md.parent / ref).resolve()
        if p.suffix.lower() not in IMAGE_EXT or not p.exists():
            sys.exit(f"Image not found or not PNG/JPEG/WebP: {ref}")
        return p

    def swap(m: re.Match) -> str:
        p = local(m.group(2))
        if not p:
            return m.group(0)
        images.append(p)
        return f"{m.group(1)}({p.name})"

    fields["content"] = re.sub(r"(!\[[^\]]*\])\(([^)\s]+)\)", swap, fields["content"])
    if fields.get("cover_image") and (p := local(fields["cover_image"])):
        images.append(p)
        fields["cover_image"] = p.name

    for k in ("title", "content"):
        if not fields.get(k):
            sys.exit(f"Missing {k}.")
    return fields, list(dict.fromkeys(images))


def multipart(fields: dict, images: list[Path]) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = bytearray()
    for k, v in fields.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n'.encode() + str(v).encode() + b"\r\n"
    for p in images:
        mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        out += (f'--{boundary}\r\nContent-Disposition: form-data; name="images[]"; filename="{p.name}"\r\n'
                f"Content-Type: {mime}\r\n\r\n").encode() + p.read_bytes() + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={boundary}"


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    fields, images = parse(Path(sys.argv[1]))
    body, ctype = multipart(fields, images)
    req = urllib.request.Request(f"{API}/blog/drafts", data=body, method="POST", headers={
        "Authorization": f"Bearer {token()}", "Accept": "application/json", "Content-Type": ctype,
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            data = json.load(res)["data"]
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        try:
            detail = json.loads(detail).get("message", detail)
        except ValueError:
            pass
        sys.exit(f"Upload failed ({e.code}): {detail}")

    print(("Updated" if data["updated"] else "Created") + f" draft #{data['id']} with {len(images)} image(s).")
    print(f"Review it here, then press Send for review: {data['edit_url']}")


if __name__ == "__main__":
    main()
