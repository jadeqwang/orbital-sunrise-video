# Round 2 — fix list mapped to shots

Source: the user's notes after watching v1. Facts: `docs/FACTS.md` (read it before writing any prompt).
Shot times: `node video/render.mjs --list` (song seconds). New Seedance plates go in `tools/plate_specs.py`.

## Accuracy decisions (from FACTS.md)
- Leonov's drawing: the film now draws it from a **photo of the original** (a museum press photo, kept locally at
  `media/refs/leonov_drawing_real_photo.jpg`, not committed), installed as the plate `leonov_drawing` by
  `tools/install_drawing.py` (card cropped and white-balanced), not from a reconstruction. A small loose coloured-pencil
  study on a cream landscape card (does not fill it): one sweeping diagonal arc from lower left to upper right; from the
  outer edge in: black, light blue, yellow, orange-red with a small red sun on it, then layered blues; no Earth disc,
  continents, text, stars, spacecraft or signature (docs/FACTS.md §4). The earlier reconstruction from Leonov's verbal
  description (`media/refs/leonov_drawing_reconstruction.png`) is superseded.
- Suit pressure: a two-mode regulator on the suit (not the backpack), 0.40 → 0.27 atm, one deliberate turn of a small
  tap (one source: blue tap at the solar plexus). Entry orientation is disputed (memoir: head-first; 1965 report:
  feet-first) — show the struggle without making the orientation the point.
- After landing: white Berkut suits (helmets off) when climbing out; then the suits' soft quilted thermal linings tied
  with parachute cord, fur boots, parachute cloth; rescuers on skis brought warm clothes. No orange coveralls (that was
  Gagarin's Vostok suit). Hatch blocked by a tree; they rocked the capsule to free it.
- Landing site: Perm Oblast (Urals taiga), not Siberia.

## Shots
| Time | Shot | Change |
|---|---|---|
| 0:07 | I2_hatch | done: dropped "FOR THE FIRST TIME / A HUMAN WILL LEAVE THE SHIP" |
| 0:41 | S3_nofit | new plate `airlock_struggle`: ballooned rigid suit wedged at the mouth of the Volga tube, can't fit, pushing, straining |
| 0:44–0:48 | P1_bleed | regenerate `valve_bleed` to match the facts: gloved hand turning the small regulator tap on the suit chest |
| 0:57 | P4_airlock | new plate `tube_struggle`: cramped inside the inflatable tube, sweating, twisting to turn around, suit barely fits |
| 1:09 | K4_home | new plate `jade_studio`: Jade singing into a studio mic (medium shot), song slice as audio ref |
| 1:32 | D5_the_drawing | draw the reconstruction (accurate bands/sun/no text) instead of the procedural rainbow |
| 1:44 | B1_split left | new plate `drawing_hand`: a hand drawing the reconstruction with coloured pencils; plausible strokes (arc, bands, sun) |
| 1:51 | B2_float | new plate `jade_notebook`: over-the-shoulder, Jade writing lyrics in a leather-bound notebook with a pencil; lyric as handwriting |
| 1:59 | A1_snow (first half) | new plate `leonov_drawing_hand`: Leonov's hand in the capsule, pencils on threads, drawing the sunrise (ref: reconstruction) |
| 2:02 | A1_snow (second half) | new plate `jade_hand_writing`: close-up of Jade's hand writing lyrics |
| 2:06 | A2_hands | done: removed 1965/NOW labels; left `leonov_drawing_hand` (dark), right `jade_hand_writing` (light) |
| 2:11 | G1_failed | new plate `porthole_spin`: through the porthole while tumbling: sun / Earth / black sweeping past |
| 2:29 | F2_home (+ F1 burn-through) | new plate `reentry_outside`: the descent sphere entering the upper atmosphere, plasma sheath and trail |
| 3:16 | L2_home | "HOME" (done); new plate `hatch_tree`: capsule in taiga snow, hatch against a tree, the men (white suits, no helmets) rocking it free |
| 3:20 | L3_madeit | new plate `hatch_free`: tree pushed aside, climbing out into deep snow (white suits, no helmets) |
| 3:21 | L4_fire | "home" (done); new plate `fire_night_v2`: by the fire in quilted thermal linings, parachute cloth, fur boots |
| 3:26 | L5_survived | new plate `drawing_survives_v2` (same wardrobe); drop the "THE DRAWING SURVIVED" line (it moves to the coda) |
| 3:33 | L6_rescue | new plate `rescue_v2`: skiers arrive with warm clothes; the men in thermal linings |
| 3:35–3:46 | L7_legacy | team-Earth montage, ~1 s per item on the beat: 1965 Ed White · 1969 Moon · 1975 handshake · 2000 ISS (15 nations) · 2003 Yang Liwei · 2014 Philae · 2019 Chang'e 4 far side · 2023 Chandrayaan-3 · 2024 Polaris Dawn (suit checked: it really is slimmer, umbilical, no backpack) · 2026 Artemis II |
| 3:46 | new card | "THE COSMONAUTS SURVIVED" over a drawing of Leonov and Belyayev (still `leg_survivors`) |
| 3:51 | C1_drawing | the reconstruction drawing; handwritten "The cosmonauts and the artwork survived." |
| 3:56 | Z_title | done: top lines kept; "An homage to "Orbital Sunrise" by John Green" + vlogbrothers / podcast / URL |

## Jade
- New character sheets (`media/chars/jade_v2_*`): DOT's outfit and flowy hair with curtain bangs; photoreal face.
- Regenerate her remaining singing plates with the v2 sheets: `jade_hook1` (0:32), `jade_studio` (1:09), `jade_brk` (1:54–1:58).
- Fewer extreme face close-ups: frame her singing medium (waist/chest up); keep hands/notebook shots for intimacy.

## Round 2 plates
Specs: `tools/plate_specs.py` (round 2 block) and `tools/legacy_stills.py` (`STILLS.update`). Frames, meta, stats, mattes and index entries are in `video/plates/`. Rejected takes are in `media/archive/`.

| id | take | what it shows |
|---|---|---|
| `leonov_drawing` | still | the reconstruction (`media/refs/leonov_drawing_reconstruction.png`): small study on a loose white sheet; red→orange→light blue→blue→violet→black over a dark Earth, red sun on the rim, no text |
| `airlock_struggle` | take1 | top-down at the Volga tube mouth: ballooned suit wedged in the round rim, gloves braced, straining |
| `valve_bleed` | take2 | close on the suit chest: the gloved hand turns the small blue regulator tap at the solar plexus (not the backpack) |
| `tube_struggle` | take2 | one shot inside the padded tube: he curls round toward the hatch, ending on his sweating, grimacing face |
| `drawing_hand` | take2 | the **real** drawing (refs: museum photo, `media/refs/leonov_drawing_real_card.jpg` + `_photo.jpg`, gitignored): top-down hand on a small cream card, sweeps the black band along the diagonal arc, then yellow, then the red sun; the Taktika box with threaded pencils and the green wire ring beside it (take1, the reconstruction, is superseded) |
| `leonov_drawing_hand` | take4 | the **real** drawing: Leonov's bare hand in the cabin colouring the red sun on the diagonal band (black, light blue, yellow, orange-red, blues); green wire loop on his wrist, Taktika pencils floating on white threads. Animated from a Nano Banana first frame (`media/refs/leonov_drawing_real_cabin_frame.png`, gitignored); takes 2–3 (refs only) drew the wrong picture and are archived |
| `porthole_spin` | take1 | through a porthole while tumbling: Earth / black sweep past, then an orange plasma glow builds on the glass |
| `reentry_outside` | take2 | wide: the small descent sphere with a pink-orange plasma sheath and a long trail over the dark Earth, black sky above |
| `hatch_tree` | take2 | the capsule in the taiga with a white birch right in front of the hatch; a gloved hand in the gap (rocking is subtle) |
| `hatch_free` | take2 | the hatch lies in the snow; Leonov (white suit, no helmet) climbs out and helps Belyayev (no helmet) |
| `fire_night_v2` | take1 | dusk fire by the capsule: both men in quilted linings tied with cord, fur boots, parachute cloth |
| `drawing_survives_v2` | take2 | by the fire, Leonov in his quilted lining unfolds the folded sheet (the reconstruction) and smiles |
| `rescue_v2` | take2 | skiers in sheepskin coats and ushankas arrive with bundles of warm clothes; the cosmonauts in linings and fur boots by the fire |
| `leg_station` | still | the whole ISS over the limb at orbital sunrise (truss, eight golden array wings, modules) |
| `leg_commercial` | still | Polaris Dawn: Dragon's nose cone open, suited figure half out of the hatch at Skywalker, umbilical, no backpack, gold visor |
| `leg_yang_liwei` | still | 2003 Shenzhou 5: Yang Liwei in a white-and-blue suit in a reclined couch, porthole with Earth |
| `leg_philae` | still | 2014 Philae tilted on the boulder-strewn nucleus of 67P beside a cliff, dust jets |
| `leg_change4` | still | 2019 Chang'e 4 lander and Yutu-2 rover with tracks on the far side, no Earth in the sky |
| `leg_chandrayaan3` | still | 2023 Vikram lander near the south pole, Pragyan rolling down its ramp, very low sun |
| `leg_survivors` | still | Leonov and Belyayev after the rescue in sheepskin coats and fur hats, taiga and fire smoke behind, documentary look |
| `jade_hook1_v3` | take1 | Jade v3 (her real likeness, glasses; sheets `media/chars/jade_v3_*`): golden hour on the hilltop above the Golden Gate and the city, waist-up, sings "bring me home" and lifts her eyes to the sky; song slice as audio ref |
| `jade_studio` | take2 | Jade v3 in a recording studio at night, orange headphones on her head, singing into a large-diaphragm condenser mic with a pop filter, medium shot; `jade_hook2` slice as audio ref (take1 had the headphones round her neck, archived) |
| `jade_brk_v3` | take2 | Jade v3 under a red dusk sky, chest-up, eyes lifted to the sky, raises one open hand; `jade_brk` slice as audio ref (take1 was framed wider with her face tilted away: landmarks in 11% of frames, archived) |
| `jade_notebook` | take1 | over-the-shoulder, daylight by a window: Jade v3 (glasses, white jacket with orange band) writing lines in a leather-bound notebook with a pencil; no audio |
| `jade_hand_writing` | take1 | close-up of her hand (white elastic cuff, orange band) writing lines in pencil in the leather-bound notebook, warm window light; no audio |
