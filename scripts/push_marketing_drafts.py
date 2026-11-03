#!/usr/bin/env python3
"""Send the day's marketing drafts to the console, switched off.

    python3 scripts/push_marketing_drafts.py marketing/drafts/2026-11-03.json

The JSON file holds {"spotlights": [...], "campaigns": [...]}. A Spotlight is
saved inactive and a campaign is saved as an unsent draft with no audience; a
person reviews them in Console → Marketing and switches on or sends. Uses the
same key as scripts/push_blog_draft.py (~/.config/vitorra/blog-drafts-token).
Standard library only.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API = os.environ.get("VITORRA_API_URL", "https://api.vitorra.org/api").rstrip("/")
SITE = "https://vitorra.org"
TOKEN_FILE = Path.home() / ".config" / "vitorra" / "blog-drafts-token"


def token() -> str:
    t = os.environ.get("VITORRA_BLOG_TOKEN") or (TOKEN_FILE.read_text().strip() if TOKEN_FILE.exists() else "")
    if not t:
        sys.exit(f"No key found. Save the output of `php artisan blog:drafts-token` to {TOKEN_FILE}")
    return t


def send(path: str, body: dict) -> dict:
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode(), method="POST", headers={
        "Authorization": f"Bearer {token()}", "Accept": "application/json", "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return json.load(res)["data"]
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        try:
            detail = json.loads(detail).get("message", detail)
        except ValueError:
            pass
        sys.exit(f"{path} refused ({e.code}): {detail}")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    drafts = json.loads(Path(sys.argv[1]).read_text())
    for s in drafts.get("spotlights", []):
        d = send("/drafts/spotlight", s)
        print(f"Spotlight draft #{d['id']} (off): {s['title']}\n  Review: {SITE}{d['review']}")
    for c in drafts.get("campaigns", []):
        d = send("/drafts/campaign", c)
        print(f"Campaign draft #{d['id']} (unsent): {c['name']}\n  Review: {SITE}{d['review']}")


if __name__ == "__main__":
    main()
