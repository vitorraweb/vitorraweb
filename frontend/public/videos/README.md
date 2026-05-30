# Video Assets

## Naming convention

| Product | Video | Poster |
|---------|-------|--------|
| Fuel Eco Tech | `fet.mp4` | `fet-poster.jpg` |
| SEAL Wound Spray | `seal.mp4` | `seal-poster.jpg` |
| Vitorra Coffee | `coffee.mp4` | `coffee-poster.jpg` |
| Logistics Services | `logistics.mp4` | `logistics-poster.jpg` |

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
