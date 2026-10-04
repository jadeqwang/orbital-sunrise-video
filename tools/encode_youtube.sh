#!/usr/bin/env bash
# High-quality 4K upload master of the approved 4:12 cut, outside GitHub's size cap.
# Requires restored plates (prepare_upload_assets.py), ffmpeg/ffprobe, Chromium and the skin-grade Python environment.
# Output and resumable PNG frames stay under the gitignored video/out directory.
#   CHROME=/usr/bin/google-chrome tools/encode_youtube.sh
#   CRF=12 WORKERS=4 OUT=/path/to/masters tools/encode_youtube.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/video/out/bin:$PATH"
PYTHON="${PYTHON:-$ROOT/video/out/.venv/bin/python}"
CHROME="${CHROME:-/usr/bin/google-chrome}"
FRAMES="${FRAMES:-$ROOT/video/out/master_frames}"
OUT="${OUT:-$ROOT/video/out/masters}"
AUDIO="${AUDIO:-$ROOT/media/audio/Orbital_Sunrise_alt2_extended.m4a}"
NAME="${NAME:-Orbital_Sunrise_extended_original_artwork_4K_master}"
mkdir -p "$OUT" "$FRAMES"
FINAL="$OUT/$NAME.mp4"
PARTIAL="$OUT/$NAME.partial.mp4"
if [[ -e "$FINAL" || -e "$PARTIAL" ]]; then
  printf 'Refusing to overwrite existing master: %s\n' "$FINAL" >&2
  exit 1
fi
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUDIO")
"$PYTHON" -c 'import sys; d=float(sys.argv[1]); assert abs(d-252.284)<0.1, f"expected the 4:12 extended mix, got {d}s"' "$DUR"
cd "$ROOT/video"
node render.mjs "--frames=0:$DUR" "--workers=${WORKERS:-4}" --format=png "--dir=$FRAMES" "--chrome=$CHROME" --q=drawing=user
# Refresh both card shots on every resumed render; cached placeholder frames must never survive into a master.
node render.mjs --frames=100.125:105.75 --workers=4 --format=png "--dir=$FRAMES" "--chrome=$CHROME" --force --q=drawing=user
node render.mjs --frames=239.1666666667:244.7916666667 --workers=4 --format=png "--dir=$FRAMES" "--chrome=$CHROME" --force --q=drawing=user
# Re-render these raw frames even on a resumed run, so the grade is never applied twice.
node render.mjs --frames=44.375:46.333333 --workers=2 --format=png "--dir=$FRAMES" "--chrome=$CHROME" --force --q=drawing=user
"$PYTHON" "$ROOT/tools/skin_grade.py" "$FRAMES" 1065 1111 --ext=png --strict=1
"$PYTHON" - "$FRAMES" <<'PY'
from pathlib import Path
import sys
from PIL import Image
d=Path(sys.argv[1])
expected={f'f{i:05d}.png' for i in range(6055)}
actual={p.name for p in d.glob('f*.png')}
assert actual==expected, f'frame sequence incomplete: missing {len(expected-actual)}, extra {len(actual-expected)}'
for p in d.glob('f*.png'):
    with Image.open(p) as im:
        assert im.size==(1920,1080), f'unexpected frame dimensions: {p}'
print('Verified 6055 lossless 1080p frames; approved skin grade applied.')
PY
audio_args=(-c:a copy)
if [[ "$AUDIO" == *.wav ]]; then audio_args=(-c:a aac -b:a 384k); fi
ffmpeg -hide_banner -loglevel warning -stats -y -framerate 24 -start_number 0 -i "$FRAMES/f%05d.png" -i "$AUDIO" \
  -map 0:v:0 -map 1:a:0 \
  -vf 'scale=3840:2160:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p' \
  -c:v libx264 -preset slow -tune grain -crf "${CRF:-12}" -profile:v high -level:v 5.1 -threads "${ENCODE_THREADS:-8}" \
  -g 48 -keyint_min 24 -color_range tv -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  "${audio_args[@]}" -movflags +faststart "$PARTIAL"
mv "$PARTIAL" "$FINAL"
"$PYTHON" - "$FINAL" "$AUDIO" "${CRF:-12}" <<'PY'
from pathlib import Path
import hashlib,json,subprocess,sys
video,audio,crf=sys.argv[1:]
p=Path(video)
root=Path.cwd().parent
sys.path.insert(0,str(root/'tools'))
from artwork_frames import artwork
info={'file':p.name,'bytes':p.stat().st_size,'resolution':[3840,2160],'fps':24,'frames':6055,
      'video_codec':'H.264 High','preset':'slow','tune':'grain','crf':float(crf),
      'source_frames':'lossless PNG at 1920x1080; Lanczos upscale','skin_grade':{'frames':[1065,1111],'k':0.35,'flat':0.45},
      'audio_source':audio,'audio_sha256':hashlib.sha256(Path(audio).read_bytes()).hexdigest(),
      'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'artwork':artwork()}
p.with_suffix('.json').write_text(json.dumps(info,indent=2)+'\n')
PY
printf '\nWrote %s\n' "$FINAL"
