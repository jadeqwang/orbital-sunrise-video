"""Scene drawings made by editing the faithful trace (media/refs/jade_trace_control_1.png): only clothes, headphones and background change. Run from the repo root."""
import sys, concurrent.futures as cf; sys.path.insert(0, 'tools')
import cfai
T = "media/refs/jade_trace_control_1.png"; OH = "media/refs/jade_outfit_hp.jpg"
BASE = ("Edit image 1, a graphite pencil drawing, into a wide landscape picture, keeping it one single pencil drawing in exactly the same technique. Keep her face, glasses, "
        "eyebrows (they are slightly different from each other: keep that), hair (long, straight, centre-parted, falling down over her shoulders) and head angle EXACTLY as drawn, line for line, "
        "and keep her pose and the size of her head; she stands right of centre. Do not redraw, beautify, add makeup to or re-pose her face. Change only: her clothes become the "
        "white cropped nylon flight jacket with the bright orange band (left of image 2) over a black top; {hp}; the background becomes {bg}, drawn more loosely and lightly than her. "
        "{col} Exactly one pair of headphones. One single image, no panels, no text.")
JOBS = {
  "hook1": dict(hp="the pale dusty-pink over-ear headphones (right of image 2) rest around her neck",
                bg="a hilltop at golden hour above the Golden Gate Bridge and the San Francisco skyline",
                col="Graphite with a few soft touches of coloured pencil: warm light on one side, the orange band, the pink headphones."),
  "studio": dict(hp="the pale dusty-pink over-ear headphones (right of image 2) are on her head over her ears, and nothing is around her neck",
                 bg="a recording studio at night: acoustic foam panels and a warm lamp, with a large-diaphragm condenser microphone on a stand at the left edge of the frame at chin height, well clear of her face",
                 col="Graphite with a soft touch of warm coloured pencil for the lamp light, the orange band and the pink headphones."),
  "brk": dict(hp="the pale dusty-pink over-ear headphones (right of image 2) rest around her neck",
              bg="a deep red and orange dusk sky in coloured pencil over the Golden Gate Bridge",
              col="A soft red-orange glow of coloured pencil on one side of her face and hair from the sunset; the orange band, the pink headphones."),
}
def run(a):
    k, i = a
    inp = {"prompt": BASE.format(**JOBS[k]), "image_input": [cfai.data_uri(T), cfai.data_uri(OH)],
           "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    return cfai.gen("google/nano-banana-pro", inp, f"media/refs/jade_ft_{k}_{i}.png", tag="fromtrace")[0]
with cf.ThreadPoolExecutor(6) as ex:
    for r in ex.map(run, [(k, i) for k in JOBS for i in (1, 2)]): print(r)
