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
    # 1:09, her note: "maybe no railings like in the reference illustration" (image 2 = the Rare Earth wide shot)
    "rare_no_rail": ("Edit image 1, keeping her exactly as she is (face, glasses, hair, headphones, mock-neck crop top, jacket, pose, "
        "colours, light) and the loose coloured-pencil style. Change only the platform: remove all the railings and the posts "
        "around it, so the platform's edge is open straight onto the sea of clouds below, like the open tower platform in image 2. "
        "Keep the steel cables rising from the platform and the small orange warning light at its edge. No text, no border."),
    # 1:09, her ask: the setting and posture of the anime reference (image 2) on result 2, keeping her face, glasses, camera angle
    "rare_anime_pose": ("Edit image 1. Keep her face exactly as it is in image 1: the same face shape, features, expression, "
        "eyebrows, glasses, centre-parted hair, pale pink headphones on her head, black mock-neck crop top with bare midriff, "
        "white cropped jacket with orange bands, and keep the same camera angle, framing, head size and head position as image 1. "
        "Change her posture to match image 2: arms spread wide out to the sides at shoulder height, palms open, her long hair "
        "blowing out behind her in the wind, singing out to the sky. Change the setting to match image 2: the open platform high "
        "above a sea of clouds at night under a deep blue starry sky, with long thin diagonal support wires running down across "
        "the frame from above, and small details like the orange box at the platform's edge. Keep image 1's loose coloured-pencil "
        "drawing style and night light; do not copy image 2's anime face or character design. No text, no border."),
    # 1:09, her notes on new B: forehead shortened, head smaller, much less hair than in real life, pants don't match the anime
    "rare_b_fix": ("Edit image 1, keeping its pose (arms spread wide), camera angle, platform, cables, orange light, night light "
        "and loose coloured-pencil style. Fix her: make her head larger, about 25% bigger than in image 1, with a high forehead "
        "(a tall forehead above her brows, the centre parting starting high on her head). Give her the full, thick, long dark hair "
        "she has in image 3: much more hair, a big volume of long hair blowing out behind her and over her shoulders in the wind. "
        "Change her trousers to the ones in image 2: loose grey-blue cargo trousers with a black belt and a long orange strap "
        "hanging down the front. Add long thin diagonal support wires running down across the sky from above, like in image 2. "
        "Keep her glasses, pale pink headphones on her head, black mock-neck crop top with bare midriff and white cropped jacket "
        "with orange bands. Do not add any lines to her face. No text, no border."),
    # after pasting her full-size head (from result 2) onto rare_b_fix: blend it in without shrinking it
    "rare_head_blend": ("Clean up image 1 without changing its composition. Her head is the right size: keep her head exactly "
        "this size and in exactly this place, and keep her face, forehead, hairline, glasses and pale pink headphones exactly as "
        "drawn. Only blend the head into the picture: give her full, thick dark hair on the crown of her head that flows "
        "continuously into the long hair blowing out behind her, so there is no visible seam or halo around her head, and match "
        "the pencil strokes and night light around it. Keep everything else in image 1 exactly as it is. No text, no border."),
    # 1:09 from her approved still (image 1): her head untouched, pose/hair/trousers/wires from the pose study (image 2)
    "rare_pose_keep_head": ("Image 1 is her approved portrait: her head is exactly right. Keep her head, face, forehead, "
        "hairline, glasses and pale pink headphones exactly as in image 1: the same size, the same place in the frame, the same "
        "angle, the same pencil lines; do not redraw or move them, and keep the camera exactly where it is in image 1. Change "
        "everything below and around her head to match image 2: her arms spread wide out to the sides, palms open; her full, "
        "long dark hair blowing out behind her in the wind; loose grey-blue cargo trousers with a black belt and a long orange "
        "strap; the open platform without railings, the cables, the diagonal support wires, the orange light, the clouds and the "
        "night sky. Draw her body in proportion to her head as it is in image 1. Keep her black mock-neck crop top with bare "
        "midriff and white cropped jacket with orange bands, and the loose coloured-pencil style. No text, no border."),
    # her hairline sits too low after the pose change; image 2 (result 2) has her real high forehead
    "rare_hairline": ("Edit image 1 only at her hairline: her forehead should be taller, like in image 2. Move her hairline "
        "and the centre parting up so there is a high, broad forehead above her brows, exactly as high as in image 2, with her "
        "dark hair swept back from it on both sides under the headphones. Keep her face below the brows, glasses, headphones, "
        "head size and position, the long hair blowing behind her, her pose, clothes and the whole setting exactly as in image 1. "
        "No text, no border."),
    # her ask: one edit of result 2 itself: arms spread, cargo pants, scaffolding gone, the anime drawing's setting details
    "rare_one_edit": ("Edit image 1. Do not change the camera: same framing, same zoom, her head exactly the same size and in "
        "exactly the same place, her face, hair, glasses and pale pink headphones exactly as drawn. Make only these changes: "
        "1) she spreads her arms wide out to the sides at shoulder height, palms open, like in image 2; her hands may go past "
        "the edges of the frame. 2) her trousers become the loose grey-blue cargo trousers with a black belt and a long orange "
        "strap from image 2. 3) remove the scaffolding: the metal frame, beams, posts and the thick diagonal girder. 4) the setting "
        "becomes the one in image 2: an open platform edge high above a sea of clouds at night, a deep blue sky with stars, long "
        "thin diagonal support wires running down across the sky, and the small orange box at the platform's edge. Keep image 1's "
        "loose coloured-pencil style. Do not copy image 2's face. No text, no border."),
    # rare_one_edit copied the anime body's angle, mirrored against her head; turn her body back the way result 2 has it
    "rare_body_turn": ("Edit image 1. Her body is turned the wrong way for her head. Turn her torso, shoulders and hips to the "
        "same angle as in image 2: her body turned the same way her head and face are turned, towards the left of the frame, her "
        "right shoulder (on the left of the picture) further from the camera, exactly the three-quarter body angle of image 2. "
        "Keep her arms spread wide and palms open (adjust them naturally to the turned body), and keep her head exactly the same "
        "size, place and angle, her face, glasses, hair, headphones, jacket, crop top, cargo trousers, the camera and the whole "
        "setting exactly as in image 1. No text, no border."),
    # the same turn in words only (with result 2 as a reference the model brought its scaffolding back)
    "rare_body_turn_text": ("Edit image 1. Her body is turned the wrong way for her head. Turn her torso, shoulders and hips a "
        "little so her body faces the same way as her face, towards the left of the frame, in a relaxed three-quarter angle. "
        "Keep her arms spread wide with palms open (adjusted naturally to the turned body). Keep her head exactly the same size, "
        "place and angle, her face, glasses, hair, headphones, jacket, crop top and cargo trousers, and keep the camera and the "
        "whole setting exactly as in image 1: the open platform edge, clouds, starry sky, the thin diagonal support wires and "
        "the orange box. Do not add any railings, posts, beams or scaffolding. No text, no border."),
    # rare_one_edit, but her body keeps image 1's angle (the anime body came out mirrored against her head)
    "rare_one_edit_body": ("Edit image 1. Do not change the camera: same framing, same zoom, her head exactly the same size, "
        "place and angle, her face, hair, glasses and pale pink headphones exactly as drawn. Her torso, shoulders and hips stay "
        "at exactly the same three-quarter angle as in image 1, turned the same way as her face; only her arms move. Make only "
        "these changes: 1) from her shoulders, she spreads her arms wide out to the sides, palms open; her hands may go past "
        "the edges of the frame. 2) her trousers become the loose grey-blue cargo trousers with a black belt and a long orange "
        "strap from image 2. 3) remove the scaffolding: the metal frame, beams, posts and the thick diagonal girder. 4) the setting "
        "becomes the one in image 2: an open platform edge high above a sea of clouds at night, a deep blue sky with stars, long "
        "thin diagonal support wires running down across the sky, and the small orange box at the platform's edge. Keep image 1's "
        "loose coloured-pencil style. Do not copy image 2's face or body angle. No text, no border."),
    # the same edit in words only: with the anime drawing as an input the model copies its wide framing and shrinks her head
    "rare_one_edit_words": ("Edit image 1. Do not change the camera: same framing, same zoom, her head exactly the same size, "
        "place and angle, her face, hair, glasses and pale pink headphones exactly as drawn. Her torso stays at the same "
        "three-quarter angle, turned the same way as her face; only her arms and trousers change. 1) From her shoulders she spreads "
        "her arms wide out to the sides at shoulder height, palms open, like a singer holding a big note; her hands may go past "
        "the edges of the frame. 2) Her trousers become loose grey-blue cargo trousers with side pockets, a black belt and a long "
        "orange strap hanging down the front. 3) Remove all the scaffolding: the metal frame, beams, posts, cables and the thick "
        "diagonal girder, and the grated floor. 4) She stands at the open edge of a high platform above a sea of clouds at night: "
        "a deep blue sky full of small white stars, a few long thin support wires running diagonally down across the sky from "
        "high above, and a small orange box at the platform's edge by her feet. Keep image 1's loose coloured-pencil style and "
        "night light. No text, no border."),
    # arms stay down in the still (Seedance spreads them as she sings): only the setting and trousers change, so the model keeps
    # her head; spreading the arms in the still made it zoom out to fit her hands in
    "rare_setting_pants": ("Edit image 1. Do not change the camera: same framing, same zoom, and keep her exactly as she is: her "
        "head, face, hair, glasses, pale pink headphones, jacket, crop top, pose, arms and body angle exactly as drawn. Change "
        "only: 1) her trousers become the loose grey-blue cargo trousers with a black belt and a long orange strap from image 2. "
        "2) remove the scaffolding: the metal frame, beams, posts, the thick diagonal girder and the grated floor. 3) the setting "
        "becomes the one in image 2: an open platform edge high above a sea of clouds at night, a deep blue sky with small white "
        "stars, long thin support wires running diagonally down across the sky, and the small orange box at the platform's edge. "
        "Keep image 1's loose coloured-pencil style and night light. Do not copy image 2's face or pose. No text, no border."),
    # her ask: make try 5's face (image 1) more like result 2's face (image 2), redrawn at try 5's own angle, not pasted
    "rare_face_match": ("Image 2 is a close-up of the same woman as in image 1, and it is her true likeness. Redraw only her face "
        "in image 1 so it looks like the face in image 2: the same eye shape and the shape of her eyelids, the same nose, the "
        "same lips and mouth, the same wide heart-shaped face with its tapering chin, the same cheeks and the same two slightly "
        "different eyebrows, as the same East Asian woman. Keep image 1's head angle, head size and position, her forehead and "
        "its shape, her hairline and hair, glasses, headphones, expression, the whole body, pose, clothes, the setting, the camera "
        "and the loose coloured-pencil style exactly as they are. No makeup, no added lines. No text, no border."),
    # her notes on rare_face_match: say that her eyebrows differ from each other, and that her forehead must be recognisable
    "rare_face_match2": ("Image 2 is a close-up of the same woman as in image 1, and it is her true likeness. Redraw her face and "
        "the top of her head in image 1 so she is recognisably the woman in image 2, at image 1's head angle. Two things matter "
        "most: 1) her eyebrows are slightly different from each other, one a little higher and more arched than the other, "
        "exactly as in image 2; do not make them symmetrical. 2) her forehead: the same high, broad, rounded forehead as in "
        "image 2, just as tall above her brows in proportion to her face. Get that height from the full size of her head, "
        "the top of her head rising higher, with her hair still full and thick on top and at the sides; do not push her "
        "hairline back or thin her hair, and do not shrink her head. Also match image 2's eye and eyelid shape, nose, lips, "
        "wide heart-shaped face and tapering chin, as the same East Asian woman. Keep her glasses, headphones, expression, "
        "the whole body, pose, clothes, setting, camera and the loose coloured-pencil style as in image 1. No makeup, no added "
        "lines. No text, no border."),
    # her notes on the sp_2 takes: no stars in the sky; the trousers should be real work cargo pants for a launch platform
    "rare_stars_pants": ("Edit image 1. Do not change the camera, the framing or her: her head, face, hair, glasses, pale pink "
        "headphones, jacket, crop top, pose and body angle stay exactly as drawn. Change only two things: 1) fill the deep blue "
        "night sky with stars: many small white stars and a few brighter four-pointed ones, drawn in white pencil, thickest high "
        "in the sky and thinning towards the clouds. 2) make her trousers rugged utility work trousers of the kind crew wear on a "
        "rocket launch platform: heavy, durable grey-blue canvas, a straight loose fit, big bellows cargo pockets on the thighs "
        "with button flaps, reinforced knee panels, double stitching, a tool loop and a hammer loop, a sturdy black work belt; "
        "keep the long orange strap hanging from the belt. Keep everything else exactly as in image 1, in the same loose "
        "coloured-pencil style. No text, no border."),
    "rare_stars_anime_pants": ("Edit image 1. Do not change the camera, the framing or her: her head, face, hair, glasses, pale "
        "pink headphones, jacket, crop top, pose and body angle stay exactly as drawn. Change only two things: 1) fill the deep "
        "blue night sky with stars: many small white stars and a few brighter four-pointed ones, drawn in white pencil, thickest "
        "high in the sky and thinning towards the clouds. 2) make her trousers loose, baggy cargo trousers like the ones in image "
        "2: very dark, between navy blue and black, a wide relaxed fit with big cargo pockets on the thighs, a black belt, and "
        "the long orange strap hanging down the front from the belt. Use image 2 only for the trousers, belt and strap; do not "
        "copy image 2's face, pose or framing. Keep everything else exactly as in image 1, in the same loose coloured-pencil "
        "style. No text, no border."),
    # as rare_stars_anime_pants, but image 2 = the owner's trousers-only crop (pants_ref2, cut above the knee so the model
    # keeps the hip-level framing); very baggy parachute/jogger cargo trousers, near-black navy, cinched at the ankle
    "rare_stars_baggy_pants": ("Edit image 1. Do not change the camera, the framing or her: her head, face, hair, glasses, pale "
        "pink headphones, jacket, crop top, pose and body angle stay exactly as drawn, with her arms down at her sides. The "
        "picture still ends at her upper thighs exactly as in image 1: do not zoom out, do not show her knees or feet. Change "
        "only two things: 1) fill the deep blue night sky with stars: many small white stars and a few brighter four-pointed "
        "ones, drawn in white pencil, thickest high in the sky and thinning towards the clouds. 2) make her trousers like the "
        "trousers in image 2, but near-black navy whatever their colour in image 2: very baggy parachute/jogger-style cargo "
        "trousers, loose and billowy through the hip and thigh, with side cargo pockets, soft matte fabric with deep drape "
        "folds (they are gathered and cinched at the ankle, below the bottom edge of the picture); a black belt, and the long "
        "orange strap still hanging down the front from the belt. Only copy the trousers from image 2; do not copy anything "
        "else from it. Keep everything else exactly as in image 1, in the same loose coloured-pencil style. No text, no "
        "border."),
    "dusk_fix": ("Edit image 1, keeping it the same drawing, framing, style and red dusk light, and keeping her face, head size, "
        "hair, glasses, jacket and pose exactly as they are. " + NO_GLASSES_SHADOW + "Change nothing else. No text, no border."),
}


# 0:44 · her round-4 note on hook1 (jade_loc): "relight her: erase the shadow from her glasses, natural skin colour, like her
# 2:08 shot but in broad daylight", and a looser sketch at the edges of the Hill Country. Applied to the take's first frame; the
# take itself is relit frame by frame from this still (tools/jade_relight.py), so her lips and timing stay the approved take's.
FIXES["daylight"] = ("Edit image 1, keeping it the same pencil drawing on cream paper with the same framing and composition, and "
    "keeping her exactly as she is drawn: every pencil line of her face, her head size and shape, high forehead, eyebrows, "
    "glasses, hair, pink headphones, jacket, pose, size and position. Do not redraw, move, resize, beautify or restyle her; no "
    "makeup. Make four changes only. 1) Broad daylight instead of golden hour: a clear sunny early afternoon, the sun high "
    "and out of the picture, a pale clear blue sky, the hills and grass in their natural daylight greens and straw colours, "
    "no low sun, no orange glow. 2) Light her as she would really be lit standing in that daylight: soft, even, natural light on "
    "her face from the front and above, and give her face, neck and hand a natural skin colour in light coloured pencil, as in "
    "a coloured portrait drawing, not grey. 3) " + NO_GLASSES_SHADOW.replace("Remove that shadow", "Remove that shadow "
    "completely: no dark band or grey patch under the lenses") + "4) Toward the left, right and bottom edges of the picture, "
    "draw the Hill Country more loosely: quicker, freer graphite and coloured-pencil strokes, much less detail, simplified "
    "shapes, more bare paper showing, strokes trailing off unfinished right at the edges, like a sketch around a finished "
    "figure; near her it stays as it is. She stays the most finished thing in the picture. No text, no border.")

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
