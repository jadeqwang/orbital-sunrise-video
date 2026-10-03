"""Natural skin colour on her face in finished frames (H1d_home, 0:44 "bring me home"; her pick 2026-10-03: "B + even 1").

    python3 tools/skin_grade.py <frames dir> <first frame> <last frame> [--k=0.35] [--flat=0.45]

Grades video/out/<dir>/f%05d.jpg in place. Her drawing there is nearly grey, so a hue test cannot find her skin: the mask is her
face from MediaPipe face landmarks (FACE_MODEL, default /tmp/work/models/face_landmarker.task, as tools/plate_meta.py),
the face oval raised to the hairline (the landmark oval stops mid-forehead), minus eyes + brows and lips, feathered.
Inside it:
  flat: skin darker than the face's median is lifted toward it by this fraction (the grey drawing shades with darker skin,
        the band under her hairline and the middle of her nose; warmed, those read red-brown). Pencil lines (luminance
        below .32) are untouched.
  k:    then each skin pixel moves this far toward a warm light-medium skin tone at its own luminance; pencil lines, and
        pink (her headphones: blue above green), keep their colour.
Frames with no face found are left as they are (listed). A post step: the renderer does not do it, so a full render or a
splice of H1d_home runs it after (tools/splice_release.py --grade=H1d_home).
"""
import sys, os, pathlib
import numpy as np, cv2

MODEL = os.environ.get("FACE_MODEL", "/tmp/work/models/face_landmarker.task")
OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
LEYE = [70, 63, 105, 66, 107, 55, 193, 245, 128, 121, 120, 119, 118, 117, 111, 35, 226, 130]   # brow + eye (her right)
REYE = [300, 293, 334, 296, 336, 285, 417, 465, 357, 350, 349, 348, 347, 346, 340, 265, 446, 359]
SKIN = np.array([.80, .63, .53], np.float32)   # RGB: a warm light-medium skin tone (luminance ≈ .67)
_fl = None


def landmarker():
    global _fl
    if _fl is None:
        import mediapipe as mp
        from mediapipe.tasks import python as mpt
        from mediapipe.tasks.python import vision
        _fl = (mp, vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
            base_options=mpt.BaseOptions(model_asset_path=MODEL), running_mode=vision.RunningMode.IMAGE, num_faces=1)))
    return _fl


def face_mask(img):
    mp, fl = landmarker(); h, w = img.shape[:2]
    r = fl.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))
    if not r.face_landmarks: return None
    L = np.array([[p.x * w, p.y * h] for p in r.face_landmarks[0]])
    O = L[OVAL].copy(); c = O.mean(0); eye_y = (L[159, 1] + L[386, 1]) / 2
    up = O[:, 1] < eye_y; O[up, 1] = eye_y - (eye_y - O[up, 1]) * 1.85; O[up, 0] = c[0] + (O[up, 0] - c[0]) * 1.05
    m = np.zeros((h, w), np.float32); cv2.fillPoly(m, [O.astype(np.int32)], 1)
    for cut in (LIPS, LEYE, REYE): cv2.fillPoly(m, [cv2.convexHull(L[cut].astype(np.int32))], 0)
    return cv2.GaussianBlur(m, (0, 0), 10)


def grade(img, m, k=.35, flat=.45):
    f = img.astype(np.float32) / 255
    lum = .299 * f[..., 2] + .587 * f[..., 1] + .114 * f[..., 0]
    if flat > 0:
        sk = (m > .5) & (lum > .45)
        med = float(np.median(lum[sk])) if sk.sum() > 100 else .8
        mid = np.clip((lum - .32) / .12, 0, 1) * (lum < med)
        nl = lum + (med - lum) * flat * mid * m
        f = f * (nl / np.maximum(lum, 1e-3))[..., None]; lum = nl
    b, g = f[..., 0], f[..., 1]
    light = np.clip((lum - .35) / .15, 0, 1) * np.clip((g - b + .03) / .03, 0, 1)
    tl = float(SKIN @ np.array([.299, .587, .114], np.float32))
    t = SKIN[None, None, ::-1] * (lum / tl)[..., None]
    a = (m * light * k)[..., None]
    return (np.clip(f * (1 - a) + np.clip(t, 0, 1) * a, 0, 1) * 255).astype(np.uint8)


def main(a):
    pos = [x for x in a if not x.startswith("--")]; opt = dict(x[2:].split("=", 1) for x in a if x.startswith("--"))
    d, f0, f1 = pathlib.Path(pos[0]), int(pos[1]), int(pos[2]); k, flat = float(opt.get("k", .35)), float(opt.get("flat", .45))
    miss = []
    for i in range(f0, f1 + 1):
        p = d / f"f{i:05d}.jpg"; img = cv2.imread(str(p))
        if img is None: miss.append(i); continue
        m = face_mask(img)
        if m is None: miss.append(i); continue
        cv2.imwrite(str(p), grade(img, m, k, flat), [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f"graded frames {f0}–{f1} (k {k}, flat {flat}); no face / no file: {miss or 'none'}")


if __name__ == "__main__":
    main(sys.argv[1:])
