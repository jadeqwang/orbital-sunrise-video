"""The approved base trace with only her clothes changed and the background removed (the intermediate she asked for).

    python3 tools/jade_base_jacket.py            -> media/refs/jade_bj_{plain,hp}_{1,2}.png (+ _hl: traced head pasted back)

Nano Banana edits media/refs/jade_trace_control_1.png at its own framing: the jacket is fitted to her body as posed
(turned slightly to the side, one arm reaching toward the camera), the closet becomes plain cream paper. Then her
traced head is pasted back unchanged (tools/jade_head_lock.py, aligned by the eyes).
"""
import sys, pathlib, concurrent.futures as cf
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import cfai, jade_head_lock as J

BASE = ROOT / "media/refs/jade_trace_control_1.png"; OH = ROOT / "media/refs/jade_outfit_hp.jpg"
PROMPT = ("Edit image 1, a graphite pencil drawing, keeping it the same drawing in exactly the same technique, framing and size. Keep her head, face, glasses, eyebrows, "
          "hair, neck, pose, shoulders and body angle exactly as drawn, line for line: her body is turned slightly to the side and one arm reaches toward the viewer. "
          "Change only two things: (1) her clothes: replace the lace top with the white cropped nylon flight jacket with the bright orange band from the left of image 2, "
          "over a black top, fitted to her body exactly as it is posed, following her shoulders, the reaching arm and the turn of her torso; {hp}"
          "(2) the background: remove the closet and clothes rack entirely and leave plain cream drawing paper behind her. Pencil, with soft coloured pencil only for the "
          "orange band{hpcol}. No text.")
JOBS = {"plain": dict(hp="", hpcol=""),
        "hp": dict(hp="also add the pale dusty-pink over-ear headphones from the right of image 2 resting around her neck, below her chin; ", hpcol=" and the pink headphones")}


def run(a):
    k, i = a
    inp = {"prompt": PROMPT.format(**JOBS[k]), "image_input": [cfai.data_uri(str(BASE)), cfai.data_uri(str(OH))],
           "aspect_ratio": "3:4", "output_format": "png", "image_size": "2K"}
    return cfai.gen("google/nano-banana-pro", inp, str(ROOT / f"media/refs/jade_bj_{k}_{i}.png"), tag="basejacket")[0][0]


if __name__ == "__main__":
    jobs = [(k, i) for k in JOBS for i in (1, 2)]
    with cf.ThreadPoolExecutor(4) as ex:
        list(ex.map(run, jobs))
    for k, i in jobs:
        p = f"media/refs/jade_bj_{k}_{i}.png"
        out = J.paste_onto(ROOT / p, "head")
        if out is not None:
            out.save(ROOT / p.replace(".png", "_hl.png"))
