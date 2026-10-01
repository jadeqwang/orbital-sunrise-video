#!/usr/bin/env bash
# Encode the rendered frames (video/out/frames) + the final mix (with the outro ritardando) into the release files.
#
#   tools/encode_release.sh            # both files → release/
#   OUT=release/extended NAME=Orbital_Sunrise_extended tools/encode_release.sh   # elsewhere, under another name
#
# A colored-pencil drawing redrawn 12 times a second is expensive to compress (fine hatching everywhere
# changes with every drawing), so the in-repo files are two-pass encodes sized to stay under GitHub's
# 100 MB per-file limit:
#   release/Orbital_Sunrise_1080p.mp4        HEVC (hvc1) 1080p24, AAC 192k  — best quality under the cap
#   release/Orbital_Sunrise_720p_h264.mp4    H.264 High 720p24, AAC 160k    — plays and uploads anywhere
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRAMES="${FRAMES:-$ROOT/video/out/frames}"   # FRAMES=dir overrides (e.g. an assembled frame set)
FR="$FRAMES/f%05d.jpg"
# The release audio: the "suit" mix with the outro ritardando (tools/ritardando.py --vmin=0.65), matching frames rendered
# with render.mjs's default time map (video/data/timemap.json). Frames rendered with --norit: NORIT=1 (the unslowed mix).
# AUDIO=... overrides. The extended recording (docs/ALTERNATE_CUT.md) plays its own ritardando, so both modes use its
# ring-out mix (tools/extend_ending.py); never the released cut's Orbital_Sunrise.mp3 (it has the old lyric "sleeve").
if [ -z "${AUDIO:-}" ]; then
  AUDIO="$ROOT/media/audio/Orbital_Sunrise_alt2_extended.wav"
  [ -f "$AUDIO" ] || AUDIO="${AUDIO%.wav}.m4a"
fi
[ -f "$AUDIO" ] || { echo "missing audio $AUDIO" >&2; exit 1; }
NF=$(ls "$FRAMES" | grep -c '^f.*\.jpg$'); DUR_A=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUDIO")
python3 -c "import sys; n,d=$NF,$DUR_A; print(f'audio {d:.2f} s, frames {n} ({n/24:.2f} s)'); sys.exit(0 if abs(n/24-d)<0.1 else 'frame count does not match the audio: render with/without --norit to match')"
OUT="${OUT:-$ROOT/release}"; NAME="${NAME:-Orbital_Sunrise}"; mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUDIO")
bits() { python3 -c "print(int(($1 * 8e6 / $DUR - $2 * 1e3) / 1e3))"; }   # target MB, audio kbps -> video kbps

# 1080p HEVC, ~94 MB
VB=$(bits 94 192)
echo "HEVC 1080p: ${VB}k video over ${DUR}s"
ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -an -c:v libx265 -preset slow -b:v ${VB}k \
  -x265-params "pass=1:stats=$TMP/x265.log:aq-mode=3:log-level=error" -pix_fmt yuv420p -f null /dev/null
ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -i "$AUDIO" -map 0:v -map 1:a \
  -c:v libx265 -preset slow -b:v ${VB}k -x265-params "pass=2:stats=$TMP/x265.log:aq-mode=3:log-level=error" \
  -tag:v hvc1 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT/${NAME}_1080p.mp4"

# 720p H.264, ~90 MB
VB=$(bits 90 160)
echo "H.264 720p: ${VB}k video"
ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -an -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow \
  -b:v ${VB}k -pass 1 -passlogfile "$TMP/x264" -pix_fmt yuv420p -f null /dev/null
ffmpeg -y -loglevel error -stats -framerate 24 -i "$FR" -i "$AUDIO" -map 0:v -map 1:a -vf scale=1280:720:flags=lanczos \
  -c:v libx264 -preset slow -profile:v high -b:v ${VB}k -pass 2 -passlogfile "$TMP/x264" -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart -shortest "$OUT/${NAME}_720p_h264.mp4"

ls -la "$OUT"
