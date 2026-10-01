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

> ⚠ H.264 only. HEVC/H.265 plays on some browsers and shows a black rectangle on
> others, which on an unattended front-desk TV nobody would think to debug.
> Check what you have before committing it:
> `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 file.mp4`
