#!/usr/bin/env bash
# Package the rendered frames + final mix as HLS for the watch page (release/web/):
#   hevc/  1080p24 HEVC ~5.2 Mbps + AAC 128k (fMP4 segments, 4 s)
#   avc/   720p24  H.264 ~2.5 Mbps + AAC 128k (fallback for browsers without HEVC)
# Two-pass so the whole set stays under the 256 MB an artifact version may hold.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FR="$ROOT/video/out/frames/f%05d.jpg"
AUDIO="$ROOT/media/audio/Orbital_Sunrise_extended.wav"
WEB="$ROOT/release/web"; mkdir -p "$WEB/hevc" "$WEB/avc"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
GOP="keyint=96:min-keyint=96:scenecut=0"
HLS=(-f hls -hls_time 4 -hls_playlist_type vod -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4)

ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -an -c:v libx265 -preset medium -b:v 5200k \
  -x265-params "pass=1:stats=$TMP/h.log:$GOP:aq-mode=3:log-level=error" -pix_fmt yuv420p -f null /dev/null
ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -i "$AUDIO" -map 0:v -map 1:a -c:v libx265 -preset medium -b:v 5200k \
  -x265-params "pass=2:stats=$TMP/h.log:$GOP:aq-mode=3:log-level=error" -tag:v hvc1 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest \
  "${HLS[@]}" -hls_segment_filename "$WEB/hevc/s%03d.mp4" "$WEB/hevc/index.m3u8"

ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -an -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -b:v 2500k \
  -g 96 -keyint_min 96 -sc_threshold 0 -pass 1 -passlogfile "$TMP/a" -pix_fmt yuv420p -f null /dev/null
ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -i "$AUDIO" -map 0:v -map 1:a -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow \
  -profile:v high -b:v 2500k -g 96 -keyint_min 96 -sc_threshold 0 -pass 2 -passlogfile "$TMP/a" -pix_fmt yuv420p -c:a aac -b:a 128k -shortest \
  "${HLS[@]}" -hls_segment_filename "$WEB/avc/s%03d.mp4" "$WEB/avc/index.m3u8"

du -sh "$WEB"/*; ls "$WEB/hevc" | wc -l; ls "$WEB/avc" | wc -l
