#!/usr/bin/env python3
# Minimal stand-in for `ffprobe -v error -show_entries format=duration -of csv=p=0 FILE` (this container ships ffmpeg only).
import sys, subprocess, re
f = sys.argv[-1]
err = subprocess.run(["ffmpeg", "-hide_banner", "-i", f], capture_output=True, text=True).stderr
m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", err)
if not m:
    sys.exit(1)
h, mi, s = m.groups()
print(f"{int(h) * 3600 + int(mi) * 60 + float(s):.6f}")
