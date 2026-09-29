"""Fade the location behind her so her drawing carries the frame (the film's white-page look), keeping her at full strength.

    python3 tools/jade_fade.py <in.jpg|in.mp4> <out> [fade] [--head]

--head keeps only her face and hair (her pick: the jacket may fade too, and the film's pencil draws it).

A person matte (MediaPipe selfie multiclass segmenter; works on her pencil drawing) keeps her; everything else is lifted
toward the paper: out = paper - (paper - px) * (matte + (1 - matte) * fade). Mattes are smoothed over time for video.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import numpy as np, cv2, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
MODEL = "/tmp/work/models/selfie_multiclass.tflite"
_seg = None


def matte(rgb, head_only=False):
    global _seg
    if _seg is None:
        _seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=MODEL), output_confidence_masks=True))
    r = _seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)))
    bg = r.confidence_masks[0].numpy_view()          # class 0 = background
    m = np.zeros_like(bg, np.float32) if head_only else (1 - bg).astype(np.float32)
    # the segmenter finds her jacket but not her pencil face and hair; the face landmarker does find the face, so the head is
    # the face oval widened for her hair, joined (convex hull) to the jacket just below it for the neck and falling hair
    import jade_forehead as JF, jade_location as JL
    fr = JF.landmarker().detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)))
    if fr.face_landmarks:
        h, w = m.shape
        L = fr.face_landmarks[0]
        P = np.array([[L[i].x * w, L[i].y * h] for i in JL.FACE_OVAL])
        c = P.mean(0); c[1] -= (P[:, 1].max() - P[:, 1].min()) * .1
        P = c + (P - c) * [1.5, 1.45]
        rx = (P[:, 0].max() - P[:, 0].min()) / 2
        ys, xs = np.nonzero(m > .5)
        near = (np.abs(xs - c[0]) < rx * 1.1) & (ys < P[:, 1].max() + rx * .8)
        pts = (P if head_only else np.concatenate([P, np.stack([xs[near], ys[near]], 1)])).astype(np.int32)
        hm = np.zeros_like(m); cv2.fillConvexPoly(hm, cv2.convexHull(pts), 1.0)
        # inside that shape keep only her uncoloured pencil: the landscape drawn in the gaps is warm-coloured
        sat = cv2.cvtColor(np.ascontiguousarray(rgb), cv2.COLOR_RGB2HSV)[..., 1].astype(np.float32) / 255
        sat = cv2.GaussianBlur(sat, (0, 0), 4)
        hm *= 1 - np.clip((sat - .14) / .14, 0, 1)
        m = np.maximum(m, hm)
    return cv2.GaussianBlur(m, (0, 0), 6)


def fade(rgb, m, f=.3):
    rgb = rgb.astype(np.float32)
    paper = np.percentile(rgb.reshape(-1, 3), 97, axis=0)
    k = (m + (1 - m) * f)[..., None]
    return np.clip(paper - (paper - rgb) * k, 0, 255).astype(np.uint8)


def main(src, out, f=.3, head_only=False):
    if src.endswith(".mp4"):
        cap = cv2.VideoCapture(src); fs = []
        while True:
            ok, fr = cap.read()
            if not ok: break
            fs.append(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
        ms = np.array([matte(fr, head_only) for fr in fs])
        ms = np.array([ms[max(0, i - 2):i + 3].mean(0) for i in range(len(ms))])   # steady the edge over ~0.2 s
        h, w = fs[0].shape[:2]
        vw = cv2.VideoWriter(out, cv2.VideoWriter_fourcc(*"mp4v"), 24, (w, h))
        for fr, m in zip(fs, ms):
            vw.write(cv2.cvtColor(fade(fr, m, f), cv2.COLOR_RGB2BGR))
        vw.release()
    else:
        rgb = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB)
        cv2.imwrite(out, cv2.cvtColor(fade(rgb, matte(rgb, head_only), f), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(out)


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    main(a[0], a[1], float(a[2]) if len(a) > 2 else .3, "--head" in sys.argv)
