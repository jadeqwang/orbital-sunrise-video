"""Round 5: plates without the AI's tether, for the procedural constant-length cable (video/src/tether.js).

The generated takes never keep the cable's length (take 2 of tether_drift stretches it ~40 % between 0.25 s and the snap;
the countdown_drift / hero_sunrise "hose" is a stiff hoop with a free end). So the cable is simulated and drawn by the
renderer, and these plates have the generated one taken out:

    python3 tools/tether_r5.py n1     # tether_drift_t2 → tether_drift_r5 (+ video/data/tether_n1.json)
    python3 tools/tether_r5.py i6     # countdown_drift_t3 → countdown_drift_r5, hero_sunrise → hero_sunrise_r5 (+ tether_i6.json)
    python3 tools/tether_r5.py h1c    # round 7: tracks for ship_wide_close (no tether generated) → tether_h1c.json

n1: the line is cut out of every frame (its own matte pixels + the round-4 track, filled from a masked temporal median
of the static shot) and so is he; he is pasted back moved along the hatch→him direction so that his distance from the
hatch is one constant cable length L at the snap (5.0 s) and at 6.71 s (her "fully taut around 20.30 s"), and well
inside it before: the same drift (a coast at constant speed), but from 0.42 L, so the rest of the cable is slack.
After the snap he is held at L (the tug), rebounds to ≈0.93 L where the take rebounds, and is taut again by ≈6.4 s.
tether_n1.json: per plate frame, the hatch point and his waist point (plate px at 960x540) and L.

i6: the hoop (the thin parts of his matte outside his body, left of his torso) is painted out (masked temporal median,
then Telea for what never shows) and removed from the mattes; tether_i6.json: per plate frame his hip point (where the
cable attaches, his right hip, the side toward the ship) and the anchor on the ship's hull (tracked by template).
Originals stay untouched; the new plates are their own ids in video/plates/index.json (frames are not in git: rerun this).
"""
import sys, json, pathlib, shutil
import numpy as np, cv2

ROOT = pathlib.Path(__file__).resolve().parent.parent
PL = ROOT / "video" / "plates"
DATA = ROOT / "video" / "data"
WD, HT = 960, 540


def frames(pid):
    return sorted((PL / pid).glob("f*.jpg"))


def matte(pid, f, n):
    """matte of 1-based frame f at 960x540 float (odd frames only exist: even = mean of neighbours)"""
    def one(k):
        k = min(max(k, 1), n if n % 2 else n - 1)
        m = cv2.imread(str(PL / pid / f"m{k:04d}.png"), 0)
        return cv2.resize(m, (WD, HT), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
    return one(f) if f % 2 else (one(f - 1) + one(f + 1)) / 2


def install(src, dst, n, note):
    idx_p = PL / "index.json"
    idx = json.loads(idx_p.read_text())
    e = dict(idx[src]); e["n"] = n; e["take"] = note
    idx[dst] = e
    idx_p.write_text(json.dumps(idx, indent=1))
    for fn in ("meta.json", "stats.json"):
        if (PL / src / fn).exists():
            m = json.loads((PL / src / fn).read_text())
            if fn == "meta.json":
                m = m[:n]
            (PL / dst / fn).write_text(json.dumps(m, separators=(",", ":")))
    (PL / dst / ".take").write_text(f"tools/tether_r5.py from {src}")


def masked_median(stack, cover, step=1):
    """per-pixel median over frames where the pixel is not covered; NaN where it is always covered"""
    S = stack[::step].astype(np.float32)
    C = cover[::step]
    S[C] = np.nan
    return np.nanmedian(S, axis=0)


def smooth1(a, r, breaks=()):
    """±r moving average along axis 0, not across the indices in breaks (segment starts)"""
    out = a.copy()
    edges = [0, *breaks, len(a)]
    for s, e in zip(edges[:-1], edges[1:]):
        for i in range(s, e):
            out[i] = a[max(s, i - r):min(e, i + r + 1)].mean(axis=0)
    return out


# ------------------------------------------------------------------------------------------------ N1 (tether_drift_t2)
def n1():
    src, dst = "tether_drift_t2", "tether_drift_r5"
    fs = frames(src); n = len(fs)
    imgs = np.stack([cv2.imread(str(p)) for p in fs])
    HATCH = np.array([0.4815 * WD, 0.2815 * HT])
    ker = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    body, line, cen = [], [], []
    for f in range(1, n + 1):
        M = matte(src, f, n)
        b = (M > .5).astype(np.uint8)
        o = cv2.morphologyEx(b, cv2.MORPH_OPEN, ker(3))
        k_, lab, st, c = cv2.connectedComponentsWithStats(o)
        ks = [k for k in range(1, k_) if c[k][1] > .42 * HT and st[k][4] > 80]
        k = max(ks, key=lambda k: st[k][4])
        bm = cv2.dilate((lab == k).astype(np.uint8), ker(2))
        B = M * bm                                           # his soft matte
        body.append(B)
        # the line: thin matte parts below the ship's hatch, plus a thin bright ridge anywhere in the corridor
        thin = ((M > .12).astype(np.uint8) - o * 0).astype(bool) & ~bm.astype(bool)
        thin[: int(HATCH[1]) - 2] = False
        line.append(thin)
        ys, xs = np.nonzero(B > .5)
        cen.append([xs.mean(), ys.mean()])
    cen = np.array(cen)
    # the corridor where the plate's line can be (hatch → him, any frame), for a ridge detector
    cover = np.zeros((n, HT, WD), bool)
    for i in range(n):
        gi = cv2.cvtColor(imgs[i], cv2.COLOR_BGR2GRAY).astype(np.float32)
        ridge = gi - cv2.GaussianBlur(gi, (0, 0), 3)        # thin bright line
        cor = np.zeros((HT, WD), np.uint8)
        top = (int(HATCH[0]), int(HATCH[1]))
        cv2.line(cor, top, (int(cen[i][0]), int(cen[i][1])), 1, 1)
        cor = cv2.dilate(cor, ker(26)).astype(bool)
        cor[: int(HATCH[1]) + 1] = False
        lm = (line[i] | ((ridge > 6) & cor)) & cor
        cover[i] = cv2.dilate((lm | (body[i] > .05)).astype(np.uint8), ker(4)).astype(bool)
    bg = masked_median(imgs, cover)
    holes = np.isnan(bg[..., 0])
    bg = np.nan_to_num(bg).astype(np.uint8)
    if holes.any():
        bg = cv2.inpaint(bg, holes.astype(np.uint8), 5, cv2.INPAINT_TELEA)
    print(f"background: {holes.sum()} px never uncovered (inpainted)")

    # his distance from the hatch, the round-5 remap
    r = np.hypot(*(cen - HATCH).T)
    SNAP = 120                                               # 0-based frame of 5.0 s
    r = smooth1(r[:, None], 2, breaks=(SNAP + 1,))[:, 0]
    tp = np.arange(n) / 24
    L = float(np.interp(6.71, tp, r))
    r0f, r1f = np.interp(0.25, tp, r), r[SNAP]
    R0 = 0.42 * L
    rn = np.empty(n)
    pre = np.arange(n) <= SNAP
    rn[pre] = R0 + (L - R0) * (r[pre] - r0f) / (r1f - r0f)
    rn[~pre] = np.minimum(L, L - 0.6 * (L - r[~pre]))
    scale = rn / r
    newc = HATCH + (cen - HATCH) * scale[:, None]
    d = newc - cen
    print(f"L = {L:.1f} px; r 0.25 s {np.interp(.25, tp, rn):.1f}, snap {rn[SNAP]:.1f}, min after {rn[SNAP+1:].min():.1f} at {tp[SNAP+1+rn[SNAP+1:].argmin()]:.2f} s")

    out = PL / dst
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    rec = []
    for i in range(n):
        f = i + 1
        im = imgs[i].copy()
        im[cover[i]] = bg[cover[i]]
        A = np.float32([[1, 0, d[i][0]], [0, 1, d[i][1]]])
        Bm = cv2.warpAffine(body[i], A, (WD, HT), flags=cv2.INTER_LINEAR)
        Bi = cv2.warpAffine(imgs[i], A, (WD, HT), flags=cv2.INTER_LINEAR)
        a = Bm[..., None]
        im = (Bi * a + im * (1 - a)).astype(np.uint8)
        cv2.imwrite(str(out / f"f{f:04d}.jpg"), im, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if f % 2:
            M = matte(src, f, n)
            ship = M.copy(); ship[int(HATCH[1]) + 2:] = 0       # the ship only (the line and he are below the hatch)
            Mn = np.maximum(ship, Bm)
            cv2.imwrite(str(out / f"m{f:04d}.png"), cv2.resize((Mn * 255).astype(np.uint8), (512, 288), interpolation=cv2.INTER_AREA))
        # his waist: the body centroid, nudged toward the hatch (the line meets him at the waist, ship side)
        u = (HATCH - newc[i]); u /= np.linalg.norm(u)
        w = newc[i] + u * 4
        rec.append([round(float(w[0]), 2), round(float(w[1]), 2)])
    install(src, dst, n, f"{src} without its tether, him moved to a constant-length cable (tools/tether_r5.py n1)")
    (DATA / "tether_n1.json").write_text(json.dumps({
        "plate": dst, "w": WD, "h": HT, "fps": 24, "hatch": [round(float(HATCH[0]), 2), round(float(HATCH[1]), 2)],
        "L": round(L - 4, 2), "snap": 5.0, "waist": rec,
        "note": "plate px at 960x540, one waist point per plate frame; L = cable length hatch→waist (tools/tether_r5.py n1)"},
        separators=(",", ":")))
    print(f"wrote {out} ({n} frames), {DATA / 'tether_n1.json'}")


# ------------------------------------------------------------------------------------------------ I6 (the hoop)
def hoop_mask(im, M):
    """the generated hose: thin parts of his matte plus bright, unsaturated pixels grown from them through the dark sky,
    left of his body (never his body core, the limb's blue/orange band or the ship)"""
    ker = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    b = (M > .5).astype(np.uint8)
    core = cv2.morphologyEx(b, cv2.MORPH_OPEN, ker(11))
    k_, lab, st, c = cv2.connectedComponentsWithStats(core)
    k = max(range(1, k_), key=lambda k: st[k][4] if c[k][0] < .62 * WD else 0)   # him, not the ship
    core = (lab == k).astype(np.uint8)
    ys, xs = np.nonzero(core); cx, cy = xs.mean(), ys.mean()
    corex = cv2.dilate(core, ker(3)).astype(bool)
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    V, S = hsv[..., 2].astype(int), hsv[..., 1].astype(int)
    B_, R_ = im[..., 0].astype(int), im[..., 2].astype(int)
    left = np.zeros_like(corex); left[: int(cy) + 5, : int(cx)] = True   # the hose loops up-left of his waist
    # the limb: its blue band (the biggest blue component), widened over its white and orange edges
    blue = ((B_ > R_ + 6) & (V > 40)).astype(np.uint8)
    k_, lab, st, _ = cv2.connectedComponentsWithStats(blue)
    limb = (lab == max(range(1, k_), key=lambda k: st[k][4])) if k_ > 1 else np.zeros_like(corex)
    limb = cv2.dilate(limb.astype(np.uint8), ker(9)).astype(bool)
    grow = (V > 28) & (S < 150) & (B_ <= R_ + 6) & ~corex & left & ~limb
    # keep the pieces that are big enough (the hose), not stray stars
    k_, lab, st, _ = cv2.connectedComponentsWithStats(grow.astype(np.uint8))
    keep = np.zeros_like(grow)
    for k in range(1, k_):
        if st[k][4] > 60:
            keep |= lab == k
    return keep, core


def i6():
    ker = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    tracks = {}
    ref = cv2.imread(str(PL / "countdown_drift_t3" / "f0081.jpg"))
    AX, AY = 736, 232                                        # the anchor on the hull (where the struts meet it), frame 81
    tpl = ref[AY - 40:AY + 40, AX - 50:AX + 30]
    HIP81 = None
    for src, dst, nmax in (("countdown_drift_t3", "countdown_drift_r5", None), ("hero_sunrise", "hero_sunrise_r5", 120)):
        fs = frames(src); n0 = len(fs); n = nmax or n0
        out = PL / dst
        if out.exists():
            shutil.rmtree(out)
        out.mkdir(parents=True)
        cen, anc = [], []
        for f in range(1, n + 1):
            im = cv2.imread(str(fs[f - 1]))
            M = matte(src, f, n0)
            hm, core = hoop_mask(im, M)
            fill = cv2.dilate(hm.astype(np.uint8), ker(3))
            im2 = cv2.inpaint(im, fill, 6, cv2.INPAINT_TELEA)
            cv2.imwrite(str(out / f"f{f:04d}.jpg"), im2, [cv2.IMWRITE_JPEG_QUALITY, 92])
            if f % 2:
                Mn = M * (1 - cv2.dilate(hm.astype(np.uint8), ker(2)))
                cv2.imwrite(str(out / f"m{f:04d}.png"), cv2.resize((Mn * 255).astype(np.uint8), (512, 288), interpolation=cv2.INTER_AREA))
            ys, xs = np.nonzero(core)
            cen.append([xs.mean(), ys.mean(), np.sqrt(len(xs))])
            r = cv2.matchTemplate(im[60:460, 520:960], tpl, cv2.TM_CCOEFF_NORMED)
            _, sc, _, (mx, my) = cv2.minMaxLoc(r)
            anc.append([520 + mx + 50, 60 + my + 40] if sc > .72 and mx + 50 < 440 - 30 else None)
        # the hull leaves the frame as hero_sunrise pushes in: from the last confident match on, the anchor keeps moving
        # as it was (its velocity over the last 8 good frames), off frame
        good = [i for i, a in enumerate(anc) if a is not None]
        g0 = good[-1]
        v = (np.array(anc[g0]) - np.array(anc[good[max(0, len(good) - 9)]])) / max(1, g0 - good[max(0, len(good) - 9)])
        for i in range(len(anc)):
            if anc[i] is None:
                prev = max([g for g in good if g < i], default=None)
                anc[i] = (np.array(anc[prev]) + v * (i - prev)).tolist() if prev is not None else anc[good[0]]
        if good[-1] < len(anc) - 1:
            print(f"{dst}: anchor matched to frame {g0 + 1}, extrapolated after")
        cen, anc = smooth1(np.array(cen), 2), smooth1(np.array(anc, float), 3)
        if HIP81 is None:
            HIP81 = (np.array([503, 300]) - cen[80, :2], cen[80, 2])   # his right hip (toward the ship), relative to his centroid
        hip = cen[:, :2] + HIP81[0] * (cen[:, 2:3] / HIP81[1])     # scaled with his size (the camera pushes in)
        # the camera's push-in (hero_sunrise moves in on him): his size relative to countdown frame 81, smoothed, so the
        # renderer can simulate the cable in fixed world units and magnify it with the plate
        zoom = smooth1(cen[:, 2:3] / HIP81[1], 6)[:, 0]
        tracks[dst] = {"hip": hip.round(2).tolist(), "anchor": anc.round(2).tolist(), "zoom": zoom.round(4).tolist()}
        install(src, dst, n, f"{src} without the generated hose (tools/tether_r5.py i6)")
        print(f"wrote {out} ({n} frames)")
    (DATA / "tether_i6.json").write_text(json.dumps({"w": WD, "h": HT, "fps": 24, **tracks,
        "note": "plate px at 960x540 per plate frame: his right hip (the cable's end) and the anchor on the hull (tools/tether_r5.py i6)"},
        separators=(",", ":")))


# ------------------------------------------------------------------------------------------------ H1c (round 7)
def h1c():
    """ship_wide_close (generated without a tether: him a couple of metres from the airlock, facing the sunrise): per plate
    frame his hip (the cable's end: his back-left hip, toward the ship) and the anchor at the airlock's mouth (the hatch
    lid; tracked by template, the camera is locked off), his height (for the collision depth), tether_h1c.json. Run after
    tools/extract_plates.py ship_wide_close:1 and tools/plate_masks.py ship_wide_close. If the take drew a line anyway,
    it is painted out like i6's hoop (thin matte parts between the ship and him)."""
    pid = "ship_wide_close"
    fs = frames(pid); n = len(fs)
    ker = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    im1 = cv2.imread(str(fs[0]))
    AX, AY = H1C_ANCHOR                                      # frame 1: the lower lip of the airlock's open mouth
    tpl = im1[AY - 24:AY + 16, AX - 30:AX + 20]
    prev, cen, anc, hgt = None, [], [], []
    for f in range(1, n + 1):
        im = cv2.imread(str(fs[f - 1]))
        M = matte(pid, f, n)
        b = cv2.morphologyEx((M > .5).astype(np.uint8), cv2.MORPH_OPEN, ker(1))
        k_, lab, st, c = cv2.connectedComponentsWithStats(b)
        cand = [k for k in range(1, k_) if st[k][4] > 150 and c[k][0] > AX + 8]   # him: right of the airlock (the ship is left)
        ref = prev if prev is not None else np.array(H1C_HIM)
        k = min(cand, key=lambda k: np.hypot(*(c[k] - ref)))
        ys, xs = np.nonzero(lab == k)
        prev = np.array([xs.mean(), ys.mean()])
        cen.append([xs.mean(), ys.mean(), np.sqrt(len(xs))]); hgt.append(float(ys.max() - ys.min()))
        r = cv2.matchTemplate(im[AY - 80:AY + 80, AX - 110:AX + 110], tpl, cv2.TM_CCOEFF_NORMED)
        _, sc, _, (mx, my) = cv2.minMaxLoc(r)
        anc.append([AX - 110 + mx + 30, AY - 80 + my + 24] if sc > .6 else None)
    good = [i for i, a in enumerate(anc) if a is not None]
    for i in range(n):
        if anc[i] is None:
            anc[i] = anc[min(good, key=lambda g: abs(g - i))]
    cen, anc = smooth1(np.array(cen), 2), smooth1(np.array(anc, float), 3)
    off = np.array(H1C_HIP) - cen[0, :2]
    hip = cen[:, :2] + off * (cen[:, 2:3] / cen[0, 2])
    (DATA / "tether_h1c.json").write_text(json.dumps({"plate": pid, "w": WD, "h": HT, "fps": 24,
        "hip": hip.round(2).tolist(), "anchor": anc.round(2).tolist(), "height": round(float(np.median(hgt)), 1),
        "note": "plate px at 960x540 per plate frame: his hip (the cable's end) and the airlock mouth (tools/tether_r5.py h1c)"},
        separators=(",", ":")))
    print(f"tether_h1c.json: {n} frames, anchor {anc[0].round(1)} (matched {len(good)}/{n}), hip {hip[0].round(1)} → {hip[-1].round(1)}, his height {np.median(hgt):.0f} px")


H1C_ANCHOR = (468, 137)     # plate px, frame 1: the bottom of the airlock's open mouth
H1C_HIM = (553, 210)        # his centroid, frame 1 (roughly; picks his matte component)
H1C_HIP = (546, 226)        # the cable's end on frame 1: his left hip, at his back (toward the ship)


if __name__ == "__main__":
    for a in sys.argv[1:]:
        {"n1": n1, "i6": i6, "h1c": h1c}[a]()
