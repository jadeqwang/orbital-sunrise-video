"""Faithful pencil trace of her photo 3 (the photo her Google portrait was drawn from): control + scene attempts. Run from the repo root."""
import sys, concurrent.futures as cf; sys.path.insert(0, 'tools')
import cfai
P3 = "media/chars/jade_src/photos/jade_photo_3_full.jpg"; GP = "media/chars/jade_src/photos/jade_face_4_pencil.jpg"; OH = "media/refs/jade_outfit_hp.jpg"
TRACE = ("a faithful trace of her face from image 1, like a careful artist tracing a photograph: the exact outline of her face and jaw, eye size, shape and spacing, the natural "
         "eyelids, nose, the exact shape of her lips, brows and hairline, all as in the photo. She wears NO makeup: no eyeliner, no mascara or emphasised lashes, no lip liner or "
         "defined lip edges, no contouring or blush, no brow shaping. Do not beautify, idealise, slim or restyle her face, and do not age her or add marks. Fine, dense, "
         "controlled pencil lines like image 2, soft tonal shading with the paper showing through on the skin.")
JOBS = {
  "control": dict(imgs=[P3, GP], prompt="Draw image 1 as a hand-drawn graphite pencil drawing on plain cream drawing paper, in the technique of image 2, changing nothing: the same "
                  "pose, framing, clothes and background (drawn more lightly). The face is " + TRACE + " No lined paper, no text."),
  "hook1": dict(imgs=[P3, GP, OH], prompt="Draw the woman in image 1 as a hand-drawn graphite pencil drawing on plain cream drawing paper, in the technique of image 2. Keep her pose, "
                "head angle straight to camera, shoulders, glasses and long dark hair exactly as in image 1. The face is " + TRACE + " Change only her clothes and the background: "
                "the white cropped nylon flight jacket with the bright orange band (left of image 3) over a black top, the pale dusty-pink over-ear headphones (right of image 3) "
                "resting around her neck, and behind her a hilltop at golden hour above the Golden Gate Bridge and the San Francisco skyline, drawn more loosely and lightly than her. "
                "Graphite with a few soft touches of coloured pencil (warm light on one side, the orange band, the pink headphones). One single image, no text."),
}
def run(a):
    k, i = a
    inp = {"prompt": JOBS[k]["prompt"], "image_input": [cfai.data_uri(p) for p in JOBS[k]["imgs"]],
           "aspect_ratio": "3:4" if k == "control" else "16:9", "output_format": "png", "image_size": "2K"}
    return cfai.gen("google/nano-banana-pro", inp, f"media/refs/jade_trace_{k}_{i}.png", tag="trace")[0]
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(run, [(k, i) for k in JOBS for i in (1, 2)]): print(r)
