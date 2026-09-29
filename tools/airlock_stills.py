"""Install the true-scale Volga airlock stills (and the animated cutaway take) as plates, prepared for the night pencil pass.

    python3 tools/airlock_stills.py [airlock_cut] [airlock_cut_still] [airlock_side]
    python3 tools/airlock_stills.py --gen       regenerate media/plates/airlock_cut/take1.mp4 (Seedance, from the cutaway still)

airlock_cut_still, airlock_side: media/plates/<src>/still.jpg → video/plates/<id>/f0001.jpg (2560x1440) + m0001.png (subject
    matte) + meta.json + stats.json.
airlock_cut: the cutaway still animated (media/plates/airlock_cut/take1.mp4, 5 s: he slides one arm up along the wall past his
    helmet until his glove presses flat on the closed hatch; locked-off camera). Every frame is registered onto the still (the
    model re-frames it by ~1%: a similarity fitted on the tube, so the face box and the shot's push hold), toned exactly like
    the still and installed at 1920x1080 (f0001..f0121). His matte is the still's body matte plus, per frame, what moved since
    the first frame (the arm: GrabCut inside the convex hull of the strong changes off his body).

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


def cut_masks(bgr):
    """(object, him) mattes of the cutaway: the tube + flanges vs the black surround, and his body (hard, 0/1)."""
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    obj = feather(rembg_mask(rgb) > .4, 3)
    # him: rembg on a crop around the body; the control panel and the padding under his legs are cut away
    man = rembg_mask(rgb, (150, 250, 910, 570))
    man[455:, 600:] = 0
    return obj, cv2.morphologyEx((man > .5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))


def prep_cut(bgr, masks=None):
    L = lightness(bgr)
    obj, man = masks or cut_masks(bgr)
    man = feather(man, 2.5)
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


def meta(pid, bgr=None):
    import plate_meta
    f = FACE["airlock_cut" if pid.startswith("airlock_cut") else pid]
    c = [(f[0] + f[2]) / 2, (f[1] + f[3]) / 2]
    out = []
    for fr in sorted((DST / pid).glob("f*.jpg")):
        m = plate_meta.measure(fr, faces=False)
        m["face"] = f + [0, c[0] - .02, c[1] - .02, c[0] + .02, c[1] - .02, c[0], c[1] + .03, {}]
        out.append(m)
    (DST / pid / "meta.json").write_text(json.dumps(out, separators=(",", ":")))
    plate_meta.stats(pid)


def run(pid):
    if pid == "airlock_cut":
        return run_take()
    src = "airlock_cut" if pid == "airlock_cut_still" else pid
    bgr = cv2.resize(cv2.imread(str(SRC / src / "still.jpg")), (W, H), interpolation=cv2.INTER_AREA)
    img, matte = (prep_cut if src == "airlock_cut" else prep_side)(bgr)
    d = DST / pid
    d.mkdir(parents=True, exist_ok=True)
    # the tones are re-laid at the working size, then carried onto the full-resolution still (detail kept for the face pass)
    big = cv2.resize(cv2.imread(str(SRC / src / "still.jpg")), OUT, interpolation=cv2.INTER_AREA)
    Lb = lightness(big)
    ratio = cv2.resize((lightness(img) + .02) / (lightness(bgr) + .02), OUT, interpolation=cv2.INTER_LINEAR)
    lab_s, lab_b = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32), cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    chroma = cv2.resize(np.clip((np.abs(lab_s[..., 1:] - 128).sum(-1) + 1) / (np.abs(lab_b[..., 1:] - 128).sum(-1) + 1), 0, 3), OUT)
    img = relight(big, (Lb + .02) * ratio - .02, chroma)
    cv2.imwrite(str(d / "f0001.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 93])
    cv2.imwrite(str(d / "m0001.png"), cv2.resize((matte * 255).astype(np.uint8), (512, 288), interpolation=cv2.INTER_AREA))
    meta(pid, bgr)
    print(pid, "installed")


# ---------------------------------------------------------------- the animated cutaway (airlock_cut)
TAKE = SRC / "airlock_cut" / "take1.mp4"
TAKE_OUT = (1920, 1080)
TAKE_PROMPT = (
    "The video starts exactly on the input image, with identical framing: a fixed locked-off camera, no zoom, no pan, no push, "
    "no reframing, no crop: the entire sealed airlock tube from the left hatch to the right hatch stays in view, the same size "
    "and in the same place in every frame, with the black background around it; the man keeps his exact size and position. "
    "A cosmonaut in a white spacesuit lies straight along the padded tube, helmet at the left end against the closed round hatch. "
    "Only ONE arm moves: over five seconds, slowly and with effort, he lifts the arm on the far side, the one against the upper padded "
    "wall, and slides it along the wall behind and above his helmet, toward the closed round hatch at the left end, until his glove "
    "touches the hatch rim above his helmet and presses flat against it. The other arm stays still, resting at his side on the lower "
    "padding; it never lifts and never crosses his face. His face inside the visor stays fully visible the whole time and strains, "
    "teeth gritted. His body barely moves. Nothing else moves: the tube, the padding, the two lamps, the metal rings, the control "
    "panel and the black background stay exactly as in the image. Photoreal, same lighting.")


def gen_take():
    """Seedance 2.5 image-to-video from the cutaway still (the real-person filter needs use_virtual_avatar). Takes 2-5 min.
    Of four tries this is the one that kept the framing and one arm (others re-scaled the tube or crossed his face)."""
    import cfai
    inp = {"prompt": TAKE_PROMPT, "duration": 5, "resolution": "720p", "aspect_ratio": "16:9", "generate_audio": False,
           "use_virtual_avatar": True, "image": cfai.data_uri(SRC / "airlock_cut" / "still.jpg")}
    cfai.gen("bytedance/seedance-2.5", inp, TAKE, tag="airlock_arm", timeout=1800)


def take_frames():
    import subprocess, tempfile
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(TAKE), f"{td}/f%04d.png"], check=True)
        return [cv2.resize(cv2.imread(str(p)), (W, H), interpolation=cv2.INTER_AREA) for p in sorted(pathlib.Path(td).glob("f*.png"))]


def register(frame, still):
    """Similarity from the take's first frame onto the still, fitted on the tube only (SIFT + RANSAC)."""
    sift = cv2.SIFT_create(8000)
    mask = np.full((H, W), 255, np.uint8); mask[180:560, 140:920] = 0
    k1, d1 = sift.detectAndCompute(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), mask)
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(still, cv2.COLOR_BGR2GRAY), mask)
    good = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < .7 * b.distance]
    M, _ = cv2.estimateAffinePartial2D(np.float32([k1[g.queryIdx].pt for g in good]), np.float32([k2[g.trainIdx].pt for g in good]),
                                       ransacReprojThreshold=2, maxIters=10000)
    return M


def fill_holes(m):
    ff = np.pad(m, 1) * 255
    cv2.floodFill(ff, None, (0, 0), 128)
    return np.maximum(m, (ff[1:-1, 1:-1] == 0).astype(np.uint8))


def run_take():
    if not TAKE.exists():
        gen_take()
    still = cv2.resize(cv2.imread(str(SRC / "airlock_cut" / "still.jpg")), (W, H), interpolation=cv2.INTER_AREA)
    frames = take_frames()
    M = register(frames[0], still)
    frames = [cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE) for f in frames]
    obj, man0 = cut_masks(frames[0])
    ref = cv2.GaussianBlur(frames[0].astype(np.float32), (0, 0), 1.5)
    d = DST / "airlock_cut"
    for p in list(d.glob("f*.jpg")) + list(d.glob("m*.png")):
        p.unlink()
    d.mkdir(parents=True, exist_ok=True)
    body = cv2.dilate(man0, np.ones((9, 9), np.uint8))
    for i, f in enumerate(frames, 1):
        # his arm: the strong changes since the first frame off his body, in the tube's upper left where the arm travels
        # (the lighting on the padding shifts too, but less), wrapped in their convex hull (the sleeve's inside barely changes)
        diff = cv2.GaussianBlur(np.abs(cv2.GaussianBlur(f.astype(np.float32), (0, 0), 1.5) - ref).sum(-1), (0, 0), 2)
        mv = ((diff > 60) & (body == 0) & (obj > .5)).astype(np.uint8)
        mv[:, 700:] = 0; mv[440:] = 0
        mv = cv2.morphologyEx(mv, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        n, lab, st, _ = cv2.connectedComponentsWithStats(mv)
        pts = np.column_stack(np.nonzero(np.isin(lab, [k for k in range(1, n) if st[k, 4] > 40])))[:, ::-1]
        man = man0
        if len(pts) > 5:
            # GrabCut inside that hull (it also holds lit padding): the body and the strongest changes are sure him
            hull = np.zeros_like(mv); cv2.fillConvexPoly(hull, cv2.convexHull(pts.astype(np.int32)), 1)
            gc = np.full(mv.shape, cv2.GC_BGD, np.uint8)
            gc[cv2.dilate(hull, np.ones((15, 15), np.uint8)) > 0] = cv2.GC_PR_BGD
            gc[hull > 0] = cv2.GC_PR_FGD
            gc[man0 > 0] = cv2.GC_FGD
            gc[(mv > 0) & (diff > 90)] = cv2.GC_FGD
            cv2.grabCut(f, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
            m = cv2.morphologyEx(((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            n, lab, st, _ = cv2.connectedComponentsWithStats(m)
            man = fill_holes((lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8))
        img, matte = prep_cut(f, (obj, man))
        cv2.imwrite(str(d / f"f{i:04d}.jpg"), cv2.resize(img, TAKE_OUT, interpolation=cv2.INTER_CUBIC), [cv2.IMWRITE_JPEG_QUALITY, 92])
        if i % 2 == 1:
            cv2.imwrite(str(d / f"m{i:04d}.png"), cv2.resize((matte * 255).astype(np.uint8), (512, 288), interpolation=cv2.INTER_AREA))
    meta("airlock_cut")
    print("airlock_cut installed:", len(frames), "frames")


if __name__ == "__main__":
    if "--gen" in sys.argv:
        gen_take()
    for pid in [a for a in sys.argv[1:] if not a.startswith("--")] or ["airlock_cut", "airlock_cut_still", "airlock_side"]:
        run(pid)
