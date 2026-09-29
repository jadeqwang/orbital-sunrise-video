"""Her closet selfie (photo 3) edited as a photo: the jacket, her pink headphones, and a plain background.

    python3 tools/jade_photo_edit.py      -> media/refs/jade_pe_{neck,head}_{1,2}.png (+ _hl: her real face pasted back)

After the edit her own face (and hair, where no headphones cover it) is pasted back from the original photo, aligned by
the eyes (tools/jade_head_lock.py), so the edit cannot change them.
"""
import sys, pathlib, concurrent.futures as cf
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import cfai, jade_head_lock as J
P3 = ROOT / "media/chars/jade_src/photos/jade_photo_3_full.jpg"; OH = ROOT / "media/refs/jade_outfit_hp.jpg"
KEEP = ("Edit image 1, a photo, keeping it a real photograph with the same camera, framing, lighting and size. Keep her face, glasses, eyebrows, skin, hair "
        "(centre-parted, half up, wispy face-framing pieces), her large head, pose and body angle exactly as they are. Do not retouch, reshape, beautify or add "
        "makeup. Change only: (1) her top becomes the white cropped nylon flight jacket with the bright orange band from the left of image 2, over a black top, "
        "fitted to her body as it is posed; (2) {hp} (3) remove the closet: the background becomes a plain, softly lit light-grey studio backdrop. No text.")
HP = {"neck": "the pale dusty-pink over-ear headphones from the right of image 2 rest around her neck, below her chin;",
      "head": "she wears the pale dusty-pink over-ear headphones from the right of image 2 on her head: the headband arches over the top of her head, resting "
              "on her hair with the hair's full volume underneath, and the cups sit over her ears outside her hair, sized for her large head; her head keeps "
              "exactly its size and outline;"}


def run(a):
    k, i = a
    inp = {"prompt": KEEP.format(hp=HP[k]), "image_input": [cfai.data_uri(str(P3)), cfai.data_uri(str(OH))],
           "aspect_ratio": "3:4", "output_format": "png", "image_size": "2K"}
    p = cfai.gen("google/nano-banana-pro", inp, str(ROOT / f"media/refs/jade_pe_{k}_{i}.png"), tag="photoedit")[0][0]
    out = J.paste_onto(pathlib.Path(p), "head" if k == "neck" else "face", src=P3)
    if out is not None:
        out.save(ROOT / f"media/refs/jade_pe_{k}_{i}_hl.png")


if __name__ == "__main__":
    with cf.ThreadPoolExecutor(4) as ex:
        list(ex.map(run, [(k, i) for k in HP for i in (1, 2)]))
