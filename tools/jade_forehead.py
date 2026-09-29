"""Give a generated singing clip back her real forehead height.

    python3 tools/jade_forehead.py measure <image|video>          forehead ratio per frame
    python3 tools/jade_forehead.py fix <in.mp4> <out.mp4>          stretch the region above her brows to the drawing's ratio

The video model keeps shrinking her high forehead. The ratio is (brow line - hairline), measured on the
centre line of the face, over (base of nose - brow line): MediaPipe gives brows and nose, the hairline is the first run of dark hair scanning up from the brows.
The fix stretches only what is above the brow line, anchored there, so her expression, eyes, mouth and jaw are untouched.
"""
import sys, pathlib
import numpy as np, cv2
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
ROOT = pathlib.Path(__file__).resolve().parent.parent
DRAWING = ROOT / "media" / "chars" / "jade_src" / "jade_trace_jacket_hp_1.jpg"
MODEL = "/tmp/work/models/face_landmarker.task"
BROWS, NOSE, TOP = [105, 66, 107, 336, 296, 334], 2, 10     # NOSE: base of the nose (the jaw moves when she sings)

_lm = None


def landmarker():
    global _lm
    if _lm is None:
        _lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL), num_faces=1))
    return _lm


def measure(bgr):
    """(brow_y, hairline_y, nose_base_y, x_centre) in pixels, or None."""
    h, w = bgr.shape[:2]
    r = landmarker().detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)))
    if not r.face_landmarks:
        return None
    L = r.face_landmarks[0]
    brow = np.mean([L[i].y for i in BROWS]) * h
    chin, top = L[NOSE].y * h, L[TOP].y * h
    xc = (L[TOP].x + L[9].x) / 2 * w
    # hairline: scan up the centre band from the top of the mesh; the forehead is light, the hair dark
    band = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)[:, max(0, int(xc - w * .015)):int(xc + w * .015)].mean(1)
    skin = np.median(band[int(top):int(brow)])
    y = int(top)
    dark = skin * .72
    while y > 2 and not (band[y] < dark and band[y - 1] < dark and band[y - 2] < dark):
        y -= 1
    return brow, float(y), chin, xc


def ratio(m):
    brow, hair, chin, _ = m
    return (brow - hair) / (chin - brow)


def frames(path):
    cap = cv2.VideoCapture(str(path))
    while True:
        ok, f = cap.read()
        if not ok:
            return
        yield f


def stretch(f, brow, k):
    """Stretch rows above `brow` upward by k (k > 1), anchored at the brow line."""
    h, w = f.shape[:2]
    ys = np.arange(h, dtype=np.float32)
    src = np.where(ys < brow, brow - (brow - ys) / k, ys)
    mapy = np.repeat(src[:, None], w, 1).astype(np.float32)
    mapx = np.repeat(np.arange(w, dtype=np.float32)[None], h, 0)
    return cv2.remap(f, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def fix(src, out, target=None):
    target = target or ratio(measure(cv2.imread(str(DRAWING))))
    fs = list(frames(src))
    ms = [measure(f) for f in fs]
    ok = [m for m in ms if m]
    brow = np.array([m[0] if m else np.nan for m in ms]); rat = np.array([ratio(m) if m else np.nan for m in ms])
    idx = np.arange(len(fs))
    good = ~np.isnan(brow)
    brow = np.interp(idx, idx[good], brow[good]); rat = np.interp(idx, idx[good], rat[good])
    # smooth over ~0.5 s so the head doesn't breathe
    kern = np.ones(13) / 13
    brow_s = np.convolve(np.pad(brow, 6, mode="edge"), kern, "valid")
    k = np.clip(target / np.convolve(np.pad(rat, 6, mode="edge"), kern, "valid"), 1, 1.6)
    print(f"target {target:.3f}  clip median {np.median(rat):.3f}  stretch {k.min():.2f}-{k.max():.2f}")
    h, w = fs[0].shape[:2]
    vw = cv2.VideoWriter(str(out), cv2.VideoWriter_fourcc(*"mp4v"), 24, (w, h))
    for f, b, kk in zip(fs, brow_s, k):
        vw.write(stretch(f, b, kk))
    vw.release()


if __name__ == "__main__":
    if sys.argv[1] == "measure":
        p = sys.argv[2]
        if p.endswith(".mp4"):
            for i, f in enumerate(frames(p)):
                if i % 12 == 0:
                    m = measure(f); print(f"{i/24:.1f}s", m and f"{ratio(m):.3f}", m and [round(v) for v in m])
        else:
            m = measure(cv2.imread(p)); print(f"{ratio(m):.3f}", [round(v) for v in m])
    else:
        fix(sys.argv[2], sys.argv[3])
