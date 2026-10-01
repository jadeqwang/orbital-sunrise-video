"""Relight one of her singing takes frame by frame from a relit still of its first frame, keeping the take's own motion, lips
and timing (no new Seedance take, so her approved lip lag stays).

    python3 tools/jade_relight.py <take.mp4> <first.jpg> <relit_model.png> <out_dir> [--plate=<video/plates id>]

1. The relit still: jade_location.restore_lines(first, relit_model, <out_dir>/first.jpg, skip_cheeks=True): her own pencil lines
   under the model's light, the model's cheeks (no closet glasses-shadow).
2. Each take frame i: MediaPipe face landmarks; a similarity transform (eyes, brows, nose, forehead: not the mouth or jaw)
   carries the still onto frame i's head.
   - light: the still's low-frequency light ratio (blur(relit) / blur(first), sigma = w/220, as restore_lines) follows her head
     inside a widened face oval (a broad wash elsewhere; its colour only on her skin); frame_i * ratio keeps every line, the
     eyes and the singing mouth of the take;
   - her skin (face oval minus eyes+brows, nose and lips): the relit still's skin light, closed (dark bands under ~40 px go)
     and smoothed, carried with her head, times the take's faint texture (full line detail only along her face's outline):
     this is what removes the closet's glasses-shadow, which Seedance draws larger than the still;
   - the take's golden-hour gold rim on hair / jacket / headphones loses most of its saturation;
   - background: outside her person matte (jade_fade.matte, smoothed over 5 frames, grown) the relit still itself (the
     location redrawn in daylight, loose at the edges), so only she moves, as in the take.
3. Writes <out_dir>/take1.mp4 (24 fps, the take's length) and, with --plate, the renderer's frames video/plates/<id>/f%04d.jpg.
"""
import sys, pathlib, subprocess
import numpy as np, cv2
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import jade_location as JL, jade_fade as JFa

import os
SMOOTH, CLOSE, RIM, CHK, FLAT, DLO, DHI, SKF, SKG = float(os.environ.get('SM', 50)), int(os.environ.get('CL', 41)), float(os.environ.get('RIM', .86)), float(os.environ.get('CHK', 0)), int(os.environ.get('FLAT', 0)), float(os.environ.get('DLO', .94)), float(os.environ.get('DHI', 1.04)), float(os.environ.get('SKF', 15)), float(os.environ.get('SKG', 1.0))
LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
CHEEKS = ([145, 234, 93, 132, 58, 172, 61, 129], [374, 454, 323, 361, 288, 397, 291, 358])   # lower lid, oval down to the jaw, mouth corner, nose


def cheeks_mask(L, w, h, feather):
    """Both cheeks from under the lenses down to the jaw, where the take draws the closet's glasses-shadow, minus the lips."""
    m = np.zeros((h, w), np.uint8)
    for side in CHEEKS: cv2.fillPoly(m, [pts(L, w, h, side).astype(np.int32)], 255)
    lips = np.zeros((h, w), np.uint8); cv2.fillPoly(lips, [pts(L, w, h, LIPS).astype(np.int32)], 255)
    m[cv2.dilate(lips, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))) > 0] = 0
    return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), feather)[..., None]


NOSE = [6, 197, 195, 5, 4, 1, 19, 94, 2, 98, 327, 129, 358, 49, 279, 64, 294, 48, 278]
EYES = ([70, 63, 105, 66, 107, 55, 133, 145, 153, 33, 130, 46], [300, 293, 334, 296, 336, 285, 362, 374, 380, 263, 359, 276])   # brow + eye, each side


def skin_mask(L, w, h, feather, grow=1.0):
    """Her face oval minus the eyes with the brows above them, the nose and the lips, each grown a little."""
    m = np.zeros((h, w), np.uint8)
    p = pts(L, w, h, JL.FACE_OVAL); c = p.mean(0); cv2.fillPoly(m, [(c + (p - c) * grow).astype(np.int32)], 255)
    cut = np.zeros((h, w), np.uint8)
    for side in EYES: cv2.fillConvexPoly(cut, cv2.convexHull(pts(L, w, h, side).astype(np.int32)), 255)
    cut = cv2.dilate(cut, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    lips = np.zeros((h, w), np.uint8); cv2.fillPoly(lips, [pts(L, w, h, LIPS).astype(np.int32)], 255)
    cut = np.maximum(cut, cv2.dilate(lips, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))))
    nose = np.zeros((h, w), np.uint8); cv2.fillConvexPoly(nose, cv2.convexHull(pts(L, w, h, NOSE).astype(np.int32)), 255)
    cut = np.maximum(cut, cv2.dilate(nose, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))))
    m[cut > 0] = 0
    return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), feather)[..., None]


STABLE = [33, 133, 159, 145, 263, 362, 386, 374, 70, 105, 107, 336, 334, 300, 6, 197, 195, 5, 4, 1, 168, 9, 10, 151, 234, 454, 127, 356]


def pts(L, w, h, idx):
    return np.array([[L[i].x * w, L[i].y * h] for i in idx], np.float32)


def oval_mask(L, w, h, grow, feather):
    p = pts(L, w, h, JL.FACE_OVAL); c = p.mean(0); p = c + (p - c) * grow
    m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [p.astype(np.int32)], 255)
    return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), feather)


def frames(mp4):
    cap = cv2.VideoCapture(str(mp4)); out = []
    while True:
        ok, f = cap.read()
        if not ok: break
        out.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return out


def main(take, first, relit_model, out_dir, plate=None):
    out_dir = pathlib.Path(out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    R_path = out_dir / "first.jpg"
    JL.restore_lines(first, relit_model, str(R_path), skip_cheeks=True)
    A = np.asarray(Image.open(first).convert("RGB"), np.float32)
    R = np.asarray(Image.open(R_path).convert("RGB"), np.float32)
    h, w = A.shape[:2]
    sig = w / 220
    blurR = cv2.GaussianBlur(R, (0, 0), sig)
    ratio = np.clip((blurR + 2) / (cv2.GaussianBlur(A, (0, 0), sig) + 2), .4, 3.0)
    LA = JL.face_landmarks(A.astype(np.uint8)); PA = pts(LA, w, h, STABLE)
    # colour from the ratio only on her skin; elsewhere (hair, jacket) mostly its brightness, so the take's gold rim turns
    # neutral instead of the opposite tint
    rl = ratio.mean(2, keepdims=True); skin = oval_mask(LA, w, h, 1.0, 8)[..., None]
    ratio = rl * (ratio / rl) ** (skin + (1 - skin) * .35)
    # away from her face the ratio is only a broad wash (her hair and the edge of her head move against the still)
    ratio_far = cv2.GaussianBlur(ratio, (0, 0), 24)
    # the still's skin light, extended past her face edge with her median skin colour, so a moved jaw never pulls in sky or grass
    # The model kept a faint diagonal glasses-shadow too, and restore_lines brings back the take's band outline below the
    # cheeks: so her skin light is the still's skin closed (dark features under ~40 px removed) and smoothed broadly (a
    # normalised blur over her skin only, sigma w/50): its colour and the large shading of her face, no band. The take's own lines go back on top (det below).
    inner = oval_mask(LA, w, h, 1.0, 1)[..., None]
    skA = skin_mask(LA, w, h, 1)
    tone = np.median(blurR[(inner[..., 0] > .5) & (cheeks_mask(LA, w, h, 1)[..., 0] > .5)], axis=0)
    sm = w / SMOOTH
    Rc = np.where(skA > .5, R, tone)                                   # outside her skin: her skin tone (no hair, glasses)
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CLOSE, CLOSE))
    Rc = cv2.erode(cv2.dilate(Rc, ker), ker)                           # a closing: dark bands and lines narrower than ~40 px go
    smooth = cv2.GaussianBlur(Rc * skA, (0, 0), sm) / (cv2.GaussianBlur(skA[..., 0], (0, 0), sm)[..., None] + 1e-4)
    skinR = inner * smooth + (1 - inner) * tone
    if FLAT: skinR = smooth   # FLAT: the normalised blur everywhere (no seam at the still's oval)
    F = frames(take)
    mats = np.array([JFa.matte(f) for f in F])
    mats = np.array([mats[max(0, i - 2):i + 3].mean(0) for i in range(len(mats))])
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    fdir = ROOT / "video" / "plates" / plate if plate else None
    if fdir: fdir.mkdir(parents=True, exist_ok=True)
    tmp = out_dir / "frames"; tmp.mkdir(exist_ok=True)
    for i, fr in enumerate(F):
        X = fr.astype(np.float32)
        try:
            L = JL.face_landmarks(fr); T, _ = cv2.estimateAffinePartial2D(PA, pts(L, w, h, STABLE))
        except RuntimeError:
            L, T = LA, np.float32([[1, 0, 0], [0, 1, 0]])
        warp = lambda im: cv2.warpAffine(im, T, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        head = oval_mask(L, w, h, 1.15, 10)[..., None]
        g = head * warp(ratio) + (1 - head) * ratio_far
        Y = X * g
        # her skin (the face oval minus the eyes and brows, which change with her expression, and the lips, which sing): the
        # still's skin light carried with her head, times the take's line detail, so the closet's glasses-shadow (Seedance
        # draws it larger than the still) goes; inside her outline only the take's faint texture is kept (the shadow's hatched
        # edges are dropped). The eyes, brows, nose and mouth keep the take's own tones (relit by the ratio above).
        ga = X.mean(2); dl = (ga + 1) / (cv2.GaussianBlur(ga, (0, 0), sig) + 1)
        nm = 1 - oval_mask(L, w, h, RIM, 4)[..., None]   # her face's outline keeps its lines
        det = (1 - nm) * np.clip(dl, DLO, DHI)[..., None] + nm * np.clip(dl, 0, 1.15)[..., None]
        sk = skin_mask(L, w, h, SKF, SKG)
        if CHK: sk = np.maximum(sk, cheeks_mask(L, w, h, CHK))
        Y = sk * warp(skinR) * det + (1 - sk) * Y
        # the take's golden-hour rim on her hair, jacket and headphones: no low sun in daylight, so its gold goes grey
        hsv = cv2.cvtColor(np.clip(Y, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
        gold = np.clip(1 - np.abs(hsv[..., 0] - 19) / 5, 0, 1) * (1 - oval_mask(L, w, h, 1.0, 6))
        hsv[..., 1] *= 1 - .8 * gold
        Y = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)
        m = cv2.GaussianBlur(cv2.dilate((mats[i] > .35).astype(np.uint8), k).astype(np.float32), (0, 0), 5)[..., None]
        m = np.maximum(m, oval_mask(L, w, h, 1.2, 10)[..., None])
        Y = m * Y + (1 - m) * R
        im = Image.fromarray(np.clip(Y, 0, 255).astype(np.uint8))
        im.save(tmp / f"f{i + 1:04d}.png")
        if fdir: im.save(fdir / f"f{i + 1:04d}.jpg", quality=92)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "24", "-i", str(tmp / "f%04d.png"), "-c:v", "libx264",
                    "-crf", "14", "-pix_fmt", "yuv420p", str(out_dir / "take1.mp4")], check=True)
    print(f"{len(F)} frames -> {out_dir / 'take1.mp4'}" + (f", {fdir}" if fdir else ""))


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    pl = next((x.split("=", 1)[1] for x in sys.argv if x.startswith("--plate=")), None)
    main(a[0], a[1], a[2], a[3], pl)
