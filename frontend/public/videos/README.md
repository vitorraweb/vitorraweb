# Video Assets

## Naming convention

Two cuts per product: a short `{product}.mp4` for the homepage hero and video
showcase, and a long `{product}-hero.mp4` brand film for the product page hero and
the reception kiosk (`/display`).

| Product | Short clip | Brand film | Poster |
|---------|-----------|------------|--------|
| Fuel Eco Tech | `fet.mp4` | `fet-hero.mp4` | `fet-poster.jpg` |
| SEAL Wound Spray | `seal.mp4` | `seal-hero.mp4` | `seal-poster.jpg` |
| Vitorra Coffee | `coffee.mp4` | `coffee-hero.mp4` | `coffee-poster.jpg` |
| Logistics Services | `logistics.mp4` | `logistics-hero.mp4` | `logistics-poster.jpg` |

## Where each file came from

Keep this current. If a clip's licence is ever questioned, this table is the
answer, and "we think someone downloaded it" is not.

| File | Source | Licence |
|------|--------|---------|
| `fet-hero.mp4`, `fet.mp4` | Supplied by Vitorra (FET manufacturer material) | Own/supplied |
| `seal-hero.mp4` | Supplied by Vitorra (SEAL manufacturer material) | Own/supplied |
| `coffee-hero.mp4` | Supplied by Vitorra | Own/supplied |
| `logistics-hero.mp4` | [Pexels video 13742716](https://www.pexels.com/video/trucks-in-port-13742716/) — "Trucks in Port" | [Pexels licence](https://www.pexels.com/license/) — free for commercial use, no attribution required |

> On stock footage: containers in any port shot carry shipping-line marks
> (MSC, Maersk and a handful of others own most of the world's boxes). That is
> unavoidable and fine — what is not fine is footage where another company's
> branding is the subject, or where a phone number or logo is legible enough to
> read as an endorsement. Two candidates were rejected on exactly that.

## Format requirements

- **Container:** MP4
- **Video codec:** H.264 (AVC)
- **Audio codec:** AAC
- **Resolution:** 1920×1080 (1080p) preferred, 1280×720 (720p) acceptable
- **Max file size:** 20 MB per clip
- **Poster:** JPG, same resolution as video, ~200 KB

## To add a new slide

1. Drop `{product}.mp4` and `{product}-poster.jpg` into this folder
2. Open `src/components/sections/VideoShowcase.tsx`
3. Find the slide in `ALL_SLIDES` and change `available: false` → `available: true`
4. Done — the carousel controls appear automatically once 2+ slides are available

## To add a brand film to the reception kiosk

1. Drop `{product}-hero.mp4` into this folder
2. Open `src/components/display/KioskSpotlight.tsx`
3. Add the file to `FILMS`, and point that sector's `film` at its index
4. Done — the kiosk cross-fades to it when that business line comes round

Also drop in a `{product}-hero-poster.jpg` (`ffmpeg -ss 6 -i film.mp4 -frames:v 1
-vf scale=1280:-2 -q:v 4 poster.jpg`). A cold start spends about ten seconds
buffering, and without a poster the screen is a black rectangle for all of it.

> ⚠ H.264 only. HEVC/H.265 plays on some browsers and shows a black rectangle on
> others, which on an unattended front-desk TV nobody would think to debug.
> Check what you have before committing it:
> `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 file.mp4`

> ⚠ Shoot or pick dark. The kiosk is a dark cinematic stage with white type over
> it. Footage shot high-key on white (a product-page packshot) washes out and
> kills the headline. If that is all you have, give the sector a `grade` in
> `KioskSpotlight.tsx` — the Coffee film carries one — but graded-down product
> footage is a rescue, not the look to aim for.
