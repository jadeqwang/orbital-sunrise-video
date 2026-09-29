"""Put her on location: the image model draws the place AROUND her kept drawing, in the same picture, with her untouched.

    python3 tools/jade_location.py <first_frame.jpg> <out_prefix> [n]

The earlier backgrounds were drawn empty and she was laid over them ("superimposed on a postcard"). Here the model sees her
and draws the scene for her pose: a selfie at arm's length at an overlook, so ground, light and camera agree with her.
Each result is checked against the input: her face region must be unchanged, or the result is rejected (see check()).
"""
import sys, pathlib
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import cfai

PROMPT = ("Edit this pencil drawing on cream paper. Keep the woman exactly as she is drawn: the same pencil lines, the same face, "
          "head size and shape, high forehead, glasses, eyebrows, hair, jacket, pink headphones, pose, size and position in the "
          "picture. Do not redraw, move, resize, beautify or restyle her in any way. Only draw the place around her, in the same "
          "graphite and coloured-pencil style on the same paper: she is taking a selfie with her phone at arm's length (her "
          "outstretched arm is the one at the lower left) at a hilltop overlook in the Texas Hill Country at golden hour. Behind "
          "her, seen close and slightly from below as a phone camera at arm's length sees it: tall grass and a live oak near her, "
          "then rolling cedar-covered hills and a wide sky with the low sun off to the left. The warm low sunlight comes from the "
          "left: a thin gold rim of coloured pencil along the left edge of her hair and shoulder, and nothing else changed on her. "
          "The landscape continues behind her on both sides at the height a real horizon would be for this camera. No text, no border.")


def check(src, out, box=(.36, .06, .62, .62), tol=10.0):
    """Mean absolute difference over her head (box in relative coords of a 16:9 frame, centred framing). Lower is better."""
    a = np.asarray(Image.open(src).convert("L").resize((1280, 720)), float)
    b = np.asarray(Image.open(out).convert("L").resize((1280, 720)), float)
    x0, y0, x1, y1 = [int(v) for v in (box[0] * 1280, box[1] * 720, box[2] * 1280, box[3] * 720)]
    d = float(np.abs(a[y0:y1, x0:x1] - b[y0:y1, x0:x1]).mean())
    return d, d <= tol


def main(first, prefix, n=2):
    import concurrent.futures as cf
    inp = {"prompt": PROMPT, "image_input": [cfai.data_uri(first)], "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    def one(i):
        p = cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{i}.png", tag="jade_location")[0][0]
        return p, check(first, p)
    with cf.ThreadPoolExecutor(n) as ex:
        for p, (d, ok) in ex.map(one, range(1, n + 1)):
            print(f"{p}: head diff {d:.1f} {'OK' if ok else 'REJECT (she was redrawn or moved)'}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2)


FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150,
             136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]


def restore_face(src, edited, out, grow=1.06, feather=18):
    """The model keeps her geometry but re-inks her face (crisper, liner-like lashes, outlined lips). Put the original face back:
    same pixels, same place (no angle or scale mismatch), inside her face oval, feathered, with the paper tone matched."""
    import cv2, jade_forehead as JF, mediapipe as mp
    A = np.asarray(Image.open(src).convert("RGB"), float)
    B = np.asarray(Image.open(edited).convert("RGB").resize((A.shape[1], A.shape[0]), Image.LANCZOS), float)
    r = JF.landmarker().detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=A.astype(np.uint8)))
    L = r.face_landmarks[0]
    h, w = A.shape[:2]
    pts = np.array([[L[i].x * w, L[i].y * h] for i in FACE_OVAL])
    c = pts.mean(0); pts = c + (pts - c) * grow
    m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [pts.astype(np.int32)], 255)
    m = cv2.GaussianBlur(m.astype(float) / 255, (0, 0), feather)[..., None]
    # match paper: the bare skin (brightest paper inside the face) in the edit vs the original
    inner = m[..., 0] > .5
    gain = np.percentile(B[inner], 90, axis=0) / np.percentile(A[inner], 90, axis=0)
    C = A * gain * m + B * (1 - m)
    Image.fromarray(np.clip(C, 0, 255).astype(np.uint8)).save(out, quality=94)
    return out
