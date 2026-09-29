"""Scene drawings of Jade whose head is her traced head, not a redrawn one.

    python3 tools/jade_head_lock.py hook1 studio brk [--n=2] [--only-composite]

The base is the model's faithful trace of photo 3 (media/refs/jade_trace_control_1.png; she approved it as accurate).
Scene edits that redraw her head normalise it (smaller, narrower, rounder chin, narrower glasses, less hair), so:
  1. the base is laid into a 16:9 frame at medium framing, right of centre   -> media/refs/jade_hl_layout.png
  2. Nano Banana redraws only her clothes, headphones and the background      -> media/refs/jade_hl_<scene>_<i>_gen.png
  3. the result is aligned to the layout (ORB + RANSAC similarity), and the traced head (face + hair, or the face
     only where headphones sit on her head) is pasted back with a feathered mask, tone-matched to the new drawing
                                                                             -> media/refs/jade_hl_<scene>_<i>.png
"""
import sys, pathlib, concurrent.futures as cf
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
REF = ROOT / "media" / "refs"
BASE = REF / "jade_trace_control_1.png"
CW, CH = 2752, 1536                 # canvas (Nano Banana's 16:9 2K size)
HFRAC, CX = .74, .64                # base height as a fraction of the frame; her centre, as a fraction of the width
PAPER = (246, 240, 226)

# polygons in the 900-wide base (see video/out: base_grid); HEAD takes her hair, FACE stops inside the ears
HEAD = [(175, 420), (180, 300), (250, 235), (420, 228), (560, 258), (618, 330), (612, 560), (578, 660), (522, 716),
        (435, 748), (345, 728), (285, 692), (232, 645), (192, 565)]
FACE = [(238, 335), (300, 292), (420, 282), (520, 300), (572, 360), (586, 470), (580, 560), (556, 650), (512, 712),
        (435, 745), (350, 725), (292, 690), (248, 630), (228, 520), (226, 420)]

HAIR = "long dark hair, centre-parted and half up, symmetrical, with wispy face-framing pieces"
PROMPT = ("Image 1 is a graphite pencil drawing of a woman on cream paper, laid into a wide frame. Keep it one single pencil drawing in exactly the same technique. "
          "Her head, face, glasses, eyebrows and hair ({hair}) are finished: keep them exactly as drawn, the same size and the same place, line for line; her head is "
          "large and heart-shaped with a tapering chin, and her glasses are wide: keep all of that. Do not redraw, reshape, shrink, beautify or add makeup to her. "
          "Keep her pose and her shoulders where they are, and draw her body in proportion to her head as it is. Change only: her clothes become the white cropped nylon "
          "flight jacket with the bright orange band (left of image 2) over a black top; {hp}; and the background, including all the blank paper around her, becomes "
          "{bg}, drawn more loosely and lightly than her. {col} Exactly one pair of headphones. One single image, no panels, no text.")
SCENES = {
    "hook1": dict(mask="head", hp="the pale dusty-pink over-ear headphones (right of image 2) rest around her neck",
                  bg="a hilltop at golden hour above the Golden Gate Bridge and the San Francisco skyline",
                  col="Graphite with a few soft touches of coloured pencil: warm light, the orange band, the pink headphones."),
    "studio": dict(mask="face", hp="the pale dusty-pink over-ear headphones (right of image 2) are on her head over her ears, nothing around her neck",
                   bg="a recording studio at night: acoustic foam panels and a warm lamp, a large-diaphragm condenser microphone on a stand at the left, at chin height, well clear of her face",
                   col="Graphite with a soft touch of warm coloured pencil for the lamp light, the orange band and the pink headphones."),
    "brk": dict(mask="head", hp="the pale dusty-pink over-ear headphones (right of image 2) rest around her neck",
                bg="a deep red and orange dusk sky in coloured pencil over the Golden Gate Bridge",
                col="Coloured pencil for the red-orange dusk sky and a soft red-orange glow along one edge of her hair and jacket; the orange band, the pink headphones."),
}


def layout():
    b = Image.open(BASE).convert("RGB")
    h = round(CH * HFRAC); s = h / b.height; w = round(b.width * s)
    x0, y0 = round(CW * CX - w / 2), CH - h
    can = Image.new("RGB", (CW, CH), PAPER); can.paste(b.resize((w, h), Image.LANCZOS), (x0, y0))
    k = b.width / 900 * s
    to = lambda poly: [(x0 + x * k, y0 + y * k) for x, y in poly]
    return can, to(HEAD), to(FACE)


def mask_of(poly, feather):
    m = Image.new("L", (CW, CH), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    m = m.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m, dtype=np.float32) / 255


def align(lay, gen, poly):
    """Similarity transform taking layout pixels onto the generated image, from features around her head."""
    a = cv2.cvtColor(np.asarray(lay), cv2.COLOR_RGB2GRAY); b = cv2.cvtColor(np.asarray(gen), cv2.COLOR_RGB2GRAY)
    xs, ys = zip(*poly); pad = 160
    roi = np.zeros_like(a); roi[max(0, int(min(ys)) - pad):int(max(ys)) + pad, max(0, int(min(xs)) - pad):int(max(xs)) + pad] = 255
    orb = cv2.ORB_create(6000)
    ka, da = orb.detectAndCompute(a, roi); kb, db = orb.detectAndCompute(b, roi)
    if da is None or db is None:
        return None
    m = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(da, db), key=lambda x: x.distance)[:800]
    pa = np.float32([ka[x.queryIdx].pt for x in m]); pb = np.float32([kb[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(pa, pb, method=cv2.RANSAC, ransacReprojThreshold=4)
    return M if M is not None and inl.sum() >= 25 else None


def composite(lay, gen, poly):
    M = align(lay, gen, poly)
    if M is None:
        print("  alignment failed: pasting at the layout position")
        M = np.float32([[1, 0, 0], [0, 1, 0]])
    else:
        print(f"  aligned: scale {np.hypot(M[0,0], M[1,0]):.3f}, shift ({M[0,2]:.1f}, {M[1,2]:.1f})")
    L = cv2.warpAffine(np.asarray(lay, dtype=np.float32), M, (CW, CH), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    m = cv2.warpAffine(mask_of(poly, 10), M, (CW, CH))[..., None]
    G = np.asarray(gen, dtype=np.float32)
    # tone match: the paper-white highlights and the pencil darks of her head, per channel
    sel = m[..., 0] > .9
    for c in range(3):
        lo_a, hi_a = np.percentile(L[..., c][sel], [3, 97]); lo_b, hi_b = np.percentile(G[..., c][sel], [3, 97])
        L[..., c] = (L[..., c] - lo_a) * (hi_b - lo_b) / max(hi_a - lo_a, 1) + lo_b
    return Image.fromarray(np.clip(G * (1 - m) + L * m, 0, 255).astype(np.uint8))


def gen_one(scene, i, lay_path):
    import cfai
    sc = SCENES[scene]
    inp = {"prompt": PROMPT.format(hair=HAIR, **sc), "image_input": [cfai.data_uri(str(lay_path)), cfai.data_uri(str(REF / "jade_outfit_hp.jpg"))],
           "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    return cfai.gen("google/nano-banana-pro", inp, str(REF / f"jade_hl_{scene}_{i}_gen.png"), tag="headlock")[0][0]


if __name__ == "__main__" and "--onto" not in sys.argv:
    a = sys.argv[1:]
    scenes = [x for x in a if not x.startswith("--")] or list(SCENES)
    n = int(next((x.split("=")[1] for x in a if x.startswith("--n=")), 2))
    lay, head, face = layout()
    lay_path = REF / "jade_hl_layout.png"; lay.save(lay_path)
    jobs = [(s, i) for s in scenes for i in range(1, n + 1)]
    if "--only-composite" not in a:
        with cf.ThreadPoolExecutor(6) as ex:
            list(ex.map(lambda j: gen_one(*j, lay_path), jobs))
    for s, i in jobs:
        g = REF / f"jade_hl_{s}_{i}_gen.png"
        if not g.exists():
            continue
        print(s, i)
        gen = Image.open(g).convert("RGB").resize((CW, CH), Image.LANCZOS)
        composite(lay, gen, head if SCENES[s]["mask"] == "head" else face).save(REF / f"jade_hl_{s}_{i}.png")


# ---------------------------------------------------------------- mode 2: paste her traced head onto a finished scene
#     python3 tools/jade_head_lock.py --onto media/refs/jade_ft_hook1_2.png[:face] ...
# The scene keeps its own composition; her traced head replaces the model's, aligned by the eye centres (MediaPipe),
# so at the same eye spacing her real head (larger, heart-shaped, wide glasses) takes its own size. Only her pixels
# are pasted (rembg matte of the base), so none of the base's background comes along.
L_EYE, R_EYE = [33, 133, 159, 145], [362, 263, 386, 374]


def eyes(img):
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path="/tmp/work/models/face_landmarker.task"), num_faces=1))
    A = np.asarray(img.convert("RGB")); H, W = A.shape[:2]
    # the detector wants a face that fills a good part of the picture: try the whole image, then square windows
    wins = [(0, 0, W, H)]
    for f in (.7, .5, .35):
        d = int(min(W, H) * f)
        wins += [(x, y, d, d) for y in range(0, H - d + 1, max(1, d // 3)) for x in range(0, W - d + 1, max(1, d // 3))]
    for x0, y0, w, h in wins:
        a = np.ascontiguousarray(A[y0:y0 + h, x0:x0 + w])
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=a))
        if r.face_landmarks:
            lm = r.face_landmarks[0]
            c = lambda ids: np.mean([[x0 + lm[i].x * w, y0 + lm[i].y * h] for i in ids], 0)
            e = np.float32([c(L_EYE), c(R_EYE)])
            if all(0 < v[0] < W and 0 < v[1] < H for v in e):
                return e
    return None


def base_matte(b):
    p = REF / "jade_trace_control_1_matte.png"
    if not p.exists():
        from rembg import remove, new_session
        remove(b, session=new_session("isnet-general-use"), only_mask=True).save(p)
    return np.asarray(Image.open(p).convert("L").resize(b.size), dtype=np.float32) / 255


def paste_onto(target_path, which="head"):
    b = Image.open(BASE).convert("RGB"); t = Image.open(target_path).convert("RGB")
    eb, et = eyes(b), eyes(t)
    if eb is None or et is None:
        print("  no face found"); return None
    # similarity from the two eye centres
    vb, vt = eb[1] - eb[0], et[1] - et[0]
    s = np.hypot(*vt) / np.hypot(*vb); ang = np.arctan2(vt[1], vt[0]) - np.arctan2(vb[1], vb[0])
    R = s * np.float32([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]])
    M = np.hstack([R, (et.mean(0) - R @ eb.mean(0))[:, None]]).astype(np.float32)
    k = b.width / 900
    poly = [(x * k, y * k) for x, y in (HEAD if which == "head" else FACE)]
    m = Image.new("L", b.size, 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    m = np.asarray(m.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(10 * k)), dtype=np.float32) / 255
    if which == "head":
        m = m * np.clip(base_matte(b) * 1.3, 0, 1)
    W, H = t.size
    Lw = cv2.warpAffine(np.asarray(b, dtype=np.float32), M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    mw = cv2.warpAffine(m, M, (W, H))[..., None]
    G = np.asarray(t, dtype=np.float32)
    sel = mw[..., 0] > .9
    for c in range(3):
        lo_a, hi_a = np.percentile(Lw[..., c][sel], [3, 97]); lo_b, hi_b = np.percentile(G[..., c][sel], [3, 97])
        Lw[..., c] = (Lw[..., c] - lo_a) * (hi_b - lo_b) / max(hi_a - lo_a, 1) + lo_b
    print(f"  eye scale {s:.3f}")
    return Image.fromarray(np.clip(G * (1 - mw) + Lw * mw, 0, 255).astype(np.uint8))


if __name__ == "__main__" and "--onto" in sys.argv:
    for a in sys.argv[sys.argv.index("--onto") + 1:]:
        path, _, which = a.partition(":")
        print(path)
        out = paste_onto(ROOT / path, which or "head")
        if out is not None:
            out.save(ROOT / path.replace(".png", "_hl.png"))
