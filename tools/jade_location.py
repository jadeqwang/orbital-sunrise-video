"""Put her on location: the image model draws the place AROUND her kept drawing, in the same picture, with her untouched.

    python3 tools/jade_location.py <first_frame.jpg> <out_prefix> [n] [scene]      scene: hook1 | studio_neck | studio_head | dusk

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


RELIGHT_STUDIO = ("Light her as she would really be lit in that room: warm lamp light from one side, the other side of her face and "
    "jacket in soft shade, a faint cool glow from the window behind rimming her hair. Keep every line of her face.")
RELIGHT_DUSK = ("Light her as she would really be lit standing there: the sun has just set behind her, so the red-orange sky lights "
    "her from behind and the side: a strong red-orange rim along her hair, cheek and shoulder, her face in soft warm shade, "
    "the white of her jacket and her skin taking on the dusk colour like everything else in the picture. She must look like she "
    "is standing in that light, not pasted onto the picture. Keep every line of her face.")
KEEP = ("Edit this pencil drawing on cream paper. Keep the woman exactly as she is drawn: the same pencil lines, the same face, "
        "head size and shape, high forehead, glasses, eyebrows, hair, jacket, pose, size and position in the picture. Do not "
        "redraw, move, resize, beautify or restyle her. Draw the place around her in the same graphite and coloured-pencil style "
        "on the same paper, as a shot in a music video filmed by someone holding the camera in front of her. ")
SCENES = {
    "hook1": PROMPT,
    # 1:09 · singing in the vocal booth
    "studio_neck": KEEP + ("Her pink headphones stay round her neck as drawn. She is in a small recording vocal booth at night: grey "
        "acoustic foam panels on the walls, a warm lamp. A large-diaphragm condenser microphone with a round pop filter on a boom "
        "arm stands at the side of the picture, at her chin height, beside her face, never in front of her face or mouth. Behind "
        "her, a window into the dim control room with the glow of a mixing desk and monitors. Warm lamp light from the side: a "
        "soft warm rim of coloured pencil on her hair and shoulder, nothing else changed on her. No text, no border."),
    "studio_head": KEEP.replace("jacket, pose", "jacket, pose (except the headphones)") + ("Move only her pale pink over-ear "
        "headphones from around her neck onto her head: the band over the top of her hair, the cups over her ears; her head "
        "stays exactly the same size and shape, the band sits on top of her hair. She is in a small recording vocal booth at "
        "night: grey acoustic foam panels, a warm lamp. A large-diaphragm condenser microphone with a round pop filter on a boom "
        "arm stands at the side of the picture at her chin height, beside her face, never in front of her face or mouth. Behind "
        "her, a window into the dim control room with the glow of a mixing desk. Warm lamp light from the side. No text, no border."),
    # 1:09, her notes: headphones ON her head only (start from the jacket-only drawing); mic beside her face as in studio_head;
    # the window behind her looks into the control room where the engineer faces her; the desk is below the window, unseen
    "studio2": KEEP.replace("jacket, pose", "jacket, pose (except the headphones)") + ("Put her pale dusty-pink over-ear headphones on "
        "her head: the band over the top of her hair, the cups over her ears; her head stays exactly the same size and shape. "
        "No headphones anywhere else, nothing round her neck. She is singing in a small recording vocal booth at night: grey "
        "acoustic foam panels, a warm lamp. A large-diaphragm condenser microphone with a round pop filter on a boom arm stands at "
        "the right side of the picture at her chin height, beside her face, never in front of her face or mouth. Behind her, a "
        "large window into the dark control room: a sound engineer sits behind the glass facing her, dimly lit by a monitor's glow, "
        "looking toward her; the top edge of a computer monitor and a small talkback microphone on a stand show at the bottom of "
        "the window; the mixing desk is below the window, out of sight. " + RELIGHT_STUDIO + " No text, no border."),
    # 1:55 · never see what he saw ahead: red dusk in Austin
    "dusk": KEEP + ("She stands on the Lady Bird Lake hike-and-bike trail in Austin, Texas at dusk: the whole sky is a deep red "
        "and orange, the downtown Austin skyline and the Congress Avenue bridge far behind her across the calm water, the red "
        "sky reflected in the lake, a few trees along the trail. Red dusk light in coloured pencil: a red-orange rim along her "
        "hair and shoulder from the sky, nothing else changed on her. No text, no border."),
    "dusk_trail_lit": KEEP + ("She stands on the Lady Bird Lake hike-and-bike trail in Austin, Texas at dusk: the whole sky a "
        "deep red and orange, the downtown Austin skyline far behind her across the calm water, the red sky reflected in the lake, "
        "trees along the trail. " + RELIGHT_DUSK + " No text, no border."),
    "dusk_skyline_lit": KEEP + ("She stands at the edge of Lady Bird Lake in Austin, Texas at dusk: the whole sky a deep red and "
        "orange, the downtown Austin skyline and the Congress Avenue bridge behind her across the water, the red sky reflected in "
        "the lake. " + RELIGHT_DUSK + " No text, no border."),
}


class _P:   # a landmark in full-image coordinates
    def __init__(s, x, y): s.x, s.y = x, y


def face_landmarks(A):
    """MediaPipe face landmarks for her in image A (full-image normalised coords). The detector misses small faces in busy
    frames, so fall back to the centre half of the picture (where she always is) and map back."""
    import jade_forehead as JF, mediapipe as mp
    h, w = A.shape[:2]
    r = JF.landmarker().detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(A.astype(np.uint8))))
    if r.face_landmarks:
        return r.face_landmarks[0]
    x0, y0, x1, y1 = w // 4, 0, w * 3 // 4, h * 3 // 4
    r = JF.landmarker().detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(A[y0:y1, x0:x1].astype(np.uint8))))
    if not r.face_landmarks:
        raise RuntimeError("no face found")
    return [_P((x0 + p.x * (x1 - x0)) / w, (y0 + p.y * (y1 - y0)) / h) for p in r.face_landmarks[0]]


def cheek_mask(L, w, h, feather):
    """Her cheeks under the glasses, where the drawing carries the shadow her glasses cast from the closet's overhead light."""
    import cv2
    P = lambda i: np.array([L[i].x * w, L[i].y * h])
    m = np.zeros((h, w), np.float32)
    for lid, nose, edge in ((145, 129, 234), (374, 358, 454)):
        top, bot = P(lid)[1] + (P(2)[1] - P(lid)[1]) * .12, P(2)[1]
        x0, x1 = sorted([P(nose)[0], P(edge)[0]])
        c = ((x0 + x1) / 2, (top + bot) / 2); ax = ((x1 - x0) / 2 * .95, (bot - top) / 2)
        cv2.ellipse(m, (int(c[0]), int(c[1])), (int(ax[0]), int(ax[1])), 0, 0, 360, 1.0, -1)
    return cv2.GaussianBlur(m, (0, 0), feather)[..., None]


def restore_lines(src, edited, out, sigma=None, grow=1.08, feather=18, skip_cheeks=False):
    """Relit scenes: keep the model's light on her face but her own pencil lines. Inside her face oval the picture is the
    edit's low-frequency light and colour times the original's line detail (original / blurred original), so every line of
    her face is hers while the shading follows the scene. Same geometry is required (the model must not move her)."""
    import cv2, jade_forehead as JF, mediapipe as mp
    A = np.asarray(Image.open(src).convert("RGB"), float)
    B = np.asarray(Image.open(edited).convert("RGB").resize((A.shape[1], A.shape[0]), Image.LANCZOS), float)
    h, w = A.shape[:2]
    sigma = sigma or w / 220
    L = face_landmarks(A)
    pts = np.array([[L[i].x * w, L[i].y * h] for i in FACE_OVAL]); c = pts.mean(0); pts = c + (pts - c) * grow
    m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [pts.astype(np.int32)], 255)
    m = cv2.GaussianBlur(m.astype(float) / 255, (0, 0), feather)[..., None]
    if skip_cheeks:   # leave the model's cheeks (lit by the scene, no closet glasses-shadow)
        m = m * (1 - cheek_mask(L, w, h, feather))
    ga = A.mean(2); detail = np.clip((ga + 1) / (cv2.GaussianBlur(ga, (0, 0), sigma) + 1), 0, 1.15)[..., None]
    light = cv2.GaussianBlur(B, (0, 0), sigma)
    C = light * detail * m + B * (1 - m)
    Image.fromarray(np.clip(C, 0, 255).astype(np.uint8)).save(out, quality=94)
    return out


NO_GLASSES_SHADOW = ("The shadow her glasses cast on her cheeks just under the lenses comes from an overhead light in the original "
    "photo; there is no overhead light in this scene. Remove that shadow: her cheeks under her glasses are lit by the same light "
    "as the rest of her face. ")
FIXES = {
    # 1:09 · her notes on studio2_2: headphones changed style; the lamp behind her makes no sense as the light on her face
    "studio_fix": ("Edit image 1, keeping it the same drawing, framing and style, and keeping her face, head size, hair, glasses, "
        "jacket and pose exactly as they are. Make three changes only. 1) Her headphones must be exactly the pale dusty-pink "
        "over-ear headphones from image 2 (same shape, colour and design), worn on her head: band over the top of her hair, cups "
        "over her ears. 2) Remove the lamp completely; that side of the booth is grey acoustic foam panels like the rest. "
        "3) Light her from the front: a soft studio light in front of her and a little to one side, off-camera, so her face is "
        "evenly and softly lit, with only the faint cool glow of the control-room window behind her on her hair. "
        + NO_GLASSES_SHADOW + "No text, no border."),
    # 1:09 · her second round of notes: glasses shadow still there, headphones still not hers, arm still holding the camera,
    # the engineer too realistic. image 2 = her drawing with the headphones, image 3 = a photo of the real pair
    "studio_fix2": ("Edit image 1, keeping it the same drawing, framing, style and lighting, and keeping her face, head size, hair, "
        "glasses and jacket exactly as they are. Make four changes only. 1) Her headphones must be exactly her real pair, shown "
        "drawn in image 2 and photographed in image 3 (Sony, matte pale dusty pink): a smooth seamless headband with no padding "
        "segments, slim arms sliding out of it with a thin copper-coloured ring, and large smooth oval ear cups with no visible "
        "hinges or screws; the band over the top of her hair, the cups over her ears. 2) Her arm is no longer reaching toward "
        "the camera: both arms hang relaxed at her sides, below the bottom of the picture, her shoulders level and natural, "
        "as a singer standing at a microphone. 3) " + NO_GLASSES_SHADOW.replace("Remove that shadow", "Remove that shadow "
        "completely: no dark band under the lenses") + "4) The sound engineer behind the window is a loose, lo-fi pencil "
        "sketch: a few quick graphite lines and soft smudged shading, barely any detail, like a rough sketch in the margin, "
        "clearly less finished than she is. No text, no border."),
    # her note: "the background can be kept a little bit loose"
    "loosen": ("Edit image 1, keeping her exactly as she is: her face, head, hair, glasses, headphones, jacket, pose and the light "
        "on her unchanged. Redraw only the background behind her more loosely, like a quick pencil sketch around a finished "
        "figure: quicker, freer graphite and coloured-pencil strokes, much less detail, simplified shapes, some bare paper showing "
        "through, edges left rough. Keep the same composition, places, colours and light direction. She stays the most finished "
        "thing in the picture. No text, no border."),
    # the same, with her two kept drawings as references (her suggestion): image 2 = with her headphones round her neck,
    # image 3 = the jacket without headphones
    "loosen_ref": ("Image 2 and image 3 are reference drawings of this same woman: image 2 shows her real pale pink headphones "
        "(round her neck there), image 3 her face, hair, glasses and jacket. " ),
    # 1:09 · her pick b, "the microphone could be a bit loose too"
    "loosen_mic": ("Edit image 1, keeping everything exactly as it is, her above all, except the microphone: redraw the "
        "microphone, its pop filter, shock mount, cable and boom arm more loosely, like the looser background: quicker, freer pencil "
        "strokes, less detail, rough edges. Keep its position, size, angle and the light on it. No text, no border."),
    # 1:09, her idea: the Rare Earth "How could we be alone?" setting, drawn AROUND her approved studio drawing (her face untouched)
    "rare_setting": ("Edit image 1, keeping her exactly as she is: her face, glasses, hair, pink headphones on her head, jacket, pose, "
        "size and position, and the pencil style. Replace only everything around her: she now stands on a high open metal platform "
        "at the top of a tall tower, far above a sea of clouds at night, a deep blue starry night sky behind her, a few thin steel "
        "cables and a small orange warning light at the platform's edge, like image 2. Remove the studio, the microphone, the "
        "window and the engineer completely. Cool blue night light on her from the sky, soft and even on her face. The background "
        "drawn loosely in the same coloured-pencil style. No text, no border."),
    # 1:09, her note: "it should be a crop top and you should be able to see some bare midriff" (the shot was chest-up)
    "rare_wider": ("Image 1 is a drawing placed smaller on a blank page. Extend it outward to fill the whole picture, like zooming "
        "the camera out: keep everything already drawn exactly as it is (above all her face, glasses, hair and headphones, "
        "unchanged, same size and place), and continue the scene around it in the same coloured-pencil style and night light: "
        "more of the starry sky, the sea of clouds, the tower platform, its cables and railing. Continue her body down to about "
        "her knees: her short cropped white jacket with orange bands hanging open, under it a black crop top that ends above her "
        "waist with a band of bare midriff showing, dark trousers. Her arms relaxed at her sides. No text, no border, no blank "
        "areas left."),
    # 1:09, her notes on the wider version: mock-neck crop top, a looser background; and no selfie arm
    "rare_wider_fix": ("Edit image 1, keeping her face, glasses, hair, headphones, head size and position exactly as they are. Make "
        "three changes only. 1) Her black top is a mock-neck crop top: a short snug black top whose collar comes a little way up "
        "her neck, ending above her waist so a band of bare midriff shows under the open cropped white jacket. 2) Her arms hang "
        "relaxed at her sides; nothing reaches toward the camera. 3) Redraw the background more loosely, like a quick coloured-pencil "
        "sketch around a finished figure: freer strokes, less detail, simplified clouds, platform and cables, some bare paper "
        "showing; same places, colours and night light. She stays the most finished thing in the picture. No text, no border."),
    "rare_arm_shadow": ("Edit image 1, keeping everything exactly as it is (her face, glasses, hair, headphones, mock-neck crop top, "
        "jacket, colours, background and night light) except two things. 1) Her arm on the left side of the picture, which now "
        "reaches forward toward the camera, hangs straight down relaxed at her side instead, her hand by her hip, the sleeve of "
        "the cropped jacket falling naturally. 2) " + NO_GLASSES_SHADOW + "No text, no border."),
    "dusk_fix": ("Edit image 1, keeping it the same drawing, framing, style and red dusk light, and keeping her face, head size, "
        "hair, glasses, jacket and pose exactly as they are. " + NO_GLASSES_SHADOW + "Change nothing else. No text, no border."),
}


FIXES["loosen_ref"] += FIXES["loosen"].replace("Edit image 1, keeping her exactly as she is:", "Edit image 1, keeping her exactly as "
    "she is and matching the references:").replace("headphones, jacket", "headphones (worn on her head, exactly her real pair "
    "from image 2), jacket")


def fix(edited, prefix, name, extra=None, n=2):
    """Touch up an existing scene edit (FIXES[name]); extra = further reference image(s) (e.g. her headphones)."""
    import concurrent.futures as cf
    extra = [] if extra is None else ([extra] if isinstance(extra, str) else list(extra))
    imgs = [cfai.data_uri(edited)] + [cfai.data_uri(e) for e in extra]
    inp = {"prompt": FIXES[name], "image_input": imgs, "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    with cf.ThreadPoolExecutor(n) as ex:
        return list(ex.map(lambda i: cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{i}.png", tag="jade_location_fix")[0][0], range(1, n + 1)))


def main(first, prefix, n=2, scene="hook1"):
    import concurrent.futures as cf
    inp = {"prompt": SCENES[scene], "image_input": [cfai.data_uri(first)], "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
    def one(i):
        p = cfai.gen("google/nano-banana-pro", inp, f"{prefix}_{i}.png", tag="jade_location")[0][0]
        return p, check(first, p)
    with cf.ThreadPoolExecutor(n) as ex:
        for p, (d, ok) in ex.map(one, range(1, n + 1)):
            print(f"{p}: head diff {d:.1f} {'OK' if ok else 'REJECT (she was redrawn or moved)'}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2, sys.argv[4] if len(sys.argv) > 4 else "hook1")


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
