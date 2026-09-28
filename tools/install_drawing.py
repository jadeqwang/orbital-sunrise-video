"""Install Leonov's real "Orbital Sunrise" drawing as the 1-frame plate `leonov_drawing`.

    python3 tools/install_drawing.py

Source: media/refs/leonov_drawing_real_photo.jpg, a museum press photo of the original drawing with his pencils
(not committed; put it there to rebuild). The card is cropped, white-balanced so the bare card reads as paper white,
and centred on a 960x540 paper-coloured frame. Then the plate's matte and meta are rebuilt.
"""
import pathlib, subprocess, sys
import numpy as np
from PIL import Image, ImageStat

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "media" / "refs" / "leonov_drawing_real_photo.jpg"
OUT = ROOT / "video" / "plates" / "leonov_drawing"
CARD = (276, 72, 714, 338)        # inside the card edges, in the 930x558 photo
BARE = (320, 190, 430, 260)       # a patch of bare card (relative to CARD) used for white balance
PAPER = np.array([246, 242, 232], dtype=np.float32)
W, H = 960, 540

im = Image.open(SRC).convert("RGB")
card = im.crop(CARD)
med = np.array(ImageStat.Stat(card.crop(BARE)).median, dtype=np.float32)
card = Image.fromarray(np.clip(np.asarray(card, dtype=np.float32) * (PAPER / med), 0, 255).astype(np.uint8))
s = min(W / card.width, H / card.height) * 0.98
card = card.resize((round(card.width * s), round(card.height * s)), Image.LANCZOS)
frame = Image.new("RGB", (W, H), tuple(int(x) for x in PAPER))
frame.paste(card, ((W - card.width) // 2, (H - card.height) // 2))
OUT.mkdir(parents=True, exist_ok=True)
for m in OUT.glob("m*.png"):
    m.unlink()
frame.save(OUT / "f0001.jpg", quality=95)
frame.save(ROOT / "media" / "refs" / "leonov_drawing_real_card.jpg", quality=95)
for tool in ("plate_masks.py", "plate_meta.py"):
    subprocess.run([sys.executable, str(ROOT / "tools" / tool), "leonov_drawing"] + (["--force"] if tool == "plate_meta.py" else []), check=True)
print("installed", OUT / "f0001.jpg")
