#!/bin/bash
# record.sh <simulator-udid>: record the landing hero loop from the app's Plan tab.
# Expects the dev build signed in to an account with demo data, open on any tab,
# with no workout in progress. Writes apps/web/public/images/landing/v3/hero-loop.{mp4,-poster.webp}.
# Needs maestro, ffmpeg and cwebp.
set -euo pipefail
D="$(cd "$(dirname "$0")" && pwd)"
O="$D/../../../web/public/images/landing/v3"
T="$(mktemp -d)"
cd "$T"
for n in 1 2 3; do
  maestro --device "$1" test --debug-output "$T/debug" "$D/tour$n.yaml"
  cp "$(find "$T/debug" -name "tour$n.mp4" | head -1)" "tour$n.mp4"
done
# ponytail: cut points are seconds into each recording and assume Maestro's usual pace;
# check the result and adjust them if a run was slower. Replace with on-screen markers if this drifts often.
seg() { echo "[$1:v]fps=30,trim=$2:$3,setpts=(PTS-STARTPTS)/$4,scale=660:1434,setsar=1[$5];"; }
ffmpeg -v error -y -i tour1.mp4 -i tour2.mp4 -i tour3.mp4 -filter_complex "
$(seg 0 0.5 12.5 1.6 a)$(seg 0 29.5 49 2 b)$(seg 0 49 53 2 c)$(seg 0 57 60 1 d)$(seg 1 6 18 2 e)$(seg 1 21.5 28 1 f)$(seg 2 18.5 22.5 1 g)
[a][b][c][d][e][f][g]concat=n=7:v=1,fps=30[v]" -map "[v]" -an -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart "$O/hero-loop.mp4"
ffmpeg -v error -y -i "$O/hero-loop.mp4" -frames:v 1 poster.png
cwebp -quiet -q 82 poster.png -o "$O/hero-loop-poster.webp"
echo "$O/hero-loop.mp4"
