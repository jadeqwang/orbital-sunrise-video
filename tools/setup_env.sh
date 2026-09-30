#!/usr/bin/env bash
# Rebuild the working environment in a fresh container (no secrets; nothing is rendered or generated).
#
#   tools/setup_env.sh            install what is missing, then report
#   tools/setup_env.sh --check    report only (installs nothing)
#   tools/setup_env.sh --audio    also: faster-whisper (tools/timing_edit.py align) and the vocal stem (tools/vocal_stem.py)
#   tools/setup_env.sh --mattes   also: pre-fetch the rembg isnet-general-use model (else it downloads on first use)
#
# What it covers (docs/ALTERNATE_CUT.md, "Environment"): Python packages (tools/requirements.txt), rubberband-cli, ffmpeg
# (the imageio-ffmpeg binary, symlinked) and an ffprobe stand-in, the renderer's node deps (video/, puppeteer-core) and a
# Chromium for it, the MediaPipe models in /tmp/work/models, the release WAVs decoded from the committed .m4a files, and a
# check (never a print) of the relay secret file tools/cfai.py needs.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECK=0; AUDIO=0; MATTES=0
for a in "$@"; do case "$a" in --check) CHECK=1;; --audio) AUDIO=1;; --mattes) MATTES=1;; *) echo "unknown $a"; exit 2;; esac; done
ok() { printf '  ok   %s\n' "$*"; }
no() { printf '  MISSING %s\n' "$*"; MISSING=$((MISSING+1)); }
MISSING=0
run() { if [ $CHECK = 1 ]; then return 1; fi; echo "  + $*"; "$@"; }

echo "== python packages"
if ! python3 -c "import numpy, scipy, PIL, cv2, skimage, matplotlib, mediapipe, rembg, onnxruntime, soundfile, pyworld, imageio_ffmpeg" 2>/dev/null; then
  run pip install -q -r "$ROOT/tools/requirements.txt" || true
fi
python3 - <<'EOF'
import importlib
for m in ["numpy", "scipy", "PIL", "cv2", "skimage", "matplotlib", "mediapipe", "rembg", "onnxruntime", "soundfile", "pyworld", "imageio_ffmpeg"]:
    try:
        v = getattr(importlib.import_module(m), "__version__", "")
        print(f"  ok   {m} {v}" + ("   (tools expect mediapipe 0.10.14)" if m == "mediapipe" and v != "0.10.14" else ""))
    except Exception as e:
        print(f"  MISSING {m} ({type(e).__name__})")
EOF
if [ $AUDIO = 1 ]; then
  python3 -c "import faster_whisper" 2>/dev/null || run pip install -q faster-whisper || true
  python3 -c "import faster_whisper" 2>/dev/null && ok faster-whisper || no "faster-whisper (pip install faster-whisper)"
fi

echo "== command-line tools"
if ! command -v ffmpeg >/dev/null; then
  FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())" 2>/dev/null) && run ln -sf "$FF" /usr/local/bin/ffmpeg
fi
command -v ffmpeg >/dev/null && ok "ffmpeg $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3)" || no ffmpeg
# the imageio build has no ffprobe; the tools only ask it for a duration, which this stand-in answers
if ! command -v ffprobe >/dev/null; then run install -m 755 "$ROOT/tools/ffprobe_standin.py" /usr/local/bin/ffprobe; fi
command -v ffprobe >/dev/null && ok "ffprobe ($(head -c 60 "$(command -v ffprobe)" | grep -q python && echo stand-in || echo real))" || no ffprobe
if ! command -v rubberband >/dev/null; then run apt-get install -y -q rubberband-cli >/dev/null || { run apt-get update -q >/dev/null && run apt-get install -y -q rubberband-cli >/dev/null; }; fi
command -v rubberband >/dev/null && ok "rubberband (tools/ritardando.py)" || no "rubberband (apt-get install rubberband-cli)"
command -v node >/dev/null && ok "node $(node -v)" || no "node (22.x)"

echo "== renderer (video/)"
if [ ! -d "$ROOT/video/node_modules/puppeteer-core" ]; then (cd "$ROOT/video" && run npm ci --no-audit --no-fund); fi
[ -d "$ROOT/video/node_modules/puppeteer-core" ] && ok "puppeteer-core" || no "video/node_modules (cd video && npm ci)"
CH="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
if [ ! -x "$CH" ]; then CH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome 2>/dev/null | tail -1); fi
if [ -z "$CH" ] && [ $CHECK = 0 ]; then npx -y playwright install chromium >/dev/null 2>&1; CH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome 2>/dev/null | tail -1); fi
if [ -n "$CH" ] && [ -x "$CH" ]; then
  ok "chromium $CH"
  [ "$CH" = /opt/pw-browsers/chromium-1194/chrome-linux/chrome ] || echo "       render.mjs defaults to chromium-1194: export CHROME=$CH (or --chrome=...)"
else no "chromium (npx playwright install chromium; then CHROME=...)"; fi

echo "== models (/tmp/work/models; not in the repo)"
mkdir -p /tmp/work/models
fetch() { # name url sha256
  local f=/tmp/work/models/$1
  if [ ! -s "$f" ]; then run curl -sSfL -o "$f" "$2" || rm -f "$f"; fi
  if [ -s "$f" ]; then
    [ "$(sha256sum "$f" | cut -c1-64)" = "$3" ] && ok "$1" || echo "  ??   $1: sha256 differs from the one used in 2026-09 (a newer 'latest'?)"
  else no "$1 ($2)"; fi
}
fetch face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task \
  64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff
fetch selfie_multiclass.tflite https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite \
  c6748b1253a99067ef71f7e26ca71096cd449baefa8f101900ea23016507e0e0
if [ $AUDIO = 1 ]; then
  fetch Kim_Vocal_2.onnx https://github.com/TRvlvr/model_repo/releases/download/all_public_uvr_models/Kim_Vocal_2.onnx \
    ce74ef3b6a6024ce44211a07be9cf8bc6d87728cc852a68ab34eb8e58cde9c8b
fi
U2=/tmp/work/u2/models/isnet-general-use/isnet-general-use.onnx
if [ ! -s "$U2" ] && [ $MATTES = 1 ] && [ $CHECK = 0 ]; then
  U2NET_HOME=/tmp/work/u2 python3 -c "from rembg import new_session; new_session('isnet-general-use')" >/dev/null 2>&1
fi
[ -s "$U2" ] && ok "rembg isnet-general-use (U2NET_HOME=/tmp/work/u2)" || echo "  --   rembg isnet-general-use: downloads on first use into U2NET_HOME=/tmp/work/u2 (--mattes pre-fetches)"

echo "== audio (media/audio/*.wav are gitignored; decoded from the committed .m4a)"
dec() { # m4a -> wav at 48 kHz
  if [ ! -f "$ROOT/$2" ] && [ -f "$ROOT/$1" ]; then run ffmpeg -hide_banner -loglevel error -i "$ROOT/$1" -ar 48000 "$ROOT/$2"; fi
  [ -f "$ROOT/$2" ] && ok "$2" || no "$2 (ffmpeg -i $1 -ar 48000 $2)"
}
dec media/audio/Orbital_Sunrise_extended.m4a media/audio/Orbital_Sunrise_extended.wav      # the "suit" mix: build everything from this
echo "       release audio Orbital_Sunrise_rit_0.65: the .wav if present, else render.mjs / encode_release.sh use the committed .m4a"
[ -f /tmp/work/audio/vocals.wav ] && ok "vocal stem /tmp/work/audio/vocals.wav" || echo "  --   vocal stem /tmp/work/audio/vocals.wav: python3 tools/vocal_stem.py (only for suit_splice / mouth_track / lipsync / align)"

echo "== generation relay (tools/cfai.py)"
if [ -s /tmp/work/relay/hook_secret.txt ]; then ok "/tmp/work/relay/hook_secret.txt present (not shown)";
else echo "  --   /tmp/work/relay/hook_secret.txt missing: needed for Seedance / Nano Banana jobs. It must hold the relay Worker's"
     echo "       HOOK_SECRET (Cloudflare Worker 'orbital-sunrise-relay', tools/relay/worker.js). Ask Jade; or, with her OK, set a new"
     echo "       one on the Worker and write it there (chmod 600). Never commit it. See docs/ALTERNATE_CUT.md."; fi

echo; [ $MISSING = 0 ] && echo "environment OK" || echo "$MISSING item(s) missing"
