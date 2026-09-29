"""Scenes where she is actually there: the image model redraws the whole scene around her as one drawing (light,
perspective, depth, how she stands in the place), then her traced head is pasted back so it cannot drift.

    python3 tools/jade_integrate.py [scene ...]   -> media/refs/jade_in_<scene>_<i>.png (+ _hl)

Inputs: the postcard composites (tools/jade_scene_bg.py) as a layout for the outdoor scenes; for the studio, her figure
with the headphones on her head. After the model's pass, tools/jade_head_lock.py pastes her traced head (hair and face;
the face only under headphones) back, aligned by the eyes and colour-matched to the model's lighting of her.
"""
import sys, pathlib, concurrent.futures as cf
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import cfai, jade_head_lock as J
REF = ROOT / "media" / "refs"

KEEP = ("Keep her exactly as she is in image 1: her face, glasses, eyebrows, head size and shape (a large, heart-shaped head with a tapering chin), hair "
        "(centre-parted, half up, wispy face-framing pieces), the jacket and headphones, her pose and body angle, and her size and place in the picture. "
        "Do not redraw, reshape, shrink, beautify or add makeup to her. ")
STYLE = "One single hand-drawn pencil drawing on cream paper, graphite with coloured pencil for the light; no border, no text."
JOBS = {
    "hook1": dict(src="jade_sc_hook1_1.png", mask="head", prompt=
        "Image 1 is a rough paste-up: a pencil drawing of a woman laid over a pencil drawing of the Pennybacker Bridge overlook in Austin at golden hour. Redraw it as "
        "if she were really standing there, holding her phone at arm's length for a selfie at the top of the overlook: the limestone ledge and cedar scrub at her feet "
        "and around her, the Pennybacker Bridge and Lake Austin below and behind her at their true distance, the camera's perspective consistent from her to the "
        "hills, the low sun behind her to one side putting a warm gold rim on her hair, shoulder and jacket, a breeze lifting a few strands. " + KEEP + STYLE),
    "brk": dict(src="jade_sc_brk_2.png", mask="head", prompt=
        "Image 1 is a rough paste-up: a pencil drawing of a woman laid over a pencil drawing of Lady Bird Lake in Austin at red dusk with the downtown skyline. Redraw it "
        "as if she were really standing there on the lakeside hike-and-bike trail at dusk, holding her phone at arm's length: the trail's railing and grass near her, "
        "the lake, the Congress Avenue Bridge and the skyline behind her at their true distance, one consistent perspective, the red-orange sky lighting her from "
        "behind and to one side with a warm red rim on her hair and shoulder, the cool dusk on the other side of her face. " + KEEP + STYLE),
    "studio": dict(src="jade_fig_head_hl.png", mask="face", prompt=
        "Image 1 is a pencil drawing of a woman wearing headphones. Draw her standing in a vocal booth of a small recording studio at night, singing: a large-diaphragm "
        "condenser microphone with a pop filter on a boom stand in front of her, off to one side at mouth height so her whole face stays visible, acoustic foam on "
        "the booth walls, and behind her a window of glass into the dim control room where the mixing desk and monitors glow. Warm light from one lamp in the booth, "
        "one consistent perspective. " + KEEP + STYLE),
}


def run(a):
    k, i = a
    j = JOBS[k]
    inp = {"prompt": j["prompt"], "image_input": [cfai.data_uri(str(REF / j["src"])), cfai.data_uri(str(REF / "jade_outfit_hp.jpg"))],
           "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    p = cfai.gen("google/nano-banana-pro", inp, str(REF / f"jade_in_{k}_{i}.png"), tag="integrate")[0][0]
    out = J.paste_onto(pathlib.Path(p), j["mask"])
    if out is not None:
        out.save(REF / f"jade_in_{k}_{i}_hl.png")
    return p


if __name__ == "__main__":
    scenes = sys.argv[1:] or list(JOBS)
    with cf.ThreadPoolExecutor(6) as ex:
        list(ex.map(run, [(k, i) for k in scenes for i in (1, 2)]))
