"""Build the Microsoft Teams app package for the Vitorra dashboard tab.

    scripts/.venv/bin/python scripts/build_teams_app.py --client-id <ENTRA_CLIENT_ID>

Writes teams-app/dist/vitorra-teams.zip (manifest.json + color.png + outline.png),
which an admin uploads in Teams admin center → Manage apps → Upload new app
(or Teams → Apps → Manage your apps → Upload an app, for a single person).

  --client-id  the Application (client) ID of the single-tenant Entra app used
               for the tab's sign-in. Without it the package still builds, but
               the tab cannot sign anyone in (no webApplicationInfo).
  --domain     the site that serves the tab (default vitorra.org).
  --version    the package version; bump it for every re-upload (default 1.0.0).

The Teams app id is fixed (teams-app/app-id.txt) so a re-upload updates the
same app instead of adding a second one. Icons are generated from
frontend/public/logo.png: color 192×192, outline 32×32 white-on-transparent.
Nothing is uploaded or published by this script.
"""

from __future__ import annotations

import argparse
import json
import re
import uuid
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
APP_DIR = ROOT / "teams-app"
LOGO = ROOT / "frontend" / "public" / "logo.png"
GUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def app_id() -> str:
    path = APP_DIR / "app-id.txt"
    if path.exists():
        return path.read_text().strip()
    new = str(uuid.uuid4())
    path.write_text(new + "\n")
    return new


def icons() -> None:
    logo = Image.open(LOGO).convert("RGBA")

    # Colour icon: the logo centred on white, full bleed, 192×192.
    color = Image.new("RGBA", (192, 192), (255, 255, 255, 255))
    mark = logo.copy()
    mark.thumbnail((156, 156), Image.LANCZOS)
    color.alpha_composite(mark, ((192 - mark.width) // 2, (192 - mark.height) // 2))
    color.convert("RGB").save(APP_DIR / "color.png")

    # Outline icon: 32×32, white where the logo is, transparent elsewhere.
    small = logo.copy()
    small.thumbnail((28, 28), Image.LANCZOS)
    alpha = small.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    white = Image.new("RGBA", small.size, (255, 255, 255, 0))
    white.putalpha(alpha)
    outline = Image.new("RGBA", (32, 32), (255, 255, 255, 0))
    outline.alpha_composite(white, ((32 - small.width) // 2, (32 - small.height) // 2))
    outline.save(APP_DIR / "outline.png")


def manifest(client_id: str | None, domain: str, version: str) -> dict:
    base = f"https://{domain}"
    m = json.loads((APP_DIR / "manifest.template.json").read_text())
    m["id"] = app_id()
    m["version"] = version
    text = json.dumps(m).replace("{{DOMAIN}}", domain).replace("{{BASE_URL}}", base)
    m = json.loads(text)
    if client_id:
        m["webApplicationInfo"] = {"id": client_id, "resource": f"api://{domain}/{client_id}"}
    return m


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--client-id")
    ap.add_argument("--domain", default="vitorra.org")
    ap.add_argument("--version", default="1.0.0")
    args = ap.parse_args()

    if args.client_id and not GUID.match(args.client_id):
        raise SystemExit("--client-id must be the Entra Application (client) ID, a GUID.")
    if not re.match(r"^\d+\.\d+\.\d+$", args.version):
        raise SystemExit("--version must look like 1.0.0")

    icons()
    m = manifest(args.client_id, args.domain, args.version)
    (APP_DIR / "dist").mkdir(exist_ok=True)
    (APP_DIR / "dist" / "manifest.json").write_text(json.dumps(m, indent=2) + "\n")

    out = APP_DIR / "dist" / "vitorra-teams.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(m, indent=2))
        z.write(APP_DIR / "color.png", "color.png")
        z.write(APP_DIR / "outline.png", "outline.png")

    print(f"Built {out.relative_to(ROOT)}  (app id {m['id']}, version {m['version']})")
    if not args.client_id:
        print("Note: no --client-id given — the tab will load but cannot sign anyone in.")


if __name__ == "__main__":
    main()
