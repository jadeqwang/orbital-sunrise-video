# Round 2 — fix list mapped to shots

Source: the user's notes after watching v1. Facts: `docs/FACTS.md` (read it before writing any prompt).
Shot times: `node video/render.mjs --list` (song seconds). New Seedance plates go in `tools/plate_specs.py`.

## Accuracy decisions (from FACTS.md)
- Leonov's drawing: small loose coloured-pencil study on white paper (does not fill the sheet); curved horizon; Earth below
  dark blue/black, no continents; bands from the rim up: red → orange → light blue → blue → violet → velvety black;
  the Sun a red ball emerging from blue; no text, stars, spacecraft or signature. We could not download a photo of the
  original, so we use a **reconstruction** from Leonov's description (`media/refs/leonov_drawing_reconstruction.png`),
  and say so in the docs.
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
