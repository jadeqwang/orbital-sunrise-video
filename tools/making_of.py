"""Making-of strip: the Seedance reference plate (as the renderer placed it) next to the drawn frame.

    cd video && node render.mjs --source=17,27,63,123,202,210 --out=out/source
    python3 tools/making_of.py video/out/source docs/making_of.jpg

Rows are "plate | drawn" pairs, labelled. The plates are analysis input only; they never appear in the film.
"""
import sys, json, pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "video" / "out" / "source")
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "docs" / "making_of.jpg")
info = json.loads((src / "plates.json").read_text())
try:
    font = ImageFont.truetype(str(ROOT / "video" / "fonts" / "JetBrainsMono_normal_700.ttf"), 20)
except Exception:
    font = ImageFont.load_default()

w, h, pad, lab = 800, 450, 12, 34
tags = sorted(info, key=lambda s: float(s[1:].replace("_", ".")))
S = Image.new("RGB", (2 * w + 3 * pad, len(tags) * (h + lab + pad) + pad), (24, 23, 28))
d = ImageDraw.Draw(S)
for r, tag in enumerate(tags):
    y = pad + r * (h + lab + pad)
    t = float(tag[1:].replace("_", "."))
    plates = ", ".join(sorted({p[0] for p in info[tag]}))
    for c, kind in enumerate(("plate", "drawn")):
        x = pad + c * (w + pad)
        S.paste(Image.open(src / f"{tag}_{kind}.jpg").convert("RGB").resize((w, h), Image.LANCZOS), (x, y + lab))
        label = f"{t:6.2f}s  reference plate: {plates}" if kind == "plate" else f"{t:6.2f}s  what the film shows"
        d.text((x + 2, y + 6), label, fill=(225, 222, 214), font=font)
S.save(out, quality=86, optimize=True)
print(out, S.size)
