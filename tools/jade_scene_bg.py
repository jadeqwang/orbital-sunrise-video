"""Scenes for Jade: her fixed figure (the approved base trace with the jacket) composited over backgrounds drawn for it.

    python3 tools/jade_scene_bg.py gen [scene ...]     backgrounds (+ the headphones-on-head figure for the studio)
    python3 tools/jade_scene_bg.py comp                 composites -> media/refs/jade_sc_<scene>_<i>.png

Her figure is never redrawn: the model draws only empty backgrounds (pencil on cream paper, room for her right of centre at
head height), and her figure is cut out (rembg) and laid over them. For the studio her headphones go on her head, which
the model draws onto the figure, and then her traced face is pasted back (tools/jade_head_lock.py).
"""
import sys, pathlib, concurrent.futures as cf
import numpy as np
from PIL import Image, ImageFilter
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import cfai
REF = ROOT / "media" / "refs"
CW, CH = 2752, 1536
FIG_NECK = REF / "jade_bj_hp_1_hl.png"          # jacket + headphones round her neck
FIG_PLAIN = REF / "jade_bj_plain_1_hl.png"      # jacket only (for the studio edit)

STYLE = ("A hand-drawn pencil drawing on plain cream drawing paper, landscape: fine controlled graphite lines, drawn loosely and lightly, with soft touches of "
         "coloured pencil for the light. No people, no figures, no text, no border or frame; the drawing fills the whole picture. ")
ROOM = ("Seen from standing eye height. Keep the area right of centre, from the middle of the picture upward, open and quiet (sky or soft distance), "
        "because a person will stand there, cut off at the bottom edge. ")
SCENES = {
    "hook1": dict(fig="neck", prompt=STYLE + "Austin, Texas at golden hour: the view from the Pennybacker Bridge overlook on Loop 360: the rust-coloured steel arch "
                  "of the Pennybacker Bridge spanning Lake Austin below, limestone bluffs and cedar-covered Hill Country hills, the low sun warm and gold. " + ROOM),
    "brk": dict(fig="neck", prompt=STYLE + "Austin, Texas at dusk: a deep red and orange sky over Lady Bird Lake with the downtown Austin skyline and the Congress "
                "Avenue Bridge, the red light reflected in the water; the sky in rich red-orange coloured pencil. " + ROOM, wash=.22),
    "studio": dict(fig="head", prompt=STYLE + "The inside of a small recording studio at night: acoustic foam panels on the walls, a warm lamp, a mixing desk edge, and "
                   "a large-diaphragm condenser microphone with a pop filter on a stand at the left third of the picture at chest height. Warm lamp light in soft "
                   "coloured pencil. " + ROOM),
}


def gen_bg(scene, i):
    inp = {"prompt": SCENES[scene]["prompt"], "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    return cfai.gen("google/nano-banana-pro", inp, str(REF / f"jade_bg_{scene}_{i}.png"), tag="scenebg")[0][0]


def gen_head_fig():
    """The plain-jacket figure with her pink headphones on her head; her traced face goes back on afterwards."""
    import jade_head_lock as J
    inp = {"prompt": "Edit image 1, a graphite pencil drawing on plain cream paper, keeping it exactly the same drawing, technique, framing and size. Keep her face, "
                     "glasses, hair, pose, jacket and body exactly as drawn. Change only: put the pale dusty-pink over-ear headphones from the right of image 2 on her "
                     "head, the band over the top of her head and the cups over her ears, sitting on her hair. Exactly one pair of headphones. Keep the plain paper "
                     "background. No text.",
           "image_input": [cfai.data_uri(str(FIG_PLAIN)), cfai.data_uri(str(REF / "jade_outfit_hp.jpg"))],
           "aspect_ratio": "3:4", "output_format": "png", "image_size": "2K"}
    p = cfai.gen("google/nano-banana-pro", inp, str(REF / "jade_fig_head.png"), tag="scenebg")[0][0]
    out = J.paste_onto(pathlib.Path(p), "face")
    (out or Image.open(p)).save(REF / "jade_fig_head_hl.png")


def cutout(fig):
    from rembg import remove, new_session
    mp = fig.with_name(fig.stem + "_matte.png")
    if not mp.exists():
        remove(Image.open(fig).convert("RGB"), session=new_session("isnet-general-use"), only_mask=True).save(mp)
    f = Image.open(fig).convert("RGB")
    m = np.asarray(Image.open(mp).convert("L").resize(f.size), dtype=np.float32) / 255
    # her pale forehead and cheeks read as paper to rembg: fill her traced face outline solid (her dark hair it finds), and any holes
    import jade_head_lock as J
    from PIL import ImageDraw
    from scipy import ndimage
    k = f.width / 900
    hm = Image.new("L", f.size, 0); ImageDraw.Draw(hm).polygon([(x * k, y * k) for x, y in J.FACE], fill=255)
    hm = hm.filter(ImageFilter.MinFilter(int(9 * k) | 1))
    m = np.maximum(m, np.asarray(hm.filter(ImageFilter.GaussianBlur(6 * k)), dtype=np.float32) / 255)
    m = np.maximum(m, ndimage.binary_fill_holes(m > .5).astype(np.float32))
    # the drawing ends at her reaching arm on the left: let the arm trail off into the paper like a sketch
    x = np.arange(f.width, dtype=np.float32) / f.width
    m *= np.clip((x - .02) / .2, 0, 1)[None, :] ** 1.5
    return f, Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8))


def comp(scene, i, frac=.92, cx=.66):
    fig = FIG_NECK if SCENES[scene]["fig"] == "neck" else REF / "jade_fig_head_hl.png"
    f, m = cutout(fig)
    bg = Image.open(REF / f"jade_bg_{scene}_{i}.png").convert("RGB").resize((CW, CH), Image.LANCZOS)
    h = round(CH * frac); w = round(f.width * h / f.height)
    f = f.resize((w, h), Image.LANCZOS); m = m.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
    # her paper is a touch different from the background's: match the paper white so the cut-out sits on the same sheet
    F = np.asarray(f, dtype=np.float32); B = np.asarray(bg, dtype=np.float32)
    F *= np.percentile(B.reshape(-1, 3), 98, axis=0) / np.maximum(np.percentile(F.reshape(-1, 3), 98, axis=0), 1)
    # a faint wash of the scene's own light over her, so she sits in it: the background's mean colour relative to paper white
    tint = B.reshape(-1, 3).mean(0); tint = tint / tint.max()
    F *= 1 - SCENES[scene].get("wash", .1) + SCENES[scene].get("wash", .1) * tint
    f = Image.fromarray(np.clip(F, 0, 255).astype(np.uint8))
    bg.paste(f, (round(CW * cx - w / 2), CH - h), m)
    bg.save(REF / f"jade_sc_{scene}_{i}.png")


if __name__ == "__main__":
    cmd, *scenes = sys.argv[1:] or ["comp"]
    scenes = scenes or list(SCENES)
    if cmd == "gen":
        with cf.ThreadPoolExecutor(8) as ex:
            futs = [ex.submit(gen_bg, s, i) for s in scenes for i in (1, 2)]
            if "studio" in scenes:
                futs.append(ex.submit(gen_head_fig))
            for f in futs:
                f.result()
    for s in scenes:
        for i in (1, 2):
            if (REF / f"jade_bg_{s}_{i}.png").exists():
                comp(s, i)
