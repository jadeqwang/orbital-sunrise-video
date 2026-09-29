"""Jade singing, animated straight from her kept drawing (tools/jade_keep.py framing A) with her own vocal as the audio reference.

    python3 tools/jade_sing.py <first_frame.jpg> <out.mp4> [--bg]

The first frame is the approved drawing on the film's paper, so the model starts from her real face; the prompt asks it to
keep the drawing as it is and move only what singing needs. --bg lets it sketch a generic landscape in behind her.
"""
import sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import cfai

AUDIO = ROOT / "media" / "audio_refs" / "jade_hook1.mp3"     # her vocal, "bring me home", 5 s

PROMPT = ("A graphite and coloured-pencil drawing on cream paper comes to life, still a pencil drawing in every frame: the same fine "
          "pencil lines, the same paper, the same drawing style as the first frame. The woman in the drawing sings the words "
          "'bring me home' from the reference audio, her lips shaping each word in time with the voice: lips closing on 'b' and 'm', "
          "opening round and wide on 'home'. She sings with feeling: her brows and eyes respond to the music, her head tilts and lifts "
          "a little, she may close her eyes on a held note or glance up, her hair moves with her. Through all of it she stays the same "
          "person as in the first frame: the same large head, wide heart-shaped face with its tapering chin, high forehead, the two "
          "slightly different eyebrows, wide glasses, centre-parted hair, jacket and pink headphones round her neck. Do not redraw, "
          "beautify, slim, age or restyle her face; no makeup, no added lines. Locked-off camera, very slow push-in. "
          "No text, no captions.")
BG = (" Behind her, in soft light pencil lines on the paper, a quiet generic landscape at golden hour: gentle hills, grass and a "
      "wide sky, drawn lightly so she stays the clear subject.")


def main(first, out, bg=False):
    inp = {"prompt": PROMPT + (BG if bg else ""), "duration": 5, "resolution": "720p", "aspect_ratio": "16:9",
           "generate_audio": True, "image": cfai.data_uri(first), "reference_audios": [cfai.data_uri(AUDIO)],
           "use_virtual_avatar": True}
    return cfai.gen("bytedance/seedance-2.5", inp, out, tag="jade_sing", background=False, timeout=900)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], "--bg" in sys.argv)
