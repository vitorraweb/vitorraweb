#!/bin/sh
# Daylight copies of the street screen's films and photos (frontend/public/day/…).
# Shadows and mid-tones lifted, highlights held, colour richer: the picture holds
# up against the sun on the road-facing screen. Baked into the files because a
# live CSS filter on moving film is too much for the screen's Android TV box.
# Used from 06:45 to 19:00 (see dayVersion in frontend/src/components/display/scenes.ts).
# Run from the repo root after changing a film or photo: sh scripts/grade_street_daylight.sh
set -e
cd frontend/public
G="curves=all='0/0.03 0.2/0.29 0.45/0.56 0.75/0.83 1/0.97',eq=saturation=1.3,unsharp=5:5:0.5"
mkdir -p day/videos day/images/stock day/photos day/display
for f in coffee-hero:3M logistics-hero:3M fet-reel:3M fet-install:5M fet-hero:0.8M seal-hero:1.2M; do
  n=${f%%:*}; r=${f##*:}
  ffmpeg -v error -y -i videos/$n.mp4 -vf "$G" -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
    -preset slow -crf 22 -maxrate $r -bufsize 6M -an -movflags +faststart day/videos/$n.mp4
  ffmpeg -v error -y -i videos/$n-poster.jpg -vf "$G" -q:v 3 day/videos/$n-poster.jpg
done
for f in images/stock/ambulance-motion images/stock/coffee-cherries images/stock/coffee-roaster images/stock/highway-sunset \
  images/stock/hills-road images/stock/kampala-skyline images/stock/port-aerial images/stock/road-mountains \
  images/stock/ship-aerial images/stock/warehouse-dark photos/process-coffee-hands photos/company-A-head-office \
  display/fet-device display/fet-engine; do
  ffmpeg -v error -y -i $f.jpg -vf "$G" -q:v 3 day/$f.jpg
done
