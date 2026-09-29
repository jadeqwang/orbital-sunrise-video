"""Rebuild the 2:02 writing-hand take (the jacket-sleeve version, take 2, whose video was never committed).

    python3 tools/hand_take3.py [--take=N] [--refs]

Take 2's first frame is recovered from its committed contact sheet (media/plates/jade_hand_writing_p/take2.sheet.jpg,
tile 1, upscaled: media/refs/jade_hand_sleeve_from_take2.jpg) and Seedance runs take 2's own spec from it. Written as
take3 (tools/plates.py would number it take2 and overwrite take 2's record, since take2.mp4 is missing).
"""
import sys, json, time, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cfai
from plate_specs import PLATES, ref
from plates import sheet

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = dict(PLATES["jade_hand_writing_p"], first_frame="media/refs/jade_hand_sleeve_from_take2.jpg")
out = ROOT / "media" / "plates" / "jade_hand_writing_p" / "take3.mp4"
inp = {"prompt": spec["prompt"], "duration": spec["duration"], "resolution": "720p", "aspect_ratio": "16:9", "generate_audio": False,
       "image": cfai.data_uri(str(ROOT / spec["first_frame"]))}
if "--refs" in sys.argv:   # take 3 had the outfit reference and came out portrait (720x1280); take 4 is without it
    inp["reference_images"] = [ref(r) for r in spec["refs"]]
n = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--take=")), "3")
out = out.with_name(f"take{n}.mp4")
t0 = time.time()
cfai.gen("bytedance/seedance-2.5", inp, out, tag="plate:jade_hand_writing_p", timeout=1500)
try:
    sheet(out)
except FileNotFoundError:   # sheet() needs ffprobe
    pass
out.with_suffix(".json").write_text(json.dumps({"spec": spec, "secs": round(time.time() - t0)}, indent=1))
print(out)
