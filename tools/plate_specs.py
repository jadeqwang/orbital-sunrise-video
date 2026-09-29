"""Seedance plate specs. Plates are reference footage only: the renderer redraws them in pencil.

Prompts favour traceable pictures: hard directional light, clean silhouettes against black space,
readable motion, one clear action per plate. Reference images are addressed by their order.
"""
import pathlib, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import cfai

ROOT = pathlib.Path(__file__).resolve().parent.parent
R = {
    "LT": "media/chars/leonov_turnaround.png", "LF": "media/chars/leonov_faces.png",
    "BT": "media/chars/belyayev_turnaround.png", "BF": "media/chars/belyayev_faces.png",
    "SHIP": "media/env/env_voskhod2_orbit.png", "CAB": "media/env/env_capsule_interior.png",
    "TUBE": "media/env/env_volga_tube.png", "TAIGA": "media/env/env_taiga_landing.png",
}
_cache = {}


def ref(key):
    p = R.get(key, key)
    if p not in _cache:
        _cache[p] = cfai.data_uri(str(ROOT / p))
    return _cache[p]


LOOK = ("Photorealistic, shot on 35mm film, IMAX documentary realism in the spirit of Apollo 11 (2019) and Gravity. "
        "Accurate 1965 Soviet hardware: the white Berkut spacesuit with rust-orange harness straps, a white helmet with red CCCP letters above the visor, "
        "Soviet markings only. Hard directional sunlight, deep black space, crisp silhouettes. No on-screen text, no captions.")
LEO = "the cosmonaut Alexei Leonov (face and suit exactly as in the first two reference images)"
BEL = "the commander Pavel Belyayev (face and suit exactly as in his reference images)"

PLATES = {
    # ---------------- intro / hook 1 ----------------
    "hero_sunrise": dict(duration=10, refs=["LT", "LF", "SHIP"], prompt=
        f"{LEO} floats weightless in open space a few metres from the Voskhod-2 spacecraft (third reference), attached by a long coiled white umbilical tether. "
        "Orbital night: the Earth below is a dark disc with a thin glowing blue line along its horizon. After two seconds the sun breaks over the horizon behind him on the right: "
        "a blinding white-gold star, a thin layered band of red, orange, gold and blue light spreading along the curve of the atmosphere, and hard golden light sweeping across his suit. "
        "He slowly spreads his arms in wonder, drifting and turning a little. Slow steady camera push-in and gentle orbit around him. " + LOOK),
    "airlock_exit": dict(duration=8, refs=["LT", "LF", "SHIP"], prompt=
        f"Wide shot outside the Voskhod-2 spacecraft (third reference) in orbit. The outer hatch of the inflatable Volga airlock cylinder is open. {LEO} emerges from the airlock: "
        "first his helmet and shoulders, then he pushes gently off the rim and drifts out into the void, the white umbilical tether uncoiling behind him. "
        "The sunlit Earth fills the bottom of the frame, clouds and the Black Sea coast; black sky above. Locked-off camera with a very slow drift. " + LOOK),
    "glove_cu": dict(duration=5, refs=["LT", "LF"], prompt=
        f"Extreme close-up of the right glove of {LEO}'s white Berkut spacesuit floating against black space, the bright blue Earth out of focus far below. "
        "The fingers flex slowly and stiffly, fighting the pressure; the fabric of the glove and cuff swells and creases tighten as the suit inflates. "
        "Hard raking sunlight from the left, deep shadows. Macro lens, very slow push-in. " + LOOK),
    "visor_cu": dict(duration=6, refs=["LF", "LT"], prompt=
        f"Tight close-up of {LEO}'s face behind the clear visor of his white helmet (red CCCP above the visor) during the spacewalk. "
        "The curved glass reflects the blue Earth and the spacecraft. He breathes hard, a faint mist forms and fades on the inside of the visor, "
        "his eyes wide with wonder, then a flicker of worry as he realises he cannot feel his hands. Sunlight on one side of his face, the other side in shadow. Slow push-in. " + LOOK),
    "visor_sunrise": dict(duration=5, refs=["LF", "LT"], prompt=
        f"Extreme close-up on the curved visor of {LEO}'s white helmet. The orbital sunrise is reflected in the glass: a burst of white-gold light sweeps across the visor "
        "with thin bands of orange and blue; behind the reflection his eyes squint against the blaze and then widen. Golden light floods the helmet rim. Locked-off camera. " + LOOK),
    "ship_wide_sunrise": dict(duration=8, refs=["SHIP", "LT"], prompt=
        "Extremely wide shot: the Voskhod-2 spacecraft (first reference) small in the upper part of frame with a tiny cosmonaut in a white suit floating on a long tether beside it, "
        "above the enormous curve of the Earth. The sun sits exactly on the horizon: a thin layered arc of atmosphere glowing crimson, orange, gold, white and deep blue stretches along the whole limb. "
        "Clouds catch the first light. Very slow drift. " + LOOK),
    "reach_home": dict(duration=5, refs=["LT", "LF"], prompt=
        f"Over-the-shoulder shot of {LEO} floating in space, his right glove stretched toward the huge sunlit blue Earth below as if trying to touch it; "
        "the umbilical tether floats in a loose curve. Golden sunrise light from the right. Slow push-in past his shoulder toward the Earth. " + LOOK),
    # ---------------- swell / pre-chorus ----------------
    "camera_reach": dict(duration=6, refs=["LT", "LF"], prompt=
        f"Medium shot of {LEO} floating on his tether. He tries to reach down to a camera switch on his thigh, but his ballooned, rigid suit will not let him bend: "
        "his arm stops short, he strains, twists, tries again, and fails. The Earth rolls slowly behind him. Handheld documentary feel. " + LOOK),
    "suit_balloon": dict(duration=6, refs=["LT"], prompt=
        "Close-up detail of a white Berkut spacesuit in vacuum: the torso and knees visibly swell and stiffen as the suit balloons, the fabric pulls tight, the rust-orange harness straps strain "
        "and creak, the glove fingers splay apart. Hard sunlight, black background. Slow push-in along the suit. " + LOOK),
    "airlock_fail": dict(duration=8, refs=["LT", "LF", "SHIP"], prompt=
        f"{LEO} pulls himself hand over hand along the tether back to the open mouth of the Volga airlock cylinder (third reference). He tries to enter feet first, "
        "but his swollen rigid suit jams against the rim; he pushes back out, turns, struggles. Desperate, physical, the Earth wheeling below. Handheld camera close to the action. " + LOOK),
    "valve_bleed": dict(duration=6, refs=["LT", "LF"], prompt=
        f"Close-up: the gloved hand of {LEO} twists a small pressure valve on the sleeve of his white Berkut suit. Fine white wisps of escaping air hiss out into vacuum and vanish. "
        "Cut-in to his face behind the visor: sweat on his forehead, jaw clenched, eyes fixed, breathing in slow controlled breaths. Hard sunlight. " + LOOK),
    "tumble_slow": dict(duration=6, refs=["LT", "LF"], prompt=
        f"{LEO} drifts alone in slow motion, tumbling end over end at the full length of his tether, a lone white figure against the black void and the blue curve of the Earth. "
        "Eerie calm, like a slow dance. The camera slowly circles him. " + LOOK),
    "headfirst": dict(duration=6, refs=["LT", "LF", "SHIP"], prompt=
        f"From behind and slightly above: {LEO} dives head first into the narrow round opening of the Volga airlock cylinder, arms stretched ahead, "
        "squeezing his swollen suit through the rim, boots kicking, until only his legs remain outside. Hard sunlight, black space, the Earth below. " + LOOK),
    "tube_turn": dict(duration=8, refs=["TUBE", "LF", "LT"], prompt=
        f"Inside the narrow Volga airlock tube (first reference): {LEO} is crammed inside head first. Claustrophobic close shots: he twists and folds his body to turn around in a space barely wider than his shoulders, "
        "face drenched in sweat behind the visor, breathing hard. He finally reaches the outer hatch, grips the handle and pulls it shut; the light from outside narrows to a sliver and goes dark. " + LOOK),
    # ---------------- hook 2 / drop 1 ----------------
    "porthole_sunrise": dict(duration=6, refs=["CAB", "LF", "LT"], prompt=
        f"Inside the cramped Voskhod-2 capsule (first reference), close on {LEO}, helmet still on with the visor raised, exhausted and soaked in sweat, turning to a small round porthole. "
        "Through the porthole the orbital sunrise blazes: a white-gold sun on the curved horizon with thin bands of orange and blue. Golden light pours through the window across his face; "
        "he closes his eyes in relief. Symmetrical composition centred on the porthole. " + LOOK),
    "helmet_off": dict(duration=6, refs=["CAB", "LF", "LT", "BF"], prompt=
        f"Inside the Voskhod-2 capsule (first reference): {LEO} lifts off his white helmet, hair plastered with sweat, and lets it float; beside him {BEL} grips his shoulder. "
        "Warm light from the instrument panel and a porthole. Weightless details: a pencil and a loose cable drift past. Documentary close framing. " + LOOK),
    "airlock_jettison": dict(duration=6, refs=["SHIP"], prompt=
        "Exterior, low Earth orbit: the empty inflatable Volga airlock cylinder separates from the side of the Voskhod-2 spacecraft (reference) with a small puff of gas, "
        "and tumbles slowly away end over end toward the sunrise on the Earth's horizon, catching the golden light. The spacecraft stays in the foreground. Slow camera pan following the airlock. " + LOOK),
    "capsule_glide": dict(duration=8, refs=["SHIP"], prompt=
        "Exterior, low Earth orbit: the Voskhod-2 spacecraft (reference, airlock gone) glides steadily over the curved Earth from left to right toward the night side; "
        "the terminator line of darkness moves across the planet below, city lights beginning to appear, the thin blue atmosphere glowing on the horizon. Camera tracks alongside. " + LOOK),
    "leonov_turn": dict(duration=5, refs=["LF", "LT"], prompt=
        f"Studio portrait in motion: {LEO}, helmet off, in the white Berkut suit collar ring, turns his head from profile to face the camera and breaks into a warm, confident grin. "
        "Pure black background, a single hard key light from the upper left and a thin orange rim light. Centered, symmetrical, like a music-video member introduction. " + LOOK),
    "belyayev_turn": dict(duration=5, refs=["BF", "BT"], prompt=
        f"Studio portrait in motion: {BEL}, helmet off, in the white Berkut suit collar ring, turns his head from profile to face the camera with a calm, steady, serious look and a faint nod. "
        "Pure black background, a single hard key light from the upper left and a thin blue rim light. Centered, symmetrical, like a music-video member introduction. " + LOOK),
    "drawing_pencils": dict(duration=8, refs=["CAB", "LF", "LT"], prompt=
        f"Inside the Voskhod-2 capsule: {LEO}, gloves off, sketches on a small sheet of white paper pressed against his knee with a colored pencil. A bundle of colored pencils "
        "floats weightless around his wrist, each tied to a string on his wrist. On the paper: the curve of the Earth and a band of colors, the sunrise. Warm light from a porthole. "
        "Close-up of his hand and the paper, then a slow tilt up to his absorbed face. " + LOOK),
    "globus": dict(duration=5, refs=["CAB"], prompt=
        "Extreme close-up of the 'Globus' navigation instrument on the Voskhod-2 instrument panel (reference): a small metal-and-glass globe in a round window slowly rotating, "
        "brass meridian rings, a tiny crosshair marking the spacecraft's position, dials and toggle switches around it lit by warm panel lamps. Slow push-in. " + LOOK),
    # ---------------- build / hook 3 ----------------
    "red_warning": dict(duration=6, refs=["CAB", "BF", "LF"], prompt=
        f"Inside the Voskhod-2 capsule: a red warning lamp on the instrument panel starts flashing, bathing the cramped cabin in pulsing red light. {BEL} and {LEO} snap their heads toward the panel, "
        "alarmed, then exchange a look. Needles on the dials swing. Tense handheld close-ups. " + LOOK),
    "vzor_manual": dict(duration=8, refs=["CAB", "BF", "LF", "LT"], prompt=
        f"Inside the Voskhod-2 capsule, the first manual re-entry: {BEL} has left his seat and lies stretched across both seats on his side, his face pressed to the round Vzor optical porthole in the floor "
        f"to line the ship up with the horizon, while {LEO} braces him and holds him in place with both arms. Sunlight spins slowly across them through the porthole. Cramped, sweaty, concentrated. " + LOOK),
    "retrofire": dict(duration=5, refs=["SHIP"], prompt=
        "Exterior, low Earth orbit, close on the rear of the Voskhod-2 spacecraft (reference, airlock gone): the retro-rocket engine ignites with a violent orange flame and white exhaust plume, "
        "the whole spacecraft shudders and begins to fall toward the curved Earth below. Night side of the planet, the flame lighting the hull. " + LOOK),
    "capsule_spin": dict(duration=6, refs=["SHIP"], prompt=
        "Exterior: the spherical Voskhod-2 descent capsule has separated from the instrument module but is still tethered to it by a bundle of cables; the two pieces whirl around each other, "
        "spinning wildly, above the curved Earth, the sun flashing past on every turn. Then the cables burn through and the capsule tumbles free. Dramatic, chaotic motion. " + LOOK),
    "g_force": dict(duration=6, refs=["CAB", "LF", "BF"], prompt=
        f"Inside the Voskhod-2 capsule during re-entry: {LEO} and {BEL} are crushed back into their seats by ten g of deceleration, faces pulled and distorted, teeth clenched, the cabin vibrating violently. "
        "Through the small porthole, orange plasma fire roars past, flooding the cabin with flickering orange light. " + LOOK),
    "reentry_fire": dict(duration=8, refs=["SHIP"], prompt=
        "Exterior, re-entry: the spherical Voskhod-2 descent capsule (reference) plunges into the upper atmosphere, heat shield first, wrapped in a blazing envelope of orange, gold and white plasma, "
        "a long glowing trail of fire and sparks streaming behind it, the dark curve of the Earth below. The capsule shakes and burns like a falling star. Camera tracks with it. " + LOOK),
    # ---------------- drop 2 / outro ----------------
    "parachute": dict(duration=8, refs=["TAIGA", "SHIP"], prompt=
        "High in a pale grey-blue sky above a layer of clouds: the scorched spherical Voskhod-2 capsule swings beneath a huge orange-and-white striped parachute that has just blossomed open, "
        "the canopy billowing and snapping full, lines taut, the capsule pendulum-swinging. Camera circles the parachute from below. " + LOOK),
    "descent_forest": dict(duration=10, refs=["TAIGA"], prompt=
        "Aerial view looking down past the orange-and-white parachute canopy and the swinging spherical capsule toward an endless snow-covered Ural taiga forest, "
        "dark fir trees and white snow as far as the horizon, no roads, no clearings, overcast March light. Slow spiralling descent, the trees getting closer. " + LOOK),
    "treetops": dict(duration=5, refs=["TAIGA"], prompt=
        "The spherical Voskhod-2 capsule under its parachute drops toward snowy fir treetops; at the last moment its soft-landing rockets fire with a burst of flame and snow, "
        "and it crashes down between two tall firs into deep snow, snow exploding up in a white cloud, branches whipping. Low angle from the snow. " + LOOK),
    "hatch_exit": dict(duration=8, refs=["TAIGA", "LF", "LT"], prompt=
        f"Deep snow in the silent Ural taiga at dusk, the scorched Voskhod-2 capsule (first reference) lying between fir trees. Its round hatch pops open; {LEO}, helmet off, climbs out "
        "and sinks thigh-deep into the snow, breath steaming, looking around at the endless forest. Snow drifting down. " + LOOK),
    "two_men_snow": dict(duration=7, refs=["TAIGA", "LF", "LT", "BF"], prompt=
        f"The Ural taiga at dusk: {LEO} and {BEL} stand in deep snow beside the scorched capsule and the parachute draped in the trees, in their white suits, breath steaming. "
        "They look up at the darkening sky, then at each other, and laugh with exhausted relief; Leonov claps Belyayev on the shoulder. Snowflakes falling. " + LOOK),
    "fire_night": dict(duration=8, refs=["TAIGA", "LF", "BF"], prompt=
        f"Night in the frozen taiga: {LEO} and {BEL}, wrapped in pieces of the orange parachute, sit close to a small crackling fire in the snow beside the dark capsule. "
        "Beyond the firelight, between black tree trunks, pairs of wolves' eyes glint in the darkness. Sparks rise into falling snow. " + LOOK),
    "drawing_survives": dict(duration=6, refs=["TAIGA", "LF", "LT"], prompt=
        f"By firelight in the snowy forest at night, {LEO} pulls a small folded sheet of paper from inside his suit, unfolds it with stiff cold fingers and looks at it: "
        "a colored-pencil drawing of an orbital sunrise, bands of color over the curve of the Earth. He smiles. Close-up on his hands and the drawing, then his face. " + LOOK),
    "rescue": dict(duration=8, refs=["TAIGA", "LF", "BF"], prompt=
        "Morning in the snowy Ural taiga: a helicopter hovers over the treetops dropping supplies in a swirl of snow, while rescuers on skis in dark winter coats glide between the firs "
        "toward two cosmonauts in white suits standing by the capsule, waving. Joyful, cold, bright overcast light. " + LOOK),
}

# ---------------- the singer (Jade, now) — lip-sync plates: the song segment is the audio reference ----------------
R.update({"JT": "media/chars/jade_turnaround.png", "JF": "media/chars/jade_faces.png", "JS": "media/chars/jade_src/Sheet_1_Jade_now.jpg"})
JADE = ("the singer (the woman in the first two reference images: long messy dark hair in a loose high ponytail with strands framing her face, "
        "oversized heather-grey hoodie)")
SING = ("She sings the song in the reference audio, her lips precisely synchronised to every word and breath of the vocal from the first frame to the last; "
        "natural singing mouth shapes, jaw and throat movement.")
LOOK_NOW = ("Photorealistic, shot on 35mm film, cinematic, present day San Francisco. Clear readable face, hard directional light, simple uncluttered background. "
            "No on-screen text, no captions.")
PLATES.update({
    "jade_hook1": dict(duration=5, refs=["JT", "JF", "JS"], audio=["media/audio_refs/jade_hook1.mp3"], generate_audio=True, prompt=
        f"Dawn on a grassy hilltop above San Francisco, the city and the bay far below in low fog. Close-up of {JADE}, facing the rising sun, golden sunrise light on her face, "
        f"wind in loose strands of hair. {SING} She lifts her eyes to the sky on the last word. Slow push-in. " + LOOK_NOW),
    "jade_hook2": dict(duration=5, refs=["JT", "JF", "JS"], audio=["media/audio_refs/jade_hook2.mp3"], generate_audio=True, prompt=
        f"Night, a small cluttered room: {JADE} sits at her desk facing the camera, a warm desk lamp beside her, colored pencils and drawings of a 1960s cosmonaut spread on the desk, "
        f"a dark window with distant city lights behind her. She looks up from her drawing straight toward the lens and sings, clearly and openly mouthing every word. {SING} "
        f"Frontal medium close-up, her whole face visible and lit by the warm lamp, deep shadows around. " + LOOK_NOW),
    "jade_brk": dict(duration=8, refs=["JT", "JF", "JS"], audio=["media/audio_refs/jade_brk.mp3"], generate_audio=True, prompt=
        f"Sunset on the same grassy hilltop above San Francisco: the whole sky has turned deep red and orange. {JADE} stands facing the sky, singing, "
        f"then slowly raises one open hand toward the sky as if reaching for something she can't touch. {SING} Medium close-up, low angle, the red sky behind her, strong rim light. " + LOOK_NOW),
    "jade_art": dict(duration=12, refs=["JS", "JT", "JF"], audio=["media/audio_refs/jade_art.mp3"], generate_audio=True, prompt=
        f"Night at her desk by a window where snow is falling outside: {JADE} draws with colored pencils on a sheet of white paper, sketching the curved horizon of the Earth and a band of sunrise colors. "
        f"She sings softly and intimately while drawing, sometimes looking at her hands. {SING} Alternate between a close-up of her face lit by the warm desk lamp and her hands drawing. " + LOOK_NOW),
    "jade_hook3": dict(duration=12, refs=["JT", "JF", "JS"], audio=["media/audio_refs/jade_hook3.mp3"], generate_audio=True, prompt=
        f"Twilight on the grassy hilltop above San Francisco, just after sunset: the sky is deep blue fading to pale gold along the Pacific horizon, the city below calm with evening lights. "
        f"Far away over the ocean a small rocket climbs on a thin, bright white-gold exhaust trail that arcs high into the sky; high up, still lit by the sun, the exhaust fans out into a delicate, "
        f"translucent, glowing feather of blue and white light like a comet's tail. Peaceful and awe-inspiring: no explosion, no fireball, no smoke clouds, nothing on fire. "
        f"{JADE} stands in the foreground singing with full power, face lifted toward the rocket's trail, lit by the cool twilight. {SING} Medium close-up with the rocket trail behind her, slow push-in. " + LOOK_NOW),
    "jade_hands": dict(duration=8, refs=["JT", "JS"], prompt=
        "Overhead close-up of a woman's hands (grey hoodie sleeves pushed up) drawing with colored pencils on a sheet of white paper on a wooden desk at night under a warm lamp: "
        "she draws the curved horizon of the Earth, then quick strokes of red, orange, yellow and blue along it — an orbital sunrise. Loose colored pencils around the paper. "
        "Steady overhead camera. Photorealistic, 35mm film, no text."),
})

# ---------------- round 2 (docs/ROUND2_PLAN.md; facts from docs/FACTS.md) ----------------
# DRAW is the real drawing (museum photo, white-balanced crop of the card); DRAWPH is the full photo with his pencil kit.
# Both are gitignored (reference only, not redistributed). The earlier reconstruction (media/refs/leonov_drawing_reconstruction.png) was wrong.
R.update({"DRAW": "media/refs/leonov_drawing_real_card.jpg", "DRAWPH": "media/refs/leonov_drawing_real_photo.jpg",
          # Nano Banana still made from CAB + DRAW + DRAWPH (media/genlog.jsonl tag ff:leonov_drawing_hand); gitignored like the photos it copies
          "DRAWFF": "media/refs/leonov_drawing_real_cabin_frame.png"})
LEO2 = "the cosmonaut Alexei Leonov (face and suit exactly as in his reference images)"
DRAWING = ("the drawing is small and loose on a small cream landscape card, with wide blank margins, mostly in the left and middle of the card: one sweeping, slightly curved diagonal band "
           "rising from the lower left to the upper right, made of soft, loose coloured-pencil strokes that run along the band; from its outer (upper) edge inward: a broad black band, "
           "a thin light-blue band, a yellow band, a thin orange-red line with a small red ball of the sun sitting on it near the middle of the band, then several layered blues below "
           "(light blue to deep blue) whose strokes fray out at the lower edge. No Earth disc, no black background, no text, no stars, no spacecraft, no signature")
PENCILS = ("short Soviet 'Taktika' coloured pencils from a flat blue-and-white cardboard box (as in the full photo reference): each pencil is tied with a thin white cotton thread, "
           "the threads gathered to a small ring of green-coated wire")
LOOK_TAIGA = ("Photorealistic, shot on 35mm film, documentary realism. March 1965, the Ural taiga of Perm Oblast: dense snow-covered spruce and pale birch forest, waist-deep snow, "
              "breath steaming at -25 C. A red-orange-and-white parachute hangs snagged in the treetops. Accurate 1965 Soviet details only: no modern clothing or gear, "
              "no orange coveralls, no helmets. Clear readable subjects, uncluttered frame. No on-screen text, no captions.")
LININGS = ("they have pulled off the rigid white outer layers of their spacesuits and wear only the soft, pale off-white quilted thermal linings of the suits, "
           "wrapped round their bodies and tied at the waist, knees and ankles with thin white parachute cord; shaggy fur boots on their feet; "
           "a piece of red-orange-and-white parachute cloth over their shoulders; bare heads, no helmets, no spacesuits; the linings look like thick soft padded sleeping-bag jackets "
           "with no metal neck rings, no metal wrist rings, no harness straps, no orange stripes, no patches, no flags")
PLATES.update({
    "airlock_struggle": dict(duration=8, refs=["LT", "LF", "SHIP"], prompt=
        "Exterior in orbit, side view of the open outer end of the Volga airlock (third reference: a pale fabric cylinder sticking out from the spacecraft, with a round metal rim and a hinged hatch lid at its end). "
        f"{LEO}: his white Berkut suit is ballooned and rigid, puffed tight like a balloon. He is half in the opening: his helmet and shoulders are wedged against the metal rim, which is too narrow for his swollen suit. "
        "He braces one stiff glove against the rim and heaves, strains, twists his shoulders left and right, pulls back out, then shoves again, his legs kicking behind him, and still cannot get through. "
        "One continuous shot, no cuts. Close three-quarter view from just outside the rim, about one and a half metres away: his helmet, shoulders, arms and the metal rim fill the lower two thirds of the frame, "
        "the struggle clearly readable; the upper third of the frame is empty black space, the blue Earth curving along the bottom edge. " + LOOK),
    "valve_bleed": dict(duration=6, refs=["LT", "LF"], prompt=
        f"Tight close-up on the chest of {LEO}'s white Berkut spacesuit during the spacewalk. At the centre of the chest, at the solar plexus below the rust-orange harness straps, "
        "there is a small round blue tap, a pressure-regulator knob the size of a coin, fixed on the suit itself. His right gloved hand comes in, grips the small blue tap and turns it "
        "one slow, deliberate quarter turn, then lets go. The over-inflated suit visibly slackens: the tight fabric of the chest and sleeve softens and creases, "
        "the swollen glove fingers go limp at the tips. No gas jets, no hoses being touched, nothing on the backpack. Hard sunlight from the left, black space, "
        "the blue Earth out of focus at the bottom. Locked-off macro camera. " + LOOK),
    "tube_struggle": dict(duration=8, refs=["TUBE", "LF", "LT"], prompt=
        f"Inside the narrow Volga airlock tube (first reference: pale padded fabric walls, metal hoops, two small lamps), barely one metre wide. {LEO2} in his white Berkut suit is crammed inside, "
        "curling his body round to turn and face the outer hatch: knees and elbows jam against the soft walls, his helmet bumps the fabric, he pushes with his gloves and twists, "
        "folding himself almost double, slow and exhausting. Behind the clear visor his face is drenched in sweat, the visor fogged at the edges, he breathes hard. "
        "His face is strained and grimacing with effort, jaw clenched, never smiling. One continuous shot, no cuts. Warm lamp light, cramped close framing on one figure, handheld camera. " + LOOK),
    "drawing_hand": dict(duration=8, refs=["DRAW", "DRAWPH"], prompt=
        "Steady top-down close-up: a hand draws with coloured pencils on a small cream card lying on a plain grey table, soft even daylight. The hand is making the drawing in the first reference image, "
        "which is partly finished: the layered blues of the lower part of the diagonal band and the thin light-blue band are already there. Holding a black pencil, the hand lays long, loose, "
        "sweeping strokes along the upper edge of the band, from lower left to upper right, building the broad black band; then it picks up a yellow pencil and sweeps the yellow band in below the light blue; "
        "then with a red pencil it draws the thin orange-red line and colours the small red ball of the sun sitting on it near the middle. "
        f"{DRAWING}. Beside the card lie the {PENCILS}. Visible soft pencil strokes and paper tooth. Only the hand and forearm, no face. "
        "Photorealistic, 35mm film. No on-screen text.", faces=False),
    # Animated from a Nano Banana first frame (DRAWFF: the real card on his knee in the cabin). Takes 2-3 were generated from reference images alone
    # (CAB, DRAW, DRAWPH, LT; prompts in media/archive/plates/leonov_drawing_hand_take*.json) and drew the wrong picture on the card.
    "leonov_drawing_hand": dict(duration=8, first_frame="DRAWFF", refs=["DRAW", "DRAWPH"], faces=False, prompt=
        f"Inside the cramped Voskhod-2 capsule, weightless, March 1965: high-angle close-up of the bare right hand of {LEO2} drawing on a small cream card on a log book on his knee, as in the first frame. "
        f"The card shows the drawing in the first reference and it stays exactly as it is: {DRAWING}. With the short red pencil he colours the small red ball of the sun "
        "with a few gentle circular strokes, then lifts his hand away a little so the whole drawing is visible. "
        f"His pencils are the {PENCILS}; the green wire loop is on his bare wrist and the short pencils drift slowly on their white threads in zero gravity. "
        "Warm light from the porthole, the panel soft and out of focus. Locked-off camera with a very slow drift; the card stays in the centre of the frame. Only his hand, no face. " + LOOK),
    "porthole_spin": dict(duration=6, refs=[], prompt=  # no cabin sheet: it shows the crew and trips the real-person filter
        "Inside the Voskhod-2 capsule, point of view through a small round porthole whose thick dark metal frame stays steady in the frame. The spacecraft is tumbling: "
        "through the glass the view sweeps past fast and repeatedly, the blue-white Earth, then black sky, then a hard white flash of the sun, then Earth again, over and over, strobing. "
        "In the last seconds a soft orange glow of plasma starts to build on the outside of the glass and the spinning slows. No people in frame. " + LOOK, faces=False),
    "reentry_outside": dict(duration=8, refs=["SHIP"], prompt=
        "Exterior, re-entry, very wide shot from a distance: the spherical Voskhod-2 descent capsule alone (the ball-shaped cabin from the reference, with no airlock and no equipment module attached; "
        "its small portholes dark, no people visible) is small in the frame, about one sixth of the frame width, in the lower middle, falling into the upper atmosphere high above the curved dark Earth. "
        "A pink-orange plasma sheath builds on its leading side and brightens to orange-white; a long glowing trail streams out behind it across the sky. "
        "The upper half of the frame stays empty black sky. One continuous shot, camera tracks alongside, steady. " + LOOK, faces=False),
    "hatch_tree": dict(duration=8, refs=["TAIGA", "LT"], prompt=
        "Deep snow in the Ural taiga, grey late-afternoon light, snow falling. Locked-off medium shot: the scorched dark spherical Voskhod-2 capsule (first reference) lies in deep snow. "
        "Directly in front of its round hatch stands the thick white trunk of a birch tree with black markings. The round hatch cover, a heavy metal disc, has swung out only a hand's width and is pinned against the white birch trunk. "
        "From inside the capsule the hatch cover is shoved outward again and again: it knocks against the birch trunk and bounces back, the whole capsule rocks slightly with each heave, snow falls from the branches. "
        "Through the narrow gap a white spacesuit glove grips the edge of the hatch. One continuous shot, no cuts, the hatch and the birch clearly readable in the centre. " + LOOK_TAIGA),
    "hatch_free": dict(duration=8, refs=["TAIGA", "LT", "LF", "BF"], prompt=
        "Deep snow in the Ural taiga, grey late-afternoon light. Beside the round hatch of the scorched spherical Voskhod-2 capsule (first reference) stands a thick white birch trunk. "
        "The round hatch cover, pinned against the birch, is shoved free with a last heave and drops into the deep snow. "
        f"{LEO2}, in his white Berkut suit with rust-orange straps, bare-headed with no helmet, climbs out through the round hatch and sinks waist-deep into the soft snow, breath steaming; "
        "he turns and reaches back to help the commander Pavel Belyayev, also in a white spacesuit and also bare-headed (no helmet, no helmet ring around his head), climb out behind him. Only these two men. "
        "One continuous medium-wide shot at snow level, no cuts, the capsule on one side, open snow and forest on the other. " + LOOK_TAIGA),
    "fire_night_v2": dict(duration=8, refs=["TAIGA", "LF", "BF"], prompt=
        f"Night in the frozen Ural taiga. Beside the dark scorched spherical capsule, whose round hatch opening is empty (the hatch cover lies in the snow), {LEO2} and the commander Pavel Belyayev "
        f"sit close together at a small fire in a pit dug in the snow. {LININGS}. They hold their hands to the flames, shivering, and talk quietly. "
        "Sparks rise into falling snow; warm firelight on their faces, black forest behind. Only these two men, no animals. Medium shot, steady camera. " + LOOK_TAIGA),
    "drawing_survives_v2": dict(duration=6, refs=["LF", "DRAW", "TAIGA"], prompt=
        f"Night in the snowy Ural taiga, by a small fire. {LEO2} sits in the snow; he is no longer in his spacesuit: {LININGS}. "
        "He pulls a small folded sheet of white paper from inside the padded lining, unfolds it with stiff cold fingers and looks at it: it is the coloured-pencil drawing in the second reference, "
        f"{DRAWING}. He smiles. Close-up on his hands and the drawing lit by the fire, then tilt up to his face. One continuous shot, no cuts. " + LOOK_TAIGA),
    "rescue_v2": dict(duration=8, refs=["TAIGA", "LF", "BF"], prompt=
        "Morning in the snowy Ural taiga, bright overcast light. Three rescuers on wooden skis, in dark sheepskin coats and fur hats with ear flaps, glide in single file between the spruce trunks, "
        "carrying bundles of warm clothes: sheepskin coats and felt boots. They reach the two cosmonauts, Alexei Leonov and Pavel Belyayev (reference faces), who stand by a smoking fire and the dark "
        f"spherical capsule; {LININGS}. The first skier throws a sheepskin coat over Leonov's shoulders; they embrace. No flags, patches or insignia on anyone's clothing. "
        "One continuous wide shot, no cuts, the skiers coming from the left. " + LOOK_TAIGA),
})

# ---------------- round 2, Jade v3: her real likeness (from her photos) with her glasses; sheets media/chars/jade_v3_* ----------------
R.update({"J3T": "media/chars/jade_v3_turnaround.png", "J3F": "media/chars/jade_v3_faces.png", "J3H": "media/chars/jade_v3_hero.png"})
JADE3 = ("the singer Jade (exactly the woman in the reference images, same face: an East Asian woman around thirty with a round face and full soft cheeks, "
         "thick straight dark eyebrows, a soft broad nose, full lips, and her thin black rectangular metal-frame glasses, which she always wears; "
         "long straight glossy black hair with a centre part and curtain bangs; oversized cropped white flight jacket with orange bands and a small pale-blue dot on the chest, "
         "black ribbed crop top, navy wide-leg cargo pants with orange straps, orange-foam headphones around her neck)")
MEDIUM = "Medium shot, framed from the waist or chest up with space around her; her face never fills the frame, no close-up."
PLATES.update({
    "jade_hook1_v3": dict(duration=5, refs=["J3T", "J3F", "J3H"], audio=["media/audio_refs/jade_hook1.mp3"], generate_audio=True, prompt=
        f"Golden hour on a grassy hilltop above San Francisco, the city and the bay far below in soft haze. {JADE3} stands facing the low sun, warm golden light on her face and glasses, "
        f"wind lifting loose strands of her hair. She sings 'bring me home' up to the sky, lifting her face and eyes to the sky on the last word. {SING} "
        f"{MEDIUM} Slow, gentle push-in that stays medium. " + LOOK_NOW),
    "jade_studio": dict(duration=5, refs=["J3T", "J3F", "J3H"], audio=["media/audio_refs/jade_hook2.mp3"], generate_audio=True, prompt=
        f"A small professional recording studio at night: acoustic foam panels, warm practical lamps, a glowing mixing desk out of focus behind the glass. "
        f"{JADE3}. In this shot, unlike the references, her orange-foam headphones are worn ON HER HEAD: the thin silver headband arches over the top of her head and the round "
        "orange foam pads cover both ears, a thin cable running down from them; nothing around her neck. She keeps her glasses on. She sings into a large-diaphragm studio condenser microphone "
        f"on a stand, with a round black mesh pop filter clipped between the microphone and her mouth, set just below and to one side of her mouth so her whole face stays visible. {SING} "
        f"{MEDIUM} Three-quarter angle, the microphone and pop filter in the foreground of the frame, steady camera. " + LOOK_NOW),
    "jade_brk_v3": dict(duration=8, refs=["J3T", "J3F", "J3H"], audio=["media/audio_refs/jade_brk.mp3"], generate_audio=True, prompt=
        f"Dusk on the grassy hilltop above San Francisco: the whole sky has turned deep red and orange. {JADE3} stands under the red sky singing, her eyes lifted up to the sky, "
        f"her chin raised only a little so her face stays turned three-quarters toward the camera and clearly readable the whole time; "
        f"she slowly raises one open hand toward the sky as if reaching for something she can't touch. {SING} "
        "Medium shot from the chest up, her raised hand entering the frame, space around her head; her face never fills the frame. "
        "Camera at chest height, slightly low, the red sky filling the space behind her, soft warm light on her face, rim light on her hair and glasses. " + LOOK_NOW),
    "jade_notebook": dict(duration=6, refs=["J3T", "J3H", "J3F"], prompt=
        f"Soft daylight from a large window. Over-the-shoulder shot from behind and slightly above her right shoulder: {JADE3} sits at a wooden desk by the window, "
        "writing lyrics with a graphite pencil in an open leather-bound notebook with cream pages. We see her shoulder and the white sleeve of her jacket, her long black hair, "
        "the arm of her glasses and the side of her cheek; the notebook and her hand in the middle of the frame, a few lines of handwriting appearing on the page as she writes. "
        "She pauses, taps the pencil, then writes another line. Calm, intimate, steady camera. Photorealistic, shot on 35mm film, present day. No on-screen text, no captions."),
    "jade_hand_writing": dict(duration=6, refs=["J3T", "J3H"], prompt=
        "Soft daylight from a window. Close-up of a woman's right hand (the white nylon cuff of her cropped flight jacket at the wrist, as in the references) writing lyrics "
        "with a graphite pencil in an open leather-bound notebook with cream paper on a wooden desk. The page fills most of the frame; lines of handwriting in pencil flow "
        "across it as she writes, the pencil tip and the graphite line clearly visible, paper texture, the leather cover at the edges of the frame. "
        "Only the hand, wrist and notebook, no face. Steady, locked-off camera slightly above. Photorealistic, shot on 35mm film. No on-screen text, no captions."),
})

# ---------------- round 2, Jade v4: sheets edited from her own photo (media/chars/jade_v4_*), same scenes as v3 ----------------
R.update({"J4T": "media/chars/jade_v4_turnaround.png", "J4F": "media/chars/jade_v4_faces.png", "J4H": "media/chars/jade_v4_hero.png"})
JADE4 = JADE3.replace("an East Asian woman around thirty with a round face and full soft cheeks, ",
                      "an East Asian woman in her thirties with a broad soft face and full cheeks, visible double eyelid creases, a rounded nose, light freckles, ")
_V4_REF = {"J3T": "J4T", "J3F": "J4F", "J3H": "J4H"}
for _v3, _v4 in [("jade_hook1_v3", "jade_hook1_v4"), ("jade_studio", "jade_studio_v4"), ("jade_brk_v3", "jade_brk_v4"),
                 ("jade_notebook", "jade_notebook_v4"), ("jade_hand_writing", "jade_hand_writing_v4")]:
    _s = dict(PLATES[_v3])
    _s["refs"] = [_V4_REF.get(r, r) for r in _s["refs"]]
    _s["prompt"] = _s["prompt"].replace(JADE3, JADE4)
    PLATES[_v4] = _s
# v4 retakes: studio takes 1-2 had bulky ear-defender cups and the pop filter over her mouth; brk tipped her head far back; notebook lost the jacket's orange band
PLATES["jade_studio_v4"]["prompt"] = PLATES["jade_studio_v4"]["prompt"].replace(
    "cover both ears, a thin cable",
    "cover both ears (slim vintage Walkman-style headphones exactly like the pair in the references: a thin silver wire headband and small flat round orange foam pads, not bulky ear cups, ear defenders or earmuffs), a thin cable").replace(
    "Three-quarter angle, the microphone and pop filter in the foreground of the frame, steady camera.",
    "Three-quarter angle from her open side: the microphone and pop filter are seen side-on at the edge of the frame beside her face, never between the camera and her face; her eyes open, steady camera.").replace(
    "set just below and to one side of her mouth so her whole face stays visible.",
    "set off to one side of her face at chin level, never in front of her mouth: her lips, chin and whole face stay clear and visible the whole time.")
PLATES["jade_brk_v4"]["prompt"] = PLATES["jade_brk_v4"]["prompt"].replace(
    "her chin raised only a little",
    "her head almost level: she looks up with her eyes and tips her chin up only slightly, never throwing her head back,")
PLATES["jade_notebook_v4"]["prompt"] = PLATES["jade_notebook_v4"]["prompt"].replace(
    "We see her shoulder and the white sleeve of her jacket,",
    "We see her shoulder and the white nylon sleeve of her cropped flight jacket with its bright orange band around the upper arm, in sharp focus,")

# ---------------- round 2, Jade from her real photos (no generated sheets): her face straight from media/chars/jade_src/photos ----------------
# Weighted to photos from the same day (consistent hair and look): front, grin, profile. Hair: her hairstyle that day, half-up half-down.
R.update({"JP_FRONT": "media/chars/jade_src/photos/jade_photo_5_front_hair.jpg",
          "JP_GRIN": "media/chars/jade_src/photos/jade_photo_6_grin.jpg",
          "JP_PROF": "media/chars/jade_src/photos/jade_photo_14_profile_left.jpg",
          "JP_34": "media/chars/jade_src/photos/jade_photo_9_threequarter_hairline.jpg",
          "JP_OUTFIT": "media/refs/jade_outfit.jpg", "JP_HP": "media/refs/jade_headphones.jpg"})
JP_REFS = ["JP_FRONT", "JP_GRIN", "JP_PROF", "JP_OUTFIT", "JP_HP"]
JADE_P = ("the singer Jade: exactly the real woman in the first three reference photos, her real face unchanged and looking her best (a broad, soft East Asian face "
          "with full cheeks, clear smooth skin, a high rounded hairline and a large, fully visible forehead, straight dark brows, a rounded nose, full lips, a small mole "
          "near her upper lip) wearing her own thin dark rectangular glasses. Her hair exactly as in those photos: long straight black hair worn half-up, half-down, "
          "the top section swept back from her forehead and gathered at the back of her head, the rest falling loose past her shoulders, with one loose face-framing "
          "section falling beside her face on one side; no bangs. She wears the outfit in the fourth reference image (cropped white flight jacket with orange bands "
          "and a pale-blue dot on the chest, black ribbed crop top, navy wide-leg cargo pants with orange straps)")
HP_NECK = "the pale dusty-pink over-ear headphones from the fifth reference image resting around her neck"
HP_HEAD = ("the pale dusty-pink over-ear headphones from the fifth reference image worn ON her head, the wide padded band over the top of her head "
           "and the large rounded cups over her ears")
CHEST = "Medium shot framed from the chest up, her face clear and well lit, about a quarter of the frame height, with space around her head; not a close-up."
PLATES.update({
    "jade_hook1_p": dict(duration=5, refs=JP_REFS, audio=["media/audio_refs/jade_hook1.mp3"], generate_audio=True, prompt=
        f"Golden hour on a grassy hilltop above San Francisco, the city and the bay far below in soft haze. {JADE_P}, with {HP_NECK}. The low sun is off to one side, "
        f"lighting her face warmly (not behind her), wind lifting loose strands of her hair. She sings 'bring me home' toward the sky, lifting her eyes on the last word. {SING} "
        f"{CHEST} Slow, gentle push-in. " + LOOK_NOW),
    "jade_studio_p": dict(duration=5, refs=JP_REFS, audio=["media/audio_refs/jade_hook2.mp3"], generate_audio=True, prompt=
        f"A small professional recording studio at night: acoustic foam panels, warm practical lamps, a glowing mixing desk out of focus behind the glass. {JADE_P}, with {HP_HEAD}. "
        "She keeps her glasses on. She sings into a large-diaphragm studio condenser microphone on a stand; the microphone and its round pop filter sit off to one side of her face "
        f"at chin level, never in front of her mouth, so her lips and whole face stay visible. {SING} {CHEST} Three-quarter angle, steady camera. " + LOOK_NOW),
    "jade_brk_p": dict(duration=8, refs=JP_REFS, audio=["media/audio_refs/jade_brk.mp3"], generate_audio=True, prompt=
        f"Dusk on the grassy hilltop above San Francisco: the whole sky has turned deep red and orange. {JADE_P}, with {HP_NECK}. She stands under the red sky singing, "
        "her head almost level: she looks up with her eyes and tips her chin up only slightly, never throwing her head back, her face three-quarters toward the camera "
        f"and clearly readable the whole time; she slowly raises one open hand toward the sky as if reaching for something she can't touch. {SING} "
        "Medium shot from the chest up, her raised hand entering the frame, space around her head. Warm light on her face, rim light on her hair and glasses. " + LOOK_NOW),
    "jade_notebook_p": dict(duration=6, refs=JP_REFS, prompt=
        f"Soft daylight from a large window. Over-the-shoulder shot from behind and slightly above her right shoulder: {JADE_P}, with {HP_NECK}. She sits at a wooden desk "
        "by the window, writing lyrics with a graphite pencil in an open leather-bound notebook with cream pages. We see her shoulder and the white nylon sleeve of her cropped "
        "flight jacket with its bright orange band around the upper arm, her half-up hair, the arm of her glasses and the side of her cheek; the notebook and her hand in the "
        "middle of the frame, a few lines of handwriting appearing as she writes. She pauses, taps the pencil, then writes another line. Calm, intimate, steady camera. "
        "Photorealistic, shot on 35mm film, present day. No on-screen text, no captions."),
    "jade_hand_writing_p": dict(duration=6, refs=["JP_OUTFIT"], faces=False, prompt=
        "Soft daylight from a window. Close-up of a woman's right hand (the white nylon cuff of the cropped flight jacket in the reference at the wrist) writing lyrics "
        "with a graphite pencil in an open leather-bound notebook with cream paper on a wooden desk. The page fills most of the frame; lines of handwriting in pencil flow "
        "across it as she writes, the pencil tip and the graphite line clearly visible, paper texture, the leather cover at the edges of the frame. "
        "Only the hand, wrist and notebook, no face. Steady, locked-off camera slightly above. Photorealistic, shot on 35mm film. No on-screen text, no captions."),
})
