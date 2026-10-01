"""Relight one of her singing takes frame by frame from a relit still of its first frame, keeping the take's own motion, lips
and timing (no new Seedance take, so her approved lip lag stays).

    python3 tools/jade_relight.py <take.mp4> <first.jpg> <relit_model.png> <out_dir> [--plate=<video/plates id>]

1. The relit still: jade_location.restore_lines(first, relit_model, <out_dir>/first.jpg, skip_cheeks=True): her own pencil lines
   under the model's light, the model's cheeks (no closet glasses-shadow).
2. Each take frame i: MediaPipe face landmarks; a similarity transform (eyes, brows, nose, forehead: not the mouth or jaw)
   carries the still onto frame i's head.
   - light: the still's low-frequency light ratio (blur(relit) / blur(first), sigma = w/220, as restore_lines) follows her head
     inside a widened face oval and stays put elsewhere; frame_i * ratio keeps every line and the mouth of the take;
   - cheeks under the lenses (jade_location.cheek_mask on frame i): the relit still's cheeks, carried with the head;
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
    ratio = np.clip((cv2.GaussianBlur(R, (0, 0), sig) + 2) / (cv2.GaussianBlur(A, (0, 0), sig) + 2), .4, 3.0)
    LA = JL.face_landmarks(A.astype(np.uint8)); PA = pts(LA, w, h, STABLE)
    F = frames(take)
    mats = np.array([JFa.matte(f) for f in F])
    mats = np.array([mats[max(0, i - 2):i + 3].mean(0) for i in range(len(mats))])
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
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
        head = oval_mask(L, w, h, 1.35, 14)[..., None]
        g = head * warp(ratio) + (1 - head) * ratio
        Y = X * g
        cm = JL.cheek_mask(L, w, h, 10)
        Y = cm * warp(R) + (1 - cm) * Y
        m = cv2.GaussianBlur(cv2.dilate((mats[i] > .35).astype(np.uint8), k).astype(np.float32), (0, 0), 8)[..., None]
        m = np.maximum(m, oval_mask(L, w, h, 1.5, 14)[..., None])
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
