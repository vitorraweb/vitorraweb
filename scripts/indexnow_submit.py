#!/usr/bin/env python3
"""Tell Bing (via IndexNow) about every page in the live sitemap.

    python3 scripts/indexnow_submit.py

Run after a release that changes many pages. Blog posts announce themselves
when published (backend App\\Services\\IndexNow); this covers everything else.
The key is public: the site serves it at https://vitorra.org/<key>.txt.
"""
import json
import re
import urllib.request

KEY = "25453b7fae61c6b0aa0b2c5a0db0a22b"
SITE = "https://vitorra.org"

xml = urllib.request.urlopen(f"{SITE}/sitemap.xml", timeout=30).read().decode()
urls = sorted(set(re.findall(r"<loc>(.*?)</loc>", xml)))
body = json.dumps({"host": "vitorra.org", "key": KEY, "keyLocation": f"{SITE}/{KEY}.txt", "urlList": urls}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
with urllib.request.urlopen(req, timeout=30) as r:
    print(f"IndexNow: {r.status} for {len(urls)} URLs")
