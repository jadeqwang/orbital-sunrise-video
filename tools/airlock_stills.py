"""Install the two true-scale Volga airlock stills as single-frame plates, prepared for the night pencil pass.

    python3 tools/airlock_stills.py [airlock_cut] [airlock_side]

media/plates/<id>/still.jpg → video/plates/<id>/f0001.jpg (1280x720) + m0001.png (subject matte) + meta.json + stats.json.

On night paper the pencil pass hatches brightness: the stills are bright and low in contrast (cream padding, white suit), so
drawn as they are they turn into an even grey mat of hatching. Here the tones are re-laid for the pencil:
  airlock_cut   the black surround goes fully black; the padded tube is pushed down to a dark mid-tone that keeps only its
                pleats (high-pass), so the tube reads as a ribbed shell in line; he (a rembg matte of the body) stays bright
                with local contrast; his face in the visor gets strong local contrast; the two lamps stay hot.
  airlock_side  the wall above him is dimmed to its pleats; the glove on it and the helmet stay bright (their matte gives the
                pencil a silhouette); his face gets local contrast and a lift so the grimace draws.
The faces are small, tilted and behind visors, so MediaPipe finds no reliable landmarks: meta.json gets a hand-set face box
(no landmark lines: the shot draws these faces with faceLines: false, from hatching and edges).
"""
import sys, json, pathlib, os
import numpy as np, cv2
from PIL import Image

os.environ.setdefault("U2NET_HOME", "/tmp/work/u2")
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, DST = ROOT / "media" / "plates", ROOT / "video" / "plates"
sys.path.insert(0, str(ROOT / "tools"))
W, H = 1280, 720          # working size (the coordinates below); installed at 2x so the face pass has pixels to draw from
OUT = (2560, 1440)
FACE_SAT = float(os.environ.get("FACE_SAT", 1.3))

# the glove flat on the wall and the forearm down to the frame edge (airlock_side, 1280x720 px)
GLOVE = [(742, 280), (768, 158), (838, 124), (905, 128), (975, 160), (985, 300), (1012, 440), (1060, 520), (1105, 640), (1110, 720),
         (880, 720), (868, 520), (842, 430), (800, 372)]
# hand-set face boxes (plate uv): the face inside the visor
FACE = {"airlock_cut": [.178, .41, .242, .52], "airlock_side": [.168, .555, .368, .885]}
def rembg_mask(rgb, box=None):
    from rembg import remove, new_session
    ses = rembg_mask.ses = getattr(rembg_mask, "ses", None) or new_session("isnet-general-use")
    x0, y0, x1, y1 = box or (0, 0, rgb.shape[1], rgb.shape[0])
    m = np.array(remove(Image.fromarray(rgb[y0:y1, x0:x1]), session=ses, only_mask=True), np.float32) / 255
    out = np.zeros(rgb.shape[:2], np.float32); out[y0:y1, x0:x1] = m
    return out


def clahe(L, clip, tile):
    c = cv2.createCLAHE(clipLimit=clip, tileGridSize=(tile, tile))
    return c.apply((np.clip(L, 0, 1) * 255).astype(np.uint8)).astype(np.float32) / 255


def ellipse(shape, cx, cy, rx, ry, soft=.35):
    y, x = np.mgrid[0:shape[0], 0:shape[1]].astype(np.float32)
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    return np.clip((1 + soft - d) / (2 * soft), 0, 1)


def feather(m, s):
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), s)


def relight(bgr, L2, sat=1.0):
    """Replace the lightness (LAB L) with L2 (0..1), keep the hue; sat scales the chroma."""
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    lab[..., 0] = np.clip(L2, 0, 1) * 255
    lab[..., 1:] = 128 + (lab[..., 1:] - 128) * (sat if np.ndim(sat) == 0 else sat[..., None])
    return cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)


def lightness(bgr):
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32) / 255


def prep_cut(bgr):
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    L = lightness(bgr)
    # the whole object (tube + flanges) vs the black surround
    obj = feather(rembg_mask(rgb) > .4, 3)
    # him: rembg on a crop around the body; the control panel and the padding under his legs are cut away
    man = rembg_mask(rgb, (150, 250, 910, 570))
    man[455:, 600:] = 0
    man = feather(cv2.morphologyEx((man > .5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)), 2.5)
    # padding: dark, only the pleats (ridges lighter than their surroundings) survive
    hp = L - cv2.GaussianBlur(L, (0, 0), 9)
    pad = np.clip(.2 + .22 * (L - .5) + 2.2 * hp, 0, .62)
    # him: bright with local contrast (suit folds, straps, the helmet rim)
    body = np.clip(.12 + .95 * clahe(L, 2.5, 8) ** 1.15, 0, .97)
    # the face in the visor: lifted, with strong local contrast (the creases, the nose, the bared teeth)
    f = FACE["airlock_cut"]
    fm = ellipse(L.shape, (f[0] + f[2]) / 2 * W, (f[1] + f[3]) / 2 * H, (f[2] - f[0]) / 2 * W * 1.05, (f[3] - f[1]) / 2 * H * 1.05)
    face = np.clip(clahe(np.clip(L * 1.2, 0, 1), 3.0, 16) * 1.05, 0, 1)
    # the lamps stay hot
    hot = feather(L > .9, 2)
    out = pad * (1 - man) + body * man
    out = out * (1 - fm) + face * fm
    out = np.maximum(out, hot * L)
    out = out * obj + L * .25 * (1 - obj)
    out[out < .06] = 0
    sat = np.clip(1 + .6 * man, 0, 2) * (1 - .5 * (1 - man) * (1 - fm))
    sat = sat * (1 - fm) + FACE_SAT * fm      # skin warm but not red: warm strokes on the face, white on the teeth and helmet
    return relight(bgr, out, sat), man


def prep_side(bgr):
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    L = lightness(bgr)
    rm = rembg_mask(rgb)
    # rembg only half-finds the glove and forearm against the pale wall: inside a hand-drawn outline of the arm its faint
    # matte is kept (finger shapes), and the forearm below the cuff is filled in
    arm = np.zeros(L.shape, np.uint8); cv2.fillPoly(arm, [np.array(GLOVE, np.int32)], 1)
    arm = cv2.dilate(arm, np.ones((9, 9), np.uint8))
    subj = ((rm > .45) | ((rm > .1) & (arm > 0))).astype(np.uint8)
    subj[400:] |= arm[400:]
    subj = np.maximum(cv2.morphologyEx(subj, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8)),
                      cv2.morphologyEx(subj, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))) & arm)
    subj = cv2.morphologyEx(subj, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    # fill the holes rembg leaves in the palm (they would draw as two dark eyes on the glove)
    ff = np.pad(subj, 1).copy() * 255
    cv2.floodFill(ff, None, (0, 0), 128)
    subj = np.maximum(subj, (ff[1:-1, 1:-1] == 0).astype(np.uint8))
    subj = feather(subj, 2.5)
    # wall: a lit surface drawn lightly, its pleats carried by the high-pass; he (glove, arm, helmet) brighter than it
    hp = L - cv2.GaussianBlur(L, (0, 0), 7)
    wall = np.clip(.4 + .3 * (L - .5) + 2.2 * hp, 0, .7)
    body = np.clip(.32 + .7 * clahe(np.clip(L * 1.2, 0, 1), 2.5, 8), 0, .97)
    f = FACE["airlock_side"]
    fm = ellipse(L.shape, (f[0] + f[2]) / 2 * W, (f[1] + f[3]) / 2 * H, (f[2] - f[0]) / 2 * W * 1.0, (f[3] - f[1]) / 2 * H * 1.0)
    face = np.clip(clahe(np.clip(L * 1.25, 0, 1), 4.0, 12) * 1.08 - .04, 0, 1)
    hot = feather(L > .9, 2)
    out = wall * (1 - subj) + body * subj
    out = out * (1 - fm) + face * fm
    out = np.maximum(out, hot * L)
    sat = (1 - .4 * (1 - subj) * (1 - fm)) * (1 - fm) + .7 * fm
    return relight(bgr, out, sat), subj


def meta(pid, bgr):
    import plate_meta
    m = plate_meta.measure(DST / pid / "f0001.jpg", faces=False)
    f = FACE[pid]
    c = [(f[0] + f[2]) / 2, (f[1] + f[3]) / 2]
    m["face"] = f + [0, c[0] - .02, c[1] - .02, c[0] + .02, c[1] - .02, c[0], c[1] + .03, {}]
    (DST / pid / "meta.json").write_text(json.dumps([m], separators=(",", ":")))
    plate_meta.stats(pid)


def run(pid):
    bgr = cv2.resize(cv2.imread(str(SRC / pid / "still.jpg")), (W, H), interpolation=cv2.INTER_AREA)
    img, matte = (prep_cut if pid == "airlock_cut" else prep_side)(bgr)
    d = DST / pid
    d.mkdir(parents=True, exist_ok=True)
    # the tones are re-laid at the working size, then carried onto the full-resolution still (detail kept for the face pass)
    big = cv2.resize(cv2.imread(str(SRC / pid / "still.jpg")), OUT, interpolation=cv2.INTER_AREA)
    Lb = lightness(big)
    ratio = cv2.resize((lightness(img) + .02) / (lightness(bgr) + .02), OUT, interpolation=cv2.INTER_LINEAR)
    lab_s, lab_b = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32), cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    chroma = cv2.resize(np.clip((np.abs(lab_s[..., 1:] - 128).sum(-1) + 1) / (np.abs(lab_b[..., 1:] - 128).sum(-1) + 1), 0, 3), OUT)
    img = relight(big, (Lb + .02) * ratio - .02, chroma)
    cv2.imwrite(str(d / "f0001.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 93])
    cv2.imwrite(str(d / "m0001.png"), cv2.resize((matte * 255).astype(np.uint8), (512, 288), interpolation=cv2.INTER_AREA))
    meta(pid, bgr)
    print(pid, "installed")


if __name__ == "__main__":
    for pid in [a for a in sys.argv[1:] if not a.startswith("--")] or ["airlock_cut", "airlock_side"]:
        run(pid)
