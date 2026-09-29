"""Jade as the kept drawings themselves: the approved trace figures laid on the film's Snow paper, never redrawn or cut out.

    python3 tools/jade_keep.py [out_dir]       framing mockups -> <out_dir>/keep_*.jpg (default media/refs)

The drawing's own paper is divided out (paper -> white) and the graphite is multiplied onto Snow paper, so the pencil lines
sit on the film's sheet with no matte edge. Nothing about her face, head size or perspective is touched: only scale, crop
and placement in the 16:9 frame.
"""
import sys, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "media" / "chars" / "jade_src"
FONT = ROOT / "video" / "fonts" / "InstrumentSerif_italic_400.ttf"
W, H = 1920, 1080
SNOW, SNOW_EDGE = np.array([243, 239, 230.]), np.array([230, 223, 210.])   # docs/STYLE_BIBLE.md, Snow paper
CRIMSON = (168, 18, 42)


def snow_paper():
    y, x = np.mgrid[0:H, 0:W]
    r = np.clip(np.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2)) / 1.25, 0, 1) ** 2   # vignette
    img = SNOW * (1 - r[..., None]) + SNOW_EDGE * r[..., None]
    img += np.random.default_rng(7).normal(0, 2.2, (H, W, 1))                               # cotton tooth
    return img


def graphite(name):
    """The drawing as a multiply layer: its paper colour (median of the plain top band) divided out."""
    a = np.asarray(Image.open(SRC / f"{name}.jpg").convert("RGB"), float)
    paper = np.median(a[:300].reshape(-1, 3), axis=0)
    return np.clip(a / paper, 0, 1)


def place(sheet, layer, scale, x, y, fade_left=0.0):
    """Multiply `layer` (scaled) onto `sheet` at (x, y); crops to the frame. fade_left: soften a cut sleeve edge."""
    h, w = layer.shape[:2]
    im = Image.fromarray((layer * 255).astype(np.uint8)).resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    L = np.asarray(im, float) / 255
    h, w = L.shape[:2]
    if fade_left:
        ramp = np.clip(np.arange(w) / (fade_left * w), 0, 1) ** 1.5
        L = 1 - (1 - L) * ramp[None, :, None]
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, W), min(y + h, H)
    sheet[y0:y1, x0:x1] *= L[y0 - y:y1 - y, x0 - x:x1 - x]
    return sheet


def backdrop(path, cx=.755, cy=.42, rx=.2, ry=.66, soft=.16, strength=.9):
    """A pencil landscape (drawn on its own paper) as a multiply layer on the sheet, with a soft clearing around her so no
    line of it runs over her face, hair or jacket: like a sketchbook page where the drawing thins out round the figure."""
    a = np.asarray(Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS), float)
    paper = np.percentile(a.reshape(-1, 3), 90, axis=0)
    L = np.clip(a / paper, 0, 1)
    y, x = np.mgrid[0:H, 0:W]
    d = np.hypot((x / W - cx) / rx, (y / H - cy) / ry)
    m = np.clip((d - 1) / soft, 0, 1)[..., None] * strength
    return 1 - (1 - L) * m


def lyric(img, text="bring me home", size=124, x=110, y=H - 140):
    d = ImageDraw.Draw(img)
    d.text((x, y), text, font=ImageFont.truetype(str(FONT), size), fill=CRIMSON, anchor="ls")
    return img


def save(sheet, out, text=True):
    img = Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8))
    if text:
        lyric(img)
    img.save(out, quality=90)
    print(out)


def main(out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    fig = graphite("jade_trace_jacket_hp_1")                        # 1792x2400; head top ~470, chin ~1330
    # A · on the page: chest-up, right of centre, open paper to her left for the lyric
    s = H / (2400 - 380)
    save(place(snow_paper(), fig, s, W - round(1792 * s) - 150, round(-380 * s), fade_left=.18), out_dir / "keep_a_page.jpg")
    # B · centred medium shot: top of head to mid-chest, like a frame of her own phone video
    s = H / (1900 - 380)
    save(place(snow_paper(), fig, s, (W - round(1792 * s)) // 2, round(-380 * s), fade_left=.12), out_dir / "keep_b_centre.jpg")


if __name__ == "__main__":
    main(pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "media" / "refs")


def video_on_paper(src, out, audio_from=None, lag=0.0, size=(1280, 720), text=True, bg=None):
    """A pencil-on-paper take (any aspect) laid on Snow paper like framing A, with the song from `audio_from` shifted by `lag`
    (song time = 30.9 + lag + clip time; 30.9 s is where media/audio_refs/jade_hook1.mp3 starts in the song)."""
    import subprocess, cv2
    cap = cv2.VideoCapture(str(src))
    fs = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        fs.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB).astype(float))
    paper = np.median(np.concatenate([f[:20].reshape(-1, 3) for f in fs[::12]]), axis=0)
    base = snow_paper()
    if bg is not None:
        base = base * backdrop(bg)
    h, w = fs[0].shape[:2]
    s = H / h
    x = W - round(w * s) - 150
    lyr = Image.new("RGBA", (W, H))
    if text:
        lyric(lyr)
    lyr = np.asarray(lyr, float) / 255
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-"]
    if audio_from:
        cmd += ["-ss", f"{30.9 + lag:.3f}", "-t", f"{len(fs) / 24:.3f}", "-i", str(audio_from), "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "128k", "-shortest"]
    cmd += ["-vf", f"scale={size[0]}:{size[1]}", "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in fs:
        sheet = place(base.copy(), np.clip(f / paper, 0, 1), s, x, 0, fade_left=.15)
        sheet = sheet * (1 - lyr[..., 3:]) + lyr[..., :3] * 255 * lyr[..., 3:]
        p.stdin.write(np.clip(sheet, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    print(out)
