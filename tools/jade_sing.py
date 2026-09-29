"""Jade singing, animated straight from her kept drawing (tools/jade_keep.py framing A) with her own vocal as the audio reference.

    python3 tools/jade_sing.py <first_frame.jpg> <out.mp4> [--bg] [--no-avatar] [--loc] [--scene=dusk|studio]

The first frame is the approved drawing on the film's paper, so the model starts from her real face; the prompt asks it to
keep the drawing as it is. --bg lets it sketch a generic landscape in behind her. Take 1 (--bg, avatar mode) ignored the
first frame and redrew her smaller-headed and narrower; --no-avatar drops the avatar mode to keep the frame.
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
          "beautify, slim, age or restyle her face; no makeup, no added lines. Keep her high forehead exactly as drawn: the hairline and "
          "centre parting stay at the same height above her brows in every frame, never lowered, and the top of her head stays in frame. "
          "Static locked-off camera, no zoom or push-in: she stays framed chest-up exactly as in the first frame, never a face close-up. "
          "No text, no captions.")
LOC = (" She is on location at a hilltop overlook in the Texas Hill Country at golden hour, filmed by someone holding the camera "
       "in front of her. The landscape behind her stays exactly as drawn in the first frame: the grass and the oak leaves stir "
       "a little in the wind, the low sun stays where it is, the warm rim light stays on her hair and shoulder.")
BG = (" Behind her, in soft light pencil lines on the paper, a quiet generic landscape at golden hour: gentle hills, grass and a "
      "wide sky, drawn lightly so she stays the clear subject.")


# the other singing shots: (vocal clip, seconds, what she sings, what she wears, where she is). Vocal clips start in the song at
# hook1 30.9 s, hook2 67.4 s, brk 110.4 s (video/src/shots2.js SEG)
SCENES = {
    "dusk": (ROOT / "media" / "audio_refs" / "jade_brk.mp3", 8,
             "'I'll never float where the sky turns red, never see what he saw ahead' from the reference audio, her lips shaping each "
             "word in time with the voice", "pink headphones round her neck",
             " She is on location on the Lady Bird Lake trail in Austin at dusk, filmed by someone holding the camera in front of her. "
             "Everything stays as drawn in the first frame: the deep red sky, the skyline and the trees behind her, the red-orange "
             "dusk light on her hair, cheek and jacket; the trees and the water stir a little."),
    "studio": (ROOT / "media" / "audio_refs" / "jade_hook2.mp3", 5,
               "'bring me home' from the reference audio, her lips shaping each word in time with the voice: lips closing on 'b' "
               "and 'm', opening round and wide on 'home'", "pink headphones on her head",
               " She is singing into the studio microphone beside her in a vocal booth. Everything stays as drawn in the first "
               "frame: the microphone and pop filter beside her face, never in front of her mouth; the window behind her with the "
               "sketched engineer; the soft light on her face."),
    # 1:09, her correction: her real self (glasses, pink headphones) in the Rare Earth setting, eyes closed, arms spread
    "rare_her": (ROOT / "media" / "audio_refs" / "jade_hook2.mp3", 5,
                 "'bring me home' from the reference audio, her lips shaping each word in time with the voice: lips closing on 'b' "
                 "and 'm', opening round and wide on 'home'", "pink headphones on her head",
                 " She stands on a high platform above the clouds at night, under a sky full of white stars that stay in the "
                 "sky the whole time. She wears rugged grey-blue utility work trousers with big cargo pockets and reinforced knees, "
                 "the kind launch-platform crew wear. As she sings she slowly lifts and spreads her arms wide, her face lifting a "
                 "little to the sky; her hair and the open cropped jacket stir in the wind; the clouds drift slowly below. Her face "
                 "is as expressive as a singer giving everything in a live performance: brows lifting and drawing together with "
                 "the feeling of the words, eyes squeezing shut on the held note, mouth opening wide and round on 'home', cheeks "
                 "lifting, her head moving with the phrase. Her whole body sings with her, not only her upper body: she shifts her "
                 "weight from one foot to the other, her knees soften and bend a little as she breathes in, her hips sway, she "
                 "rises slightly onto the balls of her feet as the note opens on 'home' and settles back, perhaps taking a small "
                 "step forward. Steady camera, a slow gentle pull-back that keeps her in a medium shot, never tiny in the frame."),
    # 1:09 (her idea): her Rare Earth character in coloured pencil, with her real pink headphones (rare_hp_2), arms spread
    "rare": (ROOT / "media" / "audio_refs" / "jade_hook2.mp3", 5,
             "'bring me home' from the reference audio, her lips shaping each word in time with the voice: lips closing on 'b' "
             "and 'm', opening round and wide on 'home'", "pale pink headphones on her head",
             " She stands on a high platform above the clouds at night, arms spread wide, eyes closed, singing out to the sky; her "
             "long hair and the jacket stir in the wind; the clouds drift slowly below. Keep the coloured-pencil drawing style and "
             "her character design exactly as in the first frame. A very slow pull-back of the camera."),
}


def main(first, out, bg=False, avatar=True, loc=False, scene=None):
    prompt, audio, dur = PROMPT + (BG if bg else "") + (LOC if loc else ""), AUDIO, 5
    if scene == "rare":   # her Rare Earth character: an illustrated character, not her likeness (no glasses)
        audio, dur, words, wear, where = SCENES[scene]
        prompt = ("A coloured-pencil drawing on cream paper comes to life, still a coloured-pencil drawing in every frame: the same "
                  "pencil strokes, paper and colours as the first frame. The illustrated young woman in the drawing (long dark hair, "
                  "her pale dusty-pink over-ear headphones, white cropped jacket with orange bands) sings the words " + words + ". She sings with feeling, "
                  "eyes closed, head lifting a little. Her character design, face, proportions and outfit stay exactly as drawn in "
                  "the first frame." + where + " No text, no captions.")
    elif scene:
        audio, dur, words, wear, where = SCENES[scene]
        prompt = (PROMPT.replace("'bring me home' from the reference audio, her lips shaping each word in time with the voice: lips "
                                 "closing on 'b' and 'm', opening round and wide on 'home'", words)
                  .replace("pink headphones round her neck", wear) + where)
    inp = {"prompt": prompt, "duration": dur, "resolution": "720p", "aspect_ratio": "16:9",
           "generate_audio": False, "image": cfai.data_uri(first), "reference_audios": [cfai.data_uri(audio)],
           "use_virtual_avatar": avatar}
    return cfai.gen("bytedance/seedance-2.5", inp, out, tag="jade_sing", timeout=1800)


if __name__ == "__main__":
    sc = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--scene=")), None)
    main(sys.argv[1], sys.argv[2], "--bg" in sys.argv, "--no-avatar" not in sys.argv, "--loc" in sys.argv, sc)
