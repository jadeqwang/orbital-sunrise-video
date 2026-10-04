"""Verify an upload or master and append results to its adjacent JSON manifest."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess

import cv2


def atoms(f, start, end):
    off = start
    while off + 8 <= end:
        f.seek(off)
        size, tag = struct.unpack(">I4s", f.read(8))
        header = 8
        if size == 1:
            size = struct.unpack(">Q", f.read(8))[0]
            header = 16
        if size == 0:
            size = end - off
        assert size >= header and off + size <= end, "invalid MP4 atom"
        yield tag, off, off + header, off + size
        off += size


def movie_info(path):
    with path.open("rb") as f:
        top = list(atoms(f, 0, path.stat().st_size))
        moov = next(a for a in top if a[0] == b"moov")
        mdat = next(a for a in top if a[0] == b"mdat")
        for tag, _, start, end in atoms(f, moov[2], moov[3]):
            if tag != b"mvhd":
                continue
            f.seek(start)
            version = f.read(1)[0]
            f.seek(start + (20 if version else 12))
            timescale = struct.unpack(">I", f.read(4))[0]
            duration = struct.unpack(">Q" if version else ">I", f.read(8 if version else 4))[0] / timescale
            return duration, moov[1] < mdat[1]
    raise RuntimeError("no movie header")


def audio_hash(path):
    data = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-map", "0:a:0", "-c:a", "copy", "-f", "adts", "-"])
    return hashlib.sha256(data).hexdigest()


def main(video, audio, resolution=(3840, 2160)):
    path = Path(video)
    cap = cv2.VideoCapture(str(path))
    assert cap.isOpened(), "video could not be opened"
    width, height = (int(cap.get(k)) for k in (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT))
    fps, frames = cap.get(cv2.CAP_PROP_FPS), int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    assert (width, height, frames) == (*resolution, 6055), (width, height, frames)
    assert abs(fps - 24) < .001, fps
    duration, faststart = movie_info(path)
    assert abs(duration - 252.284) < .1, duration
    assert faststart, "movie header is not before the video data"
    print(f"Verified {width}x{height}, 24 fps, {frames} frames, {duration:.3f}s, fast start.", flush=True)
    match = audio_hash(path) == audio_hash(audio)
    assert match, "copied AAC packets differ from the source mix"
    print("Audio packets exactly match the extended mix.", flush=True)
    subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-err_detect", "explode", "-threads", "4", "-i", str(path),
                    "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"], check=True)
    manifest = path.with_suffix(".json")
    info = json.loads(manifest.read_text()) if manifest.exists() else {}
    info["verification"] = {"resolution": [width, height], "fps": fps, "frames": frames,
                            "duration_seconds": duration, "fast_start": faststart,
                            "audio_packets_match_source": match, "full_decode_passed": True}
    manifest.write_text(json.dumps(info, indent=2) + "\n")
    print("Complete video and audio decoded without errors.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video")
    parser.add_argument("audio")
    parser.add_argument("--resolution", choices=("3840x2160", "1920x1080"), default="3840x2160")
    args = parser.parse_args()
    main(args.video, args.audio, tuple(map(int, args.resolution.split("x"))))
