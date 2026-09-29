"""1:09 (her idea): the "How could we be alone?" shot from her Rare Earth video, redrawn in the film's coloured pencil as a nod
to fans. Her own character and composition; the image model only changes the medium.

    python3 tools/rare_earth.py <frame.jpg> <out_prefix> [n] [--snow]
"""
import sys, pathlib, concurrent.futures as cf
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cfai

NIGHT = ("Redraw this frame as a hand-drawn coloured-pencil drawing on black paper, the way a skilled illustrator would draw "
         "it by hand: keep the same character (her face, long dark hair blowing, orange headphones, white cropped jacket with "
         "orange bands, dark top, dark cargo trousers), the same pose with arms spread wide, eyes closed, singing, and the same "
         "composition, platform and night sky above the clouds. Change only the medium: light coloured pencils on black paper, "
         "white and pale blue for the clouds and the lit jacket, cobalt and ultramarine for the night, orange for the jacket "
         "bands, headphones and the platform light, a few white stars. Confident lines of varying weight, hatching only where "
         "needed, the black paper left bare in the dark. No halftone dots, no screen-tone, no text or lettering, no border.")
SNOW = NIGHT.replace("on black paper", "on warm cream paper").replace("light coloured pencils on black paper", "coloured pencils "
         "on cream paper").replace("the black paper left bare in the dark", "bare paper in the lights")


HEADPHONES = ("Edit image 1, keeping it the same coloured-pencil drawing: same character, face, hair, pose, outfit, platform, sky, "
    "composition and pencil style. Change one thing: her orange headphones become her real headphones, shown drawn in image 2 and "
    "photographed in image 3: matte pale dusty-pink Sony over-ear headphones with a smooth seamless headband, slim arms with a thin "
    "copper-coloured ring, and large smooth oval ear cups, worn on her head. Drawn in coloured pencil like the rest. No orange "
    "headphones anywhere. No text, no border.")


def headphones(still, prefix, n=2):
    ROOT = pathlib.Path(__file__).resolve().parent.parent
    imgs = [cfai.data_uri(still), cfai.data_uri(str(ROOT / "media/chars/jade_src/jade_trace_jacket_hp_1.jpg")),
            cfai.data_uri(str(ROOT / "media/refs/jade_headphones.jpg"))]
    inp = {"prompt": HEADPHONES, "image_input": imgs, "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    with cf.ThreadPoolExecutor(n) as ex:
        return list(ex.map(lambda i: cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{i}.png", tag="rare_earth_hp")[0][0], range(1, n + 1)))


AS_HER = ("Image 1 is a composition to reproduce: a young woman standing on a high platform above the clouds at night, arms spread "
    "wide, singing. Redraw it with the woman replaced by the real woman in images 2 and 3, drawn as in image 2: a realistic "
    "coloured-pencil drawing on cream paper, not anime or manga, no stylised features. Her face exactly as in images 2 and 3 "
    "(large head, wide heart-shaped face with a tapering chin, high forehead, the two slightly different eyebrows), her wide "
    "rectangular glasses on, her long centre-parted dark hair blowing in the wind, her pale dusty-pink over-ear headphones on her "
    "head as in image 2, her white jacket with orange bands and black top. {eyes} Keep image 1's pose (arms spread wide), the "
    "platform, the clouds below and the starry night sky, all in the same realistic coloured-pencil style as image 2, with "
    "loose, sketchy backgrounds. No makeup. No text, no border.")
EYES = {"closed": "She sings with her eyes closed and her face lifted slightly.",
        "open": "She sings with her eyes open, looking out past the camera, her face turned toward us as in image 3."}


def as_her(prefix, eyes="closed", n=2):
    ROOT = pathlib.Path(__file__).resolve().parent.parent
    imgs = [cfai.data_uri(str(ROOT / "media/refs/rare_earth/re4_snow_1_hp.jpg")),
            cfai.data_uri(str(ROOT / "media/chars/jade_src/location/smic_2.jpg")),
            cfai.data_uri(str(ROOT / "media/chars/jade_src/jade_trace_jacket_hp_1.jpg"))]
    inp = {"prompt": AS_HER.format(eyes=EYES[eyes]), "image_input": imgs, "aspect_ratio": "16:9", "output_format": "png",
           "image_size": "2K"}
    with cf.ThreadPoolExecutor(n) as ex:
        return list(ex.map(lambda i: cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{eyes}_{i}.png", tag="rare_earth_her")[0][0], range(1, n + 1)))


def main(frame, prefix, n=2, snow=False):
    inp = {"prompt": SNOW if snow else NIGHT, "image_input": [cfai.data_uri(frame)], "aspect_ratio": "16:9",
           "output_format": "png", "image_size": "2K"}
    with cf.ThreadPoolExecutor(n) as ex:
        return list(ex.map(lambda i: cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{i}.png", tag="rare_earth")[0][0], range(1, n + 1)))


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    print(main(a[0], a[1], int(a[2]) if len(a) > 2 else 2, "--snow" in sys.argv))
