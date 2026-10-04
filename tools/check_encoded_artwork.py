"""Check decoded card frames against the supplied-art PNGs and the previous placeholder."""
import json
from pathlib import Path
import sys

import cv2

from artwork_frames import ROOT, FRAMES, WORK, verify_artwork_frames


def main(video):
    path = Path(video)
    art = verify_artwork_frames()
    cap = cv2.VideoCapture(str(path))
    assert cap.isOpened(), f"cannot open {path}"
    samples = []
    for i in (2496, 5868):  # 1:44 and 4:04.5, both fully revealed cards
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, actual = cap.read()
        assert ok, f"cannot decode artwork frame {i}"
        supplied = cv2.imread(str(FRAMES / f"f{i:05d}.png"))
        previous = cv2.imread(str(WORK / "previous_frames" / f"f{i:05d}.png"))
        assert supplied is not None and previous is not None
        size = (actual.shape[1], actual.shape[0])
        supplied = cv2.resize(supplied, size, interpolation=cv2.INTER_LANCZOS4)
        previous = cv2.resize(previous, size, interpolation=cv2.INTER_LANCZOS4)
        error = cv2.norm(actual, supplied, cv2.NORM_L1) / actual.size
        old_error = cv2.norm(actual, previous, cv2.NORM_L1) / actual.size
        assert error < old_error * .25, f"frame {i} does not match the supplied artwork: {error}, {old_error}"
        preview = path.parent / "review" / f"{path.stem}_artwork_{i}.jpg"
        preview.parent.mkdir(exist_ok=True)
        assert cv2.imwrite(str(preview), actual, [cv2.IMWRITE_JPEG_QUALITY, 95])
        samples.append({"frame": i, "seconds": i / 24, "mean_absolute_error_from_supplied": error,
                        "mean_absolute_error_from_placeholder": old_error, "matches_supplied_artwork": True})
    cap.release()
    manifest = path.with_suffix(".json")
    info = json.loads(manifest.read_text())
    assert info["artwork"] == art, "encoded artwork manifest differs from the approved artwork"
    info["verification"]["decoded_artwork_samples"] = samples
    manifest.write_text(json.dumps(info, indent=2) + "\n")
    print(json.dumps({"file": path.name, "decoded_artwork_samples": samples}, indent=2), flush=True)


if __name__ == "__main__":
    for video in sys.argv[1:]:
        main(video)
