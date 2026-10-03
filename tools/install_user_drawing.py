"""Install the songwriter's own drawing of the sunrise as the card in D5_the_drawing (1:40) and C1_drawing (3:59).

    python3 tools/install_user_drawing.py <photo or scan> [--corners=x,y,x,y,x,y,x,y] [--credit="..."] [--paper=keep|neutral]

1. The card: found automatically as the largest bright, low-saturation quadrilateral in the photo (a phone photo of the card
   on a table, at an angle, is fine); or give its four corners in photo pixels (any order) with --corners when the
   detection picks the wrong shape (check video/data/user_drawing_check.jpg). A flat scan of just the card: the whole image.
2. Straightened (perspective) to the card's own aspect, 2000 px wide, a 0.6 % margin trimmed so no table shows at the edges.
3. White balance: the bare paper (bright, unsaturated pixels) is set to the film's warm white-paper tone, so the card sits
   on the film's paper like his did; the pencil and crayon colours scale with it. --paper=keep leaves the photo's colours.
4. Writes video/data/user_drawing.jpg (the card) and video/data/user_drawing.json ({w, h, rgb (the paper tone), credit,
   source}), plus video/data/user_drawing_check.jpg (the detected outline on the photo, and the result) to look at.

The renderer shows it with ?drawing=user (or as the default once LD_DEFAULT in video/src/shots2.js says 'user'): the same card
place, size, motion, timing and draw-on wipe as the redraw, with the drawing's own texture (no restroking).
Re-render only those two shots and splice them into the current release's frames (docs/ALTERNATE_CUT.md, "Your own drawing").
"""
import sys, json, pathlib
import numpy as np, cv2

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "video" / "data"
WIDTH, TRIM = 2000, .006
PAPER = (243, 236, 222)          # the film's warm white paper (RGB), what the bare card is balanced to


def order(q):
    q = np.asarray(q, np.float32).reshape(4, 2); s = q.sum(1); d = np.diff(q, axis=1).ravel()
    return np.array([q[np.argmin(s)], q[np.argmin(d)], q[np.argmax(s)], q[np.argmax(d)]], np.float32)   # tl, tr, br, bl


def find_card(img):
    h, w = img.shape[:2]; sc = 1200 / max(h, w); sm = cv2.resize(img, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(sm, cv2.COLOR_BGR2HSV)
    v, s = hsv[..., 2].astype(np.float32), hsv[..., 1].astype(np.float32)
    # paper: bright and unsaturated ("whiteness" v - 1.5 s, split by Otsu), so warm-lit wood or a coloured cloth stays out;
    # the drawing inside the card is filled by closing
    wh = np.clip(v - 1.5 * s, 0, 255).astype(np.uint8)
    wb = cv2.GaussianBlur(wh, (5, 5), 0)
    otsu, _ = cv2.threshold(wb, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)   # too low when most of the photo is a dark table
    paper = (wb > max(otsu, .72 * np.percentile(wb, 99))).astype(np.uint8) * 255
    paper = cv2.morphologyEx(paper, cv2.MORPH_OPEN, np.ones((17, 17), np.uint8))   # bright specks and thin sunlit strips of the table
    paper = cv2.morphologyEx(paper, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cs, _ = cv2.findContours(paper, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cs: return None
    H0, W0 = sm.shape[:2]
    def score(c):
        x, y, w, h = cv2.boundingRect(c); d = np.hypot((x + w / 2) / W0 - .5, (y + h / 2) / H0 - .5)
        touches = x <= 2 or y <= 2 or x + w >= W0 - 2 or y + h >= H0 - 2      # the card normally lies inside the photo
        return cv2.contourArea(c) * (1 - d) * (.3 if touches else 1)
    c = max(cs, key=score)
    if cv2.contourArea(c) < .05 * sm.shape[0] * sm.shape[1]: return None
    hull = cv2.convexHull(c); peri = cv2.arcLength(hull, True)
    for eps in (.01, .02, .03, .05):
        q = cv2.approxPolyDP(hull, eps * peri, True)
        if len(q) == 4: return order(q / sc)
    return order(cv2.boxPoints(cv2.minAreaRect(hull)) / sc)


def main(a):
    src = [x for x in a if not x.startswith("--")][0]
    opt = dict(x[2:].split("=", 1) for x in a if x.startswith("--") and "=" in x)
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    if img is None: sys.exit(f"cannot read {src}")
    if "corners" in opt: q = order([float(v) for v in opt["corners"].split(",")])
    else:
        q = find_card(img)
        if q is None: q = order([[0, 0], [img.shape[1], 0], [img.shape[1], img.shape[0]], [0, img.shape[0]]]); print("no card found: using the whole image (a scan?)")
    wpx = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
    hpx = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
    W, H = WIDTH, int(round(WIDTH * hpx / wpx))
    M = cv2.getPerspectiveTransform(q, np.float32([[0, 0], [W, 0], [W, H], [0, H]]))
    card = cv2.warpPerspective(img, M, (W, H), flags=cv2.INTER_LANCZOS4)
    tx, ty = int(W * TRIM), int(H * TRIM); card = card[ty:H - ty, tx:W - tx]
    # white balance on the bare paper
    f = card.astype(np.float32); hsv = cv2.cvtColor(card, cv2.COLOR_BGR2HSV)
    bare = (hsv[..., 1] < 40) & (hsv[..., 2] > np.percentile(hsv[..., 2], 60))
    ref = np.median(f[bare], axis=0) if bare.sum() > 1000 else np.percentile(f.reshape(-1, 3), 90, axis=0)
    if opt.get("paper", "neutral") != "keep":
        f = f * (np.array(PAPER[::-1], np.float32) / np.maximum(ref, 1))
    card = np.clip(f, 0, 255).astype(np.uint8)
    rgb = [round(float(v), 1) for v in (np.median(card[bare], axis=0)[::-1] if bare.sum() > 1000 else PAPER)]
    OUT.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT / "user_drawing.jpg"), card, [cv2.IMWRITE_JPEG_QUALITY, 93])
    meta = {"w": card.shape[1], "h": card.shape[0], "rgb": rgb, "credit": opt.get("credit", "Drawing: Jade Wang, after Alexei Leonov's «Sunrise» (1965)"),
            "source": pathlib.Path(src).name, "corners": [[round(float(x), 1), round(float(y), 1)] for x, y in q]}
    (OUT / "user_drawing.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    # a check image: the outline on the photo, and the straightened card beside it
    chk = img.copy(); cv2.polylines(chk, [q.astype(np.int32)], True, (0, 0, 255), max(3, img.shape[1] // 300))
    hh = 700; a1 = cv2.resize(chk, (int(chk.shape[1] * hh / chk.shape[0]), hh)); a2 = cv2.resize(card, (int(card.shape[1] * hh / card.shape[0]), hh))
    cv2.imwrite(str(OUT / "user_drawing_check.jpg"), np.hstack([a1, np.full((hh, 20, 3), 255, np.uint8), a2]), [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(f"card {card.shape[1]}x{card.shape[0]} (aspect {card.shape[1] / card.shape[0]:.3f}), paper {rgb} → video/data/user_drawing.jpg; check video/data/user_drawing_check.jpg")


if __name__ == "__main__":
    main(sys.argv[1:])
