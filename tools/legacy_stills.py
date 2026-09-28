"""Stills for the 'what came next' montage, installed as one-frame plates (video/plates/leg_*/f0001.jpg).

The renderer redraws them in pencil like any other plate (they boil with the drawing clock).
"""
import sys, json, pathlib, concurrent.futures as cf
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cfai
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PL = ROOT / "video" / "plates"
LOOK = "Photorealistic, cinematic, 35mm film, hard directional light, clean composition with empty space on the left third for a title. No text, no logos, no flags."
STILLS = {
    "leg_gemini": "June 1965: an astronaut in a white 1960s spacesuit with a gold visor floats on a gold-wrapped tether above the blue Earth beside the open hatch of a small black-and-white two-seat capsule, holding a small hand-held thruster. " + LOOK,
    "leg_moon": "A single astronaut boot print pressed into grey lunar dust in the foreground; beyond the curved lunar horizon the blue and white Earth hangs in the black sky. " + LOOK,
    "leg_handshake": "1975, in orbit: inside a narrow docking tunnel between two spacecraft, two gloved hands clasp in a firm handshake, one sleeve with a Soviet-style patch shape and one with an American-style patch shape (no readable insignia), warm cabin light. " + LOOK,
    "leg_station": "A large modern space station with long golden solar arrays and white modules seen over the curved Earth at the moment of orbital sunrise, a thin band of orange and blue light along the horizon. " + LOOK,
    "leg_commercial": "2024: a person in a sleek modern white spacesuit stands half out of an open hatch on top of a modern gumdrop-shaped crew capsule above the curved Earth, one arm raised, the sun rising on the horizon. " + LOOK,
    "leg_artemis": "2026: a modern crew capsule with four solar-array wings on its service module flies past the grey cratered limb of the Moon while the small blue Earth sets behind the lunar horizon. " + LOOK,
    "leg_next": "Night on a grassy hilltop: a young girl holds up a colored-pencil drawing of a rocket toward a starry sky, while far away a real rocket's glowing plume rises above the horizon. " + LOOK,
}


def one(k):
    out = ROOT / "media" / "stills" / f"{k}.png"
    if not out.exists():
        cfai.gen("google/nano-banana-pro", {"prompt": STILLS[k], "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}, out, tag="legacy")
    d = PL / k; d.mkdir(parents=True, exist_ok=True)
    Image.open(out).convert("RGB").resize((960, 540), Image.LANCZOS).save(d / "f0001.jpg", quality=92)
    return k


if __name__ == "__main__":
    ks = sys.argv[1:] or list(STILLS)
    with cf.ThreadPoolExecutor(7) as ex:
        done = list(ex.map(one, ks))
    idx_path = PL / "index.json"
    idx = json.loads(idx_path.read_text()) if idx_path.exists() else {}
    for k in done:
        idx[k] = {"n": 1, "fps": 24, "w": 960, "h": 540, "take": "still", "mattes": False}
    idx_path.write_text(json.dumps(idx, indent=1))
    print("installed", done)
