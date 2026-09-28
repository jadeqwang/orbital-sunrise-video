#!/usr/bin/env bash
# Package the film as HLS for the watch page (release/web/), within the page's 256 MB budget:
#   hevc/  1080p24 HEVC at ~4.8 Mbps (a dedicated two-pass encode, keyframe at least every 6 s)
#   avc/   the 720p H.264 release file, cut into segments without re-encoding (fallback for browsers without HEVC)
# Run tools/encode_release.sh first (for the 720p file).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FR="$ROOT/video/out/frames/f%05d.jpg"
AUDIO="$ROOT/media/audio/Orbital_Sunrise_extended.wav"
REL="$ROOT/release"; WEB="$REL/web"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
rm -rf "$WEB/hevc" "$WEB/avc"; mkdir -p "$WEB/hevc" "$WEB/avc"
HLS=(-f hls -hls_time 6 -hls_playlist_type vod -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4)
VB=${VB:-4800}
X265="keyint=144:min-keyint=24:aq-mode=3:log-level=error"

ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -an -c:v libx265 -preset medium -b:v ${VB}k \
  -x265-params "pass=1:stats=$TMP/h.log:$X265" -pix_fmt yuv420p -f null /dev/null
ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -i "$AUDIO" -map 0:v -map 1:a -c:v libx265 -preset medium -b:v ${VB}k \
  -x265-params "pass=2:stats=$TMP/h.log:$X265" -tag:v hvc1 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest \
  "${HLS[@]}" -hls_segment_filename "$WEB/hevc/s%03d.mp4" "$WEB/hevc/index.m3u8"

ffmpeg -y -loglevel error -i "$REL/Orbital_Sunrise_720p_h264.mp4" -map 0:v -map 0:a -c copy \
  "${HLS[@]}" -hls_segment_filename "$WEB/avc/s%03d.mp4" "$WEB/avc/index.m3u8"

for d in hevc avc; do
  n=$(ls "$WEB/$d"/s*.mp4 | wc -l); big=$(ls -S "$WEB/$d"/s*.mp4 | head -1)
  echo "$d: $n segments, $(du -sh "$WEB/$d" | cut -f1), largest $(du -h "$big" | cut -f1)"
done
du -sh "$WEB"
