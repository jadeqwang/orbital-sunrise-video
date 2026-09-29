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


def main(frame, prefix, n=2, snow=False):
    inp = {"prompt": SNOW if snow else NIGHT, "image_input": [cfai.data_uri(frame)], "aspect_ratio": "16:9",
           "output_format": "png", "image_size": "2K"}
    with cf.ThreadPoolExecutor(n) as ex:
        return list(ex.map(lambda i: cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{i}.png", tag="rare_earth")[0][0], range(1, n + 1)))


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    print(main(a[0], a[1], int(a[2]) if len(a) > 2 else 2, "--snow" in sys.argv))
