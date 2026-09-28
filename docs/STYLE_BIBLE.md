# Style bible — "Leonov's Pencils"

Everything on screen is drawn by `video/src` in colored pencil. Generated video plates
(Seedance 2.5) are *reference only*: the renderer reads their light, shape and motion and
redraws them; the plates themselves never appear.

## 1. Paper

| Paper | Hex | Used for | Tooth |
|---|---|---|---|
| **Night** (black paper) | `#0d0c10` → `#16141b` vignette | space, capsule, airlock, re-entry | fine cold fibres, visible only where strokes cross them |
| **Snow** (white paper) | `#f3efe6` → `#e6dfd2` vignette | Earth, the taiga, the singer's world | warm cotton grain, visible everywhere |

Rules: never a flat digital black or white. The tooth texture modulates every stroke
(pencil only deposits on the peaks of the grain), and it shifts per *drawing* (not per
frame) so the grain boils with the linework.

## 2. The pencil box (the only colors allowed)

| Name | Hex | Role |
|---|---|---|
| white | `#f4efe6` | light on black paper; suits, stars, contours |
| silver | `#a9b0bd` | half-tones on black paper |
| sky | `#7fb3ff` | atmosphere, Earth's limb, reflections |
| cobalt | `#3d63dd` | Earth, shadows of the white suit |
| ultramarine | `#26318f` | deepest shadow tone on black paper |
| gold | `#ffc53d` | sun core, "burning gold" |
| orange | `#ff7a1a` | sunrise rays, rim light, fire |
| vermilion | `#ef3b24` | danger, panic scribble, CCCP, Cyrillic type |
| crimson | `#a8122a` | deep fire, the red sky |
| graphite | `#2b2a2e` | lines on white paper |
| lead | `#6e6c72` | hatching on white paper |

Orbital-sunrise band (Leonov's drawing, bottom → top): `crimson · vermilion · orange · gold · white · sky · cobalt · ultramarine` → black.

## 3. Strokes

* **Contour**: 1.2–2.6 px, tapering ends, 5–15 % overshoot, drawn twice with 0.6 px drift.
* **Hatch**: 10–34 px long, slightly curved along the plate's structure-tensor flow;
  density follows light on black paper (you draw the light) and darkness on white paper.
* **Radial rays**: the sun and impacts — strokes aimed away from a point, length ∝ energy.
* **Scribble**: looping stroke for panic, fire, smoke; only in vermilion/orange/crimson.
* **Boil**: every stroke is re-seeded once per drawing. Drawing rate per section:
  threes (8/s) for awe, twos (12/s) default, ones (24/s) for panic and impacts.

## 4. Type

| Role | Face | Treatment |
|---|---|---|
| Impact lyric (EN) | **Anton** | all caps, tight leading (0.86), cream `#f4efe6` on black / graphite on white; enters on the beat, one word per beat on hooks |
| Cyrillic echo | **Oswald 700** | vermilion, 30–40 % of the EN size, under or beside the EN line |
| Intimate lyric | **Instrument Serif Italic** | the singer's own lines, sentence case, subtitle-sized or huge |
| Telemetry | **JetBrains Mono** | mission clock, suit pressure, orbit count; small caps-like, tracked +4 % |
| Handwriting | single-stroke pencil (drawn, not typeset) | "Art is a landing in the snow", Leonov's signature |

Lyric sizing plan: **big** (≥ 18 % frame height) on hooks and the intro hook; **medium**
on the pre-chorus and build; **subtitle** (lower third, serif italic) in the breakdown
where the pictures carry the story.

## 5. Motion

* Cuts land on beats (bar = 4 beats ≈ 1.48 s at 162 BPM). Drops cut every 1–2 beats;
  verses every 2–4 bars.
* Camera moves come from the plates (Seedance physics); graphic layers add beat
  "punches" (2–4 % scale kick decaying over one beat) only in hooks and drops.
* Weightlessness: everything in orbit drifts; nothing snaps except on impacts.
* Transitions are *drawn*: an eraser wipe, a page turn, a scribble-out, a burn-through.

## 6. Composition

* Hook frames: subject on one third, type on the other two; the sun or the Earth's limb
  crosses behind the type.
* Close-ups of hands, visors and gauges tell the danger; wides tell the scale.
* Symmetry for iconic "point" frames (K-pop hero shots): the glove against the sun, the
  porthole, the capsule falling dead-centre.
