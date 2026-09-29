"""Kenton's core note, the fix: a shot drawn the way a person would draw it (the image model draws a still from the reference
frame, tools/human_draw.py), then animated from that drawing so every frame stays that drawing (Seedance, no audio).

    python3 tools/drawn_plate.py <first_frame.jpg> <out.mp4> <seconds> "<what happens>" [--night]
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cfai

STYLE = ("A loose hand-drawn coloured-pencil drawing on {paper} comes to life and stays that drawing in every frame: the same "
         "pencil strokes, bare paper, line weights and limited colours as the first frame, drawn quickly and economically like "
         "an illustrator's sketch, never photographic, never more detailed than the first frame. {action} Steady camera. "
         "No text, no captions.")


def main(first, out, secs, action, night=False):
    prompt = STYLE.format(paper="black paper" if night else "cream paper", action=action)
    inp = {"prompt": prompt, "duration": int(secs), "resolution": "720p", "aspect_ratio": "16:9", "generate_audio": False,
           "image": cfai.data_uri(first)}
    return cfai.gen("bytedance/seedance-2.5", inp, out, tag="drawn_plate", timeout=1800)


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    main(a[0], a[1], a[2], a[3], "--night" in sys.argv)
