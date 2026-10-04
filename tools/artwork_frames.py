"""Snapshot, record, and verify the two original-artwork replacement shots.

Run snapshot before rendering the two card shots into out/master_frames, then record.
Upload encoders call verify_artwork_frames so stale placeholder frames cannot be reused.
"""
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "video/out/master_frames"
WORK = ROOT / "video/out/artwork_patch"
MANIFEST = FRAMES / "artwork_manifest.json"
RANGES = {"D5_the_drawing": [2403, 2537], "C1_drawing": [5740, 5874]}
IDS = {i for a, b in RANGES.values() for i in range(a, b + 1)}


def checksum(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def artwork():
    meta_path = ROOT / "video/data/user_drawing.json"
    meta = json.loads(meta_path.read_text())
    image = ROOT / "video/data" / meta.get("image", "user_drawing.jpg")
    return {"mode": "user", "image": image.name, "image_sha256": checksum(image),
            "metadata_sha256": checksum(meta_path), "credit": meta["credit"], "frame_ranges": RANGES}


def frame(i):
    return FRAMES / f"f{i:05d}.png"


def unchanged_stats():
    return {str(i): [frame(i).stat().st_size, frame(i).stat().st_mtime_ns]
            for i in range(6055) if i not in IDS}


def snapshot():
    WORK.mkdir(parents=True, exist_ok=True)
    previous = WORK / "previous_frames"
    previous.mkdir(exist_ok=True)
    for i in sorted(IDS):
        dest = previous / frame(i).name
        if not dest.exists():
            shutil.copy2(frame(i), dest)
    info = {"artwork": artwork(), "unchanged_frame_stats": unchanged_stats(),
            "skin_frame_hashes": {str(i): checksum(frame(i)) for i in range(1065, 1112)}}
    (WORK / "before.json").write_text(json.dumps(info, indent=2) + "\n")
    print("Backed up 270 previous card frames; recorded the other 5785 frames and approved skin grade.", flush=True)


def record():
    before = json.loads((WORK / "before.json").read_text())
    assert artwork() == before["artwork"], "supplied artwork changed during rendering"
    assert unchanged_stats() == before["unchanged_frame_stats"], "a frame outside the two card shots changed"
    assert all(checksum(frame(int(i))) == h for i, h in before["skin_frame_hashes"].items()), "skin grade changed"
    info = {"artwork": artwork(), "card_frame_hashes": {str(i): checksum(frame(i)) for i in sorted(IDS)},
            "other_frames_unchanged": True, "approved_skin_grade_unchanged": True}
    MANIFEST.write_text(json.dumps(info, indent=2) + "\n")
    verify_artwork_frames()
    print("Verified 270 original-artwork card frames; all other frames and the approved skin grade are unchanged.", flush=True)


def verify_artwork_frames():
    info = json.loads(MANIFEST.read_text())
    assert info["artwork"] == artwork(), "cached frames do not match the supplied artwork"
    assert {int(i) for i in info["card_frame_hashes"]} == IDS, "card frame manifest is incomplete"
    for i, h in info["card_frame_hashes"].items():
        assert checksum(frame(int(i))) == h, f"stale or modified artwork frame {i}; regenerate the card shots"
    return info["artwork"]


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "verify"
    if action == "snapshot": snapshot()
    elif action == "record": record()
    elif action == "verify": print(json.dumps(verify_artwork_frames(), indent=2))
    else: sys.exit("use snapshot, record, or verify")
