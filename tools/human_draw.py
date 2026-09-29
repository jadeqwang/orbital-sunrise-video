"""Kenton's core note: the film looks like "an edge detection algorithm" rather than "what a human would draw".
Test: have the image model redraw a reference frame the way an illustrator would, then (if it works) animate that drawing
the way her scenes were done.

    python3 tools/human_draw.py <frame.jpg> <out_prefix> [n] [--night] [--sketch] [--grit]
"""
import sys, pathlib, concurrent.futures as cf
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cfai

SNOW = ("Redraw this frame as a hand-drawn illustration in coloured pencil on warm cream drawing paper, the way a skilled "
        "illustrator would draw it by hand, not a tracing: keep the same composition, camera angle and subjects, but simplify. "
        "Suggest the forest with a few confident strokes: spruce silhouettes as simple jagged shapes, trunks as single "
        "strokes, the snow left as bare paper, hatching only in the shadows under branches and on the dark side of things. "
        "Lines of varying weight and pressure, loose and economical, some edges left open. Only these pencil colours: "
        "graphite, lead grey, sky blue, cobalt, a little orange. No text, no border, no signature.")
NIGHT = SNOW.replace("on warm cream drawing paper", "in light-coloured pencils on black paper").replace(
    "the snow left as bare paper", "the lit parts drawn in white and pale colours, the dark left as bare black paper")

# Kenton, on the redraw: "less cartoony and more pencil-sketchy". No outlines round flat fills, no cel shading: graphite
# the way a person sketches on location, with the grit of the film's own pencil pass
SKETCH = ("Redraw this frame as a quick graphite pencil sketch on warm cream drawing paper, drawn by hand on location by a "
          "skilled artist: keep the same composition, camera angle and subjects. Not a cartoon and not an illustration: no clean "
          "outlines around flat areas of colour, no cel shading, no smooth gradients. Build the forms from many loose searching "
          "pencil strokes, some construction lines left in, directional hatching and cross-hatching for the shadows, smudged "
          "graphite in the darkest places, visible paper grain, gritty texture, unfinished edges that fade into the bare paper. "
          "Mostly graphite, with only a little sky blue and a touch of orange rubbed in where the light is. No text, no border, "
          "no signature.")

# Kenton, on the sketches: "all too smooth, which is what makes them feel like AI"; try the dark, spinning capsule, where the
# two of them grimace, trying not to throw up while doing the math
GRIT = ("Redraw this frame as a rough, gritty hand drawing in charcoal and soft graphite on toned grey paper, dark and heavy, "
        "drawn fast by a person under pressure: keep the same composition and camera angle. Nothing smooth: no soft airbrushed "
        "shading, no clean gradients, no polished rendering. Scratchy, wobbly, overlapping lines of uneven pressure, heavy "
        "cross-hatching scrubbed into the shadows, charcoal smudged with a finger, dust, erasure marks and corrections left "
        "visible, the tooth of the paper showing through everywhere. Most of the picture is in deep shadow; only the faces, "
        "the instrument dials and the light from the porthole come out of the dark, picked out with a little white chalk. "
        "The capsule is spinning: the two cosmonauts grimace in discomfort, sweating, nauseous, jaws clenched, trying not to "
        "throw up, while the commander squints hard, working out the numbers in his head. Only a little rust-orange and a "
        "touch of dull blue. No text, no border, no signature.")


def main(frame, prefix, n=2, night=False, sketch=False, grit=False):
    inp = {"prompt": GRIT if grit else SKETCH if sketch else NIGHT if night else SNOW, "image_input": [cfai.data_uri(frame)], "aspect_ratio": "16:9",
           "output_format": "png", "image_size": "2K"}
    with cf.ThreadPoolExecutor(n) as ex:
        return list(ex.map(lambda i: cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{i}.png", tag="human_draw")[0][0], range(1, n + 1)))


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    print(main(a[0], a[1], int(a[2]) if len(a) > 2 else 2, "--night" in sys.argv, "--sketch" in sys.argv, "--grit" in sys.argv))
