"""Fit Leonov's "Sunrise" drawing (1965) as data for the film's own pencil redraw.

    python3 tools/fit_leonov_drawing.py [--debug=DIR]

Reads the museum photo media/refs/leonov_drawing_real_photo.jpg (local only, never committed: the drawing and the photo are
under copyright, docs/RESEARCH_R4.md §3) and writes video/data/leonov_drawing.json: no pixels of the photo, only fitted
parameters that video/src/shots2.js (drawLeonovCard) turns into generated pencil strokes:

  card     the card's aspect, its off-white tone, and the photo -> card affine (used only by the licensed ?drawing=photo mode)
  pencils  one entry per pencil he used (black, light blue, yellow, orange-red, blue): the colour it leaves at full
           pressure (as a transmittance over the card, multiplied onto it), and its coverage ("pressure") on a coarse grid
           of 5x5 card units (the card is 1000 units wide), in the order he laid the bands
  orient   the stroke direction on the same grid (structure tensor of the pigment, sigma 10 units), 0..255 -> 0..pi
  sun      the red-orange disc: centre and radius in card units
  arcs     a circle fitted to each band (centre, radius, width): the curvature of the limb, for reference

How: the card is rectified from its four corners (perspective) to 1000 x 700 units; the illumination is flattened with a
quadratic fit to the bare card; each pixel's pigment is its absorbance -log(R / card); the absorbance direction picks the
pencil (k-means on unit vectors: the pencils differ in hue) and its length / the pencil's 92nd percentile is the pressure.
"""
import base64, json, pathlib, sys
import numpy as np, cv2
from sklearn.cluster import KMeans

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "media" / "refs" / "leonov_drawing_real_photo.jpg"
OUT = ROOT / "video" / "data" / "leonov_drawing.json"
DEBUG = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--debug=")), None)

# the card's corners in the 930x558 photo (TL, TR, BR, BL; BL is hidden by the pencil box and extrapolated from the edges)
CORNERS = np.float32([[262, 68], [716, 51], [729, 368], [262, 385]])
CW, CH = 1000, 700                       # card units (the card is about 1.43 : 1, close to A6)
CELL = 5                                 # grid cell, card units
GX0, GY0, GX1, GY1 = 40, 10, 840, 590    # analysed region (excludes the pencil box, the string and a speck of dirt)
PHOTO_CROP_V = .80                       # photo mode shows the card down to here: below it the pencil box covers it

im = cv2.imread(str(SRC))
if im is None:
    sys.exit(f"missing {SRC} (the museum photo is local only)")
im = im[:, :, ::-1].astype(np.float32)
k = im.shape[1] / 930
src = CORNERS * k
M = cv2.getPerspectiveTransform(src, np.float32([[0, 0], [CW, 0], [CW, CH], [0, CH]]))
R = cv2.warpPerspective(im, M, (CW, CH), flags=cv2.INTER_CUBIC)

roi = np.zeros((CH, CW), bool); roi[GY0:GY1, GX0:GX1] = True
roi[520:, :95] = False                   # the string tied to the pencils
yy, xx = np.mgrid[0:CH, 0:CW] / 1000.
A0 = -np.log(np.clip(R, 1, 255) / np.array([172, 170, 157.]))
sel = (np.abs(A0).max(2) < .06) & roi
F = np.stack([np.ones(sel.sum()), xx[sel], yy[sel], xx[sel] ** 2, yy[sel] ** 2, xx[sel] * yy[sel]], 1)
illum = np.zeros_like(R)
for c in range(3):
    co, *_ = np.linalg.lstsq(F, R[..., c][sel], rcond=None)
    illum[..., c] = co[0] + co[1] * xx + co[2] * yy + co[3] * xx ** 2 + co[4] * yy ** 2 + co[5] * xx * yy
card_rgb = np.median(illum[roi], 0)
A = -np.log(np.clip(R, 1, 255) / illum)
mag = np.linalg.norm(A, axis=2)
pig = (mag > .12) & roi
# drop isolated specks: keep pigment that belongs to the drawing's mass
mass = cv2.GaussianBlur(pig.astype(np.float32), (0, 0), 9) > .18
pig &= mass

dirs = A[pig] / mag[pig][:, None]
km = KMeans(5, n_init=8, random_state=0).fit(dirs)
lbl = np.full((CH, CW), -1); lbl[pig] = km.labels_

# name the clusters by their absorbance direction (R, G, B absorbed)
def name_of(c):
    r, g, b = c
    if b > .85: return "yellow"
    if b > .65 and r < .35: return "orange_red"
    if min(r, g, b) > .45: return "black"
    if b < .12: return "light_blue"
    return "blue"
names = [name_of(c) for c in km.cluster_centers_]
assert len(set(names)) == 5, names
ORDER = ["black", "light_blue", "yellow", "orange_red", "blue"]     # the bands from the top (space) down to the Earth

ys0, xs0 = GY0 // CELL * CELL, GX0 // CELL * CELL
nx, ny = (GX1 - xs0 + CELL - 1) // CELL, (GY1 - ys0 + CELL - 1) // CELL
def grid(a):  # mean over each cell
    sub = np.zeros((ny * CELL, nx * CELL), np.float32)
    h, w = min(CH - ys0, ny * CELL), min(CW - xs0, nx * CELL)
    sub[:h, :w] = a[ys0:ys0 + h, xs0:xs0 + w]
    return sub.reshape(ny, CELL, nx, CELL).mean((1, 3))
b64 = lambda a8: base64.b64encode(np.clip(np.round(a8), 0, 255).astype(np.uint8).tobytes()).decode()

def circle_fit(x, y, w):  # weighted Kasa fit
    Am = np.stack([x, y, np.ones_like(x)], 1) * np.sqrt(w)[:, None]
    bm = (x * x + y * y) * np.sqrt(w)
    (a, b, c), *_ = np.linalg.lstsq(Am, bm, rcond=None)
    cx, cy = a / 2, b / 2
    return cx, cy, np.sqrt(c + cx * cx + cy * cy)

pencils, arcs = [], {}
for nm in ORDER:
    i = names.index(nm); m = lbl == i
    full = np.percentile(mag[m], 92)
    strong = m & (mag > np.percentile(mag[m], 80)) & (mag < np.percentile(mag[m], 99))
    T = np.median((R / illum)[strong], 0).clip(0, 1)                 # what one full-pressure layer lets through
    cov = grid(np.where(m, np.clip(mag / full, 0, 1.25) / 1.25, 0))
    ys, xs = np.where(m)
    # the band's ridge: its weighted centre line, column by column (10-unit columns), then a circle through it
    wm = np.where(m, mag, 0); rx, ry, rw, sd = [], [], [], []
    for x0 in range(GX0, GX1, 10):
        col = wm[:, x0:x0 + 10]; w = col.sum()
        if w < 40: continue
        yv = (col.sum(1) * np.arange(CH)).sum() / w
        rx.append(x0 + 5); ry.append(yv); rw.append(w); sd.append(np.sqrt((col.sum(1) * (np.arange(CH) - yv) ** 2).sum() / w))
    cx, cy, rr = circle_fit(np.array(rx, float), np.array(ry, float), np.array(rw, float))
    arcs[nm] = dict(cx=round(cx, 1), cy=round(cy, 1), r=round(rr, 1), width=round(float(np.average(sd, weights=rw) * 2.35), 1),
                    span_x=[int(np.percentile(xs, 2)), int(np.percentile(xs, 98))])
    pencils.append(dict(name=nm, T=[round(float(v), 4) for v in T], pressure=round(float(full), 3),
                        share=round(float(m.sum() / pig.sum()), 3), cov=b64(cov * 255)))
    print(f"{nm:11s} T={np.round(T, 3)} full |A|={full:.2f} px={m.sum():6d} arc r={rr:7.1f} c=({cx:6.1f},{cy:6.1f}) width={arcs[nm]['width']}")

# stroke direction: structure tensor of the total absorbance, perpendicular to its gradient
g = A.sum(2).astype(np.float32)
gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
J = [cv2.GaussianBlur(v, (0, 0), 10) for v in (gx * gx, gy * gy, gx * gy)]
J = [grid(v) for v in J]
ang = (0.5 * np.arctan2(2 * J[2], J[0] - J[1]) + np.pi / 2) % np.pi
coh = np.sqrt((J[0] - J[1]) ** 2 + 4 * J[2] ** 2) / (J[0] + J[1] + 1e-6)

# the sun: the red family's dense blob
red = (lbl == names.index("orange_red")) & (mag > .5)
red = cv2.morphologyEx(red.astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
n, cc, st, cen = cv2.connectedComponentsWithStats(red)
j = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
blob = cc == j
sy, sx = np.where(blob)
sun = dict(cx=round(float(sx.mean()), 1), cy=round(float(sy.mean()), 1), r=round(float(np.sqrt(blob.sum() / np.pi)) * 1.08, 1))
print("sun", sun)

# photo -> card (affine, least squares through the four corners), for the licensed photo mode
P4 = np.hstack([CORNERS, np.ones((4, 1), np.float32)])
D4 = np.float32([[0, 0], [CW, 0], [CW, CH], [0, CH]])
aff, *_ = np.linalg.lstsq(P4, D4, rcond=None)                        # [x y 1] @ aff -> card units

data = dict(
    note="Fitted from a photo of A. Leonov's 'Sunrise' (1965) by tools/fit_leonov_drawing.py. Parameters only; the film draws its own strokes.",
    card=dict(w=CW, h=CH, rgb=[round(float(v), 1) for v in card_rgb], photo="leonov_drawing_real_photo.jpg", photo_w=930,
              photo_to_card=[round(float(v), 5) for v in aff.T.ravel()], photo_crop_v=PHOTO_CROP_V),
    grid=dict(x0=xs0, y0=ys0, cell=CELL, nx=nx, ny=ny),
    pencils=pencils,
    orient=dict(ang=b64(ang / np.pi * 255), coh=b64(np.clip(coh, 0, 1) * 255)),
    sun=sun, arcs=arcs)
OUT.write_text(json.dumps(data, separators=(",", ":")))
print("wrote", OUT, f"{OUT.stat().st_size / 1024:.0f} KB", f"grid {nx}x{ny}")

if DEBUG:
    dd = pathlib.Path(DEBUG); dd.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(dd / "ld_rect.png"), R[:, :, ::-1].clip(0, 255).astype(np.uint8))
    # re-synthesis from the fitted grids only (no strokes): what the data says
    syn = np.ones((ny, nx, 3), np.float32)
    for p in pencils:
        c = np.frombuffer(base64.b64decode(p["cov"]), np.uint8).reshape(ny, nx) / 255 * 1.25
        syn *= np.power(np.array(p["T"])[None, None], c[..., None])
    cv2.imwrite(str(dd / "ld_grid_synth.png"), cv2.resize((syn * card_rgb)[:, :, ::-1].clip(0, 255).astype(np.uint8), (nx * 4, ny * 4), interpolation=cv2.INTER_NEAREST))
