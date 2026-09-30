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
# round 2 (docs/ROUND2_PLAN.md, facts in docs/FACTS.md §5–6): accuracy regenerations and new montage items
STILLS.update({
    "leg_station": "The International Space Station, the whole station seen from a distance against black space above the curved Earth at the moment of orbital sunrise: "
        "one long straight horizontal central truss with four pairs of huge golden-orange solar array wings, two pairs at each end, spread symmetrically above and below the truss; "
        "white radiator panels; a cluster of white and silver cylindrical pressurised modules crossing the middle of the truss at right angles, with a small crew capsule docked at one end. "
        "Instantly recognisable ISS silhouette, not cropped. A thin band of orange and blue light along the horizon. " + LOOK,
    "leg_commercial": "12 September 2024, Polaris Dawn, the first commercial spacewalk, about 700 km above the Earth. Seen from slightly above and to one side: the conical, gumdrop-shaped top of a white SpaceX Crew Dragon capsule, "
        "its forward nose cone swung open on its hinge like a lid, revealing the round hatch at the apex of the cone. A person in a slim, mostly white SpaceX EVA spacesuit with dark grey accents and a white helmet with a lowered gold-bronze visor "
        "emerges from that apex hatch only up to the waist, legs still inside the capsule, one gloved hand gripping 'Skywalker', a small truss-like metal frame of handholds fixed in the hatch opening, the other arm raised. "
        "A thin white umbilical hose runs from the suit back down into the hatch; the suit has no backpack. The curved blue Earth far below, black sky, hard sunlight from the side. "
        "Absolutely no lettering, logos, insignia or flags anywhere on the capsule, frame or suit. " + LOOK,
    "leg_yang_liwei": "15 October 2003, Shenzhou 5, China's first crewed spaceflight: inside the cramped bell-shaped re-entry capsule in orbit, curved padded grey walls close around him, "
        "one astronaut, a Chinese man in his late thirties, in a white launch-and-entry pressure suit with blue stripes and a soft white hood-helmet with the visor raised, lies in a reclined, "
        "body-contoured couch (not an aircraft seat) with his knees raised, a calm, quiet smile; weightless, a pencil and a checklist on a cord float beside him; one small round porthole above him shows the blue Earth. "
        "No windscreen, no aircraft cockpit, only small instrument panels close in front of him. Only one person in the cabin. " + LOOK,
    "leg_philae": "12 November 2014: the small ESA Philae lander, a boxy body covered in dark solar cells on three thin spindly legs, rests slightly tilted on the dark, dusty, boulder-strewn surface "
        "of comet 67P/Churyumov-Gerasimenko beside a jagged grey cliff; low harsh sunlight, long black shadows, faint jets of dust rising from the nucleus, deep black sky. " + LOOK,
    "leg_change4": "3 January 2019, the first landing on the far side of the Moon, in Von Karman crater: the Chinese Chang'e 4 lander, a box wrapped in gold foil on four legs with its solar panels open, "
        "stands on grey regolith while the small six-wheeled Yutu-2 rover with two blue solar wings drives away from it, leaving fresh wheel tracks in the dust. "
        "Black sky with no Earth in it (the far side never faces the Earth). Low sun, long shadows. " + LOOK,
    "leg_chandrayaan3": "23 August 2023, Chandrayaan-3 near the lunar south pole: a wide landscape of grey cratered regolith that runs unbroken across the whole frame under a black sky, very low grazing sunlight, extremely long shadows. "
        "In the right half of the frame the Indian Vikram lander, a squat box wrapped in gold and silver foil on four splayed legs with a solar panel on one side, stands on the surface; "
        "the small six-wheeled Pragyan rover with a single solar panel rolls down a ramp from the lander onto the dust. The left third is open empty moonscape and black sky. No Earth in the sky, no stars, no black bars or borders. "
        "Photorealistic, cinematic, 35mm film, hard directional light. No text, no logos, no flags.",
    "leg_survivors": "Documentary press photograph, 20 March 1965, the Ural taiga after the rescue. Waist-up two-shot of the two Soviet cosmonauts, faces clearly readable and closely matching the reference images: "
        "Alexei Leonov (first reference: 30 years old, broad face, light brown hair combed back, clean-shaven with two days' fair stubble) and Pavel Belyayev (second reference: 39, lean face, dark receding hair, dark stubble). "
        "They stand shoulder to shoulder in the snow among spruce trees, in warm borrowed winter clothes: sheepskin coats with the collars turned up, fur hats with ear flaps (no badges). "
        "Exhausted, red-cheeked from the cold, a quiet, restrained smile, dignified, looking just past the camera. Smoke from a log fire drifts behind them. Muted 1960s colour film, grain, soft overcast light. "
        "Only these two men. Framed with generous headroom: the snowy spruce forest and the soft overcast sky continue naturally above their heads, "
        "one continuous photograph with no bands, borders, panels or collage edges. No text, no logos, no flags.",
})

# round 3 (2026-09-30): Tiangong, an action shot for China's first spacewalk (replaces the lying-down leg_yang_liwei), Curiosity's sky crane
STILLS.update({
    "leg_tiangong": "China's Tiangong space station in its completed T-shaped configuration, seen whole from a distance against black space above the curved blue Earth: "
        "the long white cylindrical Tianhe core module runs vertically through the middle as the stem of the T; at its forward end a spherical docking node, from which the two "
        "equally long white laboratory modules, Wentian and Mengtian, extend straight out to the left and to the right, forming the crossbar of the T. At the outer end of each laboratory module "
        "a pair of very long, narrow, flexible dark-blue solar array wings, one wing on each side, together spanning far wider than the station; two smaller dark-blue solar wings on the Tianhe core module. "
        "A small white Shenzhou crew spacecraft (bell-shaped capsule with its own small solar wings) docked at the node, and a white Tianzhou cargo ship docked at the aft end of the core module. "
        "Instantly recognisable silhouette, not cropped, crisp sunlight. The station sits in the right two thirds of the frame; the curved Earth's limb runs unbroken across the whole width of the frame at the bottom, "
        "one continuous photograph with no bands, panels, borders or straight edges. " + LOOK,
    "leg_shenzhou7": "27 September 2008, Shenzhou 7, China's first spacewalk: Chinese astronaut Zhai Zhigang floats half out of the round open hatch of the Shenzhou orbital module "
        "(a white, rounded module with handrails, no solar panels on it) above the curved blue Earth, in the white Chinese Feitian spacesuit: a bulky semi-rigid white suit with an integrated white backpack, "
        "a white helmet with a gold sun visor raised over a clear visor, a small chest control box, white gloves. He holds up a small red Chinese national flag on a short stick in his right hand "
        "and waves it toward the camera, his left glove gripping a yellow handrail beside the hatch. Behind him, in the hatch opening, the helmet and shoulders of a second astronaut in a white suit with blue and red stripes. "
        "Dynamic, joyful, hard sunlight, black sky. The small red flag is the only flag; no other text, logos or lettering. "
        "Photorealistic, cinematic, 35mm film, hard directional light, clean composition with empty space on the left third for a title.",
    "leg_curiosity": "6 August 2012, the sky crane landing of NASA's Curiosity rover in Gale Crater on Mars: seen from the side, low above the reddish-tan gravelly plain, "
        "the rocket-powered descent stage (a squat, boxy frame with four thrusters firing downward in faint plumes, kicking up swirls of red dust) hovers about eight metres above the ground "
        "and lowers the car-sized six-wheeled Curiosity rover on three thin nylon cables and an umbilical; the rover's six wheels are unfolded and just about to touch the dust, its mast and the "
        "white finned power unit at its back visible. Mount Sharp rises hazy in the background under a butterscotch-pink sky. " + LOOK,
})
REFS = {"leg_survivors": ["media/chars/leonov_faces.png", "media/chars/belyayev_faces.png"]}


def one(k):
    out = ROOT / "media" / "stills" / f"{k}.png"
    if not out.exists():
        inp = {"prompt": STILLS[k], "aspect_ratio": "16:9", "output_format": "png", "image_size": "2K"}
        if k in REFS:
            inp["image_input"] = [cfai.data_uri(str(ROOT / r)) for r in REFS[k]]
        cfai.gen("google/nano-banana-pro", inp, out, tag="legacy")
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
