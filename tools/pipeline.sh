#!/bin/bash
# Refresh everything the renderer derives from the plates, after new takes arrive.
#   tools/pipeline.sh            frames + face/sun metadata (+ mattes if --mattes)
#   tools/pipeline.sh --mattes   also compute subject mattes (slow: ~1 s per matte)
cd "$(dirname "$0")/.." || exit 1
mkdir -p /tmp/work
python3 tools/extract_plates.py > /tmp/work/extract.log 2>&1 || { echo "extract failed"; tail -5 /tmp/work/extract.log; }
python3 tools/plate_meta.py 2>&1 | grep -E "frames" || true
if [ "$1" == "--mattes" ]; then
  python3 tools/plate_masks.py 2>&1 | grep -E "mattes" || true
  python3 tools/extract_plates.py > /dev/null 2>&1       # refresh the 'mattes' flags in the index
fi
python3 - << 'EOF'
import json
idx = json.load(open('video/plates/index.json'))
print(f"{len(idx)} plates indexed; with mattes: {sum(1 for v in idx.values() if v.get('mattes'))}")
EOF
